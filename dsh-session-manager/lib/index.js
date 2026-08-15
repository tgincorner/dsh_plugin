import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';

/**
 * dsh web session manager — Host service.
 *
 * Exposes one Remote namespace `sessionManager` with methods:
 *   list()                            -> session tree (workspaces / archived / ungrouped)
 *   archive(sessionId)                -> archive one session (registry-global set)
 *   unarchive(sessionId)              -> remove one session from the archive set
 *   delete(sessionId)                 -> physically delete a session log (cold or safely disposed)
 *   migrate(sessionId, workspaceId)   -> move a session to another workspace (rewrite header cwd + move log)
 */
export default class SessionManagerService extends TypertRemoteService {
  static inject = [
    'workspaceRegistry',
    'sessionQuery',
    'sessionPersistence',
    'storageDomain',
    'subprocess',
    'sessions',
    'agents',
  ];

  constructor(ctx) {
    super(ctx, 'sessionManager');
  }

  async list() {
    return this.buildList();
  }

  async archive(sessionId) {
    await this.ctx.workspaceRegistry.archiveSession(sessionId);
    return this.buildList();
  }

  async unarchive(sessionId) {
    await this.removeFromArchiveSet(sessionId);
    return this.buildList();
  }

  async delete(sessionId) {
    await this.disposeIfLive(sessionId);
    const rec = await this.requireRecord(sessionId);
    const persistence = this.ctx.sessionPersistence;
    const loc = persistence.locate(rec.header);
    if (!loc) throw new Error('当前持久化后端不支持定位会话文件，无法物理删除');
    const dir = this.dirname(loc.path);
    const root = persistence.root;
    if (typeof root === 'string' && root.length > 0 && !dir.startsWith(root)) {
      throw new Error('拒绝删除：目标路径 ' + dir + ' 不在会话存储根目录 ' + root + ' 下');
    }
    await this.spawnOk(['rm', '-rf', '--', dir]);
    const registry = this.ctx.workspaceRegistry;
    registry.headers.delete(sessionId);
    registry.sessionPaths.delete(sessionId);
    registry.invalidSessionPaths.delete(sessionId);
    for (const w of registry.list()) {
      if (w.record && Array.isArray(w.record.sessionIds) && w.record.sessionIds.includes(sessionId)) {
        if (typeof w.detachSession === 'function') await w.detachSession(sessionId);
      }
    }
    await this.removeFromArchiveSet(sessionId);
    return this.buildList();
  }

  async migrate(sessionId, workspaceId) {
    const registry = this.ctx.workspaceRegistry;
    const target = registry.get(workspaceId);
    if (!target) throw new Error('目标工作区不存在: ' + workspaceId);
    await this.disposeIfLive(sessionId);
    const rec = await this.requireRecord(sessionId);
    const header = rec.header;
    if (header.cwd === undefined) throw new Error('该会话没有 cwd，无法迁移到其他工作区');
    if (header.cwd === target.path) throw new Error('该会话已经属于目标工作区');
    const persistence = this.ctx.sessionPersistence;
    const loc = persistence.locate(header);
    if (!loc) throw new Error('当前持久化后端不支持定位会话文件，无法迁移');
    const root = persistence.root;
    if (typeof root !== 'string' || root.length === 0) throw new Error('无法确定会话存储根目录');
    const payload = JSON.stringify({ root, id: sessionId, oldCwd: header.cwd, newCwd: target.path, artifact: loc.path });
    await this.spawnOk(['node', '-e', MIGRATE_SCRIPT, payload]);
    const newHeader = Object.assign({}, header, { cwd: target.path });
    registry.headers.set(sessionId, newHeader);
    registry.sessionPaths.set(sessionId, target.path);
    registry.invalidSessionPaths.delete(sessionId);
    const current = registry.list().find((w) => w.record && Array.isArray(w.record.sessionIds) && w.record.sessionIds.includes(sessionId));
    const currentId = current ? String(current.id) : null;
    if (current && currentId !== workspaceId && typeof current.detachSession === 'function') {
      await current.detachSession(sessionId);
    }
    if (currentId !== workspaceId && typeof target.attachSession === 'function') {
      await target.attachSession(sessionId);
    }
    return this.buildList();
  }

