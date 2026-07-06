import { createScene } from './scene.js';
import { createMap } from './map.js';
import { CollisionWorld } from './collision.js';
import { InputController } from './input.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { Effects } from './effects.js';
import { BulletSystem } from './bullets.js';
import { EnemySystem } from './enemy.js';
import { AK47 } from './weapons/ak47.js';
import { M4A1 } from './weapons/m4a1.js';
import { M249 } from './weapons/m249.js';
import { Pistol } from './weapons/pistol.js';
import { AssetManager } from './assets.js';
import { AudioManager } from './audio.js';

const THREE = window.THREE;
const assets = new AssetManager();
const audio = new AudioManager();
const scene = createScene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const collisionWorld = new CollisionWorld();
const map = createMap(scene, collisionWorld, assets);
const input = new InputController(camera, document.body);
scene.add(input.controls.getObject());
const player = new Player(camera, input, collisionWorld);
const ui = new UI();
const effects = new Effects(scene, camera, assets);

const weapons = [new AK47(), new M4A1(), new M249(), new Pistol()];
let weaponIndex = 0;
let kills = 0;
let running = false;
let gameEnded = false;
let baseFov = 75;

const enemies = new EnemySystem(scene, player, collisionWorld, effects, assets, audio);
const bullets = new BulletSystem(camera, map.raycastTargets, enemies, effects, audio, () => {
    kills += 1;
});

function startGame({ lockPointer = true } = {}) {
    running = true;
    audio.unlock();
    setInterval(() => audio.ambient(), 1800);
    ui.showGame();
    enemies.spawnOpeningWave();
    ui.update(player, weapons[weaponIndex], kills, fps, assets.image(`${weapons[weaponIndex].name}View`));
    if (lockPointer) input.lock();
}

window.__fpsDemo = {
    getState() {
        const currentWeapon = weapons[weaponIndex];
        return {
            running,
            gameEnded,
            hp: player.health,
            hitsTaken: player.hitsTaken,
            kills,
            weapon: currentWeapon.name,
            ammo: currentWeapon.ammo,
            reserveAmmo: currentWeapon.reserveAmmo,
            reloading: currentWeapon.reloading,
            enemyCount: enemies.list.length,
            playerPosition: camera.position.toArray(),
            canvasCount: document.querySelectorAll('canvas').length,
            hudDisplay: ui.hud.style.display,
            menuDisplay: ui.menu.style.display,
            crosshairDisplay: ui.crosshair.style.display
        };
    },
    startForTest() {
        startGame({ lockPointer: false });
        return this.getState();
    },
    assets: assets.allPaths()
};

document.getElementById('startBtn').addEventListener('click', () => {
    startGame({ lockPointer: true });
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let fpsTimer = 0;
let frames = 0;
let fps = 0;

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (running && !gameEnded) {
        const flags = input.consumeFrameFlags();
        if (flags.weaponRequested !== null && weapons[flags.weaponRequested]) {
            weaponIndex = flags.weaponRequested;
        }

        const currentWeapon = weapons[weaponIndex];
        ui.setAiming(input.aiming);
        const targetFov = input.aiming ? 43 : baseFov;
        camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 14);
        camera.updateProjectionMatrix();

        if (flags.reloadRequested && currentWeapon.reload(() => ui.update(player, currentWeapon, kills, fps, assets.image(`${currentWeapon.name}View`)))) {
            audio.reload();
        }

        const triggerHeld = input.mouseDown && !flags.justClicked;
        const wantsShot = input.mouseDown && currentWeapon.canShoot(time, triggerHeld);
        if (wantsShot) bullets.fire(currentWeapon, time);
        if (input.mouseDown && currentWeapon.ammo <= 0 && flags.justClicked) audio.empty();

        player.update(delta, flags);
        if (enemies.update(delta)) {
            gameEnded = true;
            ui.end();
        }
        effects.update(delta);

        if (player.hitsTaken >= 30 || player.health <= 0) {
            gameEnded = true;
            ui.end();
        }

        frames += 1;
        fpsTimer += delta;
        if (fpsTimer >= 0.5) {
            fps = Math.round(frames / fpsTimer);
            frames = 0;
            fpsTimer = 0;
        }
        ui.update(player, currentWeapon, kills, fps, assets.image(`${currentWeapon.name}View`));
    }

    renderer.render(scene, camera);
}

animate();

if (new URLSearchParams(window.location.search).has('playtest')) {
    const press = (code) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { code }));
        document.dispatchEvent(new KeyboardEvent('keyup', { code }));
    };
    const report = document.createElement('pre');
    report.id = 'playtest-report';
    report.style.display = 'none';
    document.body.appendChild(report);

    setTimeout(() => {
        document.getElementById('startBtn').click();
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
        document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    }, 250);

    let afterFireAmmo = null;
    setTimeout(() => {
        document.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
        document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
        document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }));
        afterFireAmmo = weapons[0].ammo;
        press('Digit3');
        press('KeyR');
        press('Space');
    }, 1200);

    setTimeout(() => {
        const state = window.__fpsDemo.getState();
        const checks = {
            threeLoaded: Boolean(window.THREE),
            canvasCreated: state.canvasCount >= 1,
            started: state.running && state.menuDisplay === 'none' && state.hudDisplay === 'block',
            movementRan: Math.abs(state.playerPosition[0]) > 0.01 || Math.abs(state.playerPosition[2] - 8) > 0.01,
            shootingReducedAkAmmo: afterFireAmmo !== null && afterFireAmmo < 30,
            switchedToM249: state.weapon === 'M249',
            enemiesSpawned: state.enemyCount >= 1,
            playerAlive: state.hp > 0,
            assetsRegistered: window.__fpsDemo.assets.length >= 10
        };
        report.textContent = JSON.stringify({ checks, state, afterFireAmmo }, null, 2);
        report.dataset.pass = Object.values(checks).every(Boolean) ? 'true' : 'false';
    }, 3200);
}
