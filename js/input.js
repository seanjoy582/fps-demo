class SimplePointerLockControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.isLocked = false;
        this.euler = new window.THREE.Euler(0, 0, 0, 'YXZ');
        this.onMouseMove = this.onMouseMove.bind(this);

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.domElement;
        });
        document.addEventListener('mousemove', this.onMouseMove);
    }

    getObject() {
        return this.camera;
    }

    lock() {
        this.domElement.requestPointerLock();
    }

    onMouseMove(event) {
        if (!this.isLocked) return;
        const sensitivity = 0.0022;
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= event.movementX * sensitivity;
        this.euler.x -= event.movementY * sensitivity;
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
    }
}

export class InputController {
    constructor(camera, domElement) {
        this.controls = new SimplePointerLockControls(camera, domElement);
        this.keys = new Set();
        this.mouseDown = false;
        this.aiming = false;
        this.justClicked = false;
        this.reloadRequested = false;
        this.weaponRequested = null;
        this.jumpRequested = false;

        document.addEventListener('keydown', (event) => {
            this.keys.add(event.code);
            if (event.code === 'KeyR') this.reloadRequested = true;
            if (event.code === 'Space') this.jumpRequested = true;
            if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(event.code)) {
                this.weaponRequested = Number(event.code.slice(-1)) - 1;
            }
        });
        document.addEventListener('keyup', (event) => this.keys.delete(event.code));
        document.addEventListener('contextmenu', (event) => event.preventDefault());
        const beginFire = (event) => {
            if (event.button === 0) {
                if (!this.mouseDown) this.justClicked = true;
                this.mouseDown = true;
            }
            if (event.button === 2) this.aiming = true;
        };
        const endFire = (event) => {
            if (event.button === 0) this.mouseDown = false;
            if (event.button === 2) this.aiming = false;
        };
        document.addEventListener('mousedown', beginFire);
        document.addEventListener('pointerdown', beginFire);
        document.addEventListener('mouseup', endFire);
        document.addEventListener('pointerup', endFire);
    }

    lock() {
        this.controls.lock();
    }

    consumeFrameFlags() {
        const flags = {
            justClicked: this.justClicked,
            reloadRequested: this.reloadRequested,
            weaponRequested: this.weaponRequested,
            jumpRequested: this.jumpRequested
        };
        this.justClicked = false;
        this.reloadRequested = false;
        this.weaponRequested = null;
        this.jumpRequested = false;
        return flags;
    }
}
