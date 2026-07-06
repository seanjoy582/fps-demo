const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 5199;
const requiredFiles = [
    'index.html',
    'style.css',
    'js/main.js',
    'js/scene.js',
    'js/player.js',
    'js/input.js',
    'js/ui.js',
    'js/bullets.js',
    'js/enemy.js',
    'js/collision.js',
    'js/map.js',
    'js/effects.js',
    'js/weapons/weapon.js',
    'js/weapons/ak47.js',
    'js/weapons/m4a1.js',
    'js/weapons/m249.js',
    'js/weapons/pistol.js',
    'js/assets.js',
    'js/audio.js',
    'assets/images/enemy-soldier.svg',
    'assets/images/ak47.svg',
    'assets/images/m4a1.svg',
    'assets/images/m249.svg',
    'assets/images/pistol.svg',
    'assets/images/first-person-ak47.svg',
    'assets/images/first-person-m4a1.svg',
    'assets/images/first-person-m249.svg',
    'assets/images/first-person-pistol.svg',
    'assets/images/muzzle-flash.svg',
    'assets/images/range-backdrop.svg',
    'assets/textures/sand.svg',
    'assets/textures/concrete.svg',
    'assets/textures/metal.svg',
    'assets/textures/barrel.svg',
    'assets/ATTRIBUTION.md',
    'assets/audio/README.md'
];

function serve(req, res) {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const safePath = path.normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(root, safePath);
    if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
}

function get(file) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/${file}`, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`${file} returned ${res.statusCode}`));
                    return;
                }
                resolve(body);
            });
        }).on('error', reject);
    });
}

async function run() {
    const server = http.createServer(serve);
    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
    try {
        for (const file of requiredFiles) {
            const content = await get(file);
            if (!content.trim()) throw new Error(`${file} is empty`);
        }
        const html = await get('index.html');
        if (!html.includes('src="js/main.js"')) throw new Error('index.html does not load js/main.js');
        const input = await get('js/input.js');
        if (input.includes('PointerLockControls.js')) throw new Error('input.js still depends on external PointerLockControls');
        const main = await get('js/main.js');
        if (!main.includes('AudioManager') || !main.includes('AssetManager')) throw new Error('realistic asset/audio systems are not wired');
        console.log('SMOKE TEST PASSED');
    } finally {
        server.close();
    }
}

run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
