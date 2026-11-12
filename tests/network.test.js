import test from 'node:test';
import assert from 'node:assert/strict';
import { MultiplayerClient, websocketURL } from '../dist/js/network.js';
import { createRoyaleServer } from '../server/server.mjs';

function frame(x) {
  return { phase:'flight', status:'playing', drop:{plane:{x,y:80,angle:0},remaining:12}, actors:[
    {id:'a',x,y:80,angle:3.1,altitude:1,dropState:'plane',alive:true,isPlayer:true,kills:0},
    {id:'b',x:x+40,y:90,angle:0,altitude:1,dropState:'plane',alive:true,isPlayer:true,kills:2},
  ] };
}
test('remote humans are opponents and plane uses the same interpolation clock as its passengers',()=>{
  const client=new MultiplayerClient();client.playerId='a';
  client.frames=[{received:1000,state:frame(100)},{received:1100,state:frame(200)}];
  const sample=client.sample(1150);
  assert.equal(sample.player.x,150);assert.equal(sample.drop.plane.x,150);
  assert.equal(sample.actors.find(actor=>actor.id==='a').isPlayer,true);
  assert.equal(sample.actors.find(actor=>actor.id==='b').isPlayer,false);
  assert.equal(client.frames[1].state.actors[1].isPlayer,true,'does not mutate server snapshots');
});
test('neutral input is a valid full input and combined joystick/keyboard is bounded',()=>{
  const client=new MultiplayerClient();client.frames=[{state:frame(100),received:0}];
  let packet;client.send=value=>packet=value;client.neutral();
  assert.equal(packet.angle,0);assert.equal(packet.moveX,0);assert.equal(packet.shoot,false);
  client.setInput({moveX:2,moveY:-2,angle:1.2});assert.equal(client.input.moveX,1);assert.equal(client.input.moveY,-1);
});
test('personal results use winner ID or own death rather than first human death',()=>{
  const client=new MultiplayerClient();client.playerId='b';const state=frame(100);state.phase='finished';state.status='finished';state.winnerId='b';state.actors[0].alive=false;
  client.frames=[{received:1000,state}];assert.equal(client.sample(1100).status,'won');
  state.phase='combat';state.status='playing';state.actors[1].alive=false;state.actors[1].placement=8;
  assert.equal(client.sample(1100).status,'lost');assert.equal(client.sample(1100).placement,8);
});
test('HTTPS pages require secure WebSockets and same-origin paths resolve correctly',()=>{
  const location={href:'https://island.6hx9.com/',protocol:'https:'};
  assert.equal(websocketURL('/ws',location),'wss://island.6hx9.com/ws');
  assert.throws(()=>websocketURL('ws://island.6hx9.com/ws',location));
  assert.throws(()=>websocketURL('javascript:alert(1)',location));
});
test('browser transport joins a real server, sends neutral input and preserves static world across snapshots',async t=>{
  const app=createRoyaleServer({port:0,queueMs:80});const address=await app.listen();
  let resolveStart,rejectStart,error;const started=new Promise((resolve,reject)=>{resolveStart=resolve;rejectStart=reject;});
  const client=new MultiplayerClient({onStart:state=>{client.neutral();resolveStart(state);},onError:message=>{error=message;rejectStart(new Error(message));}});
  t.after(async()=>{client.close();await app.close();});
  const timer=setTimeout(()=>rejectStart(new Error('Join timed out')),2500);t.after(()=>clearTimeout(timer));
  client.connect(`ws://127.0.0.1:${address.port}/ws`,{name:'客户端集成',color:'#edbd5b'});
  const state=await started;assert.equal(state.actors.length,50);assert.ok(state.player);assert.ok(state.obstacles.length>0);
  assert.equal(state.worldSize,8400);assert.equal(state.buildings.length,27);assert.equal(state.regions.length,9);
  client.setInput({moveX:0,moveY:0,angle:0,shoot:false,sprint:false});client.jump();
  await new Promise(resolve=>setTimeout(resolve,250));
  assert.equal(error,undefined);const next=client.sample();assert.ok(next.loot.length>0);assert.equal(next.obstacles.length,state.obstacles.length);
  assert.equal(next.player.dropState,'falling');
  assert.deepEqual(next.buildings,state.buildings);assert.deepEqual(next.regions,state.regions);
});