  // ---- helpers -----------------------------------------------------------

  dirname(p) {
    return p.replace(/[\\/]+[^\\/]*$/, '') || '/';
  }

  async readTitleMap(ids) {
    const map = new Map();
    if (ids.length === 0) return map;
    const results = await this.ctx.sessionQuery.readTitleSnapshots(ids);
    for (const res of results) {
      if (res && res.status === 'fulfilled' && res.value && res.value.title) {
        map.set(String(res.sessionId), res.value.title.title);
      }
    }
    return map;
  }

  async buildList() {
    const registry = this.ctx.workspaceRegistry;
    const records = await this.ctx.sessionQuery.listSessions();
    const archived = new Set(registry.archivedSessionIds.map(String));
    const byId = new Map();
    for (const r of records) byId.set(String(r.header.id), r);
    const titles = await this.readTitleMap(records.map((r) => String(r.header.id)));
    const running = new Set();
    for (const a of this.ctx.agents.list()) if (a.status === 'running') running.add(String(a.id));
    const liveSet = new Set(this.ctx.sessions.list().map((s) => String(s.id)));

    const summary = (rec) => ({
      sessionId: String(rec.header.id),
      title: titles.get(String(rec.header.id)) ?? null,
      cwd: rec.header.cwd ?? null,
      live: rec.live || liveSet.has(String(rec.header.id)),
      running: running.has(String(rec.header.id)),
    });

    const wsList = registry.list();
    const workspaces = wsList.map((w) => {
      const active = [];
      const archivedSessions = [];
      for (const sid of w.sessionIds) {
        const rec = byId.get(String(sid));
        if (!rec) continue;
        (archived.has(String(sid)) ? archivedSessions : active).push(summary(rec));
      }
      return {
        workspaceId: String(w.id),
        title: w.title,
        path: w.path,
        sessions: active,
        archived: archivedSessions,
      };
    });

    const accounted = new Set();
    for (const w of wsList) for (const sid of w.sessionIds) accounted.add(String(sid));
    const ungrouped = [];
    const ungroupedArchived = [];
    for (const rec of records) {
      if (accounted.has(String(rec.header.id))) continue;
      (archived.has(String(rec.header.id)) ? ungroupedArchived : ungrouped).push(summary(rec));
    }
    return { workspaces, ungrouped, ungroupedArchived };
  }

  // Safely stop a live (loaded) session: refuse while running; otherwise drain
  // pending writes, then detach the session and agent through the store entries'
  // own single-shot detach closures, so no further write can resurrect it.
  async disposeIfLive(sessionId) {
    const agents = this.ctx.agents;
    const sessions = this.ctx.sessions;
    const agent = agents.get(sessionId);
    if (agent && agent.status === 'running') {
      throw new Error('会话 ' + sessionId + ' 正在运行中，无法执行该操作');
    }
    if (agent && typeof agent.whenIdle === 'function') {
      try { await agent.whenIdle(); } catch (e) { /* quiescence best-effort */ }
    }
    const session = sessions.get(sessionId);
    if (session) {
      try { await sessions.flush(session); } catch (e) { /* already drained or no-op */ }
      const sEntry = sessions.store && sessions.store.get(sessionId);
      if (sEntry && typeof sEntry.detach === 'function') sEntry.detach();
    }
    const aEntry = agents.store && agents.store.get(sessionId);
    if (aEntry && typeof aEntry.detach === 'function') aEntry.detach();
  }

  async requireRecord(sessionId) {
    const records = await this.ctx.sessionQuery.listSessions();
    const rec = records.find((r) => String(r.header.id) === sessionId);
    if (!rec) throw new Error('找不到会话 ' + sessionId);
    return rec;
  }

