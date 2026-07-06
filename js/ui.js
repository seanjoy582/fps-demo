export class UI {
    constructor() {
        this.menu = document.getElementById('menu');
        this.hud = document.getElementById('hud');
        this.crosshair = document.getElementById('crosshair');
        this.gameOver = document.getElementById('gameOver');
        this.hp = document.getElementById('hp');
        this.ammoNow = document.getElementById('ammoNow');
        this.ammoMax = document.getElementById('ammoMax');
        this.weapon = document.getElementById('weapon');
        this.kill = document.getElementById('kill');
        this.fps = document.createElement('div');
        this.fps.id = 'fps';
        this.fps.style.cssText = 'font-size:22px;font-weight:bold;text-shadow:0 0 6px black;';
        this.hits = document.createElement('div');
        this.hits.id = 'hits';
        this.hits.style.cssText = 'font-size:22px;font-weight:bold;text-shadow:0 0 6px black;';
        this.hud.appendChild(this.fps);
        this.hud.appendChild(this.hits);

        this.weaponArt = document.createElement('img');
        this.weaponArt.id = 'weaponArt';
        this.weaponArt.alt = '';
        this.weaponArtPath = '';
        document.body.appendChild(this.weaponArt);

        this.scope = document.createElement('div');
        this.scope.id = 'scopeOverlay';
        document.body.appendChild(this.scope);
    }

    showGame() {
        this.menu.style.display = 'none';
        this.hud.style.display = 'block';
        this.crosshair.style.display = 'block';
        this.weaponArt.style.display = 'block';
    }

    setAiming(isAiming) {
        document.body.classList.toggle('aiming', isAiming);
        this.scope.style.display = isAiming ? 'block' : 'none';
    }

    update(player, weapon, kills, fps, weaponImage) {
        this.hp.textContent = Math.ceil(player.health);
        this.ammoNow.textContent = weapon.reloading ? '...' : weapon.ammo;
        this.ammoMax.textContent = weapon.reserveAmmo;
        this.weapon.textContent = weapon.name;
        this.kill.textContent = kills;
        this.fps.textContent = `FPS：${fps}`;
        this.hits.textContent = `HIT：${player.hitsTaken}/30`;
        if (weaponImage && this.weaponArtPath !== weaponImage) {
            this.weaponArtPath = weaponImage;
            this.weaponArt.src = weaponImage;
        }
        this.weaponArt.classList.toggle('weaponFlash', weapon.ammo < weapon.magazine);
    }

    end() {
        this.gameOver.style.display = 'flex';
    }
}
