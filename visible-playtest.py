import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
import random
import websocket

ROOT = os.path.dirname(os.path.abspath(__file__))
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = random.randint(10000, 16000)
URL = "http://127.0.0.1:5173/index.html"
OUT = os.path.join(ROOT, "output-playtest.png")


class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url.replace("localhost", "127.0.0.1"), timeout=8)
        self.next_id = 0

    def send(self, method, params=None):
        self.next_id += 1
        msg_id = self.next_id
        self.ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        while True:
            data = json.loads(self.ws.recv())
            if data.get("id") == msg_id:
                return data

    def eval(self, expression):
        result = self.send("Runtime.evaluate", {
            "expression": f"JSON.stringify({expression})",
            "returnByValue": True,
            "awaitPromise": True
        })
        if "exceptionDetails" in result:
            raise RuntimeError(json.dumps(result["exceptionDetails"], ensure_ascii=False))
        value = result["result"]["result"].get("value")
        return json.loads(value) if value else None

    def close(self):
        self.ws.close()


def wait_json(url, timeout=12):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception:
            time.sleep(0.15)
    raise TimeoutError(url)


def main():
    profile = tempfile.mkdtemp(prefix="fps-visible-playtest-")
    proc = subprocess.Popen([
        EDGE,
        "--new-window",
        "--disable-extensions",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-allow-origins=*",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={profile}",
        URL,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cdp = None
    try:
        tabs = wait_json(f"http://127.0.0.1:{PORT}/json")
        page = next((tab for tab in tabs if tab.get("type") == "page"), tabs[0])
        cdp = CDP(page["webSocketDebuggerUrl"])
        cdp.send("Runtime.enable")
        cdp.send("Page.enable")
        cdp.send("Page.bringToFront")
        cdp.send("Page.navigate", {"url": URL})
        time.sleep(3)
        for _ in range(40):
            ready = cdp.eval("""(() => Boolean(window.__fpsDemo && document.getElementById('startBtn')))()""")
            if ready:
                break
            time.sleep(0.15)

        initial = cdp.eval("""(() => ({
            hasThree: Boolean(window.THREE),
            hasDebug: Boolean(window.__fpsDemo),
            state: window.__fpsDemo && window.__fpsDemo.getState(),
            weaponArtDisplay: getComputedStyle(document.getElementById('weaponArt')).display,
            weaponArtSrc: document.getElementById('weaponArt').getAttribute('src')
        }))()""")

        click_result = cdp.eval("""(() => window.__fpsDemo.startForTest())()""")
        time.sleep(0.3)
        aim_result = cdp.eval("""(() => {
            document.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
            return {
                aimingClass: document.body.classList.contains('aiming'),
                scopeDisplay: getComputedStyle(document.getElementById('scopeOverlay')).display
            };
        })()""")
        time.sleep(0.3)
        cdp.eval("""(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
            return true;
        })()""")
        time.sleep(0.8)
        cdp.eval("""(() => {
            document.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
            document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3' }));
            document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit3' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
            document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
            return true;
        })()""")
        time.sleep(1.0)

        final = cdp.eval("""(() => {
            const state = window.__fpsDemo.getState();
            const weaponArt = document.getElementById('weaponArt');
            return {
                state,
                weaponArtDisplay: getComputedStyle(weaponArt).display,
                weaponArtRect: weaponArt.getBoundingClientRect().toJSON(),
                weaponArtSrc: weaponArt.getAttribute('src'),
                aimingClass: document.body.classList.contains('aiming'),
                scopeDisplay: getComputedStyle(document.getElementById('scopeOverlay')).display,
                canvases: document.querySelectorAll('canvas').length,
                enemies: state.enemyCount,
                bodyText: document.body.innerText
            };
        })()""")

        screenshot = cdp.send("Page.captureScreenshot", {"format": "png", "fromSurface": True})
        import base64
        with open(OUT, "wb") as f:
            f.write(base64.b64decode(screenshot["result"]["data"]))

        print(json.dumps({"initial": initial, "afterClick": click_result, "afterAim": aim_result, "final": final, "screenshot": OUT}, ensure_ascii=False, indent=2))
    finally:
        if cdp:
            cdp.close()
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
