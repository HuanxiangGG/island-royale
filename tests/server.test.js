import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createRoyaleServer } from '../server/server.mjs';

async function fixture(t, options = {}) {
  const app = createRoyaleServer({port:0,queueMs:120,...options});
  const address = await app.listen();
  const sockets = [];
  t.after(async()=>{for(const socket of sockets)socket.terminate();await app.close();});
  async function connect(extra = {}) {
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`,extra);
    sockets.push(socket);
    const messages=[];
    socket.on('message',data=>messages.push(JSON.parse(data.toString())));
    await once(socket,'open');
    const wait = (predicate, timeout=2500) => new Promise((resolve,reject)=>{
      const found=messages.find(predicate);
      if(found){resolve(found);return;}
      const timer=setTimeout(()=>{socket.off('message',check);reject(new Error('Timed out waiting for server message'));},timeout);
      function check(){const message=messages.find(predicate);if(message){clearTimeout(timer);socket.off('message',check);resolve(message);}}
      socket.on('message',check);
    });
    return {socket,messages,wait,send:message=>socket.send(JSON.stringify(message))};
  }
  return {app,address,connect};
}

async function eventually(check, timeout=1500) {
  const end=Date.now()+timeout;
  while(Date.now()<end){if(check())return;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.ok(check(),'condition did not become true');
}

test('HTTP health and runtime config are available; source paths stay private',async t=>{
  const {address}=await fixture(t);
  const health=await fetch(address.url+'/health').then(response=>response.json());
  assert.deepEqual(health,{ok:true,rooms:{waiting:0,playing:0},connections:0});
  assert.deepEqual(await fetch(address.url+'/config.json').then(response=>response.json()),{multiplayerEnabled:true,multiplayerUrl:'/ws'});
  assert.equal((await fetch(address.url+'/')).status,200);
  assert.equal((await fetch(address.url+'/%2e%2e%2fpackage.json')).status,403);
  assert.equal((await fetch(address.url+'/health',{method:'POST'})).status,405);
});

test('default queue is ten seconds and leaving releases the waiting reservation',async t=>{
  const {app,connect}=await fixture(t,{queueMs:10_000});
  const client=await connect();client.send({type:'join',name:'测试旅人'});
  const waiting=await client.wait(message=>message.type==='waiting');
  assert.equal(waiting.remaining,10);assert.equal(waiting.humans,1);assert.equal(waiting.capacity,50);
  client.socket.close();await once(client.socket,'close');
  await eventually(()=>app.rooms.size===0 && app.clients.size===0);
});

test('one real player starts a parachute match with exactly 49 bots',async t=>{
  const {connect}=await fixture(t);
  const client=await connect();client.send({type:'join',name:'单人联机',color:'#abcdef'});
  const start=await client.wait(message=>message.type==='start');
  assert.equal(start.state.phase,'flight');
  assert.equal(start.state.actors.length,50);
  assert.equal(start.state.actors.filter(actor=>actor.isBot).length,49);
  assert.equal(start.state.actors.find(actor=>actor.id===start.playerId).color,'#abcdef');
  assert.equal(start.state.random,undefined);
});

test('two sockets share one authoritative fifty-player match and see identical movement',async t=>{
  const {app,connect}=await fixture(t,{drop:false});
  const a=await connect(), b=await connect();
  a.send({type:'join',name:'玩家甲'});b.send({type:'join',name:'玩家乙'});
  const [sa,sb]=await Promise.all([a.wait(message=>message.type==='start'),b.wait(message=>message.type==='start')]);
  assert.equal(sa.roomId,sb.roomId);assert.notEqual(sa.playerId,sb.playerId);
  assert.equal(sa.state.actors.length,50);
  assert.equal(sa.state.actors.filter(actor=>!actor.isBot).length,2);
  assert.equal(sa.state.actors.filter(actor=>actor.isBot).length,48);
  assert.deepEqual(sa.state.actors,sb.state.actors);
  const room=app.rooms.get(sa.roomId);
  room.state.obstacles=[]; // Isolate transport/movement from randomized terrain collisions.
  const x=sa.state.actors.find(actor=>actor.id===sa.playerId).x;
  a.send({type:'input',seq:1,moveX:1,moveY:0,angle:0,shoot:false,sprint:false});
  const ma=await a.wait(message=>message.type==='snapshot' && message.state.actors.find(actor=>actor.id===sa.playerId).x>x+3);
  const mb=await b.wait(message=>message.type==='snapshot' && message.tick===ma.tick);
  assert.deepEqual(ma.state.actors,mb.state.actors);
  assert.equal(ma.state.actors.find(actor=>actor.id===sa.playerId).x,mb.state.actors.find(actor=>actor.id===sa.playerId).x);
  a.socket.close();await once(a.socket,'close');
  await eventually(()=>room.clients.size===1);
  assert.equal(room.state.actors.find(actor=>actor.id===sa.playerId).isBot,true);
  b.socket.close();await once(b.socket,'close');
  await eventually(()=>app.rooms.size===0);
});

test('server rejects forged movement and actions without accepting health or coordinates',async t=>{
  const {connect}=await fixture(t,{drop:false});
  const client=await connect();client.send({type:'join',name:'验证者'});
  const start=await client.wait(message=>message.type==='start');
  client.send({type:'input',seq:1,moveX:9000,moveY:0,angle:0,hp:99999,x:999999});
  assert.equal((await client.wait(message=>message.code==='invalid_input')).type,'error');
  client.send({type:'action',action:'switch',slot:99});
  assert.equal((await client.wait(message=>message.code==='invalid_action')).type,'error');
  client.socket.send('{');
  assert.equal((await client.wait(message=>message.code==='invalid_message')).type,'error');
  client.send({type:'input',seq:2,moveX:0,moveY:0,angle:0,hp:99999,x:999999});
  const snapshot=await client.wait(message=>message.type==='snapshot');
  const player=snapshot.state.actors.find(actor=>actor.id===start.playerId);
  assert.ok(player.hp<=100);assert.ok(player.x<snapshot.state.worldSize);assert.equal(player.alive,true);
});

test('stale movement input expires instead of moving a disconnected input stream forever',async t=>{
  const {app,connect}=await fixture(t,{drop:false});
  const client=await connect();client.send({type:'join'});
  const start=await client.wait(message=>message.type==='start');
  const room=app.rooms.get(start.roomId);room.state.obstacles=[];
  const player=room.state.actors.find(actor=>actor.id===start.playerId);
  client.send({type:'input',seq:1,moveX:1,moveY:0,angle:0});
  await client.wait(message=>message.type==='snapshot' && message.tick>=18);
  const stoppedAt=player.x;
  await client.wait(message=>message.type==='snapshot' && message.tick>=30);
  assert.equal(player.x,stoppedAt);
});

test('oversized frames are closed and no room survives its final disconnect',async t=>{
  const {app,connect}=await fixture(t,{queueMs:1000});
  const client=await connect();client.send({type:'join'});
  await client.wait(message=>message.type==='waiting');
  const closed=once(client.socket,'close');
  client.socket.send('x'.repeat(2048));
  const [code]=await closed;assert.equal(code,1009);
  await eventually(()=>app.rooms.size===0);
});

test('room capacity gives an explicit busy response and foreign origins are denied',async t=>{
  const {connect,address}=await fixture(t,{maxRooms:1});
  const a=await connect();a.send({type:'join'});await a.wait(message=>message.type==='start');
  const b=await connect();b.send({type:'join'});
  assert.equal((await b.wait(message=>message.code==='server_full')).type,'error');
  await new Promise((resolve,reject)=>{
    const socket=new WebSocket(`ws://127.0.0.1:${address.port}/ws`,{origin:'https://untrusted.example'});
    socket.on('open',()=>{socket.terminate();reject(new Error('unexpected accepted foreign origin'));});
    socket.on('error',error=>{assert.match(error.message,/403/);resolve();});
  });
});

