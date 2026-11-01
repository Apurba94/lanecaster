// Lanecaster rules: a deck-building card battle fought across three lanes. No drawing here, so it can be tested.
import { Rng } from "./gamekit.js";

export const LANES = 3, SLOTS = 2, HAND = 5, ENERGY = 3, ACTS = 3, STEPS = 5;

export const CARDS = {
  strike: { name: "Strike", cost: 1, kind: "strike", el: "none", dmg: 6, text: "6 damage" },
  guard: { name: "Guard", cost: 1, kind: "guard", el: "none", block: 6, text: "6 block" },
  ember: { name: "Ember", cost: 1, kind: "strike", el: "fire", dmg: 3, burn: 3, text: "3 damage, 3 burn" },
  frostbite: { name: "Frostbite", cost: 1, kind: "strike", el: "frost", dmg: 4, weak: 1, text: "4 damage, weaken" },
  spark: { name: "Spark", cost: 0, kind: "strike", el: "storm", dmg: 3, text: "3 damage" },
  cleave: { name: "Cleave", cost: 2, kind: "strike", el: "none", dmg: 13, text: "13 damage" },
  lance: { name: "Lance", cost: 2, kind: "strike", el: "none", dmg: 9, pierce: true, text: "9, ignores guard" },
  pyre: { name: "Pyre", cost: 2, kind: "strike", el: "fire", burn: 9, text: "9 burn" },
  inferno: { name: "Inferno", cost: 3, kind: "strike", el: "fire", dmg: 8, burn: 8, rare: true, text: "8 damage, 8 burn" },
  chain: { name: "Chain Bolt", cost: 1, kind: "strike", el: "storm", dmg: 4, combo: 6, text: "4, +6 after storm" },
  tempest: { name: "Tempest", cost: 2, kind: "strike", el: "storm", dmg: 6, allLanes: true, rare: true, text: "6 in every lane" },
  thunder: { name: "Thunderclap", cost: 1, kind: "strike", el: "storm", dmg: 5, draw: 1, text: "5 damage, draw 1" },
  shatter: { name: "Shatter", cost: 2, kind: "strike", el: "frost", dmg: 8, shatter: true, text: "8, double if weak" },
  rimewall: { name: "Rimewall", cost: 1, kind: "guard", el: "frost", block: 8, text: "8 block" },
  aegis: { name: "Aegis", cost: 2, kind: "guard", el: "none", block: 7, allLanes: true, text: "7 block, every lane" },
  thorns: { name: "Thorn Wall", cost: 1, kind: "guard", el: "none", block: 5, thorns: 4, text: "5 block, 4 back" },
  bastion: { name: "Bastion", cost: 3, kind: "guard", el: "none", block: 20, heal: 4, rare: true, text: "20 block, heal 4" },
  flare: { name: "Flare", cost: 1, kind: "guard", el: "fire", block: 4, burn: 2, text: "4 block, 2 burn" },
  mend: { name: "Mend", cost: 1, kind: "skill", el: "none", heal: 6, text: "Heal 6" },
  focus: { name: "Focus", cost: 0, kind: "skill", el: "none", draw: 2, text: "Draw 2 next turn" },
  surge: { name: "Surge", cost: 0, kind: "skill", el: "storm", energy: 2, text: "+2 energy next turn" },
  hex: { name: "Hex", cost: 1, kind: "skill", el: "none", weak: 2, draw: 1, text: "Weaken 2, draw 1" },
  kindle: { name: "Kindle", cost: 1, kind: "skill", el: "fire", burn: 4, doubleBurn: true, rare: true, text: "4 burn, then double" },
  mirror: { name: "Mirror", cost: 1, kind: "skill", el: "none", echo: true, rare: true, text: "Repeat next in lane" },
  glacier: { name: "Glacier", cost: 2, kind: "skill", el: "frost", stun: true, rare: true, text: "Cancel lane's foe" },
};
export const STARTER = ["strike", "strike", "strike", "strike", "guard", "guard", "guard", "guard", "ember", "frostbite"];
export const REWARDS = Object.keys(CARDS).filter((k) => k !== "strike" && k !== "guard");

export const MODS = {
  blaze: { name: "Blaze", text: "Strikes +3" },
  bulwark: { name: "Bulwark", text: "Guards +4" },
  echo: { name: "Echo", text: "First card twice" },
  calm: { name: "Calm", text: "+1 draw if used" },
  plain: { name: "Open", text: "" },
};

