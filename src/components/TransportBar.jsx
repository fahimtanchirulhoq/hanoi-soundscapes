import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  CloudRain,
  Circle,
  Square,
  Maximize2,
} from 'lucide-react';

function formatRecordingTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function TransportBar({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  dafVolume,
  onDafVolumeChange,
  natureVolume,
  natureEnabled,
  onNatureVolumeChange,
  onToggleNature,
  isRecording,
  recordingSeconds,
  onToggleRecord,
  onEnterZen,
  zenMode,
}) {
  return (
    <div
      className={`fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-1.5rem)] max-w-[940px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        zenMode
          ? 'opacity-0 translate-y-6 pointer-events-none'
          : 'opacity-100 translate-y-0 pointer-events-auto'
      }`}
    >
      <div className="rounded-2xl border border-[#94d2bd]/15 bg-[#091714]/82 backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.5)] px-3.5 sm:px-5 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Playback Transport */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onTogglePlay}
            title="Play or Pause (Space)"
            className="h-10 px-4 rounded-xl bg-[#e2c07d] text-[#081512] hover:bg-[#edd096] active:scale-[0.98] font-medium text-xs flex items-center gap-2 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/70"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={onStepForward}
            title="Step Forward (Right Arrow)"
            aria-label="Step Forward"
            className="h-10 w-10 rounded-xl border border-[#94d2bd]/14 bg-white/[0.03] hover:bg-white/[0.08] text-[#d9ebe4] flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Reset Recursion (R)"
            aria-label="Reset Recursion"
            className="h-10 w-10 rounded-xl border border-[#94d2bd]/14 bg-white/[0.03] hover:bg-white/[0.08] text-[#d9ebe4] flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Daf & Nature Volume Mixers */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-center min-w-[240px]">
          {/* Daf Volume */}
          <div className="flex items-center gap-2.5 flex-1 max-w-[175px]">
            <button
              type="button"
              onClick={() => onDafVolumeChange(dafVolume > 0 ? 0 : 0.82)}
              aria-label={dafVolume > 0 ? 'Mute Daf' : 'Unmute Daf'}
              title="Daf Drum Volume"
              className="text-[#e2c07d] hover:text-[#f1d59c] transition-colors shrink-0 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
            >
              {dafVolume <= 0.01 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] text-[#9cb5ac] mb-0.5">
                <span className="whitespace-nowrap">Daf</span>
                <span className="font-mono tabular-nums">{Math.round(dafVolume * 100)}%</span>
              </div>
              <input
                type="range"
                aria-label="Daf Volume"
                min={0}
                max={1}
                step={0.01}
                value={dafVolume}
                onChange={(e) => onDafVolumeChange(Number(e.target.value))}
                className="sanctuary-slider w-full block"
              />
            </div>
          </div>

          {/* Nature Volume */}
          <div className="flex items-center gap-2.5 flex-1 max-w-[175px]">
            <button
              type="button"
              onClick={onToggleNature}
              aria-label={natureEnabled ? 'Disable Nature Ambience' : 'Enable Nature Ambience'}
              title="Toggle Nature Ambience"
              className={`transition-colors shrink-0 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60 ${
                natureEnabled && natureVolume > 0.01
                  ? 'text-[#6ee7b7] hover:text-[#9ff2d1]'
                  : 'text-[#6c867d] hover:text-[#9cb5ac]'
              }`}
            >
              <CloudRain className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] text-[#9cb5ac] mb-0.5">
                <span className="whitespace-nowrap">Nature</span>
                <span className="font-mono tabular-nums">
                  {natureEnabled ? `${Math.round(natureVolume * 100)}%` : 'Off'}
                </span>
              </div>
              <input
                type="range"
                aria-label="Nature Ambience Volume"
                min={0}
                max={1}
                step={0.01}
                value={natureEnabled ? natureVolume : 0}
                onChange={(e) => onNatureVolumeChange(Number(e.target.value))}
                className="sanctuary-slider w-full block"
              />
            </div>
          </div>
        </div>

        {/* Right: Record & Download Audio + Zen Mode */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleRecord}
            title={isRecording ? 'Stop Recording & Download Audio' : 'Record Live Composition & Download'}
            className={`h-10 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60 ${
              isRecording
                ? 'border-[#e07a5f]/60 bg-[#e07a5f]/18 text-[#fbdad0] hover:bg-[#e07a5f]/28'
                : 'border-[#94d2bd]/18 bg-white/[0.035] hover:bg-white/[0.08] text-[#e4f0eb]'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-[#f2967c]" />
                <span className="font-mono tabular-nums">
                  Stop · {formatRecordingTime(recordingSeconds)}
                </span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 fill-[#e07a5f] text-[#e07a5f]" />
                <span>Record &amp; Download</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onEnterZen}
            title="Zen Mode (Z)"
            className="h-10 px-3 rounded-xl border border-[#94d2bd]/14 bg-white/[0.03] hover:bg-white/[0.08] text-[#c5dad2] hover:text-[#edf5f1] text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
