export class AudioManager {
    constructor() {
        this.context = null;
        this.master = null;
        this.enabled = false;
        this.ambientNodes = null;
        this.lastFootstep = 0;
    }

    unlock() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.context.createGain();
            this.master.gain.value = 0.42;
            this.master.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') this.context.resume();
        this.enabled = true;
        this.startBackground();
    }

    startBackground() {
        if (!this.enabled || this.ambientNodes) return;
        const wind = this.context.createOscillator();
        const hum = this.context.createOscillator();
        const windFilter = this.context.createBiquadFilter();
        const windGain = this.context.createGain();
        const humGain = this.context.createGain();
        wind.type = 'sawtooth';
        wind.frequency.value = 46;
        hum.type = 'triangle';
        hum.frequency.value = 88;
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 210;
        windGain.gain.value = 0.018;
        humGain.gain.value = 0.012;
        wind.connect(windFilter).connect(windGain).connect(this.master);
        hum.connect(humGain).connect(this.master);
        wind.start();
        hum.start();
        this.ambientNodes = [wind, hum, windGain, humGain];
    }

    noise(duration, gain, filterFrequency) {
        if (!this.enabled) return;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
        const source = this.context.createBufferSource();
        const filter = this.context.createBiquadFilter();
        const amp = this.context.createGain();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = filterFrequency;
        filter.Q.value = 1.8;
        amp.gain.setValueAtTime(gain, this.context.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        source.connect(filter).connect(amp).connect(this.master);
        source.start();
    }

    burst(duration, gain, type, frequency, rampTo = 90) {
        if (!this.enabled) return;
        const osc = this.context.createOscillator();
        const amp = this.context.createGain();
        const wave = this.context.createWaveShaper();
        wave.curve = new Float32Array([-1, -0.92, -0.35, 0, 0.35, 0.92, 1]);
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(rampTo, this.context.currentTime + duration);
        amp.gain.setValueAtTime(gain, this.context.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        osc.connect(wave).connect(amp).connect(this.master);
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    tone(frequency, duration, gain, type = 'sine') {
        if (!this.enabled) return;
        const osc = this.context.createOscillator();
        const amp = this.context.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        amp.gain.setValueAtTime(gain, this.context.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        osc.connect(amp).connect(this.master);
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    gunshot(weaponName) {
        const profile = {
            AK47: [0.145, 0.78, 1250, 95],
            M4A1: [0.115, 0.62, 1600, 120],
            M249: [0.12, 0.70, 1050, 85],
            Pistol: [0.095, 0.56, 2100, 150]
        }[weaponName] || [0.1, 0.5, 1200, 100];
        this.noise(0.018, profile[1] * 1.35, 3600);
        this.noise(profile[0], profile[1] * 0.72, profile[2]);
        this.burst(profile[0] * 0.75, 0.24, 'sawtooth', 190, profile[3]);
        setTimeout(() => this.noise(0.08, 0.13, 420), 24);
    }

    reload() {
        this.noise(0.045, 0.18, 1800);
        this.tone(260, 0.08, 0.18, 'square');
        setTimeout(() => this.noise(0.04, 0.16, 900), 160);
        setTimeout(() => this.tone(180, 0.08, 0.14, 'square'), 190);
        setTimeout(() => this.noise(0.055, 0.2, 2400), 420);
        setTimeout(() => this.tone(320, 0.05, 0.12, 'square'), 450);
    }

    empty() {
        this.tone(540, 0.04, 0.08, 'square');
    }

    hit() {
        this.noise(0.05, 0.16, 2400);
    }

    hurt() {
        this.tone(110, 0.16, 0.16, 'sawtooth');
    }

    enemyFire() {
        this.noise(0.018, 0.36, 2800);
        this.noise(0.09, 0.18, 720);
        this.burst(0.08, 0.08, 'sawtooth', 160, 80);
    }

    footstep(distance = 10) {
        if (!this.enabled) return;
        const now = this.context.currentTime;
        if (now - this.lastFootstep < 0.22) return;
        this.lastFootstep = now;
        const gain = Math.max(0.035, Math.min(0.16, 0.22 / Math.max(distance, 1)));
        this.noise(0.055, gain, 120);
        this.tone(72, 0.035, gain * 0.65, 'triangle');
    }

    ambient() {
        if (!this.enabled) return;
        this.noise(1.2, 0.018, 180);
    }
}