  async spawnOk(argv) {
    const subprocess = this.ctx.subprocess;
    const exe = await subprocess.resolveExecutable(argv[0]);
    const root = this.ctx.sessionPersistence.root;
    const handle = subprocess.spawn({
      argv: [exe].concat(argv.slice(1)),
      cwd: typeof root === 'string' && root.length > 0 ? root : '/',
      stdio: { stdin: 'ignore', stdout: { maxBytes: 65536 }, stderr: { maxBytes: 65536 } },
      graceMs: 10000,
    });
    const outcome = await handle.done;
    if (outcome.exitCode !== 0) {
      let msg = '';
      if (handle.collected && handle.collected.stderr) msg = handle.collected.stderr.readFrom(0).text;
      if (!msg && handle.collected && handle.collected.stdout) msg = handle.collected.stdout.readFrom(0).text;
      throw new Error('命令执行失败 (exit ' + outcome.exitCode + '): ' + String(msg || '').slice(0, 800));
    }
  }

  async removeFromArchiveSet(sessionId) {
    const registry = this.ctx.workspaceRegistry;
    await Promise.resolve(registry.operationTail);
    const state = registry.state;
    if (!state || !Array.isArray(state.archivedSessionIds) || !state.archivedSessionIds.includes(sessionId)) return;
    const next = Object.assign({}, state, { archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId) });
    await registry.global.set(next);
    registry.state = next;
  }
}

