// Fish and rarity data. Add new fish here — the game picks them up automatically.

export const RARITY = {
  common: { label: 'Common', weight: 62, glow: null, timeLimit: 20 },
  rare: { label: 'Rare', weight: 28, glow: 0x3fa9ff, timeLimit: 25 },
  epic: { label: 'Epic', weight: 10, glow: 0xb06bff, timeLimit: 30 },
  // Legendaries don't spawn randomly — the boss timer brings them in (Milestone 5).
  legendary: { label: 'Legendary', weight: 0, glow: 0xffc43d, timeLimit: 45 },
};

// hp: Space presses needed to land it (before the fish recovers stamina)
// regen: stamina the fish recovers per second
// strength: how often and how hard it thrashes (1 = normal)
// shadow: how big its shadow looks in the water
// size: [min, max] length in cm
export const DOCK_FISH = [
  { id: 'sardine', name: 'Sardine', rarity: 'common', size: [12, 22], shadow: 0.55, hp: 14, regen: 1, strength: 0.6, color: 0x8fb3c9 },
  { id: 'horse-mackerel', name: 'Horse Mackerel', rarity: 'common', size: [18, 35], shadow: 0.75, hp: 20, regen: 1.5, strength: 0.8, color: 0xa7c2a0 },
  { id: 'mackerel', name: 'Mackerel', rarity: 'common', size: [25, 45], shadow: 0.9, hp: 26, regen: 2, strength: 0.9, color: 0x5f9fb8 },
  { id: 'flounder', name: 'Flounder', rarity: 'rare', size: [25, 60], shadow: 1.05, hp: 32, regen: 2.5, strength: 1.0, color: 0xb59670 },
  { id: 'red-sea-bream', name: 'Red Sea Bream', rarity: 'rare', size: [30, 70], shadow: 1.15, hp: 38, regen: 3, strength: 1.1, color: 0xff7a7a },
  { id: 'yellowtail', name: 'Yellowtail', rarity: 'epic', size: [60, 110], shadow: 1.5, hp: 50, regen: 3.5, strength: 1.4, color: 0xf2d04a },
  { id: 'octopus', name: 'Octopus', rarity: 'epic', size: [50, 90], shadow: 1.35, hp: 42, regen: 3, strength: 1.6, color: 0xd96ba0 },
  { id: 'bluefin-tuna', name: 'Bluefin Tuna', rarity: 'legendary', size: [150, 300], shadow: 2.4, hp: 110, regen: 4.5, strength: 2.0, color: 0x2f4f8f },
];

export function pickRandomFish(list) {
  const pool = list.filter((f) => RARITY[f.rarity].weight > 0);
  const total = pool.reduce((sum, f) => sum + RARITY[f.rarity].weight, 0);
  let roll = Math.random() * total;
  for (const fish of pool) {
    roll -= RARITY[fish.rarity].weight;
    if (roll <= 0) return fish;
  }
  return pool[pool.length - 1];
}
