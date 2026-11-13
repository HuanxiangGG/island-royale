import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, stepGame, WEAPONS, RARITIES, WORLD_SIZE, REGIONS, pickup, reload, heal, switchWeapon, describeNearby, aliveCount } from '../dist/js/game.js';

function arena() {
  const state = createGame({ seed: 123, botCount: 1, drop: false });
  state.obstacles = [];
  state.buildings = [];
  state.regions = [];
  state.loot = [];
  Object.assign(state.player, { x: 1400, y: 1400, spawnProtection: 0 });
  Object.assign(state.zone, { x: 1400, y: 1400 });
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
  assert.ok(a.obstacles.every(o => Math.hypot(o.x - a.player.x, o.y - a.player.y) >= 150));
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
  Object.assign(c.player, { x: WORLD_SIZE - 42, y: WORLD_SIZE - 42 });
  advance(c, 1, { moveX: 1, moveY: 1 });
  assert.ok(c.player.x <= WORLD_SIZE - 41 && c.player.y <= WORLD_SIZE - 41);
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
  state.time = 360; state.combatTime = 360;
  state.zone.radius = 30;
  const enemy = state.actors[1];
  Object.assign(enemy, { x: 1500, y: 1400, aiTarget: state.player.id, ammo: 20, cooldown: 0, reloading: 0, angle: Math.PI, aiReaction: 0, aiPause: 0 });
  updateGame(state, 0.05);
  assert.equal(enemy.ammo, 19);
  assert.ok(enemy.x < 1500);
});

test('storm shrinks on schedule and damages health outside the circle', () => {
  const state = arena();
  state.time = 145; state.combatTime = 145;
  Object.assign(state.player, { x: 8200, y: 8200, shield: 100 });
  updateGame(state, 0.05);
  assert.equal(state.zone.phase, 1);
  assert.ok(state.zone.radius < 4000);
  assert.ok(state.player.hp < 100);
  assert.equal(state.player.shield, 100);
  assert.ok(state.zone.remaining < 6);
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
  state.time = 370; state.combatTime = 370;
  Object.assign(state.player, { x: 8200, y: 8200 });
  updateGame(state, 0.05);
  assert.equal(state.status, 'lost');
  assert.equal(state.placement, 2);
  assert.equal(state.player.alive, false);
});

test('a full simulated match terminates and numeric state remains finite', () => {
  const state = createGame({ seed: 8128, botCount: 12, drop: false });
  // An idle player will either be eliminated by bots or the final closing storm.
  for (let i = 0; i < 8400 && state.status === 'playing'; i++) updateGame(state, 0.05);
  assert.notEqual(state.status, 'playing');
  assert.ok(state.time < 420);
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
  for (let i = 0; i < 8400 && state.status === 'playing'; i++) stepGame(state, 0.05);
  assert.equal(state.status, 'finished');
  assert.ok(state.time < 420);
  assert.ok(state.actors.every(actor => Number.isFinite(actor.x) && Number.isFinite(actor.y) && Number.isFinite(actor.hp) && Number.isFinite(actor.angle)));
  const snapshot = JSON.parse(JSON.stringify(state));
  assert.equal(snapshot.actors.length, 50);
  assert.equal(snapshot.phase, 'finished');
  assert.ok(snapshot.actors.every(actor => actor.inventory.every(item => typeof item.rarity === 'string' && item.ammo >= 0)));
});

test('the expanded island has nine populated settlements and twenty-seven open buildings', () => {
  const state = createGame({ seed: 29, drop: false });
  assert.equal(WORLD_SIZE, 8400);
  assert.equal(state.regions.length, 9);
  assert.deepEqual(state.regions, REGIONS);
  assert.equal(state.buildings.length, 27);
  assert.equal(state.obstacles.some(obstacle => obstacle.type === 'building'), false);
  assert.equal(state.zone.remaining, 90);
  for (const building of state.buildings) {
    assert.ok(building.doorWidth >= 90);
    assert.equal(state.obstacles.filter(obstacle => obstacle.buildingId === building.id).length, 5);
    assert.ok(state.loot.filter(item => item.buildingId === building.id).length >= 4);
  }
});

function isolatedHouse(index = 0) {
  const state = createGame({ seed: 82, botCount: 1, drop: false, multiplayer: true });
  const building = state.buildings[index];
  state.obstacles = state.obstacles.filter(obstacle => obstacle.buildingId === building.id);
  state.buildings = [building]; state.regions = []; state.loot = [];
  Object.assign(state.actors[1], { x: 8000, y: 8000, aiTimer: Infinity, aiTarget: null });
  return { state, building };
}

