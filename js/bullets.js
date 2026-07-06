export class BulletSystem {
    constructor(camera, mapTargets, enemies, effects, audio, onKill) {
        this.camera = camera;
        this.mapTargets = mapTargets;
        this.enemies = enemies;
        this.effects = effects;
        this.audio = audio;
        this.onKill = onKill;
        this.raycaster = new window.THREE.Raycaster();
    }

    fire(weapon, time) {
        const THREE = window.THREE;
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.x += (Math.random() - 0.5) * weapon.recoil;
        direction.y += (Math.random() - 0.5) * weapon.recoil;
        direction.z += (Math.random() - 0.5) * weapon.recoil;
        direction.normalize();

        this.raycaster.set(this.camera.position, direction);
        this.raycaster.far = 90;
        const targets = [...this.mapTargets, ...this.enemies.list.map((enemy) => enemy.mesh)];
        const hits = this.raycaster.intersectObjects(targets, true);

        weapon.shoot(time);
        this.effects.muzzleFlash();
        this.effects.tracer(this.camera.position, direction);
        this.effects.recoil(weapon.recoil * 0.5);
        if (this.audio) this.audio.gunshot(weapon.name);

        if (!hits.length) return;
        const hit = hits[0];
        this.effects.hitSpark(hit.point);
        if (this.audio) this.audio.hit();
        const enemy = this.enemies.findByObject(hit.object);
        if (enemy && this.enemies.damage(enemy, weapon.damage)) this.onKill();
    }
}
