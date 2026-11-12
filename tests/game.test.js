import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, stepGame, WEAPONS, RARITIES, pickup, reload, heal, switchWeapon, describeNearby, aliveCount } from '../dist/js/game.js';

function arena() {
  const state = createGame({ seed: 123, botCount: 1, drop: false });
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
  const a = createGame({ seed: 99, drop: false });
  const b = createGame({ seed: 99, drop: false });
  assert.deepEqual(a.obstacles, b.obstacles);
  assert.deepEqual(a.loot, b.loot);
  assert.deepEqual(a.actors, b.actors);
  assert.equal(aliveCount(a), 50);
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
  state.bullets.push({ x: 1400, y: 1400, px: 1400, py: 1400, vx: 4000, vy: 0, damage: 40, life: 1, owner: state.player.id });
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
  state.bullets.push({ x: 1400, y: 1400, px: 1400, py: 1400, vx: 4000, vy: 0, damage: 100, life: 1, owner: state.player.id });
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
  assert.deepEqual(state.player.inventory.map(item => item.weapon), [0, 1]);
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
  state.time = 205; state.combatTime = 205;
  state.zone.radius = 30;
  const enemy = state.actors[1];
  Object.assign(enemy, { x: 1500, y: 1400, aiTarget: state.player.id, ammo: 20, cooldown: 0, reloading: 0, angle: Math.PI, aiReaction: 0, aiPause: 0 });
  updateGame(state, 0.05);
  assert.equal(enemy.ammo, 19);
  assert.ok(enemy.x < 1500);
});

test('storm shrinks on schedule and damages health outside the circle', () => {
  const state = arena();
  state.time = 70; state.combatTime = 70;
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
  state.bullets.push({ x: 1400, y: 1400, px: 1400, py: 1400, vx: 4000, vy: 0, damage: 50, life: 1, owner: state.player.id });
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
  state.time = 210; state.combatTime = 210;
  Object.assign(state.player, { x: 2700, y: 2700 });
  updateGame(state, 0.05);
  assert.equal(state.status, 'lost');
  assert.equal(state.placement, 2);
  assert.equal(state.player.alive, false);
});

test('a full simulated match terminates and numeric state remains finite', () => {
  const state = createGame({ seed: 8128, botCount: 12, drop: false });
  // An idle player will either be eliminated by bots or the final closing storm.
  for (let i = 0; i < 6000 && state.status === 'playing'; i++) updateGame(state, 0.05);
  assert.notEqual(state.status, 'playing');
  assert.ok(state.time < 300);
  for (const actor of state.actors) {
    assert.ok(Number.isFinite(actor.x) && Number.isFinite(actor.y) && Number.isFinite(actor.hp));
    assert.ok(actor.ammo >= 0 && actor.reserve >= 0);
  }
});

test('the match supports 50 total combatants and caps bots around supplied humans', () => {
  const solo = createGame({ seed: 20 });
  assert.equal(solo.actors.length, 50);
  assert.equal(solo.actors.filter(actor => actor.isBot).length, 49);
  const multi = createGame({ seed: 20, botCount: 100, players: [{ id: 'alice', name: 'A' }, { id: 'bob', name: 'B' }], multiplayer: true });
  assert.equal(multi.actors.length, 50);
  assert.equal(multi.actors.filter(actor => !actor.isBot).length, 2);
  assert.equal(multi.player.id, 'alice');
  assert.equal(new Set(multi.actors.map(actor => actor.id)).size, 50);
  assert.ok(multi.actors.every(actor => typeof actor.id === 'string'));
});

test('all six separate quality tiers spawn and retain modest increasing stat bonuses', () => {
  const state = createGame({ seed: 77, drop: false });
  assert.equal(RARITIES.length, 6);
  const present = new Set(state.loot.filter(item => item.type === 'weapon').map(item => item.rarity));
  assert.equal(present.size, 6);
  assert.equal(RARITIES[0].damageMultiplier, 1);
  assert.ok(RARITIES.at(-1).damageMultiplier < 1.4);
  for (let i = 1; i < RARITIES.length; i++) assert.ok(RARITIES[i].damageMultiplier > RARITIES[i - 1].damageMultiplier);
});

