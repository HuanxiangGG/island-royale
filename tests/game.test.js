import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, WEAPONS, pickup, reload, heal, switchWeapon, describeNearby, aliveCount } from '../dist/js/game.js';

function arena() {
  const state = createGame({ seed: 123, botCount: 1 });
  state.obstacles = [];
  state.loot = [];
  state.player.spawnProtection = 0;
  const enemy = state.actors[1];
  Object.assign(enemy, { x: 2400, y: 2400, aiTimer: Infinity, aiTarget: null });
  return state;
}

function advance(state, seconds, input = {}) {
  for (let elapsed = 0; elapsed < seconds - 0.00001; elapsed += 0.05) updateGame(state, 0.05, input);
}

test('seeded world generation is repeatable and player spawn has clear room', () => {
  const a = createGame({ seed: 99 });
  const b = createGame({ seed: 99 });
  assert.deepEqual(a.obstacles, b.obstacles);
  assert.deepEqual(a.loot, b.loot);
  assert.deepEqual(a.actors, b.actors);
  assert.equal(aliveCount(a), 24);
  assert.equal(a.player.hp, 100);
  assert.ok(a.obstacles.every(o => Math.hypot(o.x - 1400, o.y - 1400) >= 160));
});

test('diagonal movement is normalized and solid cover blocks movement', () => {
  const a = arena(), b = arena();
  advance(a, 1, { moveX: 1, moveY: 0 });
  advance(b, 1, { moveX: 1, moveY: 1 });
  assert.ok(Math.abs(Math.hypot(b.player.x - 1400, b.player.y - 1400) - (a.player.x - 1400)) < 0.001);
  const c = arena();
  c.obstacles.push({ id: 'wall', x: 1470, y: 1400, w: 40, h: 400, type: 'building', alive: true, hp: Infinity });
  advance(c, 1, { moveX: 1 });
  assert.ok(c.player.x <= 1433);
  assert.ok(c.player.x > 1400);
  Object.assign(c.player, { x: 2758, y: 2758 });
  advance(c, 1, { moveX: 1, moveY: 1 });
  assert.ok(c.player.x <= 2759 && c.player.y <= 2759);
});

test('shooting consumes ammo at the weapon cadence and reload transfers reserve', () => {
  const state = arena();
  advance(state, 0.5, { shoot: true, angle: 0 });
  assert.ok(state.player.ammo < 30 && state.player.ammo >= 26);
  const used = 30 - state.player.ammo;
  const reserve = state.player.reserve;
  assert.equal(reload(state), true);
  const ammo = state.player.ammo;
  advance(state, 0.3, { shoot: true });
  assert.equal(state.player.ammo, ammo, 'cannot shoot while reloading');
  advance(state, 2);
  assert.equal(state.player.ammo, 30);
  assert.equal(state.player.reserve, reserve - used);
  assert.equal(reload(state), false, 'full magazine does not reload');
});

test('swept bullets hit actors without tunneling and shield absorbs damage first', () => {
  const state = arena();
  const enemy = state.actors[1];
  Object.assign(enemy, { x: 1460, y: 1400, shield: 25, hp: 100 });
  state.bullets.push({ x: 1400, y: 1400, px: 1400, py: 1400, vx: 4000, vy: 0, damage: 40, life: 1, owner: 0 });
  updateGame(state, 0.05);
  assert.equal(enemy.shield, 0);
  assert.equal(enemy.hp, 85);
  assert.equal(state.bullets.length, 0);
});

test('the nearest solid obstacle intercepts bullets before actors', () => {
  const state = arena();
  const enemy = state.actors[1];
  Object.assign(enemy, { x: 1500, y: 1400, shield: 0 });
  state.obstacles.push({ id: 'wall', x: 1450, y: 1400, w: 10, h: 100, type: 'building', alive: true, hp: Infinity });
  state.bullets.push({ x: 1400, y: 1400, px: 1400, py: 1400, vx: 4000, vy: 0, damage: 100, life: 1, owner: 0 });
  updateGame(state, 0.05);
  assert.equal(enemy.hp, 100);
  assert.equal(state.bullets.length, 0);
});

