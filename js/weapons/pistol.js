import { Weapon } from './weapon.js';

export class Pistol extends Weapon {
    constructor() {
        super({
            name: 'Pistol',
            damage: 42,
            fireRate: 4,
            reloadTime: 1.5,
            magazine: 15,
            reserveAmmo: 60,
            recoil: 0.02,
            automatic: false
        });
    }
}
