import assert from "node:assert/strict";
import test from "node:test";
import { Rng } from "../src/gamekit.js";
import { ACTS, CARDS, Campaign, Duel, ENERGY, FOES, HAND, RELICS, SLOTS, STARTER, botRun } from "../src/logic.js";

const hero = (hp = 72) => ({ hp, max: 72, burn: 0 });

/** A duel with a fixed foe, a known hand, plain lanes and a plan chosen by the test. */
function duel(cards, plan = [[]], { hp = 100, relics = [] } = {}) {
  FOES.test = { name: "Test", hp, plan };
  const d = new Duel("test", [...cards, ...Array(10).fill("spark")], hero(), new Rng(1), 0, relics);
  d.mods = ["plain", "plain", "plain"];
  d.discard.push(...d.draw, ...d.hand);
  d.hand = cards.map((id, uid) => ({ id, uid: 100 + uid }));
  d.draw = [];
  d.energy = 9;
  return d;
}
const setIntent = (d, ...list) => { d.intents = list; };

test("every card has a name, a cost and something to do", () => {
  for (const [id, c] of Object.entries(CARDS)) {
    assert.ok(c.name && c.text, id);
    assert.ok(c.cost >= 0 && c.cost <= 3, id);
    assert.ok(c.dmg || c.block || c.burn || c.heal || c.draw || c.energy || c.weak || c.echo || c.stun, id);
  }
  for (const id of STARTER) assert.ok(CARDS[id]);
});

test("a duel starts with a full hand and full energy", () => {
  const d = new Duel("rat", STARTER, hero(), new Rng(2));
  assert.equal(d.hand.length, HAND);
  assert.equal(d.energy, ENERGY);
  assert.equal(d.hand.length + d.draw.length, STARTER.length);
  assert.ok(d.intents.length > 0);
});

test("playing costs energy, and a lane holds only two cards", () => {
  const d = duel(["strike", "strike", "strike"]);
  d.energy = 3;
  assert.ok(d.play(0, 0));
  assert.ok(d.play(0, 0));
  assert.equal(d.energy, 1);
  assert.equal(d.play(0, 0), false);
  assert.equal(d.lanes[0].length, SLOTS);
  assert.ok(d.play(0, 1));
  assert.equal(d.energy, 0);
});

test("a played card can be taken back for a refund", () => {
  const d = duel(["cleave"]);
  d.play(0, 1);
  assert.ok(d.recall(1, 0));
  assert.equal(d.hand.length, 1);
  assert.equal(d.energy, 9);
  assert.equal(d.recall(1, 0), false);
});

test("block only protects its own lane", () => {
  const d = duel(["guard"]);
  setIntent(d, { atk: 10, lane: 0 });
  d.play(0, 1);
  d.endTurn();
  assert.equal(d.hero.hp, 62);
  const e = duel(["guard"]);
  setIntent(e, { atk: 10, lane: 0 });
  e.play(0, 0);
  e.endTurn();
  assert.equal(e.hero.hp, 68);
});

test("a guard holds one lane, and piercing ignores it", () => {
  const d = duel(["strike", "lance"]);
  setIntent(d, { guard: 10, lane: 2 });
  d.play(0, 2);
  d.play(0, 2);
  d.endTurn();
  assert.equal(d.foe.hp, 91);
  const e = duel(["strike"]);
  setIntent(e, { guard: 10, lane: 2 });
  e.play(0, 1);
  e.endTurn();
  assert.equal(e.foe.hp, 94);
});

test("lanes resolve from left to right, so a kill stops what comes after", () => {
  const d = duel(["strike"], [[]], { hp: 5 });
  setIntent(d, { atk: 50, lane: 1 });
  d.play(0, 0);
  d.endTurn();
  assert.equal(d.state, "won");
  assert.equal(d.hero.hp, 72);
  const e = duel(["strike"], [[]], { hp: 5 });
  setIntent(e, { atk: 10, lane: 1 });
  e.play(0, 2);
  e.endTurn();
  assert.equal(e.hero.hp, 62, "lane two strikes before lane three");
});

test("lane effects change cards", () => {
  const a = duel(["strike"]);
  a.mods[0] = "blaze"; setIntent(a); a.play(0, 0); a.endTurn();
  assert.equal(a.foe.hp, 91);
  const b = duel(["strike"]);
  b.mods[0] = "echo"; setIntent(b); b.play(0, 0); b.endTurn();
  assert.equal(b.foe.hp, 88);
  const c = duel(["guard"]);
  c.mods[0] = "bulwark"; setIntent(c, { atk: 10, lane: 0 }); c.play(0, 0); c.endTurn();
  assert.equal(c.hero.hp, 72);
});

test("burn hurts at the end of the turn and then fades", () => {
  const d = duel(["pyre"]);
  setIntent(d);
  d.play(0, 0);
  d.endTurn();
  assert.equal(d.foe.hp, 91);
  assert.equal(d.foe.burn, 6);
});

