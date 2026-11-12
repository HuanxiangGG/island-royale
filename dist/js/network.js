// Browser transport only. Movement, hits, inventory and results belong to the server.
export class MultiplayerClient {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.socket = null;
    this.playerId = null;
    this.frames = [];
    this.input = { moveX:0, moveY:0, angle:0, shoot:false, sprint:false, jump:false };
    this.sequence = 0;
    this.closed = false;
  }

  connect(url, profile) {
    this.closed = false;
    this.socket = new WebSocket(url);
    const socket = this.socket;
    this.timeout = setTimeout(() => this.fail('连接超时，请稍后重试。'), 9000);
    socket.addEventListener('open', () => {
      if (this.closed) return;
      this.send({ type: 'join', name: profile.name, color: profile.color });
      this.inputTimer = setInterval(() => {
        if (this.frames.length) { this.send({ type: 'input', seq: ++this.sequence, ...this.input, jump: this.pendingJump || !!this.input.jump }); this.pendingJump = false; }
      }, 50);
    });
    socket.addEventListener('message', event => {
      if (this.closed) return;
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'error') { this.fail(message.message || '暂时无法加入对局。'); return; }
      if (message.type === 'waiting') {
        clearTimeout(this.timeout);
        this.playerId = message.playerId;
        this.callbacks.onWaiting?.(message);
      }
      if ((message.type === 'start' || message.type === 'snapshot') && message.state) {
        clearTimeout(this.timeout);
        this.playerId = message.playerId ?? this.playerId;
        const first = this.frames.length === 0;
        const previous = this.frames.at(-1)?.state;
        const merged = { ...message.state, obstacles:message.state.obstacles ?? previous?.obstacles ?? [], loot:message.state.loot ?? previous?.loot ?? [], buildings:message.state.buildings ?? previous?.buildings ?? [], regions:message.state.regions ?? previous?.regions ?? [] };
        this.frames.push({ received: performance.now(), state: merged });
        if (this.frames.length > 5) this.frames.shift();
        const state = this.sample();
        if (first) this.callbacks.onStart?.(state, message);
        this.callbacks.onState?.(state);
      }
    });
    socket.addEventListener('error', () => this.fail('无法连接联机服务器，请稍后重试或选择机器人练习。'));
    socket.addEventListener('close', () => {
      if (!this.closed) this.fail('与服务器的连接已断开，这场对局无法继续。');
    });
  }

  send(message) {
    if (this.socket?.readyState === WebSocket.OPEN && this.socket.bufferedAmount < 32768) this.socket.send(JSON.stringify(message));
  }

  setInput(input = {}) {
    this.input = { ...input, moveX:Math.max(-1,Math.min(1,input.moveX||0)), moveY:Math.max(-1,Math.min(1,input.moveY||0)), angle:Number.isFinite(input.angle)?input.angle:0 };
  }
  jump() { this.pendingJump = true; }
  neutral() { this.input = { moveX: 0, moveY: 0, angle:Number.isFinite(this.input.angle)?this.input.angle:0, shoot: false, sprint: false, jump: false }; this.pendingJump=false; if(this.frames.length)this.send({ type: 'input', seq: ++this.sequence, ...this.input }); }
  action(action, slot) { this.send({ type: 'action', action, ...(slot === undefined ? {} : { slot }) }); }

  sample(now = performance.now()) {
    if (!this.frames.length) return null;
    const renderTime = now - 100;
    let before = this.frames[0], after = this.frames.at(-1);
    for (let i = 0; i < this.frames.length - 1; i++) {
      if (this.frames[i].received <= renderTime && this.frames[i + 1].received >= renderTime) { before = this.frames[i]; after = this.frames[i + 1]; break; }
    }
    if (renderTime >= this.frames.at(-1).received) before = after = this.frames.at(-1);
    const amount = before === after ? 1 : Math.max(0, Math.min(1, (renderTime-before.received)/(after.received-before.received)));
    const latest = this.frames.at(-1).state;
    const oldActors = new Map(before.state.actors.map(actor => [actor.id, actor]));
    const newActors = new Map(after.state.actors.map(actor => [actor.id, actor]));
    const actors = latest.actors.map(actor => {
      const a = oldActors.get(actor.id), b = newActors.get(actor.id);
      if (!a || !b || a.dropState !== b.dropState || !actor.alive) return { ...actor, isPlayer:actor.id===this.playerId };
      const delta = Math.atan2(Math.sin(b.angle-a.angle), Math.cos(b.angle-a.angle));
      return { ...actor, isPlayer:actor.id===this.playerId, x:a.x+(b.x-a.x)*amount, y:a.y+(b.y-a.y)*amount, angle:a.angle+delta*amount, altitude:(a.altitude||0)+((b.altitude||0)-(a.altitude||0))*amount };
    });
    const player = actors.find(actor => actor.id === this.playerId);
    if (!player) return null;
    let status = 'playing';
    if (!player.alive) status = 'lost';
    else if (latest.status === 'finished' || latest.phase === 'finished') status = latest.winnerId === player.id ? 'won' : 'lost';
    let drop=latest.drop;
    if(before.state.drop?.plane&&after.state.drop?.plane){const a=before.state.drop.plane,b=after.state.drop.plane;drop={...latest.drop,plane:{...b,x:a.x+(b.x-a.x)*amount,y:a.y+(b.y-a.y)*amount,angle:a.angle+Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle))*amount}};}
    return { ...latest, drop, actors, player, kills:player.kills || 0, placement:player.placement || (status==='won'?1:0), status };
  }

  fail(message) {
    if (this.closed) return;
    this.close();
    this.callbacks.onError?.(message);
  }

  close() {
    this.closed = true;
    clearTimeout(this.timeout); clearInterval(this.inputTimer);
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) this.socket.close(1000, 'Leaving game');
    this.frames = [];
  }
}

export function websocketURL(value, locationLike = window.location) {
  const url = new URL(value || '/ws', locationLike.href);
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (!['ws:', 'wss:'].includes(url.protocol)) throw new Error('Invalid multiplayer URL');
  if (locationLike.protocol === 'https:' && url.protocol !== 'wss:') throw new Error('Secure WebSocket required');
  return url.href;
}
