export function createMap(scene, collisionWorld, assets) {
    const THREE = window.THREE;
    const raycastTargets = [];
    const mats = {
        ground: new THREE.MeshStandardMaterial({ map: assets.texture('sand', 10, 10), color: 0xffdf9e, roughness: 0.95 }),
        wall: new THREE.MeshStandardMaterial({ map: assets.texture('concrete', 3, 1), roughness: 0.86 }),
        crate: new THREE.MeshStandardMaterial({ map: assets.texture('metal', 1, 1), color: 0x7b775d, roughness: 0.75 }),
        cover: new THREE.MeshStandardMaterial({ map: assets.texture('concrete', 2, 1), color: 0xaaa28f, roughness: 0.9 }),
        roof: new THREE.MeshStandardMaterial({ map: assets.texture('metal', 2, 1), color: 0x858a7c, roughness: 0.85 }),
        tire: new THREE.MeshStandardMaterial({ color: 0x0d0d0c, roughness: 0.95 }),
        barrel: new THREE.MeshStandardMaterial({ map: assets.texture('barrel', 1, 1), roughness: 0.72, metalness: 0.22 }),
        target: new THREE.MeshStandardMaterial({ color: 0xd6c28f, roughness: 0.7 })
    };

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mats.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const berm = new THREE.Mesh(
        new THREE.BoxGeometry(112, 14, 4),
        new THREE.MeshStandardMaterial({ map: assets.texture('sand', 8, 1), color: 0xd2a263, roughness: 0.96 })
    );
    berm.name = 'rear sand safety berm';
    berm.position.set(0, 7, -57.5);
    berm.castShadow = false;
    berm.receiveShadow = true;
    scene.add(berm);

    for (const x of [-42, -18, 8, 34]) {
        const targetWall = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.35), mats.target);
        targetWall.name = 'large range silhouette target';
        targetWall.position.set(x, 4.2, -54.8);
        targetWall.castShadow = true;
        scene.add(targetWall);
        raycastTargets.push(targetWall);
    }

    function box(name, size, pos, mat, solid = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
        mesh.name = name;
        mesh.position.set(...pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        raycastTargets.push(mesh);
        if (solid) collisionWorld.addBox(mesh);
        return mesh;
    }

    function barrel(pos) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.4, 24), mats.barrel);
        mesh.name = 'fuel barrel';
        mesh.position.set(...pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        raycastTargets.push(mesh);
        collisionWorld.addBox(mesh, 0.1);
        return mesh;
    }

    function tireStack(pos) {
        const group = new THREE.Group();
        group.name = 'tire stack';
        group.position.set(...pos);
        for (let i = 0; i < 4; i += 1) {
            const tire = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.32, 10, 28), mats.tire);
            tire.rotation.x = Math.PI / 2;
            tire.position.y = 0.35 + i * 0.48;
            tire.castShadow = true;
            tire.receiveShadow = true;
            group.add(tire);
        }
        scene.add(group);
        raycastTargets.push(group);
        collisionWorld.addBox(group, 0.1);
        return group;
    }

    function target(pos) {
        const stand = box('target stand', [0.18, 3, 0.18], [pos[0], 1.5, pos[2] + 0.1], mats.wall, false);
        const board = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.8, 0.12), mats.target);
        board.name = 'range target';
        board.position.set(pos[0], 2.8, pos[2]);
        board.castShadow = true;
        board.receiveShadow = true;
        scene.add(board);
        raycastTargets.push(board, stand);
        return board;
    }

    box('north wall', [120, 6, 2], [0, 3, -60], mats.wall);
    box('south wall', [120, 6, 2], [0, 3, 60], mats.wall);
    box('west wall', [2, 6, 120], [-60, 3, 0], mats.wall);
    box('east wall', [2, 6, 120], [60, 3, 0], mats.wall);

    for (const p of [[-24, 1.4, -12], [-18, 1.4, -12], [20, 1.4, 14], [26, 1.4, 14], [8, 1.4, -28]]) {
        box('ammo crate', [4, 2.8, 4], p, mats.crate);
    }

    for (const p of [[-8, 1, 18], [4, 1, 18], [16, 1, -8], [-34, 1, 24]]) {
        box('concrete cover', [8, 2, 1.5], p, mats.cover);
    }

    for (const p of [[-34, 1.2, 7], [-30, 1.2, 7], [34, 1.2, -18], [38, 1.2, -18], [10, 1.2, 34]]) barrel(p);
    for (const p of [[-44, 0, -8], [-14, 0, 32], [37, 0, 20], [22, 0, -35]]) tireStack(p);
    for (const p of [[-16, 0, -52], [0, 0, -52], [16, 0, -52], [32, 0, -52]]) target(p);

    for (const p of [[-18, 0.35, -38], [12, 0.3, -36], [31, 0.28, 7], [-42, 0.3, 14]]) {
        const mound = new THREE.Mesh(new THREE.SphereGeometry(5, 18, 8), mats.ground);
        mound.name = 'sand berm';
        mound.scale.set(1.6, 0.22, 0.7);
        mound.position.set(...p);
        mound.castShadow = false;
        mound.receiveShadow = true;
        scene.add(mound);
        raycastTargets.push(mound);
    }

    box('building back', [18, 7, 2], [-32, 3.5, -36], mats.wall);
    box('building left', [2, 7, 16], [-41, 3.5, -29], mats.wall);
    box('building right', [2, 7, 16], [-23, 3.5, -29], mats.wall);
    box('building roof', [20, 1, 18], [-32, 7.5, -29], mats.roof, false);

    return { raycastTargets };
}
