# Hanoi Soundscapes: Recursive Daf & Nature Sanctuary

**Event:** UIU Developers Hub — Hub's Quest • Epoch 1 (*Recursive Soundscapes*)  
**Category:** Solo Creative Coding & Generative Audio-Visual Web Application  
**Architecture:** 100% Client-Side (React, JavaScript, HTML5 Canvas, Tailwind CSS, Native Web Audio API)

---

## 1. Project Overview

**Hanoi Soundscapes: Recursive Daf & Nature Sanctuary** transforms the classic **Recursive Tower of Hanoi** algorithm into a meditative, studio-grade audio-visual instrument. Instead of relying on melodic instruments or external audio samples, every sound is synthesized procedurally in real time inside the browser using **100% percussive traditional Daf (frame drum) acoustics** paired with **procedural nature ambience** (gentle rainfall, slow-breathing wind breeze, and flowing water droplets).

Every recursive transition of `hanoi(n, source, auxiliary, target)` drives both a 60 FPS illuminated Zen sanctuary animation on HTML5 Canvas and a synchronized spatial Daf drum strike, turning pure mathematical recursion into an organic, deeply calming rhythmic cycle.

---

## 2. How Recursion Maps to Rhythm

### Classic Tower of Hanoi Decomposition
Solving a tower of $N$ discs requires exactly $2^N - 1$ recursive moves via:

```js
function hanoi(n, source, auxiliary, target, depth) {
  if (n <= 0) return;
  hanoi(n - 1, source, target, auxiliary, depth + 1);
  // Move disc n from source -> target (triggers synchronized visual glide + Daf strike)
  hanoi(n - 1, auxiliary, source, target, depth + 1);
}
```

This recursion naturally produces the **binary ruler sequence** (`1, 2, 1, 3, 1, 2, 1, 4, 1, 2, 1, 3...`), where smaller discs move twice as frequently as the disc beneath them. Without adding artificial music-theory hacks, the algorithm inherently generates nested, self-similar polyrhythmic cycles with exact palindrome symmetry around the movement of the largest disc.

### Recursion Depth → Authentic Daf Percussion Voices (100% Halal Audio)
No pianos, flutes, strings, or tonal synthesizer pads are used anywhere in the application. Every disc level maps directly to an authentic percussive Daf articulation synthesized via the native Web Audio API:

| Recursion Level | Disc Group | Daf Voice | Procedural Synthesis Method |
| :--- | :--- | :--- | :--- |
| **Base Levels** | Largest Discs | **Deep "Dum"** | Warm pitch-enveloped low sine/triangle drumhead thump (`110Hz → 55Hz`), soft low-pass palm impact transient, and subtle sympathetic inner-ring resonance |
| **Mid Levels** | Middle Discs | **Crisp "Tak"** | Filtered high-mid wooden-rim snap paired with a crisp `800Hz–1400Hz` band-pass goatskin slap burst |
| **Leaf Levels (1–2)** | Smallest Discs | **Soft "Zinj / Shimmer"** | Gentle, low-volume cascading high-pass & band-pass metallic shaker shimmer evoking the traditional brass rings (*halqeh*) inside a Daf frame |

### Spatial Pillar Panning & Courtyard Acoustics
- **Stereo Panning (`0%–100%`):** Landing on **Pillar A** pans smoothly to the **Left ear**, **Pillar B** anchors the **Center**, and **Pillar C** opens into the **Right ear** via `StereoPannerNode`.
- **Courtyard Reverb (`0.20–0.90`):** A procedurally generated stereo impulse response (`ConvolverNode`) with early stone-wall reflections and warm low-pass air absorption simulates an open-air twilight courtyard.
- **Procedural Nature Ambience:** Seamless crossfaded stereo pink-noise rainfall, slow LFO-swept brown-noise wind breeze with gentle stereo drift, and randomized non-tonal bandpass water droplets.

---

## 3. Key Features

- **60 FPS Illuminated HTML5 Canvas Sanctuary:**
  - Deep emerald-twilight backdrop (`#060d0c` to `#0e1f1c`) with courtyard pool reflections, floating golden-jade fireflies, and ambient rainfall scaled to the active soundscape.
  - Smooth 3-phase disc flight animation (**Lift → Parabolic Arc Glide → Settle**) with luminous trail motes and concentric golden-emerald ripple waves synchronized to the exact millisecond of Daf impact.
