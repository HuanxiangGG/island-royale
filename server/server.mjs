import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createGame, stepGame, pickup, reload, heal, switchWeapon } from '../dist/js/game.js';

const CAPACITY = 50;
const STEP = 1 / 30;
const ACTOR_FIELDS = ['id','name','color','isBot','isPlayer','connected','x','y','vx','vy','radius','angle','hp','shield','alive','weapon','rarity','ammo','reserve','reloading','cooldown','inventory','slot','medkits','kills','hitFlash','muzzleFlash','spawnProtection','healCooldown','placement','dropState','altitude','dropTarget'];
const BOT_FIELDS = ACTOR_FIELDS.filter(key=>!['ammo','reserve','reloading','cooldown','inventory','slot','medkits','healCooldown','dropTarget'].includes(key));
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2' };
const pick = (object, fields) => Object.fromEntries(fields.filter(key => object[key] !== undefined).map(key => [key, object[key]]));

// No RNG functions, AI targets, socket details or server-only room data leave the server.
export function snapshotState(state, {includeObstacles=true,includeLoot=true,includeBuildings=true,includeRegions=true} = {}) {
  const snapshot = {
    ...pick(state, ['worldSize','seed','time','combatTime','phase','phaseRemaining','status','winnerId','drop','zone','kills','placement']),
    actors: state.actors.map(actor => pick(actor, actor.isBot ? BOT_FIELDS : ACTOR_FIELDS)),
    bullets: state.bullets.slice(-250).map(bullet => pick(bullet, ['x','y','px','py','vx','vy','owner','damage','life','color'])),
    particles: state.particles.slice(-100),
    events: state.events.slice(0, 8),
  };
  if (includeObstacles) snapshot.obstacles=state.obstacles.map(obstacle=>pick(obstacle,['id','x','y','w','h','type','hp','maxHp','alive','buildingId']));
  if (includeLoot) snapshot.loot=state.loot.filter(item=>item.alive).map(item=>pick(item,['id','x','y','type','weapon','rarity','amount','alive']));
  if (includeBuildings) snapshot.buildings=(state.buildings || []).map(building=>pick(building,['id','x','y','w','h','doorSide','doorWidth','style','name']));
  if (includeRegions) snapshot.regions=(state.regions || []).map(region=>pick(region,['id','name','x','y','style']));
  return snapshot;
}

const obstacleSignature=state=>state.obstacles.map(item=>`${item.id}:${item.alive}:${item.hp}`).join('|');
const lootSignature=state=>state.loot.map(item=>`${item.id}:${item.alive}:${item.weapon}:${item.rarity}`).join('|');
const buildingSignature=state=>JSON.stringify(state.buildings || []);
const regionSignature=state=>JSON.stringify(state.regions || []);
const encode=data=>JSON.stringify(data,(_,value)=>typeof value==='number'&&Number.isFinite(value)?Math.round(value*100)/100:value);