const normals = { north: { x: 0, y: -1 }, south: { x: 0, y: 1 }, east: { x: 1, y: 0 }, west: { x: -1, y: 0 } };

test('players can walk through all generated doorway orientations into real interiors', () => {
  for (const index of [0, 1, 2]) {
    const { state, building } = isolatedHouse(index);
    const n = normals[building.doorSide];
    const door = { x: building.x + n.x * building.w / 2, y: building.y + n.y * building.h / 2 };
    Object.assign(state.player, { x: door.x + n.x * 65, y: door.y + n.y * 65, vx: 0, vy: 0 });
    advance(state, 0.9, { moveX: -n.x, moveY: -n.y });
    assert.ok(Math.abs(state.player.x - building.x) < building.w / 2 - 20, building.doorSide + ' doorway x');
    assert.ok(Math.abs(state.player.y - building.y) < building.h / 2 - 20, building.doorSide + ' doorway y');
  }
});

test('solid house walls block movement, bullets and pickups through the wall', () => {
  const { state, building } = isolatedHouse(0); // East door; the west wall is solid.
  const wallX = building.x - building.w / 2;
  Object.assign(state.player, { x: wallX - 45, y: building.y, vx: 0, vy: 0 });
  state.loot = [{ id: 'inside', type: 'medkit', x: wallX + 30, y: building.y, alive: true }];
  assert.equal(describeNearby(state), null);
  assert.equal(pickup(state), false);
  advance(state, 0.5, { moveX: 1 });
  assert.ok(state.player.x < wallX - 20);
  const target = state.actors[1];
  Object.assign(target, { x: building.x, y: building.y, shield: 0, hp: 100, medkits: 0, aiTarget: null });
  state.bullets.push({ x: wallX - 45, y: building.y, px: wallX - 45, py: building.y, vx: 5000, vy: 0, damage: 100, life: 1, owner: state.player.id });
  updateGame(state, 0.05);
  assert.equal(target.hp, 100);
});

test('an unobstructed shot through a doorway reaches an opponent indoors', () => {
  const { state, building } = isolatedHouse(0);
  Object.assign(state.player, { x: building.x + building.w / 2 + 70, y: building.y, spawnProtection: 0 });
  const target = state.actors[1];
  Object.assign(target, { x: building.x, y: building.y, shield: 0, hp: 100, medkits: 0 });
  state.bullets.push({ x: state.player.x, y: building.y, px: state.player.x, py: building.y, vx: -5000, vy: 0, damage: 30, life: 1, owner: state.player.id });
  updateGame(state, 0.05);
  assert.equal(target.hp, 70);
});

test('a landed human can loot, shoot and take hits while another human remains airborne', () => {
  const state = createGame({ seed: 111, players: [{ id: 'early', name: '早落地' }, { id: 'late', name: '未跳伞' }, { id: 'rival', name: '对手' }], botCount: 0, multiplayer: true });
  state.obstacles = []; state.buildings = []; state.loot = [];
  stepGame(state, 0.05, { early: { jump: true }, rival: { jump: true } });
  advance(state, 4.05);
  const early = state.actors[0], late = state.actors[1], rival = state.actors[2];
  assert.equal(state.phase, 'flight');
  assert.equal(early.dropState, 'ground');
  assert.equal(late.dropState, 'plane');
  assert.equal(state.combatTime, 0);
  Object.assign(rival, { x: early.x + 130, y: early.y, hp: 100, shield: 0 });
  state.loot = [{ id: 'ground-ammo', x: early.x, y: early.y + 20, type: 'ammo', alive: true }];
  assert.equal(pickup(state, early), true);
  const ammo = early.ammo;
  advance(state, 0.2, { shoot: true, angle: 0 });
  assert.ok(early.ammo < ammo);
  assert.ok(rival.hp < 100, 'grounded opponent takes damage before global combat phase');
  const hp = early.hp;
  early.shield = 0;
  state.bullets.push({ x: early.x - 50, y: early.y, px: early.x - 50, py: early.y, vx: 4000, vy: 0, damage: 20, life: 1, owner: rival.id });
  stepGame(state, 0.05);
  assert.equal(early.hp, hp - 20, 'landing has no artificial combat lock or renewed invulnerability');
  late.shield = 0;
  state.bullets.push({ x: late.x - 30, y: late.y, px: late.x - 30, py: late.y, vx: 4000, vy: 0, damage: 100, life: 1, owner: early.id });
  stepGame(state, 0.05);
  assert.equal(late.hp, 100, 'airborne combatants stay immune');
  assert.equal(state.phase, 'flight');
  assert.equal(state.zone.remaining, 90);
});

