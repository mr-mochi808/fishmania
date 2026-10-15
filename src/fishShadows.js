import * as THREE from 'three';
import { RARITY, pickRandomFish } from './fishData.js';
import { SWIM_BOUNDS } from './world.js';

const SHADOW_COLOR = 0x06223d;
const WATER_Y = 0.04;

// Shared fish-silhouette geometry: body along +X, lying flat on the water.
const bodyGeo = (() => {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, 1, 0.38, 0, Math.PI * 2);
  const geo = new THREE.ShapeGeometry(shape, 24);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

const tailGeo = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-0.55, 0.35);
  shape.lineTo(-0.45, 0);
  shape.lineTo(-0.55, -0.35);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

const glowGeo = (() => {
  const geo = new THREE.RingGeometry(1.15, 1.45, 32);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

const angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const rand = (min, max) => min + Math.random() * (max - min);

export class FishShadow {
  constructor(species, position) {
    this.species = species;
    this.rarity = RARITY[species.rarity];
    this.sizeCm = Math.round(rand(species.size[0], species.size[1]));
    const sizeT = (this.sizeCm - species.size[0]) / Math.max(1, species.size[1] - species.size[0]);
    this.scale = 1.4 * species.shadow * (0.8 + 0.4 * sizeT);

    this.mode = 'wander'; // wander | attracted | nibbling | hooked | fleeing
    this.heading = rand(0, Math.PI * 2);
    this.baseSpeed = rand(0.7, 1.3) / Math.sqrt(this.scale);
    this.speed = this.baseSpeed;
    this.turnBias = 0;
    this.opacity = 0;
    this.targetOpacity = 0.55;
    this.dead = false;
    this.fleeTime = 0;
    this.target = new THREE.Vector3();
    this.nibbleKick = 0;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.position.y = WATER_Y;
    this.group.scale.setScalar(this.scale);

    this.material = new THREE.MeshBasicMaterial({
      color: SHADOW_COLOR,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.group.add(new THREE.Mesh(bodyGeo, this.material));

    this.tail = new THREE.Group();
    this.tail.position.x = -0.85;
    this.tail.add(new THREE.Mesh(tailGeo, this.material));
    this.group.add(this.tail);

    if (this.rarity.glow) {
      this.glowMaterial = new THREE.MeshBasicMaterial({
        color: this.rarity.glow,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(glowGeo, this.glowMaterial);
      glow.position.y = -0.01;
      this.group.add(glow);
    }
  }

  get position() {
    return this.group.position;
  }

  // Where the fish's mouth is — this is what bites the bobber.
  headPosition(out = new THREE.Vector3()) {
    const len = 0.95 * this.scale;
    return out.set(
      this.position.x + Math.cos(this.heading) * len,
      this.position.y,
      this.position.z + Math.sin(this.heading) * len,
    );
  }

  attractTo(point) {
    this.mode = 'attracted';
    this.target.copy(point);
  }

  release() {
    this.mode = 'wander';
  }

  nibble() {
    this.nibbleKick = 1;
  }

  flee() {
    this.mode = 'fleeing';
    this.fleeTime = 0;
    // Swim away from the dock, out to deeper water.
    this.heading = -Math.PI / 2 + rand(-0.6, 0.6);
  }

  update(dt, time) {
    this.opacity += (this.targetOpacity - this.opacity) * Math.min(1, dt * 3);
    this.material.opacity = this.opacity;
    if (this.glowMaterial) {
      this.glowMaterial.opacity = (this.opacity / 0.55) * (0.35 + 0.25 * Math.sin(time * 4));
    }

    let tailSpeed = 6;
    let tailAmount = 0.35;

    switch (this.mode) {
      case 'wander':
        this.wander(dt);
        break;
      case 'attracted':
        tailSpeed = 9;
        this.swimToTarget(dt);
        break;
      case 'nibbling':
        tailSpeed = 4;
        tailAmount = 0.2;
        break;
      case 'hooked':
        tailSpeed = 22;
        tailAmount = 0.6;
        break;
      case 'fleeing':
        tailSpeed = 20;
        this.speed = 7;
        this.fleeTime += dt;
        this.targetOpacity = 0;
        if (this.fleeTime > 1.6) this.dead = true;
        break;
    }

    if (this.mode === 'wander' || this.mode === 'attracted' || this.mode === 'fleeing') {
      this.position.x += Math.cos(this.heading) * this.speed * dt;
      this.position.z += Math.sin(this.heading) * this.speed * dt;
    }

    if (this.nibbleKick > 0) {
      const kick = Math.sin(this.nibbleKick * Math.PI) * 0.12 * this.scale;
      this.position.x += Math.cos(this.heading) * kick * dt * 20;
      this.position.z += Math.sin(this.heading) * kick * dt * 20;
      this.nibbleKick = Math.max(0, this.nibbleKick - dt * 4);
    }

    this.group.rotation.y = -this.heading;
    this.tail.rotation.y = Math.sin(time * tailSpeed + this.baseSpeed * 10) * tailAmount;
  }

  wander(dt) {
    const b = SWIM_BOUNDS;
    const p = this.position;
    const margin = 2;
    if (p.x < b.minX + margin || p.x > b.maxX - margin || p.z < b.minZ + margin || p.z > b.maxZ - margin) {
      // Steer back toward the middle of the swim area.
      const toCenter = Math.atan2((b.minZ + b.maxZ) / 2 - p.z, (b.minX + b.maxX) / 2 - p.x);
      this.heading += angleDiff(this.heading, toCenter) * Math.min(1, dt * 1.5);
    } else {
      this.turnBias += rand(-1, 1) * dt * 2;
      this.turnBias *= 0.98;
      this.heading += this.turnBias * dt;
    }
    this.speed += (this.baseSpeed - this.speed) * Math.min(1, dt * 2);
  }

  swimToTarget(dt) {
    // Swim until the mouth (not the middle of the body) reaches the bobber.
    const len = 0.95 * this.scale;
    const dist = Math.hypot(this.target.x - this.position.x, this.target.z - this.position.z);
    const want = Math.atan2(this.target.z - this.position.z, this.target.x - this.position.x);
    const turn = angleDiff(this.heading, want);
    this.heading += turn * Math.min(1, dt * (dist < len * 2.5 ? 12 : 4));
    this.speed = THREE.MathUtils.clamp((dist - len) * 0.8 + 0.3, 0, 1.8);
    if (dist - len < 0.3 && Math.abs(turn) < 0.5) {
      this.mode = 'nibbling';
      this.speed = 0;
      this.position.x = this.target.x - Math.cos(this.heading) * len;
      this.position.z = this.target.z - Math.sin(this.heading) * len;
    }
  }

  dispose(scene) {
    scene.remove(this.group);
    this.material.dispose();
    this.glowMaterial?.dispose();
  }
}

export class ShadowManager {
  constructor(scene, speciesList, count = 9) {
    this.scene = scene;
    this.speciesList = speciesList;
    this.count = count;
    this.list = [];
    this.spawnTimer = 0;
    for (let i = 0; i < count; i++) this.spawn(false);
  }

  spawn(atEdge = true) {
    const b = SWIM_BOUNDS;
    const pos = atEdge
      ? new THREE.Vector3(Math.random() < 0.5 ? b.minX + 1 : b.maxX - 1, 0, rand(b.minZ + 2, b.maxZ - 3))
      : new THREE.Vector3(rand(b.minX + 3, b.maxX - 3), 0, rand(b.minZ + 3, b.maxZ - 1));
    const fish = new FishShadow(pickRandomFish(this.speciesList), pos);
    if (atEdge) fish.heading = pos.x < 0 ? rand(-0.5, 0.5) : Math.PI + rand(-0.5, 0.5);
    this.list.push(fish);
    this.scene.add(fish.group);
    return fish;
  }

  remove(fish) {
    fish.dispose(this.scene);
    this.list = this.list.filter((f) => f !== fish);
  }

  update(dt, time) {
    for (const fish of this.list) fish.update(dt, time);
    for (const fish of this.list.filter((f) => f.dead)) this.remove(fish);

    if (this.list.length < this.count) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn(true);
        this.spawnTimer = rand(1.5, 4);
      }
    }
  }
}