test('higher-quality duplicate upgrades a slot without losing dropped quality or ammo', () => {
  // A duplicate type is an upgrade, not an accidental ammo-only pickup.
  const state = arena();
  state.player.ammo = 9;
  state.player.reserve = 37;
  state.loot = [{ id: 'upgrade', type: 'weapon', x: 1410, y: 1400, weapon: 0, rarity: 'legendary', ammo: 21, reserve: 65, alive: true }];
  assert.equal(pickup(state), true);
  assert.equal(state.player.inventory.length, 1);
  assert.equal(state.player.rarity, 'legendary');
  assert.equal(state.player.ammo, 21);
  assert.equal(state.player.reserve, 65);
  const dropped = state.loot.find(item => item.alive);
  assert.equal(dropped.rarity, 'common');
  assert.equal(dropped.ammo, 9);
  assert.equal(dropped.reserve, 37);
  state.loot = [{ id: 'lower', type: 'weapon', x: 1410, y: 1400, weapon: 0, rarity: 'rare', ammo: 30, reserve: 60, alive: true }];
  assert.equal(pickup(state), true);
  assert.equal(state.player.rarity, 'legendary');
  assert.equal(state.player.ammo, 21);
  assert.equal(state.player.reserve, 125);
});

test('different slots preserve their own rarity and ammunition when switching', () => {
  const state = arena();
  state.player.ammo = 7;
  state.loot = [{ id: 'mythic', type: 'weapon', x: 1410, y: 1400, weapon: 3, rarity: 'mythic', ammo: 5, reserve: 28, alive: true }];
  pickup(state);
  assert.equal(state.player.slot, 1);
  assert.equal(state.player.rarity, 'mythic');
  switchWeapon(state, 0);
  assert.equal(state.player.rarity, 'common');
  assert.equal(state.player.ammo, 7);
  switchWeapon(state, 1);
  assert.equal(state.player.rarity, 'mythic');
  assert.equal(state.player.ammo, 5);
  assert.equal(state.player.reserve, 28);
  assert.ok(!Object.hasOwn(state.player, 'loadouts'));
});

test('quality increases real projectile damage without changing the weapon identity', () => {
  const state = arena();
  state.player.rarity = 'mythic';
  updateGame(state, 0.01, { shoot: true, angle: 0 });
  assert.equal(state.player.weapon, 0);
  assert.ok(state.bullets.length > 0);
  assert.equal(state.bullets[0].damage, WEAPONS[0].damage * RARITIES[5].damageMultiplier);
});

test('flight is safe, jump is explicit, descent is steerable, and all actors land by 14 seconds', () => {
  const state = createGame({ seed: 10, botCount: 8 });
  assert.equal(state.phase, 'flight');
  assert.equal(state.player.dropState, 'plane');
  const initialAmmo = state.player.ammo;
  advance(state, 1, { shoot: true });
  assert.equal(state.player.hp, 100);
  assert.equal(state.player.ammo, initialAmmo);
  assert.equal(state.bullets.length, 0);
  assert.equal(state.player.x, state.drop.plane.x);
  updateGame(state, 0.05, { jump: true });
  assert.equal(state.player.dropState, 'falling');
  const x = state.player.x;
  advance(state, 1, { moveX: 1, shoot: true });
  assert.ok(state.player.x > x + 100);
  assert.ok(state.player.altitude > 0 && state.player.altitude < 1);
  assert.equal(state.player.ammo, initialAmmo);
  advance(state, 12);
  assert.equal(state.phase, 'combat');
  assert.ok(state.actors.every(actor => actor.dropState === 'ground' && actor.altitude === 0));
  assert.equal(state.drop.remaining, 0);
  assert.ok(state.combatTime < 1);
});

test('a human who never presses jump automatically descends before combat', () => {
  const state = createGame({ seed: 101, botCount: 1 });
  advance(state, 9.9);
  assert.equal(state.player.dropState, 'plane');
  advance(state, 0.2);
  assert.equal(state.player.dropState, 'falling');
  advance(state, 3.9);
  assert.equal(state.player.dropState, 'ground');
  assert.equal(state.phase, 'combat');
  assert.equal(state.player.hp, 100);
});