test('unchanged world arrays are omitted and changed terrain or loot is resent in full',async t=>{
  const {app,connect}=await fixture(t);
  const client=await connect();client.send({type:'join'});
  const start=await client.wait(message=>message.type==='start');
  assert.ok(start.state.obstacles.length>0);assert.ok(start.state.loot.length>0);
  const first=await client.wait(message=>message.type==='snapshot');
  assert.equal(first.playerId,undefined);
  assert.equal(first.state.obstacles,undefined);assert.equal(first.state.loot,undefined);
  assert.equal(first.state.actors.find(actor=>actor.isBot).inventory,undefined);
  assert.ok(first.state.actors.find(actor=>actor.id===start.playerId).inventory);
  const room=app.rooms.get(start.roomId);
  const obstacleId=room.state.obstacles[0].id,lootId=room.state.loot[0].id;
  room.state.obstacles[0].alive=false;room.state.loot[0].alive=false;
  const changed=await client.wait(message=>message.type==='snapshot'&&message.tick>first.tick&&message.state.obstacles&&message.state.loot);
  assert.equal(changed.state.obstacles.find(item=>item.id===obstacleId).alive,false);
  assert.equal(changed.state.loot.some(item=>item.id===lootId),false);
  const next=await client.wait(message=>message.type==='snapshot'&&message.tick>changed.tick);
  assert.equal(next.state.obstacles,undefined);assert.equal(next.state.loot,undefined);
});

