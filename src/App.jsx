import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, BookOpen, Minimize2, Check } from 'lucide-react';
import HanoiCanvas from './components/HanoiCanvas';
import ControlDrawer from './components/ControlDrawer';
import TransportBar from './components/TransportBar';
import RecursionInfoModal from './components/RecursionInfoModal';
import {
  createInitialTowers,
  generateHanoiSequence,
  PILLAR_LABELS,
} from './hanoi/hanoiAlgorithm';
import { loadSavedSettings, PRESETS, saveSettings } from './hanoi/presets';
import { dafAudioEngine } from './audio/dafEngine';

export default function App() {
  const [settings, setSettings] = useState(() => loadSavedSettings());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Live recursion telemetry displayed in the sanctuary overlay
  const [liveMove, setLiveMove] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [direction, setDirection] = useState({ from: 0, to: 2 });

  // Live audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const recordTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Shared mutable animation engine ref read at 60 FPS by HanoiCanvas
  const engineStateRef = useRef(null);
  if (!engineStateRef.current) {
    const initialMoves = generateHanoiSequence(settings.numDiscs, 0, 2);
    engineStateRef.current = {
      towers: createInitialTowers(settings.numDiscs, 0),
      moves: initialMoves,
      currentStepIndex: 0,
      activeMove: null,
      isPlaying: false,
      pendingSingleStep: false,
      animatingSingleStep: false,
      sourcePillar: 0,
      targetPillar: 2,
    };
  }

  const totalSteps = useMemo(() => Math.pow(2, settings.numDiscs) - 1, [settings.numDiscs]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 4200);
  }, []);

  // Persist settings to localStorage & sync Web Audio engine smoothly
  useEffect(() => {
    saveSettings(settings);
    dafAudioEngine.updateSettings({
      dafVolume: settings.dafVolume,
      natureVolume: settings.natureVolume,
      natureEnabled: settings.natureEnabled,
      resonance: settings.resonance,
      spatialSpread: settings.spatialSpread,
      ambienceProfile: settings.ambienceProfile,
    });
  }, [settings]);

  // Clean up audio & timers on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      dafAudioEngine.dispose();
    };
  }, []);

  // Close drawer cleanly on narrow screens on initial load so pillars are never obscured
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsDrawerOpen(false);
    }
  }, []);

  const resetRecursion = useCallback((discCount = settingsRef.current.numDiscs, keepPlaying = false) => {
    const engine = engineStateRef.current;
    engine.towers = createInitialTowers(discCount, 0);
    engine.moves = generateHanoiSequence(discCount, 0, 2);
    engine.currentStepIndex = 0;
    engine.activeMove = null;
    engine.pendingSingleStep = false;
    engine.animatingSingleStep = false;
    engine.sourcePillar = 0;
    engine.targetPillar = 2;
    engine.isPlaying = keepPlaying;

    setDirection({ from: 0, to: 2 });
    setCompletedSteps(0);
    setLiveMove(null);
    if (!keepPlaying) {
      setIsPlaying(false);
    }
  }, []);

  const handleTogglePlay = useCallback(async () => {
    await dafAudioEngine.ensureReady();
    setHasInteracted(true);
    const engine = engineStateRef.current;

    if (engine.isPlaying) {
      engine.isPlaying = false;
      setIsPlaying(false);
      return;
    }

    // If sequence already finished and Loop Mode was off, reset cleanly before restarting
    if (!engine.activeMove && engine.currentStepIndex >= engine.moves.length) {
      resetRecursion(settingsRef.current.numDiscs, true);
      setIsPlaying(true);
      return;
    }

    engine.isPlaying = true;
    setIsPlaying(true);
  }, [resetRecursion]);

  const handleStepForward = useCallback(async () => {
    await dafAudioEngine.ensureReady();
    setHasInteracted(true);
    const engine = engineStateRef.current;

    // Pause continuous playback when stepping manually
    engine.isPlaying = false;
    setIsPlaying(false);

    // If an animation is already mid-flight, let it finish smoothly
    if (engine.activeMove) {
      engine.animatingSingleStep = true;
      return;
    }

    // If completed, seamlessly reverse direction when loopMode is active, else reset to A->C
    if (engine.currentStepIndex >= engine.moves.length) {
      if (settingsRef.current.loopMode) {
        const nextSource = engine.targetPillar;
        const nextTarget = engine.sourcePillar;
        engine.sourcePillar = nextSource;
        engine.targetPillar = nextTarget;
        engine.moves = generateHanoiSequence(settingsRef.current.numDiscs, nextSource, nextTarget);
        engine.currentStepIndex = 0;
        setDirection({ from: nextSource, to: nextTarget });
        setCompletedSteps(0);
      } else {
        resetRecursion(settingsRef.current.numDiscs, false);
      }
    }

    engine.pendingSingleStep = true;
    engine.animatingSingleStep = true;
  }, [resetRecursion]);

  const handleReset = useCallback(() => {
    resetRecursion(settingsRef.current.numDiscs, false);
  }, [resetRecursion]);

  const handleUpdateSetting = useCallback(
    (key, value) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'numDiscs' && value !== prev.numDiscs) {
          const currentlyPlaying = engineStateRef.current?.isPlaying ?? false;
          resetRecursion(value, currentlyPlaying);
        }
        return next;
      });
    },
    [resetRecursion]
  );

  const handleSelectPreset = useCallback(
    async (preset) => {
      await dafAudioEngine.ensureReady();
      setHasInteracted(true);
      const discsChanged = preset.numDiscs !== settingsRef.current.numDiscs;

      setSettings((prev) => ({
        ...prev,
        presetId: preset.id,
        numDiscs: preset.numDiscs,
        tempo: preset.tempo,
        spatialSpread: preset.spatialSpread,
        resonance: preset.resonance,
        loopMode: preset.loopMode,
        dafVolume: preset.dafVolume,
        natureVolume: preset.natureVolume,
        natureEnabled: preset.natureEnabled,
        ambienceProfile: { ...preset.ambienceProfile },
      }));

      if (discsChanged) {
        resetRecursion(preset.numDiscs, engineStateRef.current?.isPlaying ?? false);
      }
      showToast(`Preset loaded: ${preset.name}`);
    },
    [resetRecursion, showToast]
  );

  // Canvas callbacks synced with exact move lifecycle
  const handleMoveStarted = useCallback((move) => {
    setLiveMove(move);
  }, []);

  const handleMoveImpact = useCallback((move) => {
    dafAudioEngine.triggerDafStrike(move);
  }, []);

  const handleMoveCompleted = useCallback((_move, nextIndex) => {
    const engine = engineStateRef.current;
    setCompletedSteps(nextIndex);

    if (nextIndex >= engine.moves.length) {
      if (settingsRef.current.loopMode && engine.isPlaying) {
        // Seamlessly reverse Tower of Hanoi direction (A->C becomes C->A)
        const nextSource = engine.targetPillar;
        const nextTarget = engine.sourcePillar;
        engine.sourcePillar = nextSource;
        engine.targetPillar = nextTarget;
        engine.moves = generateHanoiSequence(settingsRef.current.numDiscs, nextSource, nextTarget);
        engine.currentStepIndex = 0;
        setDirection({ from: nextSource, to: nextTarget });
        setCompletedSteps(0);
      } else if (!settingsRef.current.loopMode) {
        engine.isPlaying = false;
        setIsPlaying(false);
      }
    }
  }, []);

  // Audio Export (MediaRecorder -> downloadable audio file)
  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      try {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setIsRecording(false);
        const { blob, extension } = await dafAudioEngine.stopRecording();
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `hanoi-soundscape-${settingsRef.current.presetId}-${timestamp}.${extension}`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);

        setRecordingSeconds(0);
        showToast(`Saved ${filename}`);
      } catch {
        setIsRecording(false);
        setRecordingSeconds(0);
        showToast('Unable to finalize audio recording in this browser.');
      }
      return;
    }

    try {
      await dafAudioEngine.startRecording();
      setHasInteracted(true);

      // Ensure composition is audible while recording if currently paused
      if (!engineStateRef.current.isPlaying) {
        if (engineStateRef.current.currentStepIndex >= engineStateRef.current.moves.length) {
          resetRecursion(settingsRef.current.numDiscs, true);
        } else {
          engineStateRef.current.isPlaying = true;
        }
        setIsPlaying(true);
      }

      setRecordingSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      showToast('Audio recording is not supported in this browser.');
    }
  }, [isRecording, resetRecursion, showToast]);

  // Global Keyboard Shortcuts: Space (Play/Pause), Z (Zen Mode), ArrowRight (Step), R (Reset)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isInfoOpen) return;
      const tag = e.target?.tagName;
      const isSlider = tag === 'INPUT' && e.target?.type === 'range';

      if (e.code === 'Space') {
        if (tag === 'BUTTON') return;
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'z' || e.key === 'Z') {
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setZenMode((prev) => !prev);
      } else if (e.key === 'ArrowRight' && !isSlider) {
        e.preventDefault();
        handleStepForward();
      } else if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleReset, handleStepForward, handleTogglePlay, isInfoOpen, zenMode]);

  const activePreset = PRESETS.find((p) => p.id === settings.presetId) || PRESETS[0];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#060d0c] text-[#edf5f1]">
      {/* Full-Viewport 60 FPS Zen Canvas */}
      <HanoiCanvas
        engineStateRef={engineStateRef}
        settings={settings}
        isDrawerOpen={isDrawerOpen}
        zenMode={zenMode}
        onMoveStarted={handleMoveStarted}
        onMoveImpact={handleMoveImpact}
        onMoveCompleted={handleMoveCompleted}
      />

      {/* Minimal Top Navigation Bar (Three-Zone Contract) */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 h-16 px-4 sm:px-7 flex items-center justify-between gap-6 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          zenMode
            ? 'opacity-0 -translate-y-4 pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        {/* Zone 1: Single-line Brand Wordmark */}
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#edf5f1] whitespace-nowrap shrink-0">
          Hanoi Soundscapes
        </h1>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav aria-label="Sanctuary navigation" className="hidden md:flex items-center gap-6 text-xs font-medium text-[#a9c2b9]">
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="hover:text-[#edf5f1] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-[#e2c07d]"
          >
            How Recursion Maps to Rhythm
          </button>
          <button
            type="button"
            onClick={() => setZenMode(true)}
            className="hover:text-[#edf5f1] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-[#e2c07d]"
          >
            Zen Mode
          </button>
        </nav>

        {/* Zone 3: Single Primary Utility Action (+ mobile info icon) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            aria-label="How Recursion Maps to Rhythm"
            className="md:hidden h-9 w-9 rounded-xl border border-[#94d2bd]/15 bg-[#091714]/70 backdrop-blur-xl text-[#c5dad2] hover:text-[#edf5f1] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen((o) => !o)}
            aria-expanded={isDrawerOpen}
            className={`h-9 px-3.5 rounded-xl border backdrop-blur-xl text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60 ${
              isDrawerOpen
                ? 'border-[#e2c07d]/45 bg-[#122b24]/85 text-[#f0d8a5]'
                : 'border-[#94d2bd]/18 bg-[#091714]/70 text-[#dcece5] hover:border-[#94d2bd]/32'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isDrawerOpen ? 'Hide Controls' : 'Controls'}</span>
          </button>
        </div>
      </header>

      {/* Subtle Live Recursive Call Stack & Depth Indicator */}
      <section
        aria-live="polite"
        aria-label="Live recursive call stack state"
        className={`fixed top-16 left-0 right-0 z-20 px-4 pointer-events-none transition-all duration-400 ${
          zenMode ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
        } ${isDrawerOpen ? 'lg:pr-[340px]' : ''}`}
      >
        <div className="max-w-3xl mx-auto text-center pt-1.5 sm:pt-3">
          {/* Primary Recursion Telemetry Line (Unboxed clean typography with tabular numerals) */}
          <div className="font-mono text-xs sm:text-sm tabular-nums text-[#dfeee8] flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
            {liveMove ? (
              <>
                <span className="text-[#e2c07d]">Depth: {liveMove.depth}</span>
                <span aria-hidden="true" className="text-[#5e7c72]">|</span>
                <span>
                  Disk #{liveMove.disk}: {liveMove.fromLabel} → {liveMove.toLabel}
                </span>
                <span aria-hidden="true" className="text-[#5e7c72]">·</span>
                <span className="text-[#9cb5ac]">
                  Step {Math.min(liveMove.step, totalSteps)} / {totalSteps}
                </span>
                <span aria-hidden="true" className="text-[#5e7c72]">·</span>
                <span className="text-[#7ee2b8]">{liveMove.voiceLabel}</span>
              </>
            ) : (
              <>
                <span className="text-[#e2c07d]">Depth: 0</span>
                <span aria-hidden="true" className="text-[#5e7c72]">|</span>
                <span>
                  Ready · {settings.numDiscs} Discs ({PILLAR_LABELS[direction.from]} →{' '}
                  {PILLAR_LABELS[direction.to]})
                </span>
                <span aria-hidden="true" className="text-[#5e7c72]">·</span>
                <span className="text-[#9cb5ac]">
                  Step {completedSteps} / {totalSteps}
                </span>
                <span aria-hidden="true" className="text-[#5e7c72]">·</span>
                <span className="text-[#9cb5ac]">{activePreset.name}</span>
              </>
            )}
          </div>

          {/* Live Call Stack Breadcrumb Ribbon */}
          <div className="mt-1.5 min-h-[18px] font-mono text-[11px] tabular-nums text-[#7e9c92] flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-2">
            {liveMove && liveMove.callStack?.length > 0 ? (
              liveMove.callStack.map((frame, idx) => {
                const isActiveLeaf = idx === liveMove.callStack.length - 1;
                return (
                  <span key={`${frame.n}-${frame.depth}`} className="inline-flex items-center gap-1.5">
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-[#4a685e]">
                        ›
                      </span>
                    )}
                    <span className={isActiveLeaf ? 'text-[#d2e8df]' : 'text-[#749187]'}>
                      {frame.label}
                    </span>
                  </span>
                );
              })
            ) : (
              <span className="text-[#718e84]">
                hanoi({settings.numDiscs}, {PILLAR_LABELS[direction.from]}→
                {PILLAR_LABELS[direction.to]}) — {totalSteps} recursive transitions
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Subtle First-Visit Start Prompt (Non-blocking, fades on first play/step) */}
      {!hasInteracted && !isPlaying && !zenMode && (
        <div
          className={`fixed bottom-28 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-300 ${
            isDrawerOpen ? 'lg:pr-[320px]' : ''
          }`}
        >
          <p className="text-xs text-[#a5bfb6] tracking-wide px-4 py-1.5 rounded-full bg-[#081512]/55 backdrop-blur-md">
            Press <span className="font-mono text-[#e2c07d]">Space</span> or{' '}
            <span className="text-[#edf5f1]">Play</span> to awaken the Daf &amp; nature sanctuary
          </p>
        </div>
      )}

      {/* Collapsible Glassmorphic Parameter Drawer */}
      <ControlDrawer
        isOpen={isDrawerOpen && !zenMode}
        onClose={() => setIsDrawerOpen(false)}
        settings={settings}
        onUpdateSetting={handleUpdateSetting}
        onSelectPreset={handleSelectPreset}
      />

      {/* Floating Bottom Transport Bar */}
      <TransportBar
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStepForward={handleStepForward}
        onReset={handleReset}
        dafVolume={settings.dafVolume}
        onDafVolumeChange={(v) => handleUpdateSetting('dafVolume', v)}
        natureVolume={settings.natureVolume}
        natureEnabled={settings.natureEnabled}
        onNatureVolumeChange={(v) => {
          handleUpdateSetting('natureVolume', v);
          if (v > 0 && !settings.natureEnabled) {
            handleUpdateSetting('natureEnabled', true);
          }
        }}
        onToggleNature={() => handleUpdateSetting('natureEnabled', !settings.natureEnabled)}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        onToggleRecord={handleToggleRecord}
        onEnterZen={() => setZenMode(true)}
        zenMode={zenMode}
      />

      {/* Whisper-Subtle Zen Mode Exit Button */}
      {zenMode && (
        <button
          type="button"
          onClick={() => setZenMode(false)}
          title="Exit Zen Mode (Z or Esc)"
          className="fixed bottom-5 right-5 z-40 h-10 px-3.5 rounded-xl border border-[#94d2bd]/18 bg-[#081613]/55 backdrop-blur-xl text-xs text-[#a8c4ba] hover:text-[#edf5f1] hover:bg-[#0c201b]/80 opacity-45 hover:opacity-100 focus-visible:opacity-100 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Zen (Z)</span>
        </button>
      )}

      {/* Toast Notification (Audio Download / Preset Feedback) */}
      {toastMessage && !zenMode && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl border border-[#e2c07d]/30 bg-[#0a1b17]/92 backdrop-blur-xl text-xs text-[#edf5f1] shadow-lg flex items-center gap-2"
        >
          <Check className="w-3.5 h-3.5 text-[#6ee7b7] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* "How Recursion Maps to Rhythm" Info Modal */}
      <RecursionInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}
