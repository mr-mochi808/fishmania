import * as THREE from 'three';
import { buildWorld, buildPlayer } from './world.js';
import { DOCK_FISH } from './fishData.js';
import { ShadowManager } from './fishShadows.js';
import { Effects } from './effects.js';
import { Hud } from './hud.js';
import { Fishing } from './fishing.js';

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d4f86);

// Top-down 3D camera, tilted a little so the dock and player read clearly.
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
const CAMERA_POS = new THREE.Vector3(0, 21, 19);
const CAMERA_LOOK = new THREE.Vector3(0, 0, -3.5);
camera.position.copy(CAMERA_POS);
camera.lookAt(CAMERA_LOOK);

scene.add(new THREE.HemisphereLight(0xffffff, 0x88aacc, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(6, 12, 8);
scene.add(sun);

const world = buildWorld(scene);
const { player, rodPivot, rodTip } = buildPlayer();
scene.add(player);

let shakeAmount = 0;
const shake = (amount) => {
  shakeAmount = Math.max(shakeAmount, amount);
};

const hud = new Hud(DOCK_FISH);
const effects = new Effects(scene);
const shadows = new ShadowManager(scene, DOCK_FISH);
const fishing = new Fishing({ scene, player, rodPivot, rodTip, shadows, effects, hud, shake });

// ---- input ----

const raycaster = new THREE.Raycaster();
const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointer = new THREE.Vector2();
const hit = new THREE.Vector3();

window.addEventListener('pointermove', (e) => {
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(waterPlane, hit)) fishing.setAim(hit);
});

window.addEventListener('pointerdown', (e) => {
  if (e.button === 0) fishing.onClick();
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  e.preventDefault();
  if (!e.repeat) fishing.onSpace(); // holding Space doesn't count — you have to mash!
});

function fitToWindow() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const size = renderer.getSize(new THREE.Vector2());
  if (size.x === w && size.y === h) return;
  camera.aspect = w / h;
  // Keep enough water visible side-to-side on tall, narrow screens.
  const minHorizontalFov = THREE.MathUtils.degToRad(62);
  const neededFov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minHorizontalFov / 2) / camera.aspect));
  camera.fov = THREE.MathUtils.clamp(neededFov, 45, 85);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

// ---- game loop ----

const clock = new THREE.Clock();
const markerScreen = new THREE.Vector3();
let time = 0;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;
  fitToWindow();

  world.update(time);
  shadows.update(dt, time);
  fishing.update(dt, time);
  effects.update(dt);

  shakeAmount *= Math.exp(-dt * 6);
  camera.position.set(
    CAMERA_POS.x + (Math.random() - 0.5) * shakeAmount,
    CAMERA_POS.y + (Math.random() - 0.5) * shakeAmount,
    CAMERA_POS.z,
  );
  camera.lookAt(CAMERA_LOOK);

  const marker = fishing.markerPosition;
  if (marker) {
    markerScreen.copy(marker).setY(0.6).project(camera);
    hud.placeMarker(((markerScreen.x + 1) / 2) * window.innerWidth, ((1 - markerScreen.y) / 2) * window.innerHeight);
  } else {
    hud.hideMarker();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

if (import.meta.env.DEV) window.fishmania = { fishing, shadows };
