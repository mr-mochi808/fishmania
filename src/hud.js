import { RARITY } from './fishData.js';

const $ = (id) => document.getElementById(id);

// All the on-screen panels live in index.html; this file just updates them.
export class Hud {
  constructor(speciesList) {
    this.speciesList = speciesList;
    this.el = {
      prompt: $('prompt'),
      battle: $('battle'),
      battleName: $('battle-name'),
      battleRarity: $('battle-rarity'),
      hpFill: $('hp-fill'),
      timeFill: $('time-fill'),
      mashText: $('mash-text'),
      marker: $('bite-marker'),
      card: $('catch-card'),
      cardNew: $('card-new'),
      cardName: $('card-name'),
      cardRarity: $('card-rarity'),
      cardSize: $('card-size'),
      catchCount: $('catch-count'),
      logList: $('log-list'),
    };
  }

  setPrompt(text, style = '') {
    this.el.prompt.textContent = text;
    this.el.prompt.className = text ? style : 'hidden';
  }

  showBattle(species) {
    this.el.battleName.textContent = species.name;
    this.setRarity(this.el.battleRarity, species.rarity);
    this.el.battle.classList.remove('hidden', 'thrashing');
  }

  updateBattle(hpFrac, timeFrac, thrashing) {
    this.el.hpFill.style.width = `${Math.max(0, hpFrac) * 100}%`;
    this.el.timeFill.style.width = `${Math.max(0, timeFrac) * 100}%`;
    this.el.battle.classList.toggle('thrashing', thrashing);
    this.el.mashText.textContent = thrashing ? 'IT\'S THRASHING!' : 'MASH SPACE!';
  }

  pulseMash() {
    const t = this.el.mashText;
    t.classList.remove('pop');
    void t.offsetWidth; // restart the animation
    t.classList.add('pop');
  }

  hideBattle() {
    this.el.battle.classList.add('hidden');
  }

  placeMarker(x, y) {
    this.el.marker.style.left = `${x}px`;
    this.el.marker.style.top = `${y}px`;
    this.el.marker.classList.remove('hidden');
  }

  hideMarker() {
    this.el.marker.classList.add('hidden');
  }

  showCatch({ species, sizeCm, isNew }) {
    this.el.cardName.textContent = species.name;
    this.setRarity(this.el.cardRarity, species.rarity);
    this.el.cardSize.textContent = `${sizeCm} cm`;
    this.el.cardNew.classList.toggle('hidden', !isNew);
    this.el.card.classList.remove('hidden');
  }

  hideCatch() {
    this.el.card.classList.add('hidden');
  }

  updateLog(log, totalCatches) {
    this.el.catchCount.textContent = totalCatches;
    this.el.logList.replaceChildren(
      ...this.speciesList.map((species) => {
        const entry = log[species.id];
        const li = document.createElement('li');
        if (!entry) {
          li.className = 'unknown';
          li.textContent = '???';
          return li;
        }
        const name = document.createElement('span');
        name.textContent = species.name;
        name.className = `rarity ${species.rarity}`;
        const stats = document.createElement('span');
        stats.textContent = `×${entry.count} · ${entry.best} cm`;
        li.append(name, stats);
        return li;
      }),
    );
  }

  setRarity(el, rarity) {
    el.textContent = RARITY[rarity].label;
    el.className = `rarity ${rarity}`;
  }
}