test('bots route around the back of a house, enter its door, and collect indoor loot', () => {
  for (const index of [0, 1, 2]) {
    const { state, building } = isolatedHouse(index);
    Object.assign(state.player, { x: 8000, y: 8000 });
    const bot = state.actors[1], n = normals[building.doorSide];
    Object.assign(bot, { x: building.x - n.x * (building.w / 2 + 140), y: building.y - n.y * (building.h / 2 + 140), aiTimer: 0, aiTarget: null, shield: 100, medkits: 5, reserve: 360 });
    const item = { id: 'indoor-upgrade', x: building.x, y: building.y, type: 'weapon', weapon: 1, rarity: 'mythic', alive: true, buildingId: building.id };
    state.loot = [item];
    let entered = false;
    for (let i = 0; i < 400 && item.alive; i++) {
      stepGame(state, 0.05);
      entered ||= Math.abs(bot.x - building.x) < building.w / 2 - 20 && Math.abs(bot.y - building.y) < building.h / 2 - 20;
    }
    assert.equal(entered, true, building.doorSide + ' actual door traversal');
    assert.equal(item.alive, false, building.doorSide + ' indoor pickup');
    assert.equal(bot.rarity, 'mythic');
  }
});

test('a bot indoors exits through the doorway to escape a distant shrinking circle', () => {
  const { state, building } = isolatedHouse(0);
  Object.assign(state.player, { x: 8000, y: 8000, hp: 10000 });
  const bot = state.actors[1];
  Object.assign(bot, { x: building.x, y: building.y, hp: 1000, aiTimer: 0, aiTarget: null, navPath: [], navGoal: null });
  state.combatTime = 350;
  Object.assign(state.zone, { x: building.x - 1000, y: building.y, radius: 150 });
  let exitedThroughEastDoor = false;
  for (let i = 0; i < 240; i++) {
    stepGame(state, 0.05);
    if (bot.x > building.x + building.w / 2 + 20 && Math.abs(bot.y - building.y) < building.doorWidth / 2) exitedThroughEastDoor = true;
  }
  assert.equal(exitedThroughEastDoor, true);
  assert.ok(bot.x < building.x - building.w / 2, 'continues around the house toward the safe circle');
});

test('airdrop steering reaches all nine populated regions on the larger island', () => {
  const state = createGame({ seed: 24, multiplayer: true });
  advance(state, 14.1);
  const reached = new Set(state.actors.filter(actor => actor.isBot).map(actor => state.regions.reduce((nearest, region) =>
    Math.hypot(actor.x - region.x, actor.y - region.y) < Math.hypot(actor.x - nearest.x, actor.y - nearest.y) ? region : nearest, state.regions[0]).id));
  assert.equal(reached.size, 9);
  assert.ok(state.actors.every(actor => actor.dropState === 'ground'));
});

test('bots traverse between every pair of neighboring houses without routing loops', () => {
  for (const fromIndex of [0, 1, 2]) for (const toIndex of [0, 1, 2]) {
    if (fromIndex === toIndex) continue;
    const state = createGame({ seed: 102, botCount: 1, drop: false, multiplayer: true });
    const houses = state.buildings.slice(0, 3), from = houses[fromIndex], to = houses[toIndex], bot = state.actors[1];
    state.buildings = houses;
    state.obstacles = state.obstacles.filter(obstacle => houses.some(building => building.id === obstacle.buildingId));
    state.regions = [];
    Object.assign(state.player, { x: 8000, y: 8000 });
    Object.assign(bot, { x: from.x, y: from.y, aiTimer: 0, aiTarget: null, shield: 100, medkits: 5, reserve: 360 });
    const item = { id: 'next-house', x: to.x, y: to.y, type: 'weapon', weapon: 1, rarity: 'mythic', alive: true, buildingId: to.id };
    state.loot = [item];
    for (let i = 0; i < 400 && item.alive; i++) stepGame(state, 0.05);
    assert.equal(item.alive, false, `${fromIndex} -> ${toIndex}: exits source and enters target doorway`);
  }
});

function equipForTest(state, weapon, ammo = WEAPONS[weapon].magazine) {
  const item = { weapon, rarity: 'common', ammo, reserve: 150 };
  Object.assign(state.player, item, { inventory: [item], slot: 0, cooldown: 0, reloading: 0, burstRemaining: 0, burstCooldown: 0, burstWeapon: null, lastShotAt: -1000, lastTriggerAt: -1000 });
}

