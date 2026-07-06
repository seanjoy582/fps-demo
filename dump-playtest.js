const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const root = __dirname;
const port = 5202;
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = path.join(os.tmpdir(), `fps-edge-dump-profile-${process.pid}`);

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
        const ext = path.extname(filePath);
        const type = ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.html' ? 'text/html' : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
        res.end(data);
    });
}

function extractReport(dom) {
    const match = dom.match(/<pre id="playtest-report"[^>]*data-pass="([^"]*)"[^>]*>([\s\S]*?)<\/pre>/);
    if (!match) throw new Error('Playtest report was not rendered');
    const json = match[2]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    return { pass: match[1] === 'true', report: JSON.parse(json) };
}

async function main() {
    if (!fs.existsSync(edgePath)) throw new Error(`Edge not found at ${edgePath}`);
    fs.rmSync(profile, { recursive: true, force: true });
    const server = http.createServer(serve);
    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

    try {
        const dom = execFileSync(edgePath, [
            '--headless=new',
            '--disable-extensions',
            '--disable-component-extensions-with-background-pages',
            '--disable-gpu-compositing',
            '--enable-unsafe-swiftshader',
            '--in-process-gpu',
            '--use-angle=swiftshader',
            '--use-gl=swiftshader',
            '--no-first-run',
            '--no-default-browser-check',
            `--user-data-dir=${profile}`,
            '--virtual-time-budget=8000',
            '--dump-dom',
            `http://127.0.0.1:${port}/index.html?playtest=1`
        ], { encoding: 'utf8', timeout: 30000 });

        const result = extractReport(dom);
        console.log(JSON.stringify(result.report, null, 2));
        if (!result.pass) throw new Error('One or more playtest checks failed');
        console.log('BROWSER PLAYTEST PASSED');
    } finally {
        server.close();
        fs.rmSync(profile, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(`BROWSER PLAYTEST FAILED: ${error.message}`);
    process.exit(1);
});
