import * as THREE from 'three';
import { buildWorld, buildPlayer, SKY_COLOR } from './world.js';
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
scene.background = new THREE.Color(SKY_COLOR);

// Ace Angler-style camera: behind and above the player, looking out to sea with the horizon
// in view. During a reel battle it swoops in toward the hooked fish.
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
const CAMERA_OFFSET = new THREE.Vector3(0, 8, 8.5); // from the player
const CAMERA_LOOK_AHEAD = -14; // how far out to sea the camera looks (z, from the player)
const BATTLE_OFFSET = new THREE.Vector3(0, 5.5, 8); // from the hooked fish
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const wantPos = new THREE.Vector3();
const wantLook = new THREE.Vector3();

scene.add(new THREE.HemisphereLight(0xffffff, 0x88aacc, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(6, 12, 8);
scene.add(sun);

const world = buildWorld(scene);
const { player, rodPivot, rodTip } = buildPlayer();
scene.add(player);

function cameraTarget(focus) {
  if (focus) {
    // Look mostly at the fish, but keep a bit of the player in the shot.
    wantLook.lerpVectors(player.position, focus, 0.75).setY(0);
    wantPos.copy(wantLook).add(BATTLE_OFFSET);
  } else {
    wantPos.copy(player.position).add(CAMERA_OFFSET);
    wantLook.set(player.position.x, 0, player.position.z + CAMERA_LOOK_AHEAD);
  }
}

cameraTarget(null);
camPos.copy(wantPos);
camLook.copy(wantLook);

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

  cameraTarget(fishing.cameraFocus);
  const ease = 1 - Math.exp(-dt * 3);
  camPos.lerp(wantPos, ease);
  camLook.lerp(wantLook, ease);
  shakeAmount *= Math.exp(-dt * 6);
  camera.position.set(
    camPos.x + (Math.random() - 0.5) * shakeAmount,
    camPos.y + (Math.random() - 0.5) * shakeAmount,
    camPos.z,
  );
  camera.lookAt(camLook);

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
