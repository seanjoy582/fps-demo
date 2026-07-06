export class Weapon {
    constructor({ name, damage, fireRate, reloadTime, magazine, reserveAmmo, recoil, automatic }) {
        this.name = name;
        this.damage = damage;
        this.fireRate = fireRate;
        this.reloadTime = reloadTime;
        this.magazine = magazine;
        this.ammo = magazine;
        this.reserveAmmo = reserveAmmo;
        this.recoil = recoil;
        this.automatic = automatic;
        this.lastShot = 0;
        this.reloading = false;
    }

    canShoot(time, triggerHeld) {
        if (this.reloading || this.ammo <= 0) return false;
        if (!this.automatic && triggerHeld) return false;
        return time - this.lastShot >= 1 / this.fireRate;
    }

    shoot(time) {
        this.ammo -= 1;
        this.lastShot = time;
    }

    reload(onDone) {
        if (this.reloading || this.ammo === this.magazine || this.reserveAmmo <= 0) return false;
        this.reloading = true;
        setTimeout(() => {
            const need = this.magazine - this.ammo;
            const loaded = Math.min(need, this.reserveAmmo);
            this.ammo += loaded;
            this.reserveAmmo -= loaded;
            this.reloading = false;
            if (onDone) onDone();
        }, this.reloadTime * 1000);
        return true;
    }
}
