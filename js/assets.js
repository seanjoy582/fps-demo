const TEXTURES = {
    sand: 'assets/textures/sand.svg',
    concrete: 'assets/textures/concrete.svg',
    metal: 'assets/textures/metal.svg',
    barrel: 'assets/textures/barrel.svg'
};

const IMAGES = {
    enemySoldier: 'assets/images/enemy-soldier.svg',
    muzzleFlash: 'assets/images/muzzle-flash.svg',
    rangeBackdrop: 'assets/images/range-backdrop.svg',
    AK47: 'assets/images/ak47.svg',
    M4A1: 'assets/images/m4a1.svg',
    M249: 'assets/images/m249.svg',
    Pistol: 'assets/images/pistol.svg',
    AK47View: 'assets/images/first-person-ak47.svg',
    M4A1View: 'assets/images/first-person-m4a1.svg',
    M249View: 'assets/images/first-person-m249.svg',
    PistolView: 'assets/images/first-person-pistol.svg'
};

export class AssetManager {
    constructor() {
        this.loader = new window.THREE.TextureLoader();
        this.textureCache = new Map();
        this.images = IMAGES;
    }

    texture(name, repeatX = 1, repeatY = 1) {
        const key = `${name}:${repeatX}:${repeatY}`;
        if (this.textureCache.has(key)) return this.textureCache.get(key);
        const texture = this.loader.load(TEXTURES[name] || IMAGES[name]);
        texture.colorSpace = window.THREE.SRGBColorSpace;
        texture.wrapS = window.THREE.RepeatWrapping;
        texture.wrapT = window.THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.anisotropy = 4;
        this.textureCache.set(key, texture);
        return texture;
    }

    image(name) {
        return IMAGES[name];
    }

    allPaths() {
        return [...Object.values(TEXTURES), ...Object.values(IMAGES)];
    }
}
