import * as THREE from 'three';
import { RARITY } from './fishData.js';
import { DOCK_END_Z } from './world.js';

const CAST_RANGE = 17;
const MIN_CAST = 3;
const CAST_TIME = 0.55;
const ATTRACT_RADIUS = 4.5;
const BITE_WINDOW = 0.9;
const ROD_POWER = 1; // stamina removed per Space press (rods upgrade this in Milestone 2)
const THRASH_POWER = 0.5; // mashes are only half as strong while a fish thrashes

const rand = (min, max) => min + Math.random() * (max - min);
const angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

const PROMPTS = {
  aim: 'Click the water near a fish shadow to cast',
  wait: 'Waiting for a bite… (click to reel in)',
  approach: 'Something is coming…',
  nibble: 'Nibble… wait for it…',
  bite: 'HIT! Press SPACE!',
  reel: 'Mash SPACE to reel it in!',
};

function makeBobber() {
  const group = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshToonMaterial({ color: 0xff3b3b }),
  );
  const bottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshToonMaterial({ color: 0xffffff }),
  );
  group.add(top, bottom);
  group.visible = false;
  return group;
}

function makeReticle() {
  const geo = new THREE.RingGeometry(0.55, 0.72, 32);
  geo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  ring.position.y = 0.07;
  return ring;
}

// A placeholder 3D fish for the "jumps out of the water" moment.
function makeCaughtFish(species, scale) {
  const group = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({ color: species.color });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat);
  body.scale.set(0.9, 0.42, 0.3);
  group.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 4), mat);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.95;
  group.add(tail);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  eye.position.set(0.6, 0.1, 0.24);
  group.add(eye);
  group.scale.setScalar(Math.max(0.6, scale));
  return group;
}