// Migration worker: spawned as `node -e <script> <payload>`.
// Re-encodes a zstd JSONL session artifact with a rewritten header cwd and
// relocates it under the target workspace project dir. Escape-free by design
// (String.fromCharCode(10) instead of '\n'), so embedding layers cannot mangle it.
const MIGRATE_SCRIPT = `
const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const zstdCompress = promisify(zlib.zstdCompress);
const zstdDecompress = promisify(zlib.zstdDecompress);
const CHECKSUM = { params: { [zlib.constants.ZSTD_c_checksumFlag]: 1 } };
const ZSTD_MAGIC = 4247762216;
function scanZstdFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset < buffer.length) {
    const start = offset;
    if (buffer.length - offset < 4) return { frames, tornStart: start };
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error('invalid frame magic');
    offset += 4;
    if (offset === buffer.length) return { frames, tornStart: start };
    const descriptor = buffer.readUInt8(offset);
    offset += 1;
    if ((descriptor & 24) !== 0) throw new Error('reserved frame-header bit');
    const contentSizeFlag = descriptor >>> 6;
    const singleSegment = (descriptor & 32) !== 0;
    const checksum = (descriptor & 4) !== 0;
    const dictionaryFlag = descriptor & 3;
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag;
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start };
    offset += remainingHeaderBytes;
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start };
      const blockHeader = buffer.readUIntLE(offset, 3);
      offset += 3;
      const lastBlock = (blockHeader & 1) !== 0;
      const blockType = (blockHeader >>> 1) & 3;
      const blockSize = blockHeader >>> 3;
      if (blockType === 3) throw new Error('reserved block type');
      const payloadBytes = blockType === 1 ? 1 : blockSize;
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start };
      offset += payloadBytes;
      if (lastBlock) break;
    }
    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start };
      offset += 4;
    }
    frames.push({ start, end: offset });
  }
  return { frames };
}
function encodeSegment(raw) {
  if (raw.length === 0) throw new Error('empty segment');
  if (raw === '.') return '~002E';
  if (raw === '..') return '~002E~002E';
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    const ch = String.fromCharCode(code);
    if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) out += ch;
    else out += '~' + code.toString(16).toUpperCase().padStart(4, '0');
  }
  return out;
}
function projectKey(cwd) {
  if (cwd.length === 0) throw new Error('empty project path');
  let readable = '';
  let separatorRun = false;
  for (let i = 0; i < cwd.length; i++) {
    const code = cwd.charCodeAt(i);
    const ch = String.fromCharCode(code);
    if (ch === '/' || code === 92 || ch === ':') {
      if (!separatorRun) readable += '-';
      separatorRun = true;
    } else if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch;
      separatorRun = false;
    } else {
      readable += '~' + code.toString(16).toUpperCase().padStart(4, '0');
      separatorRun = false;
    }
  }
  return '--' + (readable.replace(/^-+/, '') || 'root').slice(0, 251) + '--';
}
(async () => {
  const NL = String.fromCharCode(10);
  const { root, id, oldCwd, newCwd, artifact } = JSON.parse(process.argv[process.argv.length - 1]);
  const base = path.basename(artifact);
  const targetDir = path.join(root, projectKey(newCwd), encodeSegment(id));
  const targetLog = path.join(targetDir, base);
  if (base.endsWith('.zstd')) {
    const bytes = await fs.readFile(artifact);
    const scan = scanZstdFrames(bytes);
    if (scan.tornStart !== undefined) throw new Error('会话日志存在未完成的尾帧，拒绝迁移');
    if (scan.frames.length === 0) throw new Error('会话日志为空');
    const plain = [];
    for (const f of scan.frames) plain.push(await zstdDecompress(bytes.subarray(f.start, f.end)));
    const headerText = plain[0];
    if (headerText.indexOf(10) !== headerText.length - 1) throw new Error('首帧不是单行 header');
    const header = JSON.parse(headerText.slice(0, -1).toString('utf8'));
    if (header.id !== id) throw new Error('header id 不匹配');
    if (header.cwd !== oldCwd) throw new Error('header cwd 与预期不符: ' + header.cwd);
    header.cwd = newCwd;
    const eventsText = Buffer.concat(plain.slice(1));
    const out = Buffer.concat([
      await zstdCompress(Buffer.from(JSON.stringify(header) + NL, 'utf8'), CHECKSUM),
      await zstdCompress(eventsText, CHECKSUM)
    ]);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetLog, out);
    const check = await fs.readFile(targetLog);
    const f2 = scanZstdFrames(check).frames;
    const head2 = await zstdDecompress(check.subarray(f2[0].start, f2[0].end));
    const parsed = JSON.parse(head2.slice(0, -1).toString('utf8'));
    if (parsed.id !== id || parsed.cwd !== newCwd) throw new Error('迁移后校验失败');
  } else {
    const text = await fs.readFile(artifact, 'utf8');
    const nl = text.indexOf(NL);
    const header = JSON.parse(text.slice(0, nl === -1 ? text.length : nl));
    if (header.id !== id) throw new Error('header id 不匹配');
    if (header.cwd !== oldCwd) throw new Error('header cwd 与预期不符: ' + header.cwd);
    header.cwd = newCwd;
    const rest = nl === -1 ? '' : text.slice(nl);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetLog, JSON.stringify(header) + rest);
    const check = await fs.readFile(targetLog, 'utf8');
    const idx = check.indexOf(NL);
    const parsed2 = JSON.parse(check.slice(0, idx === -1 ? check.length : idx));
    if (parsed2.id !== id || parsed2.cwd !== newCwd) throw new Error('迁移后校验失败');
  }
  const oldDir = path.dirname(artifact);
  if (oldDir !== targetDir) await fs.rm(oldDir, { recursive: true, force: true });
  process.stdout.write('ok' + NL);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
`;

// Mark Remote methods without decorator syntax (Node loads this file directly).
// The Remote() decorator only records private marker state via
// context.addInitializer, so we feed it a synthetic method-decorator context.
for (const name of ['list', 'archive', 'unarchive', 'delete', 'migrate']) {
  Remote(name).call(null, SessionManagerService.prototype[name], {
    kind: 'method',
    name,
    static: false,
    private: false,
    addInitializer(fn) {
      fn.call(Object.create(SessionManagerService.prototype));
    },
  });
}
