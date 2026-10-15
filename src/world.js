import * as THREE from 'three';

// Where the end of the dock is — the player stands here and fish stay in front of it.
export const DOCK_END_Z = 3.6;
export const DECK_Y = 0.55;

// The area fish are allowed to swim in.
export const SWIM_BOUNDS = { minX: -15, maxX: 15, minZ: -17, maxZ: 1.8 };

const toon = (color) => new THREE.MeshToonMaterial({ color });

function buildWater() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        vec2 p = vWorld.xz * 0.45;
        float w = sin(p.x * 1.7 + uTime * 0.8) * sin(p.y * 1.3 - uTime * 0.6)
                + sin((p.x + p.y) * 2.3 + uTime * 1.1) * 0.5;
        float bands = smoothstep(0.80, 0.84, w * 0.5 + 0.5);
        vec3 deep = vec3(0.05, 0.33, 0.6);
        vec3 shallow = vec3(0.2, 0.66, 0.88);
        float nearShore = smoothstep(-22.0, 9.0, vWorld.z);
        vec3 col = mix(deep, shallow, nearShore);
        col = mix(col, vec3(0.8, 0.95, 1.0), bands * 0.22);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const geo = new THREE.PlaneGeometry(120, 80);
  geo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(geo, material);
  water.position.z = -12;
  return water;
}

function buildShore() {
  const group = new THREE.Group();

  const sand = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 24), toon(0xf3d98b));
  sand.position.set(0, -0.15, 22);
  group.add(sand);

  // A strip of grass behind the beach — Town Center goes here in Milestone 2.
  const grass = new THREE.Mesh(new THREE.BoxGeometry(120, 1, 20), toon(0x7cc75b));
  grass.position.set(0, -0.05, 36);
  group.add(grass);

  return group;
}

function buildDock() {
  const group = new THREE.Group();
  const startZ = 11.5;
  const plankDepth = 0.42;
  const gap = 0.06;
  const wood = [0xb5793f, 0xa86d36];

  let i = 0;
  for (let z = startZ; z > DOCK_END_Z; z -= plankDepth + gap) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, plankDepth), toon(wood[i++ % 2]));
    plank.position.set(0, DECK_Y - 0.07, z - plankDepth / 2);
    group.add(plank);
  }

  const postGeo = new THREE.CylinderGeometry(0.16, 0.16, 2.2, 8);
  const postMat = toon(0x7a4a22);
  for (let z = startZ - 0.3; z > DOCK_END_Z; z -= 2.4) {
    for (const x of [-1.25, 1.25]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, DECK_Y - 0.9, z);
      group.add(post);
    }
  }
  for (const x of [-1.25, 1.25]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, DECK_Y - 0.7, DOCK_END_Z + 0.15);
    group.add(post);
  }

  return group;
}

function buildRocks() {
  const group = new THREE.Group();
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const spots = [
    [-12, 4.5, 1.6],
    [-9.5, 6.2, 1.0],
    [11, 5, 1.8],
    [13.5, 2.8, 1.1],
    [-17, -6, 2.2],
    [17.5, -9, 2.6],
  ];
  for (const [x, z, s] of spots) {
    const rock = new THREE.Mesh(geo, toon(0x8d98a5));
    rock.position.set(x, -0.2, z);
    rock.scale.set(s, s * 0.6, s);
    rock.rotation.y = x * z;
    group.add(rock);
  }
  return group;
}

export function buildWorld(scene) {
  const water = buildWater();
  scene.add(water, buildShore(), buildDock(), buildRocks());

  return {
    update(time) {
      water.material.uniforms.uTime.value = time;
    },
  };
}

export function buildPlayer() {
  const player = new THREE.Group();
  player.position.set(0, DECK_Y, DOCK_END_Z + 0.6);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.6, 4, 12), toon(0xff8a3d));
  body.position.y = 0.65;
  player.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), toon(0xffd7b0));
  head.position.y = 1.55;
  player.add(head);

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16), toon(0x2f7fd8));
  hatBrim.position.y = 1.72;
  player.add(hatBrim);
  const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.25, 16), toon(0x2f7fd8));
  hatTop.position.y = 1.85;
  player.add(hatTop);

  // The rod pivots at the hands. Its geometry points along -Z (the way the player faces).
  const rodPivot = new THREE.Group();
  rodPivot.position.set(0.32, 1.05, -0.15);
  rodPivot.rotation.x = 0.7;
  player.add(rodPivot);

  const rodGeo = new THREE.CylinderGeometry(0.025, 0.05, 2.4, 6);
  rodGeo.rotateX(-Math.PI / 2);
  rodGeo.translate(0, 0, -1.2);
  rodPivot.add(new THREE.Mesh(rodGeo, toon(0x3a2a1a)));

  const rodTip = new THREE.Object3D();
  rodTip.position.set(0, 0, -2.4);
  rodPivot.add(rodTip);

  return { player, rodPivot, rodTip };
}
