export class Player {
    constructor(camera, input, collisionWorld) {
        this.camera = camera;
        this.input = input;
        this.collisionWorld = collisionWorld;
        this.health = 100;
        this.hitsTaken = 0;
        this.nextDamageAt = 0;
        this.velocity = new window.THREE.Vector3();
        this.height = 1.75;
        this.radius = 0.65;
        this.grounded = false;
        this.camera.position.set(0, this.height, 8);
    }

    update(delta, frameFlags) {
        const THREE = window.THREE;
        const speed = this.input.keys.has('ShiftLeft') ? 12 : 7;
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        if (this.input.keys.has('KeyW')) direction.add(forward);
        if (this.input.keys.has('KeyS')) direction.sub(forward);
        if (this.input.keys.has('KeyD')) direction.add(right);
        if (this.input.keys.has('KeyA')) direction.sub(right);
        if (direction.lengthSq() > 0) direction.normalize().multiplyScalar(speed);

        this.velocity.x = direction.x;
        this.velocity.z = direction.z;
        this.velocity.y -= 22 * delta;
        if (frameFlags.jumpRequested && this.grounded) {
            this.velocity.y = 8;
            this.grounded = false;
        }

        this.camera.position.addScaledVector(this.velocity, delta);
        if (this.camera.position.y <= this.height) {
            this.camera.position.y = this.height;
            this.velocity.y = 0;
            this.grounded = true;
        }
        this.collisionWorld.resolve(this.camera.position, this.radius);
    }

    damage(amount) {
        const now = performance.now();
        if (now < this.nextDamageAt) return false;
        this.nextDamageAt = now + 900;
        this.hitsTaken += 1;
        this.health = Math.max(0, 100 - Math.floor((this.hitsTaken / 30) * 100));
        document.body.classList.remove('damageFlash');
        void document.body.offsetWidth;
        document.body.classList.add('damageFlash');
        return this.hitsTaken >= 30;
    }
}
