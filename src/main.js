// Lanecaster screens: the road between battles, the three-lane table, rewards and the shop.
import { Game, Result, Scene, Title, backdrop, bar, compose, panel, para, text } from "./gamekit.js";
import { ACTS, CARDS, Campaign, FOES, LANES, MODS, RELICS, SLOTS, STEPS } from "./logic.js";

export const game = new Game({ id: "lanecaster", title: "Lanecaster", theme: { accent: "#fbbf24", onAccent: "#2a1a02", bg: "#120d08", bg2: "#2c1d0f", panel: "#3a2614" }, defaults: { wins: 0, runs: 0, best: 0 } });
const data = game.store.data;
const EL = { fire: "#f97316", frost: "#38bdf8", storm: "#a78bfa", none: "#a8a29e" };

const HELP = [
  ["Three lanes", "Each battle is fought across three lanes. The foe shows what it will do in each one. Spend energy to play cards into lanes, up to two in each."],
  ["Blocking", "Block only protects its own lane. If the foe attacks the left lane, guard the left lane.\n\nA foe's guard also holds a single lane, so strike where it is open."],
  ["Order matters", "When you end your turn, lanes resolve from left to right: your cards first, then the foe's plan. Kill the foe in lane one and lanes two and three never happen."],
  ["Lane effects", "Blaze adds to strikes. Bulwark adds to guards. Echo plays the first card in the lane twice. Calm draws an extra card next turn."],
  ["Status", "Burn hurts the foe at the end of each turn, then fades. Weaken reduces its attacks.\n\nTap a played card to take it back before you end the turn."],
];

function art(c, g, t) {
  backdrop(c, g, t);
  for (let i = 0; i < 3; i++) {
    const x = 60 + i * 95, y = 250 + Math.sin(t + i) * 8;
    panel(c, x, y, 80, 120, ["#f97316", "#38bdf8", "#a78bfa"][i], 10);
    panel(c, x + 6, y + 6, 68, 108, "rgba(0,0,0,.35)", 7);
  }
}

const title = () => new Title(game, { tag: data.wins ? `${data.wins} wins in ${data.runs} runs` : "Three lanes. One deck.", art, help: HELP, play: () => { const c = new Campaign(Date.now() % 1000000); game.go(new Road(game, c)); } });

function drawCard(c, id, x, y, w, h, selected, faded, g) {
  const d = CARDS[id];
  c.globalAlpha = faded ? 0.45 : 1;
  panel(c, x, y, w, h, "#241709", 8, selected ? "#fff" : EL[d.el]);
  panel(c, x, y, w, 5, EL[d.el], 3);
  text(c, d.name.length > 10 ? d.name.slice(0, 9) + "." : d.name, x + w / 2, y + 20, { size: w < 62 ? 10 : 12, weight: 800 });
  panel(c, x + 3, y + 3, 17, 17, g.theme.accent, 9);
  text(c, String(d.cost), x + 11.5, y + 12, { size: 11, color: "#2a1a02", weight: 900 });
  para(c, d.text, x + w / 2, y + 36, w - 8, { size: w < 62 ? 9 : 10, color: g.theme.muted, align: "center", lh: 1.2 });
  c.globalAlpha = 1;
}