export const RELICS = {
  stone: { name: "Lodestone", text: "+1 energy each turn" },
  coin: { name: "Old Coin", text: "+25% gold" },
  charm: { name: "Hearth Charm", text: "Heal 5 more after each battle" },
  ember: { name: "Coal Heart", text: "Burn you apply is +1" },
  shield: { name: "Oak Buckler", text: "Start each turn with 3 block in each lane" },
  quill: { name: "Scribe's Quill", text: "Draw 1 more card each turn" },
};

export const FOES = {
  rat: { name: "Lane Rat", hp: 26, plan: [[{ atk: 6 }], [{ atk: 3 }, { atk: 3 }], [{ atk: 7 }]] },
  shell: { name: "Stonecrab", hp: 34, plan: [[{ guard: 8 }, { atk: 5 }], [{ atk: 9 }], [{ guard: 6 }, { guard: 6 }]] },
  wisp: { name: "Bog Wisp", hp: 24, plan: [[{ atk: 4 }, { atk: 4 }], [{ burn: 3 }], [{ atk: 5 }, { atk: 4 }]] },
  bandit: { name: "Road Bandit", hp: 38, plan: [[{ atk: 8 }], [{ atk: 5 }, { guard: 6 }], [{ atk: 4 }, { atk: 4 }, { atk: 4 }]] },
  golem: { name: "Clay Golem", hp: 56, plan: [[{ guard: 12 }], [{ atk: 14 }], [{ strength: 2 }], [{ atk: 7 }, { atk: 7 }]] },
  witch: { name: "Marsh Witch", hp: 44, plan: [[{ burn: 4 }, { atk: 5 }], [{ guard: 8 }, { atk: 6 }], [{ strength: 2 }, { atk: 5 }]] },
  knight: { name: "Fallen Knight", hp: 74, elite: true, plan: [[{ atk: 11 }, { guard: 10 }], [{ atk: 7 }, { atk: 7 }], [{ strength: 2 }, { guard: 12 }], [{ atk: 18 }]] },
  hydra: { name: "Tri-Hydra", hp: 66, elite: true, plan: [[{ atk: 6 }, { atk: 6 }, { atk: 6 }], [{ heal: 10 }, { atk: 8 }], [{ atk: 9 }, { atk: 9 }]] },
  warden: { name: "Gate Warden", hp: 90, boss: true, plan: [[{ guard: 14 }, { atk: 10 }], [{ atk: 8 }, { atk: 8 }, { atk: 8 }], [{ strength: 2 }, { guard: 12 }], [{ atk: 20 }]] },
  sorcerer: { name: "Ash Sorcerer", hp: 105, boss: true, plan: [[{ burn: 6 }, { atk: 10 }], [{ guard: 16 }, { atk: 12 }], [{ heal: 16 }, { atk: 9 }, { atk: 9 }], [{ strength: 2 }, { atk: 13 }]] },
  monarch: { name: "The Lane Monarch", hp: 130, boss: true, plan: [[{ atk: 12 }, { atk: 12 }, { guard: 16 }], [{ burn: 6 }, { strength: 2 }], [{ atk: 24 }], [{ atk: 10 }, { atk: 10 }, { atk: 10 }]] },
};