test('fifty humans start immediately rather than waiting for the queue deadline',{timeout:15_000},async t=>{
  const {app,connect}=await fixture(t,{queueMs:60_000});
  const clients=await Promise.all(Array.from({length:50},()=>connect()));
  clients.forEach((client,index)=>client.send({type:'join',name:`P${index}`}));
  // Bound network delivery, but verify the capacity trigger rather than machine speed.
  const starts=await Promise.all(clients.map(client=>client.wait(message=>message.type==='start',10_000)));
  assert.equal(new Set(starts.map(message=>message.roomId)).size,1);
  const room=app.rooms.get(starts[0].roomId);
  assert.equal(room.phase,'playing');
  assert.equal(room.clients.size,50);
  assert.ok(Date.now()<room.startsAt,'full room must start before its 60-second queue deadline');
  assert.equal(starts[0].state.actors.length,50);
  assert.equal(starts[0].state.actors.filter(actor=>actor.isBot).length,0);
});

test('clients receive identical enterable buildings and walls, with static metadata sent only on change',async t=>{
  const {app,connect}=await fixture(t);
  const a=await connect(),b=await connect();
  a.send({type:'join',name:'建筑甲'});b.send({type:'join',name:'建筑乙'});
  const [sa,sb]=await Promise.all([a.wait(message=>message.type==='start'),b.wait(message=>message.type==='start')]);
  assert.equal(sa.state.worldSize,8400);
  assert.equal(sa.state.regions.length,9);
  assert.deepEqual(sa.state.regions,sb.state.regions);
  assert.deepEqual(sa.state.drop.route,sb.state.drop.route);
  assert.ok(sa.state.drop.route.start.x<sa.state.drop.route.end.x);
  assert.ok(sa.state.buildings.length>0);
  assert.deepEqual([...new Set(sa.state.buildings.map(building=>building.kind))].sort(),['barn','clinic','cottage','store','villa','workshop']);
  assert.deepEqual(sa.state.buildings,sb.state.buildings);
  const building=sa.state.buildings[0];
  assert.ok(['north','south','east','west'].includes(building.doorSide));
  assert.equal(building.doorWidth,110);
  const walls=sa.state.obstacles.filter(obstacle=>obstacle.type==='wall');
  assert.ok(walls.length>0);
  assert.ok(walls.every(wall=>sa.state.buildings.some(item=>item.id===wall.buildingId)));
  assert.deepEqual(sa.state.obstacles,sb.state.obstacles);
  const first=await a.wait(message=>message.type==='snapshot');
  assert.equal(first.state.buildings,undefined);
  assert.equal(first.state.regions,undefined);
  const room=app.rooms.get(sa.roomId);
  room.state.buildings=room.state.buildings.map((building,index)=>index?building:{...building,name:'已更新房屋'});
  room.state.regions=room.state.regions.map((region,index)=>index?region:{...region,name:'已更新聚落'});
  const changedA=await a.wait(message=>message.type==='snapshot'&&message.tick>first.tick&&message.state.buildings);
  const changedB=await b.wait(message=>message.type==='snapshot'&&message.tick===changedA.tick);
  assert.deepEqual(changedA.state.buildings,changedB.state.buildings);
  assert.deepEqual(changedA.state.regions,changedB.state.regions);
  assert.equal(changedA.state.buildings[0].name,'已更新房屋');
  assert.equal(changedA.state.regions[0].name,'已更新聚落');
  const after=await a.wait(message=>message.type==='snapshot'&&message.tick>changedA.tick);
  assert.equal(after.state.buildings,undefined);
  assert.equal(after.state.regions,undefined);
});

test('an independently landed player can fire through the server while another human remains on the plane',async t=>{
  const {connect}=await fixture(t);
  const a=await connect(),b=await connect();
  a.send({type:'join',name:'先行者'});b.send({type:'join',name:'等候者'});
  const [sa,sb]=await Promise.all([a.wait(message=>message.type==='start'),b.wait(message=>message.type==='start')]);
  a.send({type:'input',seq:1,moveX:0,moveY:0,angle:0,jump:true,shoot:false});
  const landed=await a.wait(message=>message.type==='snapshot'&&message.state.actors.find(actor=>actor.id===sa.playerId).dropState==='ground',7000);
  assert.equal(landed.state.phase,'flight');
  assert.equal(landed.state.actors.find(actor=>actor.id===sb.playerId).dropState,'plane');
  const ammo=landed.state.actors.find(actor=>actor.id===sa.playerId).ammo;
  assert.ok(ammo>0);
  a.send({type:'input',seq:2,moveX:0,moveY:0,angle:0,jump:false,shoot:true});
  const fired=await a.wait(message=>message.type==='snapshot'&&message.tick>landed.tick&&message.state.actors.find(actor=>actor.id===sa.playerId).ammo<ammo);
  assert.equal(fired.state.phase,'flight');
  assert.equal(fired.state.actors.find(actor=>actor.id===sb.playerId).dropState,'plane');
  const seenByB=await b.wait(message=>message.type==='snapshot'&&message.tick===fired.tick);
  assert.equal(seenByB.state.actors.find(actor=>actor.id===sa.playerId).ammo,fired.state.actors.find(actor=>actor.id===sa.playerId).ammo);
});