export function createRoyaleServer(options = {}) {
  const config = {
    host: options.host ?? '127.0.0.1', port: options.port ?? 4180,
    queueMs: options.queueMs ?? 10_000, maxRooms: options.maxRooms ?? 6,
    maxConnections: options.maxConnections ?? 120, maxBufferedBytes: options.maxBufferedBytes ?? 512 * 1024,
    allowedOrigins: options.allowedOrigins ?? [], staticDir: options.staticDir ?? fileURLToPath(new URL('../dist/', import.meta.url)),
    ...options,
  };
  const rooms = new Map(), clients = new Set();
  let closing = false, interval;
  const staticRoot = path.resolve(config.staticDir);
  const inside = filename => filename === staticRoot || filename.startsWith(staticRoot + path.sep);

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    const reply = (status, body, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); reply(405, '{"error":"method_not_allowed"}'); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { reply(400,'{"error":"invalid_url"}'); return; }
    if (pathname === '/health') {
      const waiting = [...rooms.values()].filter(room => room.phase === 'waiting').length;
      reply(200, JSON.stringify({ok:true,rooms:{waiting,playing:rooms.size-waiting},connections:clients.size})); return;
    }
    if (pathname === '/config.json') { reply(200, JSON.stringify({multiplayerEnabled:true,multiplayerUrl:'/ws'})); return; }
    if (pathname.includes('\0')) { reply(400,'{"error":"invalid_path"}'); return; }
    try {
      let filename = path.resolve(staticRoot, '.' + pathname);
      if (!inside(filename)) { reply(403,'{"error":"forbidden"}'); return; }
      if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
      filename = await realpath(filename);
      if (!inside(filename)) { reply(403,'{"error":"forbidden"}'); return; }
      const body = await readFile(filename);
      res.writeHead(200, {'Content-Type':MIME[path.extname(filename)] || 'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-cache'});
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) { reply(['ENOENT','ENOTDIR'].includes(error.code) ? 404 : 500, '{"error":"not_found"}'); }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  const wss = new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});

  function send(client, data) {
    if (client.socket.readyState !== WebSocket.OPEN) return false;
    if (client.socket.bufferedAmount > config.maxBufferedBytes) { client.socket.close(1013, 'Connection too slow'); return false; }
    const packet = typeof data === 'string' ? data : encode(data);
    client.socket.send(packet, error => { if (error) client.socket.terminate(); });
    return true;
  }
  function error(client, code, message) { send(client,{type:'error',code,message}); }
  function broadcastWaiting(room) {
    for (const client of room.clients) send(client,{type:'waiting',roomId:room.id,playerId:client.id,humans:room.clients.size,capacity:CAPACITY,remaining:Math.max(0,Math.ceil((room.startsAt-Date.now())/1000))});
  }
  function startRoom(room) {
    if (room.phase !== 'waiting' || !room.clients.size) return;
    const players = [...room.clients].map(client => ({id:client.id,name:client.name,color:client.color}));
    room.state = createGame({seed:Date.now(),players,botCount:CAPACITY-players.length,drop:config.drop ?? true,multiplayer:true});
    room.phase = 'playing'; room.tick = 0;
    room.obstacleSignature=obstacleSignature(room.state);room.lootSignature=lootSignature(room.state);
    room.buildingSignature=buildingSignature(room.state);
    room.regionSignature=regionSignature(room.state);
    for (const client of room.clients) send(client,{type:'start',roomId:room.id,playerId:client.id,state:snapshotState(room.state)});
  }
  function join(client, data) {
    if (client.room) { error(client,'already_joined','你已经进入一场对局。'); return; }
    let room = [...rooms.values()].find(room => room.phase === 'waiting' && room.clients.size < CAPACITY);
    if (!room) {
      if (rooms.size >= config.maxRooms) { error(client,'server_full','服务器对局已满，请稍后再试。'); return; }
      room = {id:randomUUID(),clients:new Set(),phase:'waiting',startsAt:Date.now()+config.queueMs,createdAt:Date.now(),tick:0,lastWaiting:0};
      rooms.set(room.id,room);
    }
    client.name = typeof data.name === 'string' ? [...data.name.replace(/[\u0000-\u001f\u007f]/g,'').trim()].slice(0,16).join('') || '无名旅人' : '无名旅人';
    client.color = typeof data.color === 'string' && /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : '#edbd5b';
    client.room = room; room.clients.add(client); broadcastWaiting(room);
    if(room.clients.size>=CAPACITY)startRoom(room);
  }
  function disconnect(client) {
    clients.delete(client);
    const room = client.room;
    if (!room) return;
    room.clients.delete(client); client.room = null;
    if (!room.clients.size) { rooms.delete(room.id); return; }
    if (room.state) {
      const actor = room.state.actors.find(actor => actor.id === client.id);
      if (actor?.alive) {
        actor.connected = false; actor.isBot = true; actor.isPlayer = false;
      }
    } else broadcastWaiting(room);
  }
  function receive(client, raw, binary) {
    const now = Date.now();
    client.tokens = Math.min(100,client.tokens+(now-client.lastRefill)*0.075); client.lastRefill=now;
    if (--client.tokens < 0) { client.socket.close(1008,'Message rate limit'); return; }
    let data;
    try { data = binary ? null : JSON.parse(raw.toString()); } catch { data = null; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) { error(client,'invalid_message','消息格式无效。'); return; }
    if (data.type === 'join') { join(client,data); return; }
    if (data.type === 'ping') { send(client,{type:'pong',serverTime:now}); return; }
    const room = client.room;
    if (!room || room.phase !== 'playing') { error(client,'not_playing','请先加入对局。'); return; }
    if (data.type === 'input') {
      const valid = Number.isSafeInteger(data.seq) && data.seq >= 0 && ['moveX','moveY','angle'].every(key => typeof data[key] === 'number' && Number.isFinite(data[key]))
        && Math.abs(data.moveX) <= 1 && Math.abs(data.moveY) <= 1 && Math.abs(data.angle) <= Math.PI*2
        && ['shoot','sprint','jump'].every(key => data[key] === undefined || typeof data[key] === 'boolean');
      if (!valid) { error(client,'invalid_input','输入超出允许范围。'); return; }
      if (data.seq <= client.seq) return;
      client.seq = data.seq; client.inputAt = now;
      client.input = {moveX:data.moveX,moveY:data.moveY,angle:data.angle,shoot:!!data.shoot,sprint:!!data.sprint,jump:!!data.jump};
      return;
    }
    if (data.type === 'action') {
      if (now-client.actionAt < 100) return;
      const actor = room.state.actors.find(actor => actor.id === client.id);
      if (!actor?.alive) return;
      if (!['pickup','reload','heal','switch'].includes(data.action) || data.action === 'switch' && (!Number.isInteger(data.slot) || data.slot < 0 || data.slot > 2)) { error(client,'invalid_action','操作无效。'); return; }
      client.actionAt=now;
      if (data.action === 'pickup') pickup(room.state,actor);
      if (data.action === 'reload') reload(room.state,actor);
      if (data.action === 'heal') heal(room.state,actor);
      if (data.action === 'switch') switchWeapon(room.state,data.slot,actor);
      return;
    }
    error(client,'unknown_message','不支持的消息类型。');
  }
  wss.on('connection', socket => {
    const client = {id:randomUUID(),socket,room:null,seq:-1,input:{},inputAt:0,actionAt:0,tokens:100,lastRefill:Date.now(),connectedAt:Date.now(),lastPong:Date.now(),lastPing:Date.now()};
    clients.add(client);
    socket.on('message',(raw,binary)=>receive(client,raw,binary));
    socket.on('pong',()=>client.lastPong=Date.now());
    socket.on('error',()=>{});
    socket.on('close',()=>disconnect(client));
  });
  server.on('upgrade',(req,socket,head)=>{
    let pathname;
    try { pathname = new URL(req.url,'http://localhost').pathname; } catch { socket.destroy(); return; }
    if (closing || pathname !== '/ws' || clients.size >= config.maxConnections) { socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n'); return; }
    const origin=req.headers.origin;
    let sameOrigin=false;
    try { sameOrigin=origin && new URL(origin).host === req.headers.host; } catch {}
    if (origin && !sameOrigin && !config.allowedOrigins.includes(origin)) { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return; }
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
  });

  function tick() {
    const now=Date.now();
    for (const client of clients) {
      if (!client.room && now-client.connectedAt > 15_000 || now-client.lastPong > 65_000) { client.socket.terminate(); continue; }
      if (now-client.lastPing > 30_000) { client.lastPing=now; if (client.socket.readyState === WebSocket.OPEN) client.socket.ping(); }
    }
    for (const room of rooms.values()) {
      if (room.phase === 'waiting') {
        if (now >= room.startsAt) startRoom(room);
        else if (now-room.lastWaiting >= 250) { room.lastWaiting=now; broadcastWaiting(room); }
        continue;
      }
      const inputs={};
      for (const client of room.clients) inputs[client.id]=now-client.inputAt < 400 ? client.input : {};
      stepGame(room.state,STEP,inputs); room.tick++;
      if (room.tick%3===0) {
        const obstacles=obstacleSignature(room.state),loot=lootSignature(room.state),buildings=buildingSignature(room.state),regions=regionSignature(room.state);
        const state=snapshotState(room.state,{includeObstacles:obstacles!==room.obstacleSignature,includeLoot:loot!==room.lootSignature,includeBuildings:buildings!==room.buildingSignature,includeRegions:regions!==room.regionSignature});
        room.obstacleSignature=obstacles;room.lootSignature=loot;room.buildingSignature=buildings;room.regionSignature=regions;
        const packet=encode({type:'snapshot',serverTime:now,tick:room.tick,state});
        for (const client of room.clients) send(client,packet);
      }
      if (room.state.phase === 'finished' || room.state.status === 'finished') room.finishedAt ||= now;
      if (room.finishedAt && now-room.finishedAt > 25_000 || now-room.createdAt > 600_000) {
        for (const client of room.clients) client.socket.close(1000,'Match finished');
        rooms.delete(room.id);
      }
    }
  }

  return {
    server, rooms, clients,
    async listen() {
      await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.host,()=>{server.off('error',reject);resolve();});});
      interval=setInterval(tick,1000/30);
      const address=server.address();
      return {host:config.host,port:address.port,url:`http://${config.host}:${address.port}`};
    },
    async close() {
      closing=true;clearInterval(interval);
      for (const client of clients) client.socket.terminate();
      rooms.clear();
      await new Promise(resolve=>wss.close(resolve));
      if (server.listening) await new Promise(resolve=>server.close(resolve));
    },
  };
}