test("weaken softens attacks, and shatter doubles against it", () => {
  const d = duel(["frostbite"]);
  setIntent(d, { atk: 10, lane: 1 });
  d.play(0, 0);
  d.endTurn();
  assert.equal(d.hero.hp, 64);
  const e = duel(["shatter"]);
  setIntent(e);
  e.foe.weak = 1;
  e.play(0, 0);
  e.endTurn();
  assert.equal(e.foe.hp, 84);
});

test("chain bolt rewards a storm card before it", () => {
  const d = duel(["spark", "chain"]);
  setIntent(d);
  d.play(0, 0); d.play(0, 0);
  d.endTurn();
  assert.equal(d.foe.hp, 100 - 3 - 10);
});

test("mirror repeats the next card, and glacier cancels a lane", () => {
  const d = duel(["mirror", "strike"]);
  setIntent(d);
  d.play(0, 0); d.play(0, 0);
  d.endTurn();
  assert.equal(d.foe.hp, 88);
  const e = duel(["glacier"]);
  setIntent(e, { atk: 30, lane: 0 });
  e.play(0, 0);
  e.endTurn();
  assert.equal(e.hero.hp, 72);
});

test("every-lane cards reach all three lanes", () => {
  const d = duel(["aegis"]);
  setIntent(d, { atk: 7, lane: 0 }, { atk: 7, lane: 2 });
  d.play(0, 1);
  d.endTurn();
  assert.equal(d.hero.hp, 72);
});

test("the forecast agrees with what really happens", () => {
  const d = duel(["strike", "guard"]);
  setIntent(d, { atk: 9, lane: 0 });
  d.play(0, 0); d.play(0, 0);
  const f = d.forecast(0);
  assert.deepEqual(f, { dmg: 6, block: 6, guard: 0, hit: 9 });
  d.endTurn();
  assert.equal(d.foe.hp, 94);
  assert.equal(d.hero.hp, 69);
});

test("the discard pile is reshuffled when the deck runs out", () => {
  const d = new Duel("rat", STARTER, hero(9999), new Rng(3));
  d.hero.max = 9999;
  for (let t = 0; t < 6 && d.state === "playing"; t++) d.endTurn();
  assert.equal(d.hand.length + d.draw.length + d.discard.length, STARTER.length);
  assert.equal(d.hand.length, HAND);
});

test("losing all health loses the duel", () => {
  const d = duel(["strike"]);
  d.hero.hp = 5;
  setIntent(d, { atk: 20, lane: 0 });
  d.endTurn();
  assert.equal(d.state, "lost");
  assert.equal(d.hero.hp, 0);
});

test("relics do what they say", () => {
  const a = new Duel("rat", STARTER, hero(), new Rng(1), 0, ["stone", "quill"]);
  assert.equal(a.energy, ENERGY + 1);
  assert.equal(a.hand.length, HAND + 1);
  const b = duel(["guard"], [[]], { relics: ["shield"] });
  setIntent(b, { atk: 3, lane: 2 });
  b.endTurn();
  assert.equal(b.hero.hp, 72);
  const c = duel(["ember"], [[]], { relics: ["ember"] });
  setIntent(c);
  c.play(0, 0);
  c.endTurn();
  assert.equal(c.foe.hp, 100 - 3 - 4);
  assert.equal(Object.keys(RELICS).length, 6);
});

test("the road has choices and ends in a boss", () => {
  const c = new Campaign(5);
  assert.equal(c.options.length, 2);
  for (let i = 0; i < 5; i++) c.advance(false);
  assert.equal(c.options.length, 1);
  assert.equal(c.options[0].type, "boss");
  c.advance(true);
  assert.equal(c.act, 1);
  assert.equal(c.relics.length, 1);
  assert.equal(c.step, 0);
});

test("beating the last boss wins the run", () => {
  const c = new Campaign(5);
  c.act = ACTS - 1;
  c.advance(true);
  assert.equal(c.state, "won");
});

test("resting heals, and cards can only be removed for gold", () => {
  const c = new Campaign(1);
  c.hero.hp = 10;
  c.rest();
  assert.equal(c.hero.hp, 38);
  c.gold = 39;
  assert.equal(c.removeCard("strike"), false);
  c.gold = 40;
  assert.ok(c.removeCard("strike"));
  assert.equal(c.deck.length, STARTER.length - 1);
  assert.equal(c.removeCard("no such card"), false);
});

test("foes grow tougher in later acts", () => {
  const a = new Duel("rat", STARTER, hero(), new Rng(1), 0), b = new Duel("rat", STARTER, hero(), new Rng(1), 2);
  assert.ok(b.foe.max > a.foe.max);
  assert.ok(b.foe.strength > a.foe.strength);
});

test("a sensible bot can win a run, but not most of them", () => {
  let wins = 0, boss = 0;
  for (let s = 1; s <= 300; s++) {
    const c = botRun(s);
    if (c.state === "won") wins++;
    if (c.act > 0 || c.state === "won") boss++;
  }
  assert.ok(wins >= 3, `wins ${wins}`);
  assert.ok(wins < 200, `wins ${wins}, too easy`);
  assert.ok(boss >= 100, `first boss beaten ${boss} times`);
});
