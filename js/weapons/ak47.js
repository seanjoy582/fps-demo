import { Weapon } from './weapon.js';

export class AK47 extends Weapon {
    constructor() {
        super({
            name: 'AK47',
            damage: 34,
            fireRate: 9,
            reloadTime: 2.2,
            magazine: 30,
            reserveAmmo: 120,
            recoil: 0.035,
            automatic: true
        });
    }
}