- **Live Recursive Call Stack & Depth Indicator:**
  - Real-time unboxed readout (`Depth: k | Disk #i: A → C · Step m / 2^N - 1 · Voice`) accompanied by a live call-stack breadcrumb (`hanoi(5, A→C) › hanoi(4, A→B) › ...`) so evaluators can trace the recursion frame-by-frame.
- **Four Curated One-Click Presets:**
  1. **Midnight Rain & Daf** (5 discs, 56 BPM, lush courtyard resonance, rain-forward ambience)
  2. **Desert Courtyard Rhythm** (6 discs, 68 BPM, crisp dry acoustics, warm night breeze & fireflies)
  3. **Forest Stream Meditation** (4 discs, 48 BPM, wide stereo spread, flowing water & droplets)
  4. **Deep Focus Pulse** (7 discs, 84 BPM, tight rhythmic frame drum for sustained concentration)
- **Collapsible Glassmorphic Control Drawer:**
  - Configurable **Number of Discs (`3–8`)**, **Tempo (`45–100 BPM`)**, **Spatial Spread (`0–100%`)**, **Acoustic Resonance / Decay (`0.20–0.90`)**, **Seamless Loop Mode** (reverses `A → C` and `C → A` seamlessly without jarring resets), and **Nature Ambience Toggle**.
  - All user settings persist automatically via browser `localStorage`.
- **Floating Bottom Transport Bar & Live Audio Export:**
  - **Play / Pause**, **Step Forward**, **Reset Recursion**, independent **Daf Volume** and **Nature Volume** mixers, and **Zen Mode** (hides all UI overlays for pure distraction-free meditation).
  - **Record & Download Audio:** Uses native `MediaRecorder` connected to a Web Audio `MediaStreamAudioDestinationNode` with a live recording timer (`MM:SS`) to capture both Daf percussion and nature ambience and download the composition directly to the user's device.
- **Evaluator Guide Modal:** Built-in *"How Recursion Maps to Rhythm"* modal explaining the algorithm, voice mapping, spatial panning, and keyboard shortcuts.

---

## 4. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `→` (Right Arrow) | Step Forward one recursive move |
| `R` | Reset Recursion to Step 0 |
| `Z` | Toggle Zen Mode |
| `Esc` | Exit Zen Mode or close info modal |

---

## 5. Tech Stack & Architecture

- **Frontend Framework:** React 19 (JavaScript / JSX) + Vite
- **Styling:** Tailwind CSS v4 + Lucide React Icons
- **Graphics Engine:** Native HTML5 2D Canvas API (`requestAnimationFrame` + DPR scaling)
- **Audio & Export Engine:** Native Web Audio API (`OscillatorNode`, `BiquadFilterNode`, `ConvolverNode`, `StereoPannerNode`, `DynamicsCompressorNode`, `MediaStreamAudioDestinationNode`) + `MediaRecorder`
- **Persistence:** Client-side `localStorage` (zero backend, zero database, zero external audio files)

### Directory Structure

```text
hanoi-soundscapes/
├── index.html                          # Entry HTML, metadata, and typography links
├── metadata.json                       # Application metadata
├── package.json                        # Dependencies and scripts
├── prompt.md                           # Complete AI prompt chain & ideation log
├── project_description.md              # Project documentation & architecture overview
└── src/
    ├── main.jsx                        # React root mount
    ├── index.css                       # Tailwind v4 imports & custom sanctuary slider styles
    ├── App.jsx                         # Main state orchestration, shortcuts, recording & telemetry
    ├── hanoi/
    │   ├── hanoiAlgorithm.js           # Recursive hanoi() engine, call stack & Daf voice mapping
    │   └── presets.js                  # 4 relaxing presets & localStorage persistence helpers
    ├── audio/
    │   └── dafEngine.js                # Procedural Daf (Dum/Tak/Zinj), reverb, nature & MediaRecorder
    └── components/
        ├── HanoiCanvas.jsx             # 60 FPS HTML5 Canvas sanctuary, pillars, discs & ripples
        ├── ControlDrawer.jsx           # Collapsible parameter & preset drawer
        ├── TransportBar.jsx            # Floating playback, volume mixers, record/export & Zen bar
        └── RecursionInfoModal.jsx      # "How Recursion Maps to Rhythm" evaluator modal
```

---

## 6. Running Locally

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build production bundle
npm run build
```