function advanceFine(state, seconds, input = {}) {
  for (let elapsed = 0; elapsed < seconds - 0.000001; elapsed += 0.01) updateGame(state, 0.01, input);
}

test('fourteen distinct firearms preserve the original indices and expose useful categories', () => {
  assert.equal(WEAPONS.length, 14);
  assert.deepEqual(WEAPONS.slice(0, 5).map(weapon => weapon.id), ['rifle', 'smg', 'shotgun', 'marksman', 'pistol']);
  assert.deepEqual(WEAPONS.slice(5).map(weapon => weapon.id), ['carbine', 'burst', 'lmg', 'sniper', 'autoshotgun', 'revolver', 'vector', 'suppressed', 'doublebarrel']);
  assert.equal(new Set(WEAPONS.map(weapon => weapon.id)).size, 14);
  assert.deepEqual([...new Set(WEAPONS.map(weapon => weapon.category))].sort(), ['步枪', '冲锋枪', '霰弹枪', '狙击枪', '手枪', '机枪'].sort());
  assert.ok(WEAPONS.every(weapon => weapon.role && weapon.damage > 0 && weapon.magazine > 0 && weapon.fireRate > 0 && weapon.reloadTime > 0));
  assert.ok(WEAPONS[7].magazine > WEAPONS[0].magazine * 2, 'LMG has a genuinely larger magazine');
  assert.ok(WEAPONS[8].range > WEAPONS[3].range && WEAPONS[8].fireRate > WEAPONS[3].fireRate, 'heavy sniper trades cadence for reach');
  assert.equal(WEAPONS[13].magazine, 2);
});

test('every generated match includes searchable copies of all fourteen guns and all six qualities', () => {
  for (const seed of [1, 2, 7, 100]) {
    const state = createGame({ seed });
    const guns = state.loot.filter(item => item.alive && item.type === 'weapon');
    assert.deepEqual([...new Set(guns.map(item => item.weapon))].sort((a, b) => a - b), WEAPONS.map((_, index) => index));
    assert.equal(new Set(guns.map(item => item.rarity)).size, 6);
    assert.ok(WEAPONS.every((_, index) => guns.some(item => item.weapon === index && item.buildingId)), 'guaranteed arsenal caches are inside searchable buildings');
    assert.equal(new Set(state.actors.filter(actor => actor.isBot).map(actor => actor.weapon)).size, 14);
  }
});

test('crate weapon rolls cover the entire fourteen-gun catalogue', () => {
  const state = arena();
  for (let weapon = 0; weapon < WEAPONS.length; weapon++) {
    state.random = () => (weapon + 0.5) / WEAPONS.length;
    state.loot = [];
    state.obstacles = [{ id: 'supply-crate', x: state.player.x + 40, y: state.player.y, w: 40, h: 40, type: 'crate', alive: true, hp: 42 }];
    assert.equal(pickup(state), true);
    assert.equal(state.loot.find(item => item.type === 'weapon').weapon, weapon);
  }
});

test('every gun can be collected, fired and reloaded through the same action API', () => {
  for (let weapon = 0; weapon < WEAPONS.length; weapon++) {
    const state = arena();
    state.loot = [{ id: 'weapon-gift', type: 'weapon', x: 1410, y: 1400, weapon, rarity: 'epic', ammo: WEAPONS[weapon].magazine, reserve: 60, alive: true }];
    assert.equal(pickup(state), true, WEAPONS[weapon].id + ' pickup');
    assert.equal(state.player.weapon, weapon);
    assert.equal(state.player.rarity, 'epic');
    advance(state, 0.2);
    updateGame(state, 0.01, { shoot: true, angle: 0 });
    advanceFine(state, 0.25);
    const spent = WEAPONS[weapon].burstCount || 1;
    assert.equal(state.player.ammo, WEAPONS[weapon].magazine - spent, WEAPONS[weapon].id + ' firing');
    assert.equal(reload(state), true, WEAPONS[weapon].id + ' reload starts');
    advance(state, WEAPONS[weapon].reloadTime + 0.1);
    assert.equal(state.player.ammo, WEAPONS[weapon].magazine);
    assert.equal(state.player.reserve, 60 - spent);
    assert.equal(state.player.inventory[state.player.slot].rarity, 'epic');
  }
});