class Road extends Scene {
  constructor(g, run) { super(g); this.run = run; }
  enter() {
    const g = this.g, r = this.run;
    g.sound.music(compose(r.act + 31, 70, 98));
    if (r.state === "won") return this.end(true);
    r.options.forEach((o, i) => {
      const label = { battle: "Battle", elite: "Elite battle", boss: "Boss", rest: "Campfire", shop: "Merchant" }[o.type];
      const sub = o.foe ? FOES[o.foe].name : o.type === "rest" ? "Heal 35% of your health" : "Buy cards and relics";
      this.ui.button(45, 240 + i * 96, 300, 82, label, () => this.choose(o), { sub, style: o.type === "boss" || o.type === "elite" ? "danger" : "ghost", size: 18 });
    });
    this.ui.button(45, g.H - 70, 140, 48, "Deck", () => g.go(new DeckView(g, this.run, this)), { size: 14 });
    this.ui.button(205, g.H - 70, 140, 48, "Give up", () => this.end(false), { size: 14 });
  }
  choose(o) {
    const g = this.g, r = this.run;
    if (o.type === "rest") { r.rest(); g.sound.play("ok"); r.advance(false); g.go(new Road(g, r)); return; }
    if (o.type === "shop") { g.go(new Shop(g, r)); return; }
    g.go(new Table(g, r, o));
  }
  end(won) {
    const g = this.g, r = this.run;
    g.sound.stopMusic();
    data.runs++;
    if (won) data.wins++;
    data.best = Math.max(data.best, r.score());
    g.store.save();
    g.go(new Result(g, { title: won ? "The Monarch falls" : "Road's end", good: won, lines: [`Score ${r.score()}`, `Best ${data.best}`, `${r.wins} battles won, ${r.deck.length} cards`], buttons: [["New run", () => g.go(new Road(g, new Campaign(Date.now() % 1000000))), "primary"], ["Menu", () => g.go(title())]] }));
  }
  draw(c) {
    const g = this.g, r = this.run;
    backdrop(c, g, this.t);
    text(c, `Act ${r.act + 1} of ${ACTS}`, g.W / 2, 62, { size: 26, weight: 800 });
    text(c, `Step ${Math.min(r.step + 1, STEPS + 1)} of ${STEPS + 1}`, g.W / 2, 92, { size: 14, color: g.theme.muted });
    bar(c, 70, 124, 250, 14, r.hero.hp / r.hero.max, "#ef4444");
    text(c, `${r.hero.hp}/${r.hero.max} health   ${r.gold} gold`, g.W / 2, 156, { size: 14 });
    if (r.relics.length) para(c, r.relics.map((k) => RELICS[k].name).join(", "), g.W / 2, 176, 330, { size: 11, color: g.theme.muted, align: "center" });
    text(c, "Choose your path", g.W / 2, 220, { size: 15, color: g.theme.accent });
  }
}

class DeckView extends Scene {
  constructor(g, run, back) { super(g); this.run = run; this.back = back; }
  enter() { this.ui.button(55, this.g.H - 70, 280, 50, "Back", () => this.g.go(this.back)); }
  draw(c) {
    const g = this.g;
    backdrop(c, g, this.t);
    text(c, `Deck: ${this.run.deck.length} cards`, g.W / 2, 44, { size: 22, weight: 800 });
    [...this.run.deck].sort().forEach((id, i) => drawCard(c, id, 16 + (i % 5) * 72, 72 + Math.floor(i / 5) * 100, 68, 94, false, false, g));
  }
}

class Shop extends Scene {
  constructor(g, run) { super(g); this.run = run; this.stock = run.shopStock(); }
  enter() { this.layout(); }
  layout() {
    const g = this.g, r = this.run, ui = this.ui;
    ui.clear();
    this.stock.cards.forEach((s, i) => {
      if (s.sold) return;
      ui.button(24 + i * 116, 130, 110, 150, s.id, () => {
        if (r.gold < s.price) { g.sound.play("bad"); return; }
        r.gold -= s.price; r.addCard(s.id); s.sold = true; g.sound.play("coin"); this.layout();
      }, { draw: (c, b) => { drawCard(c, s.id, b.x + 4, b.y + 4, 102, 118, false, r.gold < s.price, g); text(c, s.price + " gold", b.x + 55, b.y + 136, { size: 13, color: g.theme.gold, weight: 700 }); } });
    });
    if (this.stock.relic) {
      const k = this.stock.relic;
      ui.button(24, 300, 342, 72, RELICS[k].name, () => {
        if (r.gold < this.stock.relicPrice) { g.sound.play("bad"); return; }
        r.gold -= this.stock.relicPrice; r.gainRelic(k); this.stock.relic = null; g.sound.play("power"); this.layout();
      }, { sub: `${RELICS[k].text}. ${this.stock.relicPrice} gold`, size: 16 });
    }
    ui.button(24, 386, 342, 56, "Remove a Strike", () => { if (r.removeCard("strike")) { g.sound.play("ok"); this.layout(); } else g.sound.play("bad"); }, { sub: "40 gold", size: 14, disabled: !r.deck.includes("strike") });
    ui.button(55, g.H - 70, 280, 50, "Leave", () => { r.advance(false); g.go(new Road(g, r)); }, { style: "primary" });
  }
  draw(c) {
    const g = this.g;
    backdrop(c, g, this.t);
    text(c, "Merchant", g.W / 2, 62, { size: 28, weight: 800 });
    text(c, `${this.run.gold} gold`, g.W / 2, 98, { size: 16, color: g.theme.gold, weight: 700 });
  }
}

