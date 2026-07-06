import { Weapon } from './weapon.js';

export class M4A1 extends Weapon {
    constructor() {
        super({
            name: 'M4A1',
            damage: 28,
            fireRate: 11,
            reloadTime: 2.0,
            magazine: 30,
            reserveAmmo: 150,
            recoil: 0.024,
            automatic: true
        });
    }
}
