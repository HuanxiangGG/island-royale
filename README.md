# 荒岛突围 · Island Royale

一个打开浏览器就能玩的原创 2D 俯视角大逃杀游戏。探索海岛、收集装备、躲避风暴，在 23 名电脑对手之间活到最后。

本版本为 **1 名玩家 + 23 名电脑对手**，在浏览器本地运行，不需要注册、游戏服务器或 API 密钥。电脑对手之间也会战斗；这不是多人在线联机版。

## 游戏内容

- 原创海岛场景，包含树木、岩石、房屋和可破坏的物资箱。
- 五种武器、弹药、护盾和医疗物资，支持换弹与切换装备。
- 会寻找目标、利用射线判断障碍并向安全区移动的电脑对手。
- 分阶段收缩的安全区、圈外伤害、淘汰提示与胜负结算。
- 键盘鼠标操作与手机双摇杆操作。

所有图形均由代码绘制。游戏借鉴俯视角大逃杀这一玩法类型，未使用 Zombs Royale 的代码、名称标识、地图或美术资源，也与其运营方无关联。

## 本地运行

需要 Node.js 22 或更新版本，无需安装任何运行依赖。

```sh
git clone https://github.com/HuanxiangGG/island-royale.git
cd island-royale
npm start
```

在浏览器打开终端显示的地址，默认是 `http://127.0.0.1:4173`。按 `Ctrl+C` 停止本地服务器。可用 `PORT=8080 npm start` 更改端口。

请通过 HTTP 服务器打开，不要直接双击 `index.html`；浏览器的模块加载规则会限制 `file://` 页面。

## 操作

| 操作 | 键盘鼠标 |
| --- | --- |
| 移动 | WASD / 方向键 |
| 瞄准 | 移动鼠标 |
| 开火 | 鼠标左键 |
| 奔跑 | Shift |
| 拾取 / 开箱 | E |
| 换弹 | R |
| 切换装备 | 1 / 2 / 3 |
| 使用医疗包 | Q |
| 暂停 / 继续 | Esc |

手机使用左侧摇杆移动、右侧摇杆瞄准并射击，其他操作使用屏幕按钮。横屏更适合战斗。

## 检查与发布

```sh
npm test
```

测试使用 Node.js 内置测试工具验证游戏逻辑。网页文件全部位于 `dist/`，可直接发布到静态网站服务。

仓库包含 GitHub Pages 自动发布流程。在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions** 后，推送到 `main` 会先运行测试，再发布 `dist/`。也可以在 Actions 中手动运行 **Test and publish GitHub Pages**。

默认 Pages 地址为 <https://huanxianggg.github.io/island-royale/>。实际发布是否完成，请以仓库 Actions 的部署结果为准。

## 项目结构

```text
dist/                   网页与游戏资源
  js/game.js            无界面的游戏规则与电脑对手逻辑
  js/renderer.js        Canvas 场景与小地图绘制
tests/                  游戏逻辑测试
scripts/serve.mjs       本地静态服务器
.github/workflows/      测试与 GitHub Pages 发布
```

当前版本专注完整的电脑对战体验，不包含真人联机、账号、付费系统或云端排行榜。
