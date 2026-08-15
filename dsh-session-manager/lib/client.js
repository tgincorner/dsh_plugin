window.__ModuleLoader__.load({
  id: "dsh-session-manager",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const React = require("react");

    const CSS = `
.sm-mask { position: fixed; inset: 0; z-index: 2147483000; background: rgba(0,0,0,0.35); pointer-events: auto; }
.sm-panel { position: fixed; top: 56px; right: 20px; bottom: 56px; width: 560px; max-width: calc(100vw - 40px); display: flex; flex-direction: column; background: var(--dsw-alias-bg-layer-1, #ffffff); color: var(--dsw-alias-label-primary, #18181b); border: 1px solid var(--dsw-alias-border-l1, #e4e4e7); border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.28); overflow: hidden; pointer-events: auto; font-size: 13px; line-height: 1.45; }
.sm-entry { flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: auto; height: 34px; margin: 2px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2, #d4d4d8); background: var(--dsw-alias-bg-layer-2, #f4f4f5); color: var(--dsw-alias-label-primary, #18181b); font-size: 13px; cursor: pointer; white-space: nowrap; }
.sm-entry:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.06)); }
.sm-page { display: flex; flex-direction: column; gap: 12px; padding: 4px 2px; }
.sm-head { display: flex; align-items: center; gap: 8px; padding: 4px 0 10px; border-bottom: 1px solid var(--dsw-alias-border-l1, #e4e4e7); }
.sm-title { font-weight: 600; font-size: 14px; flex: 1; }
.sm-btn { cursor: pointer; border: 1px solid var(--dsw-alias-border-l1, #e4e4e7); background: var(--dsw-alias-bg-layer-2, #f4f4f5); color: var(--dsw-alias-label-primary, #18181b); border-radius: 8px; padding: 3px 10px; font-size: 12px; white-space: nowrap; }
.sm-btn:hover { filter: brightness(0.97); }
.sm-btn:disabled { opacity: 0.5; cursor: default; }
.sm-btn-danger { color: #fff; background: var(--dsw-alias-state-error-primary, #dc2626); border-color: transparent; }
.sm-btn-primary { color: #fff; background: var(--dsw-alias-brand-primary, #4f46e5); border-color: transparent; }
.sm-body { display: flex; flex-direction: column; gap: 12px; }
.sm-ws { border: 1px solid var(--dsw-alias-border-l1, #e4e4e7); border-radius: 10px; overflow: hidden; }
.sm-ws-head { display: flex; align-items: baseline; gap: 8px; padding: 8px 12px; background: var(--dsw-alias-bg-layer-2, #f4f4f5); }
.sm-ws-title { font-weight: 600; flex-shrink: 0; }
.sm-ws-path { color: var(--dsw-alias-label-secondary, #71717a); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.sm-count { margin-left: auto; color: var(--dsw-alias-label-secondary, #71717a); font-size: 11px; white-space: nowrap; flex-shrink: 0; }
.sm-sub { padding: 4px 12px; color: var(--dsw-alias-label-secondary, #71717a); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid var(--dsw-alias-border-l1, #e4e4e7); background: var(--dsw-alias-bg-layer-2, #f4f4f5); }
.sm-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-top: 1px solid var(--dsw-alias-border-l1, #e4e4e7); }
.sm-row-main { flex: 1; min-width: 0; }
.sm-row-title { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
.sm-row-id { color: var(--dsw-alias-label-secondary, #71717a); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sm-chip { font-size: 10px; border-radius: 999px; padding: 1px 7px; background: var(--dsw-alias-border-l2, #d4d4d8); color: var(--dsw-alias-label-secondary, #71717a); flex-shrink: 0; }
.sm-chip-live { background: var(--dsw-alias-state-warn-primary, #d97706); color: #fff; }
.sm-actions { display: flex; gap: 6px; flex-shrink: 0; }
.sm-mig { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.sm-select { border: 1px solid var(--dsw-alias-border-l1, #e4e4e7); background: var(--dsw-alias-bg-layer-2, #f4f4f5); color: var(--dsw-alias-label-primary, #18181b); border-radius: 8px; padding: 3px 6px; font-size: 12px; max-width: 220px; }
.sm-empty { color: var(--dsw-alias-label-secondary, #71717a); padding: 10px 12px; font-size: 12px; }
.sm-error { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #dc2626) 12%, transparent); color: var(--dsw-alias-state-error-primary, #dc2626); padding: 8px 12px; border-radius: 8px; font-size: 12px; }
.sm-toast { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); background: var(--dsw-alias-bg-overlay, #18181b); color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 12px; }
.sm-hint { color: var(--dsw-alias-label-secondary, #71717a); font-size: 11px; padding: 0 2px; }
`;

    // Direct gateway call, bypassing the mounted Remote namespace machinery:
    // the Host gateway accepts POST /api/<namespace>/<method> with { args }
    // and resolves the endpoint against the live `sessionManager` service via
    // SRC markers. No generated stubs, no strict codecs, no inject gating.
    function makeSessionManager(connection) {
      const call = (method, args) => connection.rpc.call("/api", "sessionManager/" + method, { args: args || {} }, undefined);
      return {
        list: () => call("list"),
        archive: (sessionId) => call("archive", { sessionId: sessionId }),
        unarchive: (sessionId) => call("unarchive", { sessionId: sessionId }),
        delete: (sessionId) => call("delete", { sessionId: sessionId }),
        migrate: (sessionId, workspaceId) => call("migrate", { sessionId: sessionId, workspaceId: workspaceId }),
      };
    }

    function unwrap(result) {
      if (result && result.ok) return result.value;
      const message = result && result.error && (result.error.message || result.error.code) ? result.error.message || result.error.code : "调用失败";
      throw new Error(message);
    }

    function ManagerContent(props) {
      const sm = props.sm;
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      const [busy, setBusy] = React.useState(null);
      const [confirm, setConfirm] = React.useState(null);
      const [migrate, setMigrate] = React.useState(null);
      const [toast, setToast] = React.useState(null);

      const load = () => {
        setLoading(true);
        sm.list().then((r) => {
          setData(unwrap(r));
          setError(null);
        }).catch((e) => {
          setError((e && e.message) || String(e));
        }).finally(() => setLoading(false));
      };

      React.useEffect(() => { load(); }, []);

      const wsRev = props.useWorkspaces((s) => (s && s.items ? s.items.length + ":" + (s.archivedSessionIds || []).join(",") : ""));
      React.useEffect(() => { if (wsRev) load(); }, [wsRev]);

      const run = (kind, sessionId, extra, okText) => {
        const key = kind + ":" + sessionId;
        setBusy(key);
        setError(null);
        setConfirm(null);
        let promise;
        if (kind === "archive") promise = sm.archive(sessionId);
        else if (kind === "unarchive") promise = sm.unarchive(sessionId);
        else if (kind === "delete") promise = sm.delete(sessionId);
        else promise = sm.migrate(sessionId, extra.workspaceId);
        promise.then((r) => {
          setData(unwrap(r));
          setToast(okText);
        }).catch((e) => {
          setError((e && e.message) || String(e));
        }).finally(() => setBusy(null));
      };

      const isBusy = (s, kind) => busy === (kind + ":" + s.sessionId);

      const actionsFor = (s) => {
        const btns = [];
        if (s.archived) {
          btns.push(React.createElement("button", { key: "restore", className: "sm-btn", disabled: isBusy(s, "unarchive"), onClick: () => run("unarchive", s.sessionId, null, "已恢复归档") }, "恢复"));
        } else {
          btns.push(React.createElement("button", { key: "archive", className: "sm-btn", disabled: isBusy(s, "archive"), onClick: () => run("archive", s.sessionId, null, "已归档") }, "归档"));
        }
        btns.push(React.createElement("button", { key: "migrate", className: "sm-btn", disabled: isBusy(s, "migrate"), onClick: () => setMigrate({ sessionId: s.sessionId, title: s.title, wsId: s.wsId }) }, "迁移"));
        if (confirm === s.sessionId) {
          btns.push(React.createElement("button", { key: "del2", className: "sm-btn sm-btn-danger", disabled: isBusy(s, "delete"), onClick: () => run("delete", s.sessionId, null, "已物理删除") }, "确认删除?"));
          btns.push(React.createElement("button", { key: "delx", className: "sm-btn", onClick: () => setConfirm(null) }, "取消"));
        } else {
          btns.push(React.createElement("button", { key: "del", className: "sm-btn", disabled: isBusy(s, "delete"), onClick: () => setConfirm(s.sessionId) }, "删除"));
        }
        return React.createElement("div", { className: "sm-actions" }, btns);
      };

      const renderRow = (s, wsId, archived) => {
        const row = { sessionId: s.sessionId, title: s.title, cwd: s.cwd, running: s.running, live: s.live, archived: archived, wsId: wsId };
        const chips = [];
        if (row.running) chips.push(React.createElement("span", { key: "run", className: "sm-chip sm-chip-live" }, "运行中"));
        else if (row.live) chips.push(React.createElement("span", { key: "live", className: "sm-chip" }, "已加载"));
        const titleText = row.title || "(无标题)";
        const mig = migrate && migrate.sessionId === s.sessionId;
        return React.createElement("div", { key: s.sessionId, className: "sm-row" },
          React.createElement("div", { className: "sm-row-main" },
            React.createElement("div", { className: "sm-row-title" }, titleText, chips),
            React.createElement("div", { className: "sm-row-id" }, s.sessionId + (s.cwd ? "  ·  " + s.cwd : ""))
          ),
          mig
            ? React.createElement("div", { className: "sm-mig" },
                React.createElement("select", {
                  className: "sm-select",
                  value: migrate.workspaceId || "",
                  onChange: (e) => setMigrate(Object.assign({}, migrate, { workspaceId: e.target.value })),
                },
                  React.createElement("option", { value: "", disabled: true }, "选择目标工作区…"),
                  (data.workspaces || []).filter((w) => w.workspaceId !== String(wsId || "")).map((w) => React.createElement("option", { key: w.workspaceId, value: w.workspaceId }, w.title + "  (" + w.path + ")"))
                ),
                React.createElement("button", { className: "sm-btn sm-btn-primary", disabled: !migrate.workspaceId || isBusy(row, "migrate"), onClick: () => run("migrate", s.sessionId, { workspaceId: migrate.workspaceId }, "已迁移") }, "迁移"),
                React.createElement("button", { className: "sm-btn", onClick: () => setMigrate(null) }, "取消")
              )
            : actionsFor(row)
        );
      };

      const renderGroup = (ws) => {
        const els = [];
        for (const s of ws.sessions) els.push(renderRow(s, ws.workspaceId, false));
        if (ws.archived.length > 0) {
          els.push(React.createElement("div", { key: "arch-label", className: "sm-sub" }, "已归档  (" + ws.archived.length + ")"));
          for (const s of ws.archived) els.push(renderRow(s, ws.workspaceId, true));
        }
        return React.createElement("div", { key: ws.workspaceId, className: "sm-ws" },
          React.createElement("div", { className: "sm-ws-head" },
            React.createElement("span", { className: "sm-ws-title" }, ws.title),
            React.createElement("span", { className: "sm-ws-path" }, ws.path),
            React.createElement("span", { className: "sm-count" }, (ws.sessions.length + ws.archived.length) + " 个会话")
          ),
          els.length === 0 ? React.createElement("div", { className: "sm-empty" }, "暂无会话") : els
        );
      };

      const sections = [];
      if (data) {
        for (const ws of data.workspaces || []) sections.push(renderGroup(ws));
        if ((data.ungrouped || []).length > 0 || (data.ungroupedArchived || []).length > 0) {
          const unEls = [];
          for (const s of data.ungrouped || []) unEls.push(renderRow(s, null, false));
          if ((data.ungroupedArchived || []).length > 0) {
            unEls.push(React.createElement("div", { key: "uarch-label", className: "sm-sub" }, "已归档  (" + data.ungroupedArchived.length + ")"));
            for (const s of data.ungroupedArchived || []) unEls.push(renderRow(s, null, true));
          }
          sections.push(React.createElement("div", { key: "ungrouped", className: "sm-ws" },
            React.createElement("div", { className: "sm-ws-head" },
              React.createElement("span", { className: "sm-ws-title" }, "未分组会话"),
              React.createElement("span", { className: "sm-count" }, ((data.ungrouped || []).length + (data.ungroupedArchived || []).length) + " 个会话")
            ),
            unEls.length === 0 ? React.createElement("div", { className: "sm-empty" }, "暂无会话") : unEls
          ));
        }
        if (sections.length === 0) sections.push(React.createElement("div", { key: "none", className: "sm-empty" }, "暂无会话"));
      }

      const bodyChildren = [];
      if (error) bodyChildren.push(React.createElement("div", { key: "err", className: "sm-error" }, String(error)));
      if (loading && !data) bodyChildren.push(React.createElement("div", { key: "loading", className: "sm-empty" }, "加载中…"));
      if (!loading && data) bodyChildren.push(React.createElement("div", { key: "hint", className: "sm-hint" }, "提示：正在运行（running）的会话无法删除/迁移；已加载但空闲的会话会被自动安全关闭后再操作。"));
      for (const s of sections) bodyChildren.push(s);

      return React.createElement("div", { className: "sm-content" },
        React.createElement("div", { className: "sm-head" },
          React.createElement("span", { className: "sm-title" }, "会话管理"),
          React.createElement("button", { className: "sm-btn", onClick: load, disabled: loading }, "刷新"),
          props.onClose ? React.createElement("button", { className: "sm-btn", onClick: props.onClose }, "关闭") : null
        ),
        React.createElement("div", { className: "sm-body" }, bodyChildren),
        toast ? React.createElement("div", { className: "sm-toast" }, toast) : null
      );
    }

    function apply(ctx) {
      const slots = ctx.get("slots");
      const connection = ctx.get("connection");
      if (slots === undefined || connection === undefined) return;
      const sm = makeSessionManager(connection);

      let open = false;
      const subs = new Set();
      const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
      const setOpen = (v) => { open = v; for (const fn of Array.from(subs)) fn(); };
      const toggle = () => setOpen(!open);

      const styleEl = React.createElement("style", { key: "sm-style" }, CSS);

      slots.inject("sidebar.footer.action", () => slots.register(
        { name: "sidebar.footer.action", id: "session-manager", order: 100, label: () => "会话管理" },
        (props) => {
          const [, setTick] = React.useState(0);
          React.useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
          return React.createElement(React.Fragment, null,
            styleEl,
            React.createElement("button", { className: "sm-entry", title: "会话管理", onClick: toggle },
              React.createElement("span", { style: { fontSize: 13 } }, "▦"),
              props.wide ? React.createElement("span", null, open ? "关闭" : "会话管理") : null
            )
          );
        }
      ));

      slots.inject("shell.overlay", () => slots.register(
        { name: "shell.overlay", id: "session-manager-panel" },
        (props) => {
          const [visible, setVisible] = React.useState(false);
          React.useEffect(() => subscribe(setVisible), []);
          if (!visible) return null;
          return React.createElement("div", { className: "sm-mask", onClick: () => setOpen(false) },
            React.createElement("div", { className: "sm-panel", onClick: (e) => e.stopPropagation() },
              styleEl,
              React.createElement(ManagerContent, { sm: sm, useWorkspaces: props.useWorkspaces, onClose: () => setOpen(false) })
            )
          );
        }
      ));

      slots.inject("settings.section", () => slots.register(
        { name: "settings.section", id: "session-manager", order: 30, label: () => "会话管理" },
        (props) => React.createElement("div", { className: "sm-page" },
          styleEl,
          React.createElement(ManagerContent, { sm: sm, useWorkspaces: props.useWorkspaces })
        )
      ));
    }

    module.exports = { apply, inject: ["slots", "connection"] };
    return module.exports;
  },
});