export class Duel {
  constructor(foeId, deck, hero, rng, act = 0, relics = []) {
    const f = FOES[foeId];
    this.foeId = foeId;
    this.foe = { ...f, max: Math.round(f.hp * (1 + act * 0.2)), hp: Math.round(f.hp * (1 + act * 0.2)), burn: 0, weak: 0, strength: act };
    this.hero = hero;
    this.rng = rng;
    this.relics = relics;
    this.draw = rng.shuffle(deck.map((id, n) => ({ id, uid: n })));
    this.discard = [];
    this.hand = [];
    this.lanes = [[], [], []];
    this.mods = rng.shuffle(["blaze", "bulwark", "echo", "calm", "plain"]).slice(0, 3);
    this.turn = 0;
    this.nextDraw = 0;
    this.nextEnergy = 0;
    this.state = "playing";
    this.log = [];
    this.events = [];
    this.begin();
  }
  rel(id) { return this.relics.includes(id); }
  begin() {
    this.energy = ENERGY + this.nextEnergy + (this.rel("stone") ? 1 : 0);
    this.nextEnergy = 0;
    this.lanes = [[], [], []];
    this.deal(HAND + this.nextDraw + (this.rel("quill") ? 1 : 0));
    this.nextDraw = 0;
    const plan = this.foe.plan[this.turn % this.foe.plan.length];
    const spots = this.rng.shuffle([0, 1, 2]);
    this.intents = plan.map((p, i) => ({ ...p, lane: spots[i % LANES] }));
    this.turn++;
  }
  deal(n) {
    for (let i = 0; i < n; i++) {
      if (!this.draw.length) { this.draw = this.rng.shuffle(this.discard); this.discard = []; }
      if (!this.draw.length) return;
      this.hand.push(this.draw.pop());
    }
  }
  canPlay(i, lane) {
    const c = this.hand[i];
    return !!c && this.state === "playing" && CARDS[c.id].cost <= this.energy && this.lanes[lane].length < SLOTS;
  }
  play(i, lane) {
    if (!this.canPlay(i, lane)) return false;
    const [c] = this.hand.splice(i, 1);
    this.energy -= CARDS[c.id].cost;
    this.lanes[lane].push(c);
    return true;
  }
  /** Take a card back out of a lane before ending the turn. */
  recall(lane, slot) {
    const [c] = this.lanes[lane].splice(slot, 1);
    if (!c) return false;
    this.energy += CARDS[c.id].cost;
    this.hand.push(c);
    return true;
  }
  /** Damage and block a lane would produce, shown on screen before the turn ends. */
  forecast(lane) {
    let dmg = 0, block = this.rel("shield") ? 3 : 0;
    const mod = this.mods[lane];
    this.lanes.forEach((cards, l) => {
      cards.forEach((c, n) => {
        const d = CARDS[c.id];
        if (l !== lane && !d.allLanes) return;
        const twice = l === lane && mod === "echo" && n === 0 ? 2 : 1;
        if (d.dmg) dmg += (d.dmg + (this.mods[l] === "blaze" ? 3 : 0)) * (l === lane ? twice : this.mods[l] === "echo" && n === 0 ? 2 : 1);
        if (d.block) block += (d.block + (this.mods[l] === "bulwark" ? 4 : 0)) * (l === lane ? twice : this.mods[l] === "echo" && n === 0 ? 2 : 1);
      });
    });
    const guard = this.intents.filter((t) => t.lane === lane && t.guard).reduce((s, t) => s + t.guard, 0);
    const hit = this.intents.filter((t) => t.lane === lane && t.atk).reduce((s, t) => s + this.foeHit(t), 0);
    return { dmg, block, guard, hit };
  }
  foeHit(t) { return Math.max(0, t.atk + this.foe.strength - this.foe.weak * 2); }
  strikeFoe(amount, pierce, guardLeft, lane) {
    let hit = amount;
    if (!pierce) {
      const stop = Math.min(guardLeft.value, hit);
      guardLeft.value -= stop;
      hit -= stop;
    }
    this.foe.hp -= hit;
    if (hit) this.events.push({ kind: "foeHit", lane, amount: hit });
  }
  resolveCard(c, lane, st, n) {
    const d = CARDS[c.id], mod = this.mods[lane], foe = this.foe, h = this.hero;
    const times = (n === 0 && mod === "echo" ? 2 : 1) * (st.echo ? 2 : 1);
    st.echo = false;
    for (let t = 0; t < times; t++) {
      if (d.dmg) {
        let v = d.dmg + (mod === "blaze" ? 3 : 0);
        if (d.combo && st.prevEl === "storm") v += d.combo;
        if (d.shatter && foe.weak > 0) v *= 2;
        if (d.allLanes) for (let l = 0; l < LANES; l++) this.strikeFoe(v, d.pierce, st.guards[l], l);
        else this.strikeFoe(v, d.pierce, st.guards[lane], lane);
      }
      if (d.block && !d.allLanes) st.blocks[lane] += d.block + (mod === "bulwark" ? 4 : 0);
      if (d.thorns) st.thorns[lane] += d.thorns;
      if (d.burn) foe.burn += d.burn + (this.rel("ember") ? 1 : 0);
      if (d.doubleBurn) foe.burn *= 2;
      if (d.weak) foe.weak += d.weak;
      if (d.heal) { h.hp = Math.min(h.max, h.hp + d.heal); this.events.push({ kind: "heal", amount: d.heal }); }
      if (d.draw) this.nextDraw += d.draw;
      if (d.energy) this.nextEnergy += d.energy;
      if (d.stun) st.stunned[lane] = true;
      if (d.echo) st.echo = true;
    }
    if (mod === "calm" && n === 0) this.nextDraw += 1;
    st.prevEl = d.el;
  }
  /** Lanes resolve left to right: your cards first, then whatever the foe has planned for that lane. */
  endTurn() {
    if (this.state !== "playing") return;
    const foe = this.foe, h = this.hero;
    const st = { blocks: [0, 0, 0].map(() => (this.rel("shield") ? 3 : 0)), guards: [0, 1, 2].map((l) => ({ value: this.intents.filter((t) => t.lane === l && t.guard).reduce((s, t) => s + t.guard, 0) })), thorns: [0, 0, 0], stunned: [false, false, false], prevEl: null, echo: false };
    // Guards that cover every lane go up first, or they could not reach the lanes before their own.
    this.lanes.forEach((cards, lane) => cards.forEach((c, n) => {
      const d = CARDS[c.id];
      if (!d.block || !d.allLanes) return;
      const twice = this.mods[lane] === "echo" && n === 0 ? 2 : 1;
      st.blocks.forEach((_, l) => { st.blocks[l] += (d.block + (this.mods[lane] === "bulwark" ? 4 : 0)) * twice; });
    }));
    for (let lane = 0; lane < LANES && this.state === "playing"; lane++) {
      this.lanes[lane].forEach((c, n) => { if (foe.hp > 0) this.resolveCard(c, lane, st, n); });
      if (foe.hp <= 0) break;
      if (st.stunned[lane]) continue;
      for (const t of this.intents.filter((x) => x.lane === lane)) {
        if (t.atk) {
          let dmg = this.foeHit(t);
          const stop = Math.min(st.blocks[lane], dmg);
          st.blocks[lane] -= stop;
          dmg -= stop;
          if (st.thorns[lane]) foe.hp -= st.thorns[lane];
          if (dmg) { h.hp -= dmg; this.events.push({ kind: "heroHit", lane, amount: dmg }); }
        }
        if (t.burn) h.burn = (h.burn || 0) + t.burn;
        if (t.heal) foe.hp = Math.min(foe.max, foe.hp + t.heal);
        if (t.strength) foe.strength += t.strength;
      }
      if (h.hp <= 0) { h.hp = 0; this.state = "lost"; return; }
    }
    if (foe.hp > 0 && foe.burn > 0) { foe.hp -= foe.burn; this.events.push({ kind: "burn", amount: foe.burn }); foe.burn = Math.floor(foe.burn * 0.7); }
    if (h.burn > 0) { h.hp -= h.burn; this.events.push({ kind: "heroHit", lane: 1, amount: h.burn }); h.burn = Math.floor(h.burn / 2); }
    foe.weak = Math.max(0, foe.weak - 1);
    for (const lane of this.lanes) this.discard.push(...lane);
    this.discard.push(...this.hand);
    this.hand = [];
    if (foe.hp <= 0) { foe.hp = 0; this.state = "won"; return; }
    if (h.hp <= 0) { h.hp = 0; this.state = "lost"; return; }
    this.begin();
  }
}

