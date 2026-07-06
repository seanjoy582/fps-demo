export function createScene() {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd5e8);
    scene.fog = new THREE.Fog(0xbfd5e8, 55, 150);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xb89b6b, 2.35);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff2d0, 3.2);
    sun.position.set(28, 46, 26);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    scene.add(sun);

    return scene;
}
