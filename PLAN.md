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
| 5 | Visuals | 3D. While fishing, an Ace Angler–style camera: behind and above the player looking out to sea, zooming toward the fish during a reel battle |
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
| 24 | Day length | Daytime lasts 10 real minutes (see #41 for the full cycle) |
| 25 | Night | Different fish come out at night, and rare fish are more common |
| 26 | Gacha cost | Summons cost Spirit Pearls and/or coins |
| 27 | 3D models | Made with AI 3D model generators (e.g. Meshy, Tripo); placeholders until then |
| 28 | Spirits in a fight | Bring up to 3 spirits; press 1 / 2 / 3 to summon one when the meter is full |
| 29 | Area unlocks | New fishing areas unlock when you reach a certain player level |
| 30 | Fish in v1 | 2 areas × ~8 fish, rarities Common / Rare / Epic / Legendary, 1 boss per area |
| 31 | Boss timing | Bosses/legendaries show up after about 7–10 minutes of fishing |
| 32 | Chef | Recipe book; you hand the chef fish. Known combos make named dishes; an unknown combo makes a custom dish that gets saved to the book |
| 33 | Shop | Sells rods (stronger mashes) and bait (rarer shadows), plus a small shelf of cooking extras |
| 34 | Meals | Breakfast, lunch and dinner each fill about a third of the hunger bar |
| 35 | Gacha details | 1 summon = 10 Spirit Pearls or 2,000 coins. Duplicates level up the spirit. Rare fish sometimes drop pearls |
| 36 | Spirits in v1 | 8 total: 3 earned by progressing, 5 from the gacha |
| 37 | Leveling | XP from catches (rarer gives more) and from discovering new recipes. Levels only unlock things; area 2 opens at level 5 |
| 38 | Boss timer | Counts total time spent in that area (going to town doesn't reset it). A boss stays ~2 minutes, then leaves and the timer restarts |
| 39 | Cooking | 1–3 items per dish (fish + extras). Custom dishes are random but weighted by ingredients, get an auto-generated silly name, and can be renamed |
| 40 | Model tool | Meshy. The creator makes the account; a cartoon outline shader keeps the look consistent |
| 41 | Day/night split | 10 minutes of day + 12 minutes of night (22-minute full cycle). No sleeping; you fish through the night |
| 42 | Character | One fixed fisher character; the player types a name at the start. Look customization comes later |
| 43 | Town | Called "Town Center" |
| 44 | Audio | Music and sound effects generated with ElevenLabs (Milestone 6) |

## Open questions

_None — the plan is complete. Details get settled as each milestone is built._

## Milestones

1. ✅ **Fishing core**: dock, fish shadows, mouse aim, cast, mash Space to reel, catch. Placeholder art.
2. **Town square**: walk with WASD, chef, shop, coins, cook or sell.
3. **Hunger + day/night**: 10-min day + 12-min night, meals, night fish.
4. **Spirits**: meter, 1/2/3 to summon, earned spirits, then the gacha.
5. **Progression**: XP and levels, area 2, bosses, recipe book with custom dishes.
6. **Art + sound**: Meshy models, toon shader, music and sound effects.
7. **Saving + polish**.