test('bots rotate along the short angular path with bounded turning and acceleration', () => {
  const state = arena();
  const bot = state.actors[1];
  Object.assign(bot, { x: 1500, y: 1400, angle: 0, aiTarget: state.player.id, aiTimer: Infinity, aiReaction: 1, aiPause: 0 });
  const maxTurn = bot.aimSpeed * 0.05;
  updateGame(state, 0.05);
  assert.ok(Math.abs(bot.angle) > 0 && Math.abs(bot.angle) <= maxTurn + 1e-9);
  assert.ok(Math.hypot(bot.vx, bot.vy) <= 660 * 0.05 + 1e-9);
  assert.equal(bot.ammo, WEAPONS[bot.weapon].magazine, 'reaction and aim prevent an immediate shot');
  bot.angle = Math.PI - 0.02;
  bot.aiAccuracyPhase = 0;
  updateGame(state, 0.05);
  const delta = Math.atan2(Math.sin(bot.angle - (Math.PI - 0.02)), Math.cos(bot.angle - (Math.PI - 0.02)));
  assert.ok(Math.abs(delta) <= maxTurn + 1e-9);
});

test('authoritative inputs and action helpers operate on the requested human', () => {
  const state = createGame({ seed: 5, players: [{ id: 'one', name: '1' }, { id: 'two', name: '2' }], botCount: 0, multiplayer: true, drop: false });
  state.obstacles = []; state.loot = [];
  const second = state.actors[1];
  Object.assign(second, { x: 1700, y: 1400, hp: 30, ammo: 10 });
  const firstX = state.player.x, secondX = second.x;
  stepGame(state, 0.05, { two: { moveX: 1 } });
  assert.equal(state.player.x, firstX);
  assert.ok(second.x > secondX);
  assert.equal(heal(state, second), true);
  assert.equal(second.hp, 85);
  assert.equal(state.player.hp, 100);
  assert.equal(reload(state, second), true);
  assert.ok(second.reloading > 0);
  assert.equal(state.player.reloading, 0);
});

test('a multiplayer match continues after the first human dies and resolves the actual winner', () => {
  const state = createGame({ seed: 55, players: [{ id: 'one', name: '1' }, { id: 'two', name: '2' }], botCount: 1, multiplayer: true, drop: false });
  state.obstacles = []; state.loot = [];
  const first = state.player, second = state.actors[1], bot = state.actors[2];
  Object.assign(first, { x: 1400, y: 1400, hp: 1, shield: 0, spawnProtection: 0 });
  Object.assign(second, { x: 1700, y: 1400 });
  Object.assign(bot, { x: 2200, y: 2200, aiTimer: Infinity, aiTarget: null, hp: 1, shield: 0, medkits: 0 });
  state.bullets.push({ x: 1300, y: 1400, px: 1300, py: 1400, vx: 4000, vy: 0, damage: 50, life: 1, owner: second.id });
  stepGame(state, 0.05);
  assert.equal(first.alive, false);
  assert.equal(first.placement, 3);
  assert.equal(state.status, 'playing');
  assert.equal(state.phase, 'combat');
  const x = second.x;
  stepGame(state, 0.05, { two: { moveX: 1 } });
  assert.ok(second.x > x);
  state.bullets.push({ x: bot.x - 50, y: bot.y, px: bot.x - 50, py: bot.y, vx: 4000, vy: 0, damage: 50, life: 1, owner: second.id });
  stepGame(state, 0.05);
  assert.equal(state.status, 'finished');
  assert.equal(state.phase, 'finished');
  assert.equal(state.winnerId, 'two');
  assert.equal(second.placement, 1);
  assert.equal(bot.placement, 2);
});

test('50-player multiplayer simulation terminates with finite state and serializable snapshots', () => {
  const state = createGame({ seed: 400, multiplayer: true });
  for (let i = 0; i < 6000 && state.status === 'playing'; i++) stepGame(state, 0.05);
  assert.equal(state.status, 'finished');
  assert.ok(state.time < 300);
  assert.ok(state.actors.every(actor => Number.isFinite(actor.x) && Number.isFinite(actor.y) && Number.isFinite(actor.hp) && Number.isFinite(actor.angle)));
  const snapshot = JSON.parse(JSON.stringify(state));
  assert.equal(snapshot.actors.length, 50);
  assert.equal(snapshot.phase, 'finished');
  assert.ok(snapshot.actors.every(actor => actor.inventory.every(item => typeof item.rarity === 'string' && item.ammo >= 0)));
});
