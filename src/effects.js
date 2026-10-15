import * as THREE from 'three';

const dropGeo = new THREE.SphereGeometry(0.09, 6, 4);
const ringGeo = (() => {
  const geo = new THREE.RingGeometry(0.8, 1, 32);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

// Splash droplets and ripple rings on the water.
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.drops = [];
    this.ripples = [];
  }

  splash(pos, count = 10, power = 1) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(dropGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
      mesh.position.set(pos.x, 0.1, pos.z);
      const angle = Math.random() * Math.PI * 2;
      const out = (0.8 + Math.random() * 1.5) * power;
      const vel = new THREE.Vector3(Math.cos(angle) * out, (2.5 + Math.random() * 2.5) * power, Math.sin(angle) * out);
      this.scene.add(mesh);
      this.drops.push({ mesh, vel, life: 0.7 });
    }
  }

  ripple(pos, size = 1) {
    const mesh = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }),
    );
    mesh.position.set(pos.x, 0.06, pos.z);
    mesh.scale.setScalar(0.2);
    this.scene.add(mesh);
    this.ripples.push({ mesh, age: 0, size });
  }

  update(dt) {
    for (const d of this.drops) {
      d.life -= dt;
      d.vel.y -= 12 * dt;
      d.mesh.position.addScaledVector(d.vel, dt);
      d.mesh.material.opacity = Math.max(0, d.life / 0.7);
    }
    for (const r of this.ripples) {
      r.age += dt;
      r.mesh.scale.setScalar(0.2 + r.age * 2.5 * r.size);
      r.mesh.material.opacity = Math.max(0, 0.8 - r.age * 0.9);
    }
    this.drops = this.cleanup(this.drops, (d) => d.life <= 0 || d.mesh.position.y < -0.2);
    this.ripples = this.cleanup(this.ripples, (r) => r.age > 0.9);
  }

  cleanup(items, isDone) {
    return items.filter((item) => {
      if (!isDone(item)) return true;
      this.scene.remove(item.mesh);
      item.mesh.material.dispose();
      return false;
    });
  }
}