/** The road: three acts of steps with a choice at each one and a boss at the end of each act. */
export class Campaign {
  constructor(seed = 1) {
    this.seed = seed;
    this.rng = new Rng(seed);
    this.hero = { hp: 80, max: 80, burn: 0 };
    this.deck = [...STARTER];
    this.gold = 60;
    this.relics = [];
    this.act = 0;
    this.step = 0;
    this.wins = 0;
    this.state = "road";
    this.options = this.makeOptions();
  }
  makeOptions() {
    if (this.step === STEPS) return [{ type: "boss", foe: ["warden", "sorcerer", "monarch"][this.act] }];
    const r = this.rng;
    const common = [["rat", "wisp", "shell"], ["bandit", "shell", "witch"], ["golem", "witch", "bandit"]][this.act];
    const out = [{ type: "battle", foe: r.pick(common) }];
    const second = this.step === 0 ? "battle" : r.pick(["elite", "rest", "shop", "battle", "rest"]);
    out.push(second === "elite" ? { type: "elite", foe: r.pick(["knight", "hydra"]) } : second === "battle" ? { type: "battle", foe: r.pick(common) } : { type: second });
    return out;
  }
  duel(option) { return new Duel(option.foe, this.deck, this.hero, this.rng, this.act, this.relics); }
  won(option) {
    this.wins++;
    this.hero.burn = 0;
    this.hero.hp = Math.min(this.hero.max, this.hero.hp + 5 + (this.relics.includes("charm") ? 5 : 0));
    const base = option.type === "boss" ? 70 : option.type === "elite" ? 50 : 25;
    const amount = Math.round(base * (this.relics.includes("coin") ? 1.25 : 1));
    this.gold += amount;
    return amount;
  }
  rewardCards() {
    const pool = this.rng.shuffle([...REWARDS]);
    const picks = [];
    for (const k of pool) {
      if (picks.length === 3) break;
      if (!CARDS[k].rare || this.rng.chance(0.3)) picks.push(k);
    }
    return picks;
  }
  addCard(id) { this.deck.push(id); }
  rest() { this.hero.hp = Math.min(this.hero.max, this.hero.hp + Math.round(this.hero.max * 0.35)); }
  shopStock() {
    const cards = this.rewardCards().map((id) => ({ id, price: CARDS[id].rare ? 90 : 55 }));
    const free = Object.keys(RELICS).filter((k) => !this.relics.includes(k));
    const relic = free.length ? this.rng.pick(free) : null;
    return { cards, relic, relicPrice: 130 };
  }
  gainRelic(id) {
    if (this.relics.includes(id)) return;
    this.relics.push(id);
  }
  removeCard(id) {
    const i = this.deck.indexOf(id);
    if (i < 0 || this.gold < 40 || this.deck.length <= 5) return false;
    this.gold -= 40;
    this.deck.splice(i, 1);
    return true;
  }
  /** Move on after a step. Bosses give a relic and a heal. */
  advance(boss) {
    if (boss) {
      const free = Object.keys(RELICS).filter((k) => !this.relics.includes(k));
      if (free.length) this.gainRelic(this.rng.pick(free));
      this.hero.max += 10;
      this.rest();
      this.act++;
      this.step = 0;
      if (this.act >= ACTS) { this.state = "won"; return; }
    } else this.step++;
    this.options = this.makeOptions();
  }
  score() { return this.wins * 100 + this.gold + this.hero.hp + this.act * 500; }
}