export class Fishing {
  constructor({ scene, player, rodPivot, rodTip, shadows, effects, hud, shake }) {
    Object.assign(this, { scene, player, rodPivot, rodTip, shadows, effects, hud, shake });

    this.state = 'aim';
    this.timer = 0;
    this.fish = null;
    this.battle = null;
    this.log = {};
    this.totalCatches = 0;

    this.aimPoint = new THREE.Vector3(0, 0, -4);
    this.tip = new THREE.Vector3();
    this.castFrom = new THREE.Vector3();
    this.castTo = new THREE.Vector3();
    this.rodKick = 0;
    this.bobberDip = 0;
    this.attractCheck = 0;
    this.rippleTimer = 0;

    this.bobber = makeBobber();
    this.reticle = makeReticle();
    this.lineGeo = new THREE.BufferGeometry().setFromPoints(new Array(16).fill(0).map(() => new THREE.Vector3()));
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0x1b2a38 }));
    this.line.frustumCulled = false;
    scene.add(this.bobber, this.reticle, this.line);

    hud.updateLog(this.log, 0);
    hud.setPrompt(PROMPTS.aim);
  }

  // ---- input ----

  setAim(point) {
    const dx = point.x - this.player.position.x;
    const dz = Math.min(point.z, DOCK_END_Z - 1.5) - this.player.position.z;
    const dist = Math.hypot(dx, dz) || 1;
    const clamped = THREE.MathUtils.clamp(dist, MIN_CAST, CAST_RANGE);
    this.aimPoint.set(
      this.player.position.x + (dx / dist) * clamped,
      0,
      this.player.position.z + (dz / dist) * clamped,
    );
  }

  onClick() {
    if (this.state === 'aim') this.startCast();
    else if (this.state === 'wait' || this.state === 'nibble') this.reelInEmpty();
    else if (this.state === 'card') this.closeCard();
  }

  onSpace() {
    if (this.state === 'nibble') this.lose('Too early! You scared it away.');
    else if (this.state === 'bite') this.startBattle();
    else if (this.state === 'reel') this.mash();
    else if (this.state === 'card') this.closeCard();
  }

  // ---- state changes ----

  startCast() {
    this.state = 'cast';
    this.timer = 0;
    this.castFrom.copy(this.tip);
    this.castTo.copy(this.aimPoint);
    this.bobber.visible = true;
    this.reticle.visible = false;
    this.rodKick = -1.2; // flick the rod forward
    this.hud.setPrompt('');
  }

  land() {
    this.state = 'wait';
    this.bobber.position.set(this.castTo.x, 0.05, this.castTo.z);
    this.effects.splash(this.bobber.position, 8, 0.6);
    this.effects.ripple(this.bobber.position, 1);
    this.attractCheck = 0.3;
    this.hud.setPrompt(PROMPTS.wait);
  }

  reelInEmpty() {
    this.fish?.release();
    this.fish = null;
    this.toAimAfter(0.35, '');
  }

  startBattle() {
    const fish = this.fish;
    const sp = fish.species;
    const end = new THREE.Vector3(this.player.position.x, 0, DOCK_END_Z - 0.8 - fish.scale);
    const start = fish.position.clone();
    this.battle = {
      hp: sp.hp,
      maxHp: sp.hp,
      time: RARITY[sp.rarity].timeLimit,
      maxTime: RARITY[sp.rarity].timeLimit,
      thrashing: false,
      thrashLeft: 0,
      nextThrash: rand(1.5, 3) / sp.strength,
      side: 1,
      start,
      end,
      pullAngle: Math.atan2(start.z - end.z, start.x - end.x),
    };
    fish.mode = 'hooked';
    this.state = 'reel';
    this.hud.hideMarker();
    this.hud.showBattle(sp);
    this.hud.setPrompt(PROMPTS.reel, 'alert');
    this.effects.splash(fish.position, 16, 1.2);
    this.shake(0.3);
    this.rodKick = 1;
  }

  mash() {
    const b = this.battle;
    b.hp -= ROD_POWER * (b.thrashing ? THRASH_POWER : 1);
    this.rodKick = 1;
    this.hud.pulseMash();
    this.effects.splash(this.fish.position, 3, 0.5);
  }

  catchFish() {
    const fish = this.fish;
    const sp = fish.species;
    const entry = (this.log[sp.id] ||= { count: 0, best: 0 });
    const isNew = entry.count === 0;
    entry.count++;
    entry.best = Math.max(entry.best, fish.sizeCm);
    this.totalCatches++;

    this.caught = { species: sp, sizeCm: fish.sizeCm, isNew };
    this.jumpFish = makeCaughtFish(sp, fish.scale);
    this.jumpFrom = fish.position.clone();
    this.jumpTo = this.player.position.clone().add(new THREE.Vector3(0, 2.8, -0.6));
    this.scene.add(this.jumpFish);

    this.effects.splash(fish.position, 24, 1.5);
    this.effects.ripple(fish.position, 1.6);
    this.shake(0.4);
    this.shadows.remove(fish);
    this.fish = null;
    this.battle = null;
    this.bobber.visible = false;
    this.hud.hideBattle();
    this.hud.setPrompt('');
    this.state = 'landing';
    this.timer = 0;
  }

  closeCard() {
    this.hud.hideCatch();
    this.scene.remove(this.jumpFish);
    this.jumpFish = null;
    this.state = 'aim';
    this.reticle.visible = true;
    this.hud.setPrompt(PROMPTS.aim);
  }

  lose(message) {
    if (this.fish && this.fish.mode !== 'fleeing') this.fish.flee();
    this.fish = null;
    this.battle = null;
    this.hud.hideBattle();
    this.hud.hideMarker();
    this.toAimAfter(1.4, message, 'bad');
  }

  toAimAfter(seconds, message, style = '') {
    this.state = 'pause';
    this.timer = seconds;
    this.hud.setPrompt(message, style);
  }

  // ---- per-frame ----

  update(dt, time) {
    this.rodTip.getWorldPosition(this.tip);
    this.faceTarget(dt);
    this.updateRod(dt, time);

    switch (this.state) {
      case 'aim':
        this.reticle.visible = true;
        this.reticle.position.x = this.aimPoint.x;
        this.reticle.position.z = this.aimPoint.z;
        this.reticle.scale.setScalar(1 + Math.sin(time * 5) * 0.08);
        break;
      case 'cast':
        this.updateCast(dt);
        break;
      case 'wait':
        this.updateWait(dt, time);
        break;
      case 'nibble':
        this.updateNibble(dt);
        break;
      case 'bite':
        this.updateBite(dt, time);
        break;
      case 'reel':
        this.updateReel(dt, time);
        break;
      case 'landing':
        this.updateLanding(dt);
        break;
      case 'card':
        this.jumpFish.position.y = this.jumpTo.y + Math.sin(time * 3) * 0.15;
        this.jumpFish.rotation.y += dt * 1.5;
        break;
      case 'pause':
        this.timer -= dt;
        if (this.bobber.visible) {
          this.bobber.position.lerp(this.tip, Math.min(1, dt * 8));
          if (this.bobber.position.distanceTo(this.tip) < 0.4) this.bobber.visible = false;
        }
        if (this.timer <= 0) {
          this.bobber.visible = false;
          this.state = 'aim';
          this.hud.setPrompt(PROMPTS.aim);
        }
        break;
    }

    this.updateLine();
  }

  // Marker position for the big "!" when a fish bites.
  get markerPosition() {
    return this.state === 'bite' ? this.bobber.position : null;
  }

  faceTarget(dt) {
    const target = this.state === 'aim' ? this.aimPoint : this.bobber.visible ? this.bobber.position : this.aimPoint;
    const want = Math.atan2(-(target.x - this.player.position.x), -(target.z - this.player.position.z));
    this.player.rotation.y += angleDiff(this.player.rotation.y, want) * Math.min(1, dt * 10);
  }

  updateRod(dt, time) {
    let pitch = 0.7;
    if (this.state === 'aim') pitch = 0.95;
    if (this.state === 'reel') pitch = 0.45 + (this.battle?.thrashing ? Math.sin(time * 20) * 0.08 : 0);
    this.rodKick *= Math.exp(-dt * 10);
    this.rodPivot.rotation.x = pitch - this.rodKick * 0.25;
  }

  updateCast(dt) {
    this.timer += dt / CAST_TIME;
    const t = Math.min(1, this.timer);
    this.bobber.position.lerpVectors(this.castFrom, this.castTo, t);
    this.bobber.position.y = THREE.MathUtils.lerp(this.castFrom.y, 0.05, t) + 4 * 3 * t * (1 - t);
    if (t >= 1) this.land();
  }

  updateWait(dt, time) {
    this.bobber.position.y = 0.05 + Math.sin(time * 3) * 0.04;

    if (!this.fish) {
      this.attractCheck -= dt;
      if (this.attractCheck > 0) return;
      this.attractCheck = 0.4;
      const nearby = this.shadows.list
        .filter((f) => f.mode === 'wander' && f.headPosition().distanceTo(this.bobber.position) < ATTRACT_RADIUS)
        .sort((a, b) => a.position.distanceTo(this.bobber.position) - b.position.distanceTo(this.bobber.position));
      if (nearby.length && Math.random() < 0.6) {
        this.fish = nearby[0];
        this.fish.attractTo(this.bobber.position);
        this.hud.setPrompt(PROMPTS.approach);
      }
    } else if (this.fish.mode === 'nibbling') {
      this.state = 'nibble';
      this.nibblesLeft = 1 + Math.floor(Math.random() * 3);
      this.timer = rand(0.3, 0.7);
      this.hud.setPrompt(PROMPTS.nibble);
    } else if (this.fish.mode !== 'attracted') {
      this.fish = null;
    }
  }

  updateNibble(dt) {
    this.timer -= dt;
    this.bobberDip *= Math.exp(-dt * 8);
    this.bobber.position.y = 0.05 - this.bobberDip * 0.18;
    if (this.timer > 0) return;

    if (this.nibblesLeft > 0) {
      this.nibblesLeft--;
      this.fish.nibble();
      this.bobberDip = 1;
      this.effects.ripple(this.bobber.position, 0.5);
      this.timer = rand(0.6, 1.1);
    } else {
      this.state = 'bite';
      this.timer = BITE_WINDOW;
      this.effects.splash(this.bobber.position, 10, 0.8);
      this.effects.ripple(this.bobber.position, 1.2);
      this.hud.setPrompt(PROMPTS.bite, 'alert');
    }
  }

  updateBite(dt, time) {
    this.timer -= dt;
    this.bobber.position.y = -0.18 + Math.sin(time * 40) * 0.04;
    if (this.timer <= 0) this.lose('Too slow… it got away!');
  }

  updateReel(dt, time) {
    const b = this.battle;
    const fish = this.fish;
    const sp = fish.species;

    b.time -= dt;
    b.hp = Math.min(b.maxHp, b.hp + sp.regen * dt);

    if (b.thrashing) {
      b.thrashLeft -= dt;
      if (b.thrashLeft <= 0) {
        b.thrashing = false;
        b.nextThrash = rand(1.5, 3.5) / sp.strength;
      }
    } else {
      b.nextThrash -= dt;
      if (b.nextThrash <= 0) {
        b.thrashing = true;
        b.thrashLeft = 0.8 + sp.strength * 0.4;
        b.side = Math.random() < 0.5 ? -1 : 1;
        this.effects.splash(fish.position, 14, 1);
        this.shake(0.2 * sp.strength);
      }
    }

    // The more stamina the fish loses, the closer it gets pulled to the dock.
    const progress = THREE.MathUtils.smoothstep(1 - b.hp / b.maxHp, 0, 1);
    const target = new THREE.Vector3().lerpVectors(b.start, b.end, progress);
    const sway = Math.sin(time * 1.7) * 0.6 + (b.thrashing ? Math.sin(time * 13) * 1.1 * b.side : 0);
    target.x += -Math.sin(b.pullAngle) * sway;
    target.z += Math.cos(b.pullAngle) * sway;
    fish.position.lerp(target, 1 - Math.exp(-5 * dt));
    fish.heading = b.pullAngle + (b.thrashing ? Math.sin(time * 18) * 0.7 : Math.sin(time * 3) * 0.2);

    fish.headPosition(this.bobber.position);
    this.bobber.position.y = 0;

    this.rippleTimer -= dt;
    if (this.rippleTimer <= 0) {
      this.rippleTimer = b.thrashing ? 0.12 : 0.35;
      this.effects.ripple(fish.position, 0.6 * fish.scale);
    }

    this.hud.updateBattle(b.hp / b.maxHp, b.time / b.maxTime, b.thrashing);

    if (b.hp <= 0) this.catchFish();
    else if (b.time <= 0) this.lose('The line snapped! It got away…');
  }

  updateLanding(dt) {
    this.timer += dt / 0.9;
    const t = Math.min(1, this.timer);
    this.jumpFish.position.lerpVectors(this.jumpFrom, this.jumpTo, t);
    this.jumpFish.position.y = THREE.MathUtils.lerp(0, this.jumpTo.y, t) + 4 * t * (1 - t);
    this.jumpFish.rotation.z = t * Math.PI * 4;
    if (t >= 1) {
      this.jumpFish.rotation.z = 0;
      this.state = 'card';
      this.hud.showCatch(this.caught);
      this.hud.updateLog(this.log, this.totalCatches);
    }
  }

  updateLine() {
    this.line.visible = this.bobber.visible;
    if (!this.line.visible) return;

    const from = this.tip;
    const to = this.bobber.position;
    const taut = this.state === 'reel' || this.state === 'bite';
    const sag = taut ? 0.1 : from.distanceTo(to) * 0.12;
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    mid.y -= sag;

    const pos = this.lineGeo.attributes.position;
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const t = i / (pos.count - 1);
      // Quadratic curve from rod tip, through the sagging middle, to the bobber.
      p.set(0, 0, 0)
        .addScaledVector(from, (1 - t) * (1 - t))
        .addScaledVector(mid, 2 * (1 - t) * t)
        .addScaledVector(to, t * t);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    pos.needsUpdate = true;
  }
}
