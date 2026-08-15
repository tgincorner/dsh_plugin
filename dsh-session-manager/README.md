# dsh-session-manager

dsh web 会话管理插件：按工作区列出会话（区分未归档 / 已归档），支持**物理删除**、**恢复已归档会话**、**跨工作区迁移**。

- 入口 1：侧边栏底部「▦ 会话管理」按钮（弹出面板）
- 入口 2：设置（左下角齿轮）→「会话管理」页面

## 安装（同事部署方式）

把本目录（或打包成的 tarball / 推到 git 仓库）交给同事，在同事机器上：

```bash
pkill -f "dsh web"; sleep 2
dsh plugin --profile web add /绝对路径/dsh-session-manager-1.0.2.tgz
dsh web --port 3080
```

验证：
- 启动日志无 `dsh-session-manager` 相关报错；
- 页面刷新后，侧边栏底部出现「▦ 会话管理」，设置里出现「会话管理」页；
- 插件随 dsh 启动加载、随页面加载——**刷新不丢、进程重启不丢**（与动态插件不同）。

> 从 npm registry 安装：`dsh plugin add dsh-session-manager`（需要先发布到 registry）。

## 工作原理

| 部分 | 机制 |
|---|---|
| Host 服务 | 一个 Cordis `Service`（`TypertRemoteService` 子类），以 `@Remote` 注册命名空间 `sessionManager`，方法 `list / archive / unarchive / delete / migrate` |
| 客户端调用 | `dsh.client` 声明 + 手写 `__ModuleLoader__` bundle；运行时通过 `ctx.remote.$mount()` 挂载 src-json 描述符，经 typert 网关调用 Host 服务——**无需重新构建前端** |
| 组合加载 | `dsh.bundle` 声明 + `cordis.patch.yml` 插入一行 `session-manager`，随 profile 组合在启动时加载 |

## 功能与注意事项

- **列出**：按工作区分组，未归档 / 已归档分区，含未分组会话；显示标题、sessionId、cwd、运行状态。
- **归档 / 恢复归档**：归档只隐藏，日志保留；恢复即取消归档标记。
- **物理删除**：二次确认后删除会话日志目录（`~/.dsh/sessions/<项目>/session-<id>/`），并清理工作区记账与归档集合。已加载但空闲的会话会先安全排空写入并卸载（store 条目 detach），不会"复活"。
- **迁移**：把会话日志头的 `cwd` 改写为目标工作区路径并把文件移动到目标项目目录（事件内容逐字节保留，写后校验），再更新工作区记账。迁移由内置 `node -e` 脚本完成（`node:zlib` 原生 zstd，按帧解码→改 header→重编码）。
- **保护**：正在运行（running）的会话拒绝删除 / 迁移。
- 恢复归档、删除、迁移在平台没有公开 API，实现会直接读写 workspace 领域状态与 store 内部条目——这是目前唯一可行的途径，改动是受控的。

## 卸载

```bash
dsh plugin --profile web remove dsh-session-manager   # pnpm remove 并从 bundles 列表移除
# 或手动删除 profile 的 package.json 里 bundles 中对应项后 pnpm install
# 重启 dsh web 生效
```

## 开发说明

- `lib/index.js`：Host 服务。`Remote(name)` 装饰器以手工方式应用（无装饰器语法，Node 直接加载）。
- `lib/client.js`：客户端 bundle（`__ModuleLoader__.load` 工厂形态），`require("react")` 走平台 seed；UI 复用动态版组件。
- 修改后无需重新构建前端：bundle 就是包内的 `lib/client.js`，由 `client-modules` 直接按 URL 服务。
