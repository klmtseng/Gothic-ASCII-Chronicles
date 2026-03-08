export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private footstepTimer = 0;
  private isWalking = false;

  init() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAmbient() {
    if (!this.ctx || !this.masterGain || this.ambientOsc) return;

    // Deep low drone
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 38;
    this.ambientGain.gain.value = 0.04;

    // Filter for rumble
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;

    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientOsc.start();

    // Slow LFO modulation on drone pitch
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOsc.frequency);
    lfo.start();
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
  }

  // Procedural footstep sound
  playFootstep() {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.08);
    const source = this.ctx.createBufferSource();
    source.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 + Math.random() * 400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + 0.1);
  }

  updateFootsteps(walking: boolean, dt: number) {
    this.isWalking = walking;
    if (walking) {
      this.footstepTimer += dt;
      if (this.footstepTimer > 0.45) {
        this.playFootstep();
        this.footstepTimer = 0;
      }
    } else {
      this.footstepTimer = 0.3; // ready to play quickly on next walk
    }
  }

  playWhisper() {
    this.playFilteredNoise(1.5, 400, 1200, 0.08, 'bandpass');
  }

  playScream() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // High-pitched dissonant tone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.value = 800;
    osc2.frequency.value = 850;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 600;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  }

  playGrowl() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.linearRampToValueAtTime(30, now + 2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2);
  }

  playDrone() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Dissonant organ chord
    const freqs = [110, 138.6, 164.8, 220];
    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 4);
    }
  }

  playDamage() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Impact thud + noise burst
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // Noise component
    this.playFilteredNoise(0.15, 200, 600, 0.2, 'bandpass');
  }

  playPickup() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playDoorOpen() {
    this.playFilteredNoise(0.5, 100, 400, 0.15, 'bandpass');
  }

  playSound(type: string) {
    switch (type) {
      case 'whisper': this.playWhisper(); break;
      case 'scream': this.playScream(); break;
      case 'growl': this.playGrowl(); break;
      case 'drone': this.playDrone(); break;
    }
  }

  private playFilteredNoise(duration: number, freqLow: number, freqHigh: number, volume: number, filterType: BiquadFilterType) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noise = this.createNoiseBuffer(duration);
    const source = this.ctx.createBufferSource();
    source.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = (freqLow + freqHigh) / 2;
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + duration);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  destroy() {
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
