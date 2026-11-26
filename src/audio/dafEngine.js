/**
 * Procedural Daf (Frame Drum) & Nature Ambience Web Audio Engine
 * 100% Native Web Audio API — Zero external audio files, zero melodic/tonal instruments.
 * Strictly authentic procedural Daf percussion (Dum, Tak, Zinj) + soothing nature ambience
 * (pink-noise rain, LFO-modulated wind breeze, flowing water & soft droplets).
 */

class DafNatureAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    // Routing buses
    this.dafBus = null;
    this.dafDryGain = null;
    this.dafWetGain = null;
    this.reverbNode = null;
    this.natureBus = null;
    this.masterCompressor = null;
    this.masterGain = null;
    this.mediaStreamDest = null;

    // Procedural nature nodes
    this.rainGain = null;
    this.windGain = null;
    this.waterGain = null;
    this.natureSources = [];
    this.dropletTimer = null;

    // Reusable noise buffers
    this.whiteNoiseBuffer = null;
    this.pinkNoiseBuffer = null;
    this.brownNoiseBuffer = null;

    // State parameters
    this.dafVolume = 0.82;
    this.natureVolume = 0.62;
    this.natureEnabled = true;
    this.resonance = 0.72;
    this.spatialSpread = 82;
    this.ambienceProfile = {
      rain: 0.88,
      wind: 0.32,
      water: 0.35,
    };

    // MediaRecorder state
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingMimeType = 'audio/webm';
  }

  /**
   * Lazily initializes or resumes the AudioContext on user gesture.
   */
  async ensureReady() {
    if (!this.isInitialized) {
      this._init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  _init() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    const now = this.ctx.currentTime;

    // Create reusable noise buffers
    this.whiteNoiseBuffer = this._createWhiteNoiseBuffer(2.0);
    this.pinkNoiseBuffer = this._createSeamlessPinkNoiseBuffer(8.0);
    this.brownNoiseBuffer = this._createSeamlessBrownNoiseBuffer(8.0);

    // Master chain: warm gentle compressor -> masterGain -> speakers + recorder stream
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-14, now);
    this.masterCompressor.knee.setValueAtTime(18, now);
    this.masterCompressor.ratio.setValueAtTime(3.2, now);
    this.masterCompressor.attack.setValueAtTime(0.004, now);
    this.masterCompressor.release.setValueAtTime(0.18, now);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.92, now);

    this.mediaStreamDest = this.ctx.createMediaStreamDestination();

    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.mediaStreamDest);

    // Daf percussion bus with dry/wet courtyard reverb
    this.dafBus = this.ctx.createGain();
    this.dafBus.gain.setValueAtTime(this.dafVolume, now);

    this.dafDryGain = this.ctx.createGain();
    this.dafWetGain = this.ctx.createGain();

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this._createCourtyardImpulse(2.5);

    this.dafBus.connect(this.dafDryGain);
    this.dafBus.connect(this.reverbNode);
    this.reverbNode.connect(this.dafWetGain);

    this.dafDryGain.connect(this.masterCompressor);
    this.dafWetGain.connect(this.masterCompressor);

    // Nature ambience bus
    this.natureBus = this.ctx.createGain();
    const initialNatureGain = this.natureEnabled ? this.natureVolume * 0.45 : 0.0001;
    this.natureBus.gain.setValueAtTime(initialNatureGain, now);
    this.natureBus.connect(this.masterCompressor);

    this._setupNatureAmbience();
    this._applyResonance(now);
    this._applyAmbienceProfile(now);
    this._startDropletScheduler();

    this.isInitialized = true;
  }

  /**
   * Creates a mono white noise buffer for crisp percussion transients.
   */
  _createWhiteNoiseBuffer(durationSec) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Creates a seamless looping stereo pink-noise buffer (Paul Kellet algorithm)
   * with a smooth loop-boundary crossfade so rainfall never clicks.
   */
  _createSeamlessPinkNoiseBuffer(durationSec) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const fadeLen = Math.floor(sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const raw = new Float32Array(length + fadeLen);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < raw.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.095;
        b6 = white * 0.115926;
      }

      const out = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        out[i] = raw[i];
      }
      // Crossfade tail into beginning for a 100% seamless loop
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen;
        out[i] = out[i] * t + raw[length + i] * (1 - t);
      }
    }
    return buffer;
  }

  /**
   * Creates a seamless looping stereo brown-noise buffer for soft wind & flowing water.
   */
  _createSeamlessBrownNoiseBuffer(durationSec) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const fadeLen = Math.floor(sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const raw = new Float32Array(length + fadeLen);
      let lastOut = 0;
      for (let i = 0; i < raw.length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.024 * white) / 1.024;
        raw[i] = lastOut * 2.6;
      }
      const out = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        out[i] = raw[i];
      }
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen;
        out[i] = out[i] * t + raw[length + i] * (1 - t);
      }
    }
    return buffer;
  }

  /**
   * Synthesizes a warm, diffused open-air stone courtyard impulse response.
   * Gently low-pass smoothed so the Daf rings naturally without metallic harshness.
   */
  _createCourtyardImpulse(durationSec) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(2, length, sampleRate);

    // Distinct early stone-wall reflections (in seconds)
    const earlyTaps = [0.017, 0.029, 0.043, 0.061, 0.084, 0.112];

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lpState = 0;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Exponential decay envelope
        const env = Math.pow(1 - i / length, 2.8) * Math.exp(-t * 1.45);
        const white = Math.random() * 2 - 1;
        // Warm one-pole low-pass absorption (darker as tail decays)
        const alpha = Math.max(0.06, 0.34 - t * 0.11);
        lpState = lpState + alpha * (white - lpState);
        data[i] = lpState * env * 0.65;
      }

      // Inject subtle early reflections with slight stereo offset
      earlyTaps.forEach((tapSec, idx) => {
        const offsetSec = tapSec + (ch === 1 ? 0.0035 * (idx + 1) : 0);
        const sampleIdx = Math.floor(offsetSec * sampleRate);
        if (sampleIdx < length) {
          const amp = (0.28 / (idx + 1.2)) * (idx % 2 === 0 ? 1 : -1);
          data[sampleIdx] += amp;
          if (sampleIdx + 1 < length) data[sampleIdx + 1] += amp * 0.5;
        }
      });
    }

    return buffer;
  }

  /**
   * Builds the continuous procedural Nature Ambience network:
   * 1) Gentle Rainfall (filtered stereo pink noise)
   * 2) Soft Wind Breeze (slow LFO-swept bandpass brown noise + gentle pan drift)
   * 3) Flowing Forest Stream (soft modulated mid-low water bed)
   */
  _setupNatureAmbience() {
    const now = this.ctx.currentTime;

    // 1. Gentle Rainfall
    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = this.pinkNoiseBuffer;
    rainSource.loop = true;

    const rainHP = this.ctx.createBiquadFilter();
    rainHP.type = 'highpass';
    rainHP.frequency.setValueAtTime(240, now);

    const rainLP = this.ctx.createBiquadFilter();
    rainLP.type = 'lowpass';
    rainLP.frequency.setValueAtTime(2400, now);
    rainLP.Q.setValueAtTime(0.5, now);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.42, now);

    rainSource.connect(rainHP);
    rainHP.connect(rainLP);
    rainLP.connect(this.rainGain);
    this.rainGain.connect(this.natureBus);
    rainSource.start(now);
    this.natureSources.push(rainSource);

    // 2. Soft Wind Breeze with slow breathing LFO
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = this.brownNoiseBuffer;
    windSource.loop = true;

    const windBP = this.ctx.createBiquadFilter();
    windBP.type = 'bandpass';
    windBP.frequency.setValueAtTime(340, now);
    windBP.Q.setValueAtTime(1.45, now);

    const windLfo = this.ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.075, now); // ~13.3s slow breath cycle
    const windLfoDepth = this.ctx.createGain();
    windLfoDepth.gain.setValueAtTime(175, now);
    windLfo.connect(windLfoDepth);
    windLfoDepth.connect(windBP.frequency);

    const windPanner = this.ctx.createStereoPanner();
    const windPanLfo = this.ctx.createOscillator();
    windPanLfo.type = 'sine';
    windPanLfo.frequency.setValueAtTime(0.045, now);
    const windPanDepth = this.ctx.createGain();
    windPanDepth.gain.setValueAtTime(0.45, now);
    windPanLfo.connect(windPanDepth);
    windPanDepth.connect(windPanner.pan);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.35, now);

    windSource.connect(windBP);
    windBP.connect(windPanner);
    windPanner.connect(this.windGain);
    this.windGain.connect(this.natureBus);

    windSource.start(now);
    windLfo.start(now);
    windPanLfo.start(now);
    this.natureSources.push(windSource, windLfo, windPanLfo);

    // 3. Flowing Water Stream Bed
    const streamSource = this.ctx.createBufferSource();
    streamSource.buffer = this.pinkNoiseBuffer;
    streamSource.loop = true;
    // Offset loop start so it's decorrelated from rainfall
    streamSource.loopStart = 0;

    const streamBP = this.ctx.createBiquadFilter();
    streamBP.type = 'bandpass';
    streamBP.frequency.setValueAtTime(640, now);
    streamBP.Q.setValueAtTime(0.95, now);

    const streamLfo = this.ctx.createOscillator();
    streamLfo.type = 'sine';
    streamLfo.frequency.setValueAtTime(0.19, now);
    const streamLfoDepth = this.ctx.createGain();
    streamLfoDepth.gain.setValueAtTime(140, now);
    streamLfo.connect(streamLfoDepth);
    streamLfoDepth.connect(streamBP.frequency);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.28, now);

    streamSource.connect(streamBP);
    streamBP.connect(this.waterGain);
    this.waterGain.connect(this.natureBus);

    streamSource.start(now, 3.1);
    streamLfo.start(now);
    this.natureSources.push(streamSource, streamLfo);
  }

  /**
   * Schedules organic, non-tonal procedural water droplets (soft filtered fluid noise pips)
   * when nature ambience is enabled.
   */
  _startDropletScheduler() {
    if (this.dropletTimer) clearTimeout(this.dropletTimer);

    const scheduleNext = () => {
      const waterStrength = this.ambienceProfile?.water ?? 0.3;
      const baseDelay = Math.max(550, 2300 - waterStrength * 1450);
      const jitter = Math.random() * 1400;

      this.dropletTimer = window.setTimeout(() => {
        if (
          this.ctx &&
          this.ctx.state === 'running' &&
          this.natureEnabled &&
          this.natureVolume > 0.04 &&
          waterStrength > 0.18
        ) {
          this._triggerWaterDroplet(waterStrength);
        }
        scheduleNext();
      }, baseDelay + jitter);
    };

    scheduleNext();
  }

  /**
   * Synthesizes a single delicate fluid water-drop plip using purely bandpass-filtered noise
   * (zero oscillators / zero melodic notes).
   */
  _triggerWaterDroplet(waterStrength) {
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.whiteNoiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    const startFreq = 1050 + Math.random() * 650;
    bp.frequency.setValueAtTime(startFreq, now);
    bp.frequency.exponentialRampToValueAtTime(startFreq * 1.48, now + 0.032);
    bp.Q.setValueAtTime(11 + Math.random() * 4, now);

    const env = this.ctx.createGain();
    const peak = (0.045 + Math.random() * 0.05) * waterStrength;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.75, now);

    src.connect(bp);
    bp.connect(env);
    env.connect(panner);
    panner.connect(this.natureBus);
    // Tiny touch into courtyard reverb for serene depth
    panner.connect(this.reverbNode);

    src.start(now, Math.random() * 1.2, 0.06);
  }

  /**
   * Updates all audio parameters smoothly without clicks.
   */
  updateSettings({ dafVolume, natureVolume, natureEnabled, resonance, spatialSpread, ambienceProfile }) {
    if (typeof dafVolume === 'number') this.dafVolume = dafVolume;
    if (typeof natureVolume === 'number') this.natureVolume = natureVolume;
    if (typeof natureEnabled === 'boolean') this.natureEnabled = natureEnabled;
    if (typeof resonance === 'number') this.resonance = resonance;
    if (typeof spatialSpread === 'number') this.spatialSpread = spatialSpread;
    if (ambienceProfile) {
      this.ambienceProfile = { ...this.ambienceProfile, ...ambienceProfile };
    }

    if (!this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    this.dafBus.gain.setTargetAtTime(Math.max(0.0001, this.dafVolume), now, 0.04);

    const targetNature = this.natureEnabled ? Math.max(0.0001, this.natureVolume * 0.45) : 0.0001;
    this.natureBus.gain.setTargetAtTime(targetNature, now, 0.12);

    this._applyResonance(now);
    this._applyAmbienceProfile(now);
  }

  _applyResonance(now) {
    // Resonance (0.2 to 0.9) controls courtyard reverb send and dry/wet balance
    const wet = 0.08 + this.resonance * 0.58;
    const dry = 1.0 - this.resonance * 0.22;
    this.dafWetGain.gain.setTargetAtTime(wet, now, 0.08);
    this.dafDryGain.gain.setTargetAtTime(dry, now, 0.08);
  }

  _applyAmbienceProfile(now) {
    if (!this.rainGain || !this.windGain || !this.waterGain) return;
    const { rain = 0.7, wind = 0.35, water = 0.35 } = this.ambienceProfile;
    this.rainGain.gain.setTargetAtTime(rain * 0.62, now, 0.35);
    this.windGain.gain.setTargetAtTime(wind * 0.68, now, 0.35);
    this.waterGain.gain.setTargetAtTime(water * 0.56, now, 0.35);
  }

  /**
   * Triggers a single procedurally synthesized Daf strike mapped from a Hanoi move.
   *
   * @param {object} move - Move descriptor from generateHanoiSequence
   */
  triggerDafStrike(move) {
    if (!this.isInitialized || !this.ctx || this.ctx.state !== 'running') return;
    if (this.dafVolume <= 0.001) return;

    const now = this.ctx.currentTime;
    // Pillar stereo pan: A(0) -> -1, B(1) -> 0, C(2) -> +1
    const pillarSign = move.to === 0 ? -1 : move.to === 2 ? 1 : 0;
    const panAmount = pillarSign * (this.spatialSpread / 100);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(panAmount, now);
    panner.connect(this.dafBus);

    // Subtle organic humanization (±5% gain, slight pitch/filter warmth variance)
    const humanVel = 0.95 + Math.random() * 0.1;
    const sizeRatio = move.sizeRatio ?? 0.5;

    if (move.voice === 'dum') {
      this._synthDafDum(now, panner, sizeRatio, humanVel);
    } else if (move.voice === 'tak') {
      this._synthDafTak(now, panner, sizeRatio, humanVel);
    } else {
      this._synthDafZinj(now, panner, move.disk, humanVel);
    }
  }

  /**
   * Deep "Dum" — Largest discs (base recursion levels).
   * Warm pitch-enveloped low sine/triangle drum thump (110Hz -> 55Hz) with goatskin resonance.
   */
  _synthDafDum(now, destination, sizeRatio, velocity) {
    const decayTime = 0.32 + this.resonance * 0.68;
    // Larger disk sits slightly deeper in the drum skin (112Hz -> 55Hz to 104Hz -> 50Hz)
    const startFreq = 114 - sizeRatio * 8 + (Math.random() * 3 - 1.5);
    const endFreq = 57 - sizeRatio * 5;

    // 1. Primary drumhead fundamental (sine membrane pitch drop)
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(startFreq, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.115);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.linearRampToValueAtTime(0.92 * velocity, now + 0.0045);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + decayTime + 0.03);

    // 2. Warm goatskin harmonic body (filtered triangle)
    const skinOsc = this.ctx.createOscillator();
    skinOsc.type = 'triangle';
    skinOsc.frequency.setValueAtTime(startFreq * 1.52, now);
    skinOsc.frequency.exponentialRampToValueAtTime(endFreq * 1.48, now + 0.09);

    const skinLP = this.ctx.createBiquadFilter();
    skinLP.type = 'lowpass';
    skinLP.frequency.setValueAtTime(340, now);

    const skinGain = this.ctx.createGain();
    const skinDecay = 0.16 + this.resonance * 0.28;
    skinGain.gain.setValueAtTime(0.0001, now);
    skinGain.gain.linearRampToValueAtTime(0.24 * velocity, now + 0.004);
    skinGain.gain.exponentialRampToValueAtTime(0.0001, now + skinDecay);

    skinOsc.connect(skinLP);
    skinLP.connect(skinGain);
    skinGain.connect(destination);
    skinOsc.start(now);
    skinOsc.stop(now + skinDecay + 0.03);

    // 3. Soft thumb-on-skin impact puff
    const puffSrc = this.ctx.createBufferSource();
    puffSrc.buffer = this.whiteNoiseBuffer;
    const puffLP = this.ctx.createBiquadFilter();
    puffLP.type = 'lowpass';
    puffLP.frequency.setValueAtTime(380, now);

    const puffGain = this.ctx.createGain();
    puffGain.gain.setValueAtTime(0.0001, now);
    puffGain.gain.linearRampToValueAtTime(0.22 * velocity, now + 0.002);
    puffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    puffSrc.connect(puffLP);
    puffLP.connect(puffGain);
    puffGain.connect(destination);
    puffSrc.start(now, Math.random() * 1.2, 0.04);

    // 4. Subtle passive brass-ring sympathetic vibration inside the Daf frame
    const ringSrc = this.ctx.createBufferSource();
    ringSrc.buffer = this.whiteNoiseBuffer;
    const ringHP = this.ctx.createBiquadFilter();
    ringHP.type = 'highpass';
    ringHP.frequency.setValueAtTime(6400, now);

    const ringGain = this.ctx.createGain();
    ringGain.gain.setValueAtTime(0.0001, now);
    ringGain.gain.linearRampToValueAtTime(0.028 * velocity, now + 0.012);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

    ringSrc.connect(ringHP);
    ringHP.connect(ringGain);
    ringGain.connect(destination);
    ringSrc.start(now, Math.random() * 1.2, 0.11);
  }

  /**
   * Crisp "Tak" — Middle discs (mid recursion levels).
   * Filtered high-mid transient + short band-pass noise burst (800Hz–1400Hz) like a goatskin rim tap.
   */
  _synthDafTak(now, destination, sizeRatio, velocity) {
    const decayTime = 0.065 + this.resonance * 0.14;

    // 1. Crisp goatskin rim slap burst (800Hz - 1400Hz bandpass noise)
    const slapSrc = this.ctx.createBufferSource();
    slapSrc.buffer = this.whiteNoiseBuffer;

    const slapBP = this.ctx.createBiquadFilter();
    slapBP.type = 'bandpass';
    const centerFreq = 1340 - sizeRatio * 460 + (Math.random() * 70 - 35); // 880Hz - 1340Hz
    slapBP.frequency.setValueAtTime(centerFreq, now);
    slapBP.Q.setValueAtTime(2.3, now);

    const slapGain = this.ctx.createGain();
    slapGain.gain.setValueAtTime(0.0001, now);
    slapGain.gain.linearRampToValueAtTime(0.68 * velocity, now + 0.0018);
    slapGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    slapSrc.connect(slapBP);
    slapBP.connect(slapGain);
    slapGain.connect(destination);
    slapSrc.start(now, Math.random() * 1.2, decayTime + 0.02);

    // 2. High-mid wooden-rim / tight-edge percussive transient (strictly unpitched short snap)
    const rimOsc = this.ctx.createOscillator();
    rimOsc.type = 'triangle';
    const rimStart = 470 - sizeRatio * 90;
    rimOsc.frequency.setValueAtTime(rimStart, now);
    rimOsc.frequency.exponentialRampToValueAtTime(195, now + 0.022);

    const rimHP = this.ctx.createBiquadFilter();
    rimHP.type = 'highpass';
    rimHP.frequency.setValueAtTime(240, now);

    const rimGain = this.ctx.createGain();
    rimGain.gain.setValueAtTime(0.0001, now);
    rimGain.gain.linearRampToValueAtTime(0.32 * velocity, now + 0.0015);
    rimGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    rimOsc.connect(rimHP);
    rimHP.connect(rimGain);
    rimGain.connect(destination);
    rimOsc.start(now);
    rimOsc.stop(now + 0.06);

    // 3. Light brass ring rim-rattle accent
    const jingleSrc = this.ctx.createBufferSource();
    jingleSrc.buffer = this.whiteNoiseBuffer;
    const jingleBP = this.ctx.createBiquadFilter();
    jingleBP.type = 'bandpass';
    jingleBP.frequency.setValueAtTime(5400 + Math.random() * 450, now);
    jingleBP.Q.setValueAtTime(3.2, now);

    const jingleGain = this.ctx.createGain();
    jingleGain.gain.setValueAtTime(0.0001, now);
    jingleGain.gain.linearRampToValueAtTime(0.08 * velocity, now + 0.003);
    jingleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    jingleSrc.connect(jingleBP);
    jingleBP.connect(jingleGain);
    jingleGain.connect(destination);
    jingleSrc.start(now, Math.random() * 1.2, 0.08);
  }

  /**
   * Soft "Zinj / Shimmer" — Smallest discs (leaf recursion levels 1–2).
   * Gentle, low-volume high-pass filtered metallic jingle/shaker with delicate stereo shimmer.
   */
  _synthDafZinj(now, destination, disk, velocity) {
    const shimmerDecay = 0.085 + this.resonance * 0.16;
    // Disk 1 is airiest whisper; Disk 2 adds a slightly fuller soft skin brush
    const isDiskTwo = disk === 2;

    // Two gentle cascading micro-shimmers mimicking Daf inner rings settling
    const hits = [
      { delay: 0, gainScale: 1.0, freqShift: 0 },
      { delay: 0.024, gainScale: 0.45, freqShift: 850 },
    ];

    hits.forEach(({ delay, gainScale, freqShift }) => {
      const startTime = now + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.whiteNoiseBuffer;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(5600 + freqShift, startTime);

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime((isDiskTwo ? 6900 : 8100) + freqShift + Math.random() * 450, startTime);
      bp.Q.setValueAtTime(2.6, startTime);

      const env = this.ctx.createGain();
      const peak = (isDiskTwo ? 0.16 : 0.13) * gainScale * velocity;
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(peak, startTime + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + shimmerDecay);

      src.connect(hp);
      hp.connect(bp);
      bp.connect(env);
      env.connect(destination);

      src.start(startTime, Math.random() * 1.2, shimmerDecay + 0.03);
    });

    // For Disk 2, add a very subtle fingertip tap on the outer membrane so levels 1 and 2 feel distinct
    if (isDiskTwo) {
      const tapSrc = this.ctx.createBufferSource();
      tapSrc.buffer = this.whiteNoiseBuffer;
      const tapBP = this.ctx.createBiquadFilter();
      tapBP.type = 'bandpass';
      tapBP.frequency.setValueAtTime(1650 + Math.random() * 120, now);
      tapBP.Q.setValueAtTime(2.8, now);

      const tapEnv = this.ctx.createGain();
      tapEnv.gain.setValueAtTime(0.0001, now);
      tapEnv.gain.linearRampToValueAtTime(0.18 * velocity, now + 0.002);
      tapEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

      tapSrc.connect(tapBP);
      tapBP.connect(tapEnv);
      tapEnv.connect(destination);
      tapSrc.start(now, Math.random() * 1.2, 0.055);
    }
  }

  /**
   * Starts recording the live Web Audio output via MediaStreamDestination + MediaRecorder.
   */
  async startRecording() {
    await this.ensureReady();
    if (!this.mediaStreamDest || typeof window.MediaRecorder === 'undefined') {
      throw new Error('Audio recording is not supported in this browser.');
    }

    const candidateMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    const supportedMime =
      candidateMimeTypes.find((type) => window.MediaRecorder.isTypeSupported(type)) || '';

    this.recordedChunks = [];
    this.recordingMimeType = supportedMime || 'audio/webm';

    const options = supportedMime ? { mimeType: supportedMime } : undefined;
    this.mediaRecorder = new window.MediaRecorder(this.mediaStreamDest.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250);
    return true;
  }

  /**
   * Stops the active recording and resolves with the downloadable audio Blob + file extension.
   */
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording found.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || this.recordingMimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        let extension = 'webm';
        if (mimeType.includes('mp4')) extension = 'm4a';
        else if (mimeType.includes('ogg')) extension = 'ogg';

        this.recordedChunks = [];
        this.mediaRecorder = null;
        resolve({ blob, mimeType, extension });
      };

      this.mediaRecorder.onerror = (err) => {
        this.mediaRecorder = null;
        reject(err);
      };

      this.mediaRecorder.stop();
    });
  }

  dispose() {
    if (this.dropletTimer) {
      clearTimeout(this.dropletTimer);
      this.dropletTimer = null;
    }
    this.natureSources.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignore already-stopped nodes
      }
    });
    this.natureSources = [];
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const dafAudioEngine = new DafNatureAudioEngine();