test('all six qualities apply to every gun without changing its weapon identity', () => {
  const state = arena();
  for (let weapon = 0; weapon < WEAPONS.length; weapon++) for (const quality of RARITIES) {
    state.player.inventory = [];
    state.loot = [{ id: 'quality-gift', type: 'weapon', x: 1410, y: 1400, weapon, rarity: quality.id, alive: true }];
    assert.equal(pickup(state), true);
    state.player.cooldown = 0;
    state.bullets = [];
    updateGame(state, 0.001, { shoot: true, angle: 0 });
    assert.equal(state.player.weapon, weapon);
    assert.equal(state.player.rarity, quality.id);
    assert.equal(state.bullets.length, WEAPONS[weapon].pellets);
    assert.equal(state.bullets[0].damage, WEAPONS[weapon].damage * quality.damageMultiplier);
  }
});

test('one burst trigger fires three timed rounds even after the trigger is released', () => {
  const state = arena();
  equipForTest(state, 6);
  updateGame(state, 0.01, { shoot: true, angle: 0 });
  assert.equal(state.player.ammo, 26, 'first round fires immediately');
  advanceFine(state, 0.05);
  assert.equal(state.player.ammo, 26, 'the other rounds are not simultaneous pellets');
  advanceFine(state, 0.04);
  assert.equal(state.player.ammo, 25, 'second round follows the short burst interval');
  advanceFine(state, 0.09);
  assert.equal(state.player.ammo, 24);
  advanceFine(state, 0.3);
  assert.equal(state.player.ammo, 24, 'released trigger never starts a second group');
});

test('holding the burst rifle separates three-round groups with a real recovery gap', () => {
  const state = arena(); equipForTest(state, 6);
  const times = []; let ammo = state.player.ammo;
  for (let i = 0; i < 100; i++) {
    updateGame(state, 0.01, { shoot: true, angle: 0 });
    if (state.player.ammo < ammo) { times.push(state.time); ammo = state.player.ammo; }
  }
  assert.equal(times.length, 6);
  for (const group of [0, 3]) {
    assert.ok(times[group + 1] - times[group] >= 0.075 && times[group + 1] - times[group] <= 0.095);
    assert.ok(times[group + 2] - times[group + 1] >= 0.075 && times[group + 2] - times[group + 1] <= 0.095);
  }
  assert.ok(times[3] - times[2] > 0.4);
});

test('switching or reloading cancels queued burst rounds and partial magazines never overdraw', () => {
  const switched = arena(); equipForTest(switched, 6);
  switched.player.inventory.push({ weapon: 1, rarity: 'common', ammo: 36, reserve: 90 });
  updateGame(switched, 0.01, { shoot: true });
  assert.equal(switchWeapon(switched, 1), true);
  advanceFine(switched, 0.25);
  assert.equal(switched.player.ammo, 36);
  assert.equal(switched.player.burstRemaining, 0);
  assert.equal(switched.player.inventory[0].ammo, 26);

  const reloaded = arena(); equipForTest(reloaded, 6);
  updateGame(reloaded, 0.01, { shoot: true });
  assert.equal(reload(reloaded), true);
  advance(reloaded, 2);
  assert.equal(reloaded.player.ammo, 27);
  assert.equal(reloaded.player.reserve, 149, 'only the fired round is replenished');

  const partial = arena(); equipForTest(partial, 6, 2);
  updateGame(partial, 0.01, { shoot: true });
  advanceFine(partial, 0.3);
  assert.equal(partial.player.ammo, 0);
  assert.equal(partial.player.burstRemaining, 0);
});

test('high-speed SMG cadence remains distinct at thirty and sixty updates per second', () => {
  function shots(weapon, ticks) {
    const state = arena(); equipForTest(state, weapon);
    for (let i = 0; i < ticks; i++) updateGame(state, 1 / ticks, { shoot: true, angle: 0 });
    return WEAPONS[weapon].magazine - state.player.ammo;
  }
  const vector30 = shots(11, 30), vector60 = shots(11, 60), regular30 = shots(1, 30);
  assert.ok(vector30 >= 21 && vector30 <= 23);
  assert.ok(Math.abs(vector30 - vector60) <= 1);
  assert.ok(vector30 >= regular30 + 6);
});

test('all six building kinds retain the existing navigable house geometry contract', () => {
  const state = createGame({ seed: 91, drop: false });
  assert.equal(state.buildings.length, 27);
  assert.deepEqual([...new Set(state.buildings.map(building => building.kind))].sort(), ['cottage', 'villa', 'workshop', 'barn', 'store', 'clinic'].sort());
  for (const building of state.buildings) {
    assert.ok(building.w >= 240 && building.h >= 230);
    assert.equal(building.doorWidth, 110);
    assert.ok(['north', 'east', 'west'].includes(building.doorSide));
    assert.equal(state.obstacles.filter(obstacle => obstacle.buildingId === building.id && obstacle.type === 'wall').length, 5);
  }
});