test('opening crates produces usable loot and inventory retains ammo across switches', () => {
  const state = arena();
  const crate = { id: 'crate', x: 1440, y: 1400, w: 40, h: 40, type: 'crate', alive: true, hp: 42 };
  state.obstacles.push(crate);
  assert.equal(describeNearby(state).label, '物资箱');
  assert.equal(pickup(state), true);
  assert.equal(crate.alive, false);
  assert.ok(state.loot.some(l => l.type === 'weapon'));
  state.loot = [{ id: 'smg', x: 1430, y: 1400, type: 'weapon', weapon: 1, alive: true }];
  state.player.ammo = 17;
  assert.equal(pickup(state), true);
  assert.equal(state.player.weapon, 1);
  assert.deepEqual(state.player.inventory, [0, 1]);
  assert.equal(state.player.ammo, WEAPONS[1].magazine);
  assert.equal(switchWeapon(state, 0), true);
  assert.equal(state.player.ammo, 17);
  assert.equal(switchWeapon(state, 2), false);
});

test('healing requires missing health, an available kit and cooldown', () => {
  const state = arena();
  assert.equal(heal(state), false);
  state.player.hp = 20;
  assert.equal(heal(state), true);
  assert.equal(state.player.hp, 75);
  assert.equal(state.player.medkits, 1);
  assert.equal(heal(state), false);
  advance(state, 4.1);
  assert.equal(heal(state), true);
  assert.equal(state.player.hp, 100);
  assert.equal(state.player.medkits, 0);
});

test('full supplies do not hide other nearby useful pickups', () => {
  const state = arena();
  state.player.shield = 100;
  state.loot = [
    { id: 'full', x: 1401, y: 1400, type: 'shield', alive: true },
    { id: 'ammo', x: 1440, y: 1400, type: 'ammo', alive: true },
  ];
  assert.equal(describeNearby(state).id, 'ammo');
  assert.equal(pickup(state), true);
  assert.equal(state.player.reserve, 210);
});

test('bots can fire while moving into the final storm circle', () => {
  const state = arena();
  state.time = 205;
  state.zone.radius = 30;
  const enemy = state.actors[1];
  Object.assign(enemy, { x: 1500, y: 1400, aiTarget: 0, ammo: 20, cooldown: 0, reloading: 0 });
  updateGame(state, 0.05);
  assert.equal(enemy.ammo, 19);
  assert.ok(enemy.x < 1500);
});

test('storm shrinks on schedule and damages health outside the circle', () => {
  const state = arena();
  state.time = 70;
  Object.assign(state.player, { x: 2700, y: 2700, shield: 100 });
  updateGame(state, 0.05);
  assert.equal(state.zone.phase, 1);
  assert.ok(state.zone.radius < 1250);
  assert.ok(state.player.hp < 100);
  assert.equal(state.player.shield, 100);
  assert.ok(state.zone.remaining < 7);
});

test('last opponent elimination produces a win and records the player kill', () => {
  const state = arena();
  Object.assign(state.actors[1], { x: 1460, y: 1400, shield: 0, hp: 1, medkits: 0 });
  state.bullets.push({ x: 1400, y: 1400, px: 1400, py: 1400, vx: 4000, vy: 0, damage: 50, life: 1, owner: 0 });
  updateGame(state, 0.05);
  assert.equal(state.status, 'won');
  assert.equal(state.placement, 1);
  assert.equal(state.kills, 1);
  assert.equal(state.player.kills, 1);
  const time = state.time;
  advance(state, 1, { shoot: true });
  assert.equal(state.time, time, 'finished matches stop advancing');
});

test('player death records rank without awarding a win', () => {
  const state = arena();
  state.player.hp = 1;
  state.player.shield = 0;
  state.time = 210;
  Object.assign(state.player, { x: 2700, y: 2700 });
  updateGame(state, 0.05);
  assert.equal(state.status, 'lost');
  assert.equal(state.placement, 2);
  assert.equal(state.player.alive, false);
});

test('a full simulated match terminates and numeric state remains finite', () => {
  const state = createGame({ seed: 8128, botCount: 12 });
  // An idle player will either be eliminated by bots or the final closing storm.
  for (let i = 0; i < 6000 && state.status === 'playing'; i++) updateGame(state, 0.05);
  assert.notEqual(state.status, 'playing');
  assert.ok(state.time < 300);
  for (const actor of state.actors) {
    assert.ok(Number.isFinite(actor.x) && Number.isFinite(actor.y) && Number.isFinite(actor.hp));
    assert.ok(actor.ammo >= 0 && actor.reserve >= 0);
  }
});
