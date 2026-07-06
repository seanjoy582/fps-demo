export class CollisionWorld {
    constructor() {
        this.colliders = [];
    }

    addBox(mesh, padding = 0.2) {
        mesh.updateMatrixWorld(true);
        const box = new window.THREE.Box3().setFromObject(mesh).expandByScalar(padding);
        this.colliders.push({ mesh, box });
    }

    refresh() {
        for (const item of this.colliders) {
            item.mesh.updateMatrixWorld(true);
            item.box.setFromObject(item.mesh).expandByScalar(0.2);
        }
    }

    resolve(position, radius) {
        for (const { box } of this.colliders) {
            const closest = box.clampPoint(position, new window.THREE.Vector3());
            const delta = position.clone().sub(closest);
            const dist = delta.length();
            if (dist < radius) {
                if (dist === 0) {
                    const center = box.getCenter(new window.THREE.Vector3());
                    delta.copy(position).sub(center).setY(0);
                    if (delta.lengthSq() === 0) delta.set(1, 0, 0);
                }
                delta.normalize().multiplyScalar(radius - Math.max(dist, 0.001));
                delta.y = 0;
                position.add(delta);
            }
        }
    }
}
