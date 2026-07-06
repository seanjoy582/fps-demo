import { Weapon } from './weapon.js';

export class M249 extends Weapon {
    constructor() {
        super({
            name: 'M249',
            damage: 24,
            fireRate: 12,
            reloadTime: 4.3,
            magazine: 100,
            reserveAmmo: 200,
            recoil: 0.045,
            automatic: true
        });
    }
}
