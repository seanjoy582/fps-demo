export class EnemySystem {
    constructor(scene, player, collisionWorld, effects, assets, audio) {
        this.scene = scene;
        this.player = player;
        this.collisionWorld = collisionWorld;
        this.effects = effects;
        this.assets = assets;
        this.audio = audio;
        this.list = [];
        this.spawnTimer = 0;
        this.materials = {
            camo: new window.THREE.MeshStandardMaterial({ color: 0x8d8459, roughness: 0.86 }),
            armor: new window.THREE.MeshStandardMaterial({ color: 0x3e4636, roughness: 0.82 }),
            skin: new window.THREE.MeshStandardMaterial({ color: 0xb9875b, roughness: 0.72 }),
            dog: new window.THREE.MeshStandardMaterial({ color: 0x7a5a36, roughness: 0.78 }),
            dark: new window.THREE.MeshStandardMaterial({ color: 0x111310, roughness: 0.78 })
        };
    }

    createSoldierMesh() {
        const THREE = window.THREE;
        const group = new THREE.Group();
        const m = this.materials;

        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.35, 6, 12), m.camo);
        body.name = 'enemy body';
        body.position.y = 1.65;
        body.scale.set(1.05, 1.08, 0.8);
        group.add(body);

        const vest = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.15, 0.38), m.armor);
        vest.name = 'enemy vest';
        vest.position.set(0, 1.7, 0.08);
        group.add(vest);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), m.dog);
        head.name = 'enemy dog head';
        head.scale.set(1, 0.92, 1.08);
        head.position.y = 2.73;
        group.add(head);

        const muzzle = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.22, 5, 8), m.dog);
        muzzle.name = 'enemy dog muzzle';
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 2.66, -0.31);
        group.add(muzzle);

        for (const side of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 8), m.dog);
            ear.name = 'enemy dog ear';
            ear.position.set(side * 0.22, 3.04, 0);
            ear.rotation.z = side * 0.35;
            group.add(ear);
        }

        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), m.armor);
        helmet.name = 'enemy tactical helmet';
        helmet.position.y = 2.88;
        group.add(helmet);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.12), m.dark);
        visor.name = 'enemy helmet visor';
        visor.position.set(0, 2.78, -0.3);
        group.add(visor);

        const gun = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.16), m.dark);
        gun.name = 'enemy rifle';
        gun.position.set(0.55, 2.05, -0.43);
        group.add(gun);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), m.dark);
        barrel.name = 'enemy barrel';
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(1.55, 2.05, -0.43);
        group.add(barrel);

        for (const side of [-1, 1]) {
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.9, 5, 8), m.camo);
            arm.name = 'enemy arm';
            arm.position.set(side * 0.62, 1.95, -0.12);
            arm.rotation.z = side * 0.45;
            arm.rotation.x = Math.PI / 2.5;
            group.add(arm);

            const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.1, 5, 8), m.camo);
            leg.name = 'enemy leg';
            leg.position.set(side * 0.23, 0.55, 0);
            group.add(leg);
        }

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return group;
    }

    spawn(position = null) {
        const THREE = window.THREE;
        const group = new THREE.Group();
        const soldier = this.createSoldierMesh();
        group.add(soldier);
        const hitBody = new THREE.Mesh(
            new THREE.BoxGeometry(1.55, 3.2, 0.95),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 })
        );
        hitBody.name = 'enemy hit body';
        hitBody.position.y = 1.55;
        group.add(hitBody);
        if (position) {
            group.position.copy(position);
        } else {
            const forward = new THREE.Vector3();
            this.player.camera.getWorldDirection(forward);
            forward.y = 0;
            if (forward.lengthSq() === 0) forward.set(0, 0, -1);
            forward.normalize();
            const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
            const lane = (Math.random() - 0.5) * 26;
            const dist = 18 + Math.random() * 18;
            group.position.copy(this.player.camera.position).addScaledVector(forward, dist).addScaledVector(right, lane);
            group.position.y = 0;
        }
        this.scene.add(group);
        this.list.push({
            mesh: group,
            soldier,
            hp: 100,
            state: 'patrol',
            patrol: new THREE.Vector3((Math.random() - 0.5) * 45, 0, (Math.random() - 0.5) * 45),
            cooldown: 0,
            flash: 0,
            stepTimer: Math.random() * 0.3
        });
    }

    spawnOpeningWave() {
        if (this.list.length > 0) return;
        const THREE = window.THREE;
        const forward = new THREE.Vector3();
        this.player.camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() === 0) forward.set(0, 0, -1);
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        for (const offset of [[0, 16], [-7, 22], [8, 26]]) {
            const pos = this.player.camera.position.clone().addScaledVector(right, offset[0]).addScaledVector(forward, offset[1]);
            pos.y = 0;
            this.spawn(pos);
        }
        this.spawnTimer = 5;
    }

    findByObject(object) {
        return this.list.find((enemy) => {
            let node = object;
            while (node) {
                if (node === enemy.mesh) return true;
                node = node.parent;
            }
            return false;
        });
    }

    damage(enemy, amount) {
        enemy.hp -= amount;
        enemy.flash = 0.12;
        if (enemy.hp > 0) return false;
        this.effects.deathFade(enemy.mesh);
        this.list = this.list.filter((item) => item !== enemy);
        return true;
    }

    update(delta) {
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0 && this.list.length < 8) {
            this.spawn();
            this.spawnTimer = 4;
        }

        for (const enemy of this.list) {
            const toPlayer = this.player.camera.position.clone().sub(enemy.mesh.position);
            const distance = toPlayer.length();
            enemy.state = distance < 30 ? 'chase' : 'patrol';
            const target = enemy.state === 'chase' ? this.player.camera.position : enemy.patrol;
            const move = target.clone().sub(enemy.mesh.position);
            move.y = 0;
            if (move.lengthSq() > 0.1) {
                move.normalize();
                enemy.mesh.position.addScaledVector(move, delta * (enemy.state === 'chase' ? 3.2 : 1.4));
                enemy.mesh.lookAt(enemy.mesh.position.clone().add(move));
                this.collisionWorld.resolve(enemy.mesh.position, 0.6);
                enemy.stepTimer -= delta;
                if (enemy.state === 'chase' && enemy.stepTimer <= 0) {
                    if (this.audio) this.audio.footstep(distance);
                    enemy.stepTimer = distance < 10 ? 0.26 : 0.38;
                }
            } else if (enemy.state === 'patrol') {
                enemy.patrol.set((Math.random() - 0.5) * 50, 0, (Math.random() - 0.5) * 50);
            }

            enemy.mesh.lookAt(this.player.camera.position.x, enemy.mesh.position.y, this.player.camera.position.z);
            if (enemy.flash > 0) {
                enemy.flash -= delta;
                enemy.soldier.traverse((child) => {
                    if (child.material && child.material.color) child.material.emissive?.set(0x661111);
                });
            } else {
                enemy.soldier.traverse((child) => {
                    if (child.material && child.material.emissive) child.material.emissive.set(0x000000);
                });
            }

            enemy.cooldown -= delta;
            if (distance < 22 && enemy.cooldown <= 0) {
                const start = enemy.mesh.position.clone().add(new THREE.Vector3(0, 2.05, 0));
                const direction = this.player.camera.position.clone().sub(start).normalize();
                this.effects.enemyTracer(start, direction);
                const ended = this.player.damage(34);
                if (this.audio) {
                    this.audio.enemyFire();
                    this.audio.hurt();
                }
                enemy.cooldown = 1.45;
                if (ended) return true;
            }
        }
        return false;
    }
}