class Reward extends Scene {
  constructor(g, run, option, gold) { super(g); this.run = run; this.o = option; this.gold = gold; this.picks = run.rewardCards(); }
  enter() {
    const g = this.g, r = this.run, next = () => {
      r.advance(this.o.type === "boss");
      g.go(new Road(g, r));
    };
    this.picks.forEach((id, i) => {
      this.ui.button(24 + i * 116, 200, 110, 170, id, () => { r.addCard(id); g.sound.play("ok"); next(); }, { draw: (c, b) => drawCard(c, id, b.x + 4, b.y + 4, 102, 160, false, false, g) });
    });
    this.ui.button(55, g.H - 70, 280, 50, "Skip the card", next);
  }
  draw(c) {
    const g = this.g;
    backdrop(c, g, this.t);
    text(c, "Victory", g.W / 2, 80, { size: 32, weight: 900 });
    text(c, `+${this.gold} gold`, g.W / 2, 118, { size: 17, color: g.theme.gold, weight: 700 });
    text(c, "Add a card to your deck", g.W / 2, 164, { size: 15, color: g.theme.muted });
  }
}

class Table extends Scene {
  constructor(g, run, option) { super(g); this.run = run; this.o = option; }
  get laneY() { return 110 + Math.max(0, (this.g.H - 660) / 3); }
  enter() {
    this.d = this.run.duel(this.o);
    this.sel = null;
    this.g.sound.music(compose(this.o.foe.length + this.run.act * 5, 92, 82));
    this.layout();
  }
  layout() {
    const g = this.g, d = this.d, ui = this.ui;
    ui.clear();
    const n = d.hand.length, w = Math.min(70, (g.W - 20) / Math.max(n, 1) - 3), y = g.H - 182;
    d.hand.forEach((card, i) => {
      ui.button(10 + i * (w + 3), y - (this.sel === i ? 8 : 0), w, 112, card.id, () => { this.sel = this.sel === i ? null : i; this.layout(); }, { clearFill: true, style: "clear", draw: (c, b) => drawCard(c, card.id, b.x, b.y, b.w, b.h, this.sel === i, CARDS[card.id].cost > d.energy, g) });
    });
    for (let l = 0; l < LANES; l++) {
      for (let s = 0; s < d.lanes[l].length; s++) {
        const card = d.lanes[l][s];
        const pos = this.slot(l, s);
        ui.button(pos.x, pos.y, pos.w, pos.h, card.id, () => { d.recall(l, s); this.sel = null; this.layout(); }, { style: "clear", draw: (c, b) => drawCard(c, card.id, b.x, b.y, b.w, b.h, false, false, g) });
      }
    }
    ui.button(236, g.H - 62, 144, 52, "End turn", () => this.end(), { style: "primary" });
  }
  laneX(l) { return 8 + l * 127; }
  slot(l, s) { return { x: this.laneX(l) + 4 + s * 58, y: this.laneY + 96, w: 56, h: 118 }; }
  down(p) {
    if (this.sel == null || p.y < this.laneY || p.y > this.laneY + 240) return;
    const l = Math.max(0, Math.min(2, Math.floor((p.x - 8) / 127)));
    if (this.d.play(this.sel, l)) { this.g.sound.play("tap"); this.g.buzz(8); this.sel = null; this.layout(); } else this.g.sound.play("bad");
  }
  end() {
    const g = this.g, d = this.d;
    d.endTurn();
    for (const e of d.events) {
      const x = this.laneX(e.lane ?? 1) + 62;
      if (e.kind === "foeHit") { g.fx.float(x, 70, "-" + e.amount, "#fde047", 19); g.sound.play("hit"); }
      if (e.kind === "burn") { g.fx.float(g.W / 2, 50, "-" + e.amount + " burn", "#fb923c", 17); }
      if (e.kind === "heroHit") { g.fx.float(x, g.H - 200, "-" + e.amount, "#fb7185", 21); g.shake(0.18); g.buzz(30); g.sound.play("bad"); }
      if (e.kind === "heal") g.fx.float(90, g.H - 40, "+" + e.amount, "#4ade80", 17);
    }
    d.events.length = 0;
    this.sel = null;
    if (d.state === "won") {
      const gold = this.run.won(this.o);
      g.sound.play("win");
      g.go(new Reward(g, this.run, this.o, gold));
      return;
    }
    if (d.state === "lost") { const r = new Road(g, this.run); r.end(false); return; }
    this.layout();
  }
  draw(c) {
    const g = this.g, d = this.d, foe = d.foe, h = this.run.hero;
    backdrop(c, g, 0);
    text(c, foe.name, g.W / 2, 22, { size: 18, weight: 800 });
    bar(c, 60, 40, 270, 14, foe.hp / foe.max, "#ef4444");
    text(c, `${Math.max(0, foe.hp)}/${foe.max}`, g.W / 2, 47, { size: 10, weight: 800 });
    const tags = [foe.burn ? `Burn ${foe.burn}` : "", foe.weak ? `Weak ${foe.weak}` : "", foe.strength ? `Strength +${foe.strength}` : ""].filter(Boolean).join("   ");
    text(c, tags, g.W / 2, 68, { size: 12, color: g.theme.accent, weight: 700 });
    for (let l = 0; l < LANES; l++) {
      const x = this.laneX(l), mod = MODS[d.mods[l]], f = d.forecast(l);
      panel(c, x, this.laneY - 26, 120, 256, this.sel != null ? "rgba(251,191,36,.12)" : "rgba(255,255,255,.05)", 12, g.theme.line);
      text(c, mod.name, x + 60, this.laneY - 14, { size: 11, weight: 800, color: g.theme.accent });
      text(c, mod.text, x + 60, this.laneY + 1, { size: 9, color: g.theme.muted });
      const intents = d.intents.filter((t) => t.lane === l);
      intents.forEach((t, i) => {
        const hit = t.atk ? `Attack ${d.foeHit(t)}` : t.guard ? `Guard ${t.guard}` : t.burn ? `Burn you ${t.burn}` : t.heal ? `Heal ${t.heal}` : `Strength +${t.strength}`;
        panel(c, x + 6, this.laneY + 13 + i * 24, 108, 20, t.atk ? "#7f1d1d" : t.guard ? "#1e3a8a" : "#581c87", 6);
        text(c, hit, x + 60, this.laneY + 23 + i * 24, { size: 11, weight: 700 });
      });
      for (let s = d.lanes[l].length; s < SLOTS; s++) { const p = this.slot(l, s); panel(c, p.x, p.y, p.w, p.h, "rgba(0,0,0,.25)", 8); }
      const hurt = Math.max(0, f.hit - f.block);
      text(c, `${f.dmg} dmg  ${f.block} block`, x + 60, this.laneY + 219, { size: 10, color: hurt ? "#fca5a5" : "#86efac", weight: 700 });
    }
    text(c, this.sel != null ? "Now tap a lane" : "Tap a card to pick it up", g.W / 2, g.H - 200, { size: 12, color: g.theme.muted });
    bar(c, 12, g.H - 58, 208, 12, h.hp / h.max, "#ef4444");
    text(c, `${Math.max(0, h.hp)}/${h.max}${h.burn ? `   Burn ${h.burn}` : ""}`, 116, g.H - 34, { size: 12 });
    text(c, `Energy ${d.energy}`, 116, g.H - 16, { size: 13, weight: 800, color: g.theme.accent });
  }
}

game.start(title());
