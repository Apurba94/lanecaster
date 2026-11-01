# Lanecaster

A single-player deck-building card battler where position matters as much as the cards. Every battle is fought across three lanes. Foes
declare their plan lane by lane, and your block only protects the lane you play it in. When the turn ends, lanes resolve from left to
right, so a kill in lane one stops everything after it.

**[Play it now](https://apurba94.github.io/lanecaster/)** in your phone's browser, then use "Add to Home Screen" to install it. After the
first visit it works offline.

* 25 cards across fire, frost and storm, with burn, weaken, combos and repeats.
* Lane effects that change every battle: Blaze, Bulwark, Echo and Calm.
* A 3-act road with choices at each step: battles, elites, campfires and a merchant.
* 11 foes including 3 bosses, and 6 relics.

No ads, no accounts, no tracking and no network use after the first load.

## Run from source

```bash
npx serve .
npm test
```

Plain JavaScript with no dependencies. `src/logic.js` holds the rules, and `src/main.js` holds the screens.

## How it is tested

The tests pin down how the lanes resolve, each card behaviour and each relic, and that the on-screen forecast matches what really
happens. A simple bot then plays 300 full runs, and has to win some but not most of them. That shows that the game can be beaten and is
not trivial. It does not show how a person will find the balance.

## License

MIT
