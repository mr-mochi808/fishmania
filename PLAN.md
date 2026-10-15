# Fishmania — Game Plan

A living plan for building Fishmania. Decisions get added here as we settle them.

## Pitch

A fishing game inspired by **Ace Angler: Fishing Spirits**. You fish to get food, bring your catch
back to the **town square**, and your **chef** cooks it for you. Then you head out and fish again.

## Settled decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | Genre | Arcade fishing game in the style of Ace Angler: Fishing Spirits |
| 2 | Core loop | Fish → bring catch to town square → chef cooks it → eat → fish again |
| 3 | Team | Mostly me (the creator); a friend may join later; Claude helps with code |
| 4 | Platform | Web browser first; downloadable PC version is a maybe |
| 5 | Visuals | 3D, top-down camera |
| 6 | Scope | A few weeks for the first version, possibly growing into a big project |
| 7 | Audience | Just for fun, as a way to learn to make games |
| 8 | Experience | Lots of HTML, a little CSS, barely any Java; Claude helps write the code |
| 9 | Reeling | Ace Angler style: mash a button to reel while the fish's stamina drains |
| 10 | Spirits | Yes, several spirits with different powers, summoned from a meter |
| 11 | Hunger | Hunger bar that causes a penalty when empty (exact effects TBD); no dying |
| 12 | Town square | A walkable 3D plaza with the chef, shop(s) and the dock |
| 13 | Fish use | Each fish can be cooked (food) or sold (coins for gear and upgrades) |
| 14 | Roles | The creator is the director/designer and explains what to build; Claude writes the code |
| 15 | Engine | Three.js + Vite (JavaScript in the browser); Electron later if we want a PC version |
| 16 | Hunger drain | Goes down over the in-game day; you need 2–3 meals a day. Fishing itself costs no hunger |
| 17 | Empty hunger | Mashes count for half and you can't summon spirits |
| 18 | Getting spirits | Earned by progressing, plus random gacha summons |
| 19 | Fishing spots | Several areas that unlock as you progress, each with its own fish |
| 20 | Casting | Fish shadows are visible in the water; you aim at one and cast |
| 21 | Art style | Bright, cartoony, Ace Angler–like look |
| 22 | Controls | WASD to walk, mouse to aim the cast, mash Space to reel |
| 23 | Saving | Autosave in the browser: fish, coins, spirits |
| 24 | Day length | One in-game day = 10 real minutes |
| 25 | Night | Different fish come out at night, and rare fish are more common |
| 26 | Gacha cost | Summons cost Spirit Pearls and/or coins |
| 27 | 3D models | Made with AI 3D model generators (e.g. Meshy, Tripo); placeholders until then |
| 28 | Spirits in a fight | Bring up to 3 spirits; press 1 / 2 / 3 to summon one when the meter is full |
| 29 | Area unlocks | New fishing areas unlock when you reach a certain player level |
| 30 | Fish in v1 | 2 areas × ~8 fish, rarities Common / Rare / Epic / Legendary, 1 boss per area |
| 31 | Boss timing | Bosses/legendaries show up after about 7–10 minutes of fishing |
| 32 | Chef | Recipe book; you hand the chef fish. Known combos make named dishes; an unknown combo makes a custom dish that gets saved to the book |
| 33 | Shop | Sells rods (stronger mashes) and bait (rarer shadows) |

## Open questions

- Night: can you sleep to skip it? How long is night compared to day?
- Gacha: exact costs, and what duplicate spirits do
- Leveling: how you earn XP and what levels give you
- Boss timer details
- Chef: ingredients, how many fish per dish, what custom dishes do
- Which AI model tool, and who makes the account
- First milestones

## Milestones

_To be filled in once the open questions are settled._
