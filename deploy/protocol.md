# 联机协议 v3

浏览器连接同源 `ws(s)://<host>/ws`。服务器在 `GET /config.json` 返回：

```json
{"multiplayerEnabled":true,"multiplayerUrl":"/ws"}
```

静态发布使用 `dist/config.json`，只有 VPS 完成验证后才启用远端 WSS 地址。

## 客户端消息

```json
{"type":"join","name":"旅人","color":"#edbd5b"}
{"type":"input","seq":1,"moveX":1,"moveY":0,"angle":0,"shoot":false,"sprint":false,"jump":false}
{"type":"action","action":"pickup"}
{"type":"action","action":"reload"}
{"type":"action","action":"heal"}
{"type":"action","action":"switch","slot":1}
{"type":"ping"}
```

`seq` 是递增的非负安全整数。移动分量必须在 -1 到 1，角度为有限弧度数，射击、奔跑、跳伞字段为布尔值。服务器仅采用这些输入；客户端提交的位置、生命、物资、房间 ID 等不会成为模拟状态。装备槽索引为 0–2。

服务器接收操作频率上限约 75 条/秒、短时余量 100 条；动作最短间隔 100ms。输入 400ms 未更新会归零。单条输入最大 1024 字节。发送缓冲超过 512 KiB 的慢连接会被关闭。

## 服务器消息

```json
{"type":"waiting","roomId":"...","playerId":"...","humans":2,"capacity":50,"remaining":9}
{"type":"start","roomId":"...","playerId":"...","state":{}}
{"type":"snapshot","serverTime":1730000000000,"tick":3,"state":{}}
{"type":"error","code":"server_full","message":"服务器对局已满，请稍后再试。"}
{"type":"pong","serverTime":1730000000000}
```

真人只会进入等待中的公共房间；首人加入后倒计时 10 秒，满 50 名真人立即开始。开局电脑数为 `50 - 真人数`。玩家与房间 ID 由服务器生成，客户端不能指定。房间开始后不再接受新玩家，新的加入者进入下一间等待房。

状态包含世界尺寸、时间、阶段、空投、区域、角色、障碍、建筑、聚落、物资、子弹、粒子、事件和胜者 ID。`worldSize` 为 8400。`phase` 依次为 `flight`、`combat`、`finished`。最终 `status` 为 `finished`，`winnerId` 是胜者的字符串 ID 或 `null`。

`flight` 表示仍在空投阶段，不表示所有角色都禁止战斗。以每个角色的 `dropState` 判断：`ground` 角色立即允许移动、拾取和开火，`plane` / `falling` 角色仍在空中。安全区计时在全体落地后开始。`drop.route` 携带航线 `start` / `end` 世界坐标。

`start` 包含完整的 `obstacles`、`loot`、`buildings` 和 `regions`。后续快照若某个世界数组未发生变化会省略该字段；字段出现时是完整替换数组，省略时客户端必须保留上次对应数组。角色、子弹、粒子等动态数组每次替换。电脑角色省略装备栏等不影响远端绘制的私有数据，真人角色保留完整装备状态。

`buildings` 是房屋的静态元数据：`{id,x,y,w,h,doorSide,doorWidth,style,name}`，位置为中心点、尺寸为完整外框，`doorSide` 为 north/south/east/west、门宽 110。实体碰撞由 `obstacles` 内的 `type:"wall"` 墙段承担，墙段的 `buildingId` 关联对应房屋；门洞无实体墙。`regions` 为九处聚落 `{id,name,x,y,style}`，供小地图和全图标注使用。服务器仅首次发送这些静态数组，或在其元数据变化时完整重发。

客户端保存 `start.playerId`，从 `state.actors` 找出自己的角色；自己的击败数与名次读取该角色的 `kills`、`placement`。后续快照不重复发送 `playerId`。服务器不会发送重复的 `state.player` 引用，也不会将任何玩家死亡误判为整个联机房间立即结束。

模拟步长为 1/30 秒，每 3 次模拟发送一次快照。坐标和其他有限小数在网络编码时保留两位小数。每间房间的公共快照只编码一次，再发送给该房所有客户端。客户端可以在相邻快照间插值绘制，但不得通过本地预测改写服务器比赛结果。

## 连接与房间生命周期

- 连接后 15 秒内未加入房间会断开。
- 服务端定期 Ping，未响应的连接会关闭。
- 等待中断开会释放名额；战斗中断开后电脑接管该角色。
- 没有真人连接的房间立即清理；比赛结束后保留结果 25 秒再关闭连接。
- 同源网页允许连接；其他来源必须在 `ALLOWED_ORIGINS` 中精确配置。
- 默认上限：6 个房间、120 个 WebSocket 连接；没有无限匹配队列。

建筑元数据 `buildings[].kind` 为 cottage / villa / workshop / barn / store / clinic，用于客户端选择建筑外观。武器索引扩充为 0–13，前五种索引保持兼容。
