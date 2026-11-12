# 独立 VPS 部署

目标域名：`island.6hx9.com`。部署文件已经准备好；本次按要求暂不连接或修改 VPS，也未启用该域名的联机服务。

游戏使用独立的 Compose 项目 `island-royale`，仅将主机回环端口 `127.0.0.1:4180` 交给已有 Caddy 转发。它不需要数据库，不占用现有应用的目录、端口或存储卷。

## 准备

确认 VPS 已有 Docker Compose，端口 4180 未被占用，并将域名 DNS 指向 VPS。检查已有 Caddy 的运行方式；下面片段适用于运行在主机上的 Caddy。若 Caddy 本身在容器中，必须根据现有网络连接方式调整代理目标，不要直接改动其他容器的网络。

在一个新的独立目录取得代码，例如 `/opt/island-royale`。之后只在该目录中操作：

```sh
git clone https://github.com/HuanxiangGG/island-royale.git /opt/island-royale
cd /opt/island-royale
docker compose -p island-royale up -d --build
curl --fail http://127.0.0.1:4180/health
```

容器使用非 root 用户、只读文件系统和独立资源上限，默认最多 6 场对局、120 个连接。`mem_limit`、`cpus` 和人数上限需要按 VPS 实际余量调整；这些上限不是经过大规模并发测试的性能承诺。

## 接入 HTTPS 与 WebSocket

备份现有 Caddy 配置，将 [Caddyfile.snippet](./Caddyfile.snippet) 的独立域名区块加入配置，保留其他站点。先验证完整配置，再使用现有部署方式重新加载 Caddy。

```sh
caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl --fail https://island.6hx9.com/health
```

Caddy 的 `reverse_proxy` 会处理 WebSocket 升级。成功后打开 `https://island.6hx9.com/`；同源 `/config.json` 会自动启用 `/ws`。用两个独立浏览器进入联机匹配，确认显示相同房间并能互相看到行动。

GitHub Pages / Sites 是静态前端，无法自己运行 WebSocket 服务器。目前静态 `dist/config.json` 保持联机关闭，避免展示假联机。VPS 验证完成后，才将静态配置的 `multiplayerEnabled` 改为 `true`、`multiplayerUrl` 设置为 `wss://island.6hx9.com/ws`，并重新发布前端。若还有其他前端域名，将其精确来源加入 Compose 的 `ALLOWED_ORIGINS`，逗号分隔。

## 更新、回退与停止

记录上一次已验证的 Git 提交后更新，并只重建本项目：

```sh
cd /opt/island-royale
git pull --ff-only
docker compose -p island-royale up -d --build
docker compose -p island-royale ps
```

回退时先切换到上一次已验证的提交，再运行本项目的重建命令。只停止此游戏可使用 `docker compose -p island-royale stop`。不要执行全局 Docker 清理、删除其他应用的卷，或覆盖已有 Caddy 配置。

## 服务边界

- 房间和比赛只保存在内存中，重启会结束正在进行的比赛。
- 首位真人加入后等待 10 秒，开局时用电脑补足 50 个参赛者。
- 等待时断开会释放名额；战斗中断开由电脑接管角色；没有真人连接的房间立即清理。
- 服务器以 30 Hz 计算世界，10 Hz 下发快照。输入过期、发送频率、消息体大小、慢连接缓冲均有上限。
- 没有账号、付费、数据库或聊天内容；服务默认仅输出启动信息，不记录玩家姓名、IP 或操作日志。
- 当前不提供跨进程匹配、自动扩容或断线重连恢复。部署前应在目标 VPS 进行实际网络和负载验证。