/** A sensible player: guard the biggest attack, then strike where the foe is not guarding. */
export function botPlay(d) {
  for (let guard = 0; guard < 12; guard++) {
    const fc = [0, 1, 2].map((l) => d.forecast(l));
    const lane = [0, 1, 2].filter((l) => fc[l].hit > fc[l].block && d.lanes[l].length < SLOTS).sort((a, b) => (fc[b].hit - fc[b].block) - (fc[a].hit - fc[a].block))[0];
    let i = d.hand.findIndex((c, n) => CARDS[c.id].kind === "guard" && lane != null && d.canPlay(n, lane));
    if (i >= 0) { d.play(i, lane); continue; }
    const strikeLane = [0, 1, 2].filter((l) => d.lanes[l].length < SLOTS).sort((a, b) => fc[a].guard - fc[b].guard || (d.mods[b] === "blaze") - (d.mods[a] === "blaze"))[0];
    if (strikeLane == null) break;
    i = d.hand.findIndex((c, n) => CARDS[c.id].kind !== "guard" && d.canPlay(n, strikeLane));
    if (i < 0) i = d.hand.findIndex((c, n) => d.canPlay(n, strikeLane));
    if (i < 0) break;
    d.play(i, strikeLane);
  }
  d.endTurn();
}

/** Simple choices for a whole run, used by the tests to look at the difficulty. */
export function botRun(seed) {
  const c = new Campaign(seed);
  const prefer = ["cleave", "lance", "aegis", "bastion", "rimewall", "thunder", "tempest", "inferno", "pyre", "shatter"];
  while (c.state === "road") {
    const o = (c.hero.hp < c.hero.max * 0.5 && c.options.find((x) => x.type === "rest")) || c.options.find((x) => x.type === "shop" && c.gold >= 130) || c.options.find((x) => x.type === "battle") || c.options[0];
    if (o.type === "rest") { c.rest(); c.advance(false); continue; }
    if (o.type === "shop") {
      const s = c.shopStock();
      if (s.relic && c.gold >= s.relicPrice) { c.gold -= s.relicPrice; c.gainRelic(s.relic); }
      c.advance(false);
      continue;
    }
    const d = c.duel(o);
    for (let t = 0; t < 60 && d.state === "playing"; t++) botPlay(d);
    if (d.state !== "won") { c.state = "lost"; break; }
    c.won(o);
    const picks = c.rewardCards();
    const pick = prefer.find((k) => picks.includes(k));
    if (pick && c.deck.length < 20) c.addCard(pick);
    c.advance(o.type === "boss");
  }
  return c;
}
