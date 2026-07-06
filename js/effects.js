export class Effects {
    constructor(scene, camera, assets) {
        this.scene = scene;
        this.camera = camera;
        this.assets = assets;
        this.items = [];
    }

    muzzleFlash() {
        const THREE = window.THREE;
        const light = new THREE.PointLight(0xffc15a, 4, 8);
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        light.position.copy(this.camera.position).addScaledVector(dir, 1.2).add(new THREE.Vector3(0.25, -0.18, 0));
        this.scene.add(light);
        this.items.push({ object: light, life: 0.055, max: 0.055, fade: true });

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.assets.texture('muzzleFlash'),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        sprite.scale.set(1.2, 1.2, 1);
        sprite.position.copy(this.camera.position).addScaledVector(dir, 1.45).add(new THREE.Vector3(0.22, -0.16, 0));
        this.scene.add(sprite);
        this.items.push({ object: sprite, life: 0.065, max: 0.065, fade: true });
    }

    tracer(from, direction) {
        const THREE = window.THREE;
        const start = from.clone().addScaledVector(direction, 1.1).add(new THREE.Vector3(0.18, -0.12, 0));
        const end = start.clone().addScaledVector(direction, 26);
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffe199,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.items.push({ object: line, life: 0.055, max: 0.055, fade: true });

        const slug = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true })
        );
        slug.position.copy(start);
        this.scene.add(slug);
        this.items.push({ object: slug, life: 0.16, max: 0.16, fade: true, velocity: direction.clone().multiplyScalar(115) });
    }

    enemyTracer(from, direction) {
        const THREE = window.THREE;
        const end = from.clone().addScaledVector(direction, 26);
        const geometry = new THREE.BufferGeometry().setFromPoints([from, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xff1f12,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.items.push({ object: line, life: 0.16, max: 0.16, fade: true });

        const slug = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 10, 10),
            new THREE.MeshBasicMaterial({
                color: 0xff3b1f,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            })
        );
        slug.position.copy(from);
        this.scene.add(slug);
        this.items.push({ object: slug, life: 0.26, max: 0.26, fade: true, velocity: direction.clone().multiplyScalar(75) });
    }

    recoil(amount) {
        this.camera.rotation.x += amount;
    }

    hitSpark(position) {
        const THREE = window.THREE;
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffd15c, transparent: true })
        );
        mesh.position.copy(position);
        this.scene.add(mesh);
        this.items.push({ object: mesh, life: 0.22, max: 0.22, fade: true });
    }

    deathFade(object) {
        object.traverse((child) => {
            if (child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
            }
        });
        this.items.push({ object, life: 1.0, max: 1.0, death: true });
    }

    update(delta) {
        for (let i = this.items.length - 1; i >= 0; i -= 1) {
            const item = this.items[i];
            item.life -= delta;
            const alpha = Math.max(0, item.life / item.max);
            if (item.fade && item.object.material) item.object.material.opacity = alpha;
            if (item.velocity) item.object.position.addScaledVector(item.velocity, delta);
            if (item.death) {
                item.object.position.y -= delta * 0.8;
                item.object.traverse((child) => {
                    if (child.material) child.material.opacity = alpha;
                });
            }
            if (item.life <= 0) {
                this.scene.remove(item.object);
                this.items.splice(i, 1);
            }
        }
    }
}
