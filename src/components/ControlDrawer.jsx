import { X, Repeat, Trees } from 'lucide-react';
import { PRESETS } from '../hanoi/presets';

export default function ControlDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onSelectPreset,
}) {
  const totalSteps = Math.pow(2, settings.numDiscs) - 1;
  const intervalMs = Math.round((60 / settings.tempo) * 1000);

  return (
    <aside
      aria-label="Recursion and Rhythm Parameters"
      className={`fixed top-20 right-4 sm:right-6 bottom-24 z-30 w-[calc(100vw-2rem)] sm:w-[344px] rounded-2xl border border-[#94d2bd]/15 bg-[#091714]/82 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.52)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col overflow-hidden ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-[112%] opacity-0 pointer-events-none'
      }`}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#94d2bd]/12 shrink-0">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#edf5f1] leading-none">
            Sanctuary Controls
          </h2>
          <p className="text-xs text-[#9cb5ac] mt-1">
            Recursion depth, Daf acoustics &amp; presets
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close controls drawer"
          className="h-9 w-9 rounded-lg flex items-center justify-center text-[#9cb5ac] hover:text-[#edf5f1] hover:bg-white/6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Parameter Body */}
      <div className="flex-1 overflow-y-auto sanctuary-scroll px-5 py-5 space-y-6">
        {/* 4 Relaxing Presets */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-xs font-medium text-[#c5dad2]">Soundscape Presets</h3>
            <span className="text-[11px] text-[#7f9c92]">One-click profiles</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PRESETS.map((preset) => {
              const active = settings.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`text-left px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60 ${
                    active
                      ? 'bg-[#16342c]/85 border-[#e2c07d]/45 text-[#edf5f1]'
                      : 'bg-white/[0.025] border-[#94d2bd]/10 text-[#b7cfc7] hover:bg-white/[0.055] hover:border-[#94d2bd]/22'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium leading-snug truncate">
                      {preset.name}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[#e2c07d] shrink-0">
                      {preset.numDiscs} discs · {preset.tempo} bpm
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8ca89f] mt-0.5 line-clamp-1">
                    {preset.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-[#94d2bd]/10" />

        {/* Recursion & Rhythm Sliders */}
        <section className="space-y-5">
          {/* Number of Discs (3 to 8) */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="slider-discs" className="text-xs font-medium text-[#d4e5de]">
                Number of Discs
              </label>
              <span className="font-mono text-xs tabular-nums text-[#e2c07d]">
                {settings.numDiscs} discs · {totalSteps} steps
              </span>
            </div>
            <input
              id="slider-discs"
              type="range"
              min={3}
              max={8}
              step={1}
              value={settings.numDiscs}
              onChange={(e) => onUpdateSetting('numDiscs', Number(e.target.value))}
              className="sanctuary-slider w-full"
            />
            <div className="flex justify-between font-mono text-[10px] tabular-nums text-[#769389] mt-1">
              <span>3 (7 steps)</span>
              <span>5 (31)</span>
              <span>8 (255 steps)</span>
            </div>
          </div>

          {/* Tempo (45 to 100 BPM) */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="slider-tempo" className="text-xs font-medium text-[#d4e5de]">
                Tempo / Step Interval
              </label>
              <span className="font-mono text-xs tabular-nums text-[#e2c07d]">
                {settings.tempo} BPM · {intervalMs} ms
              </span>
            </div>
            <input
              id="slider-tempo"
              type="range"
              min={45}
              max={100}
              step={1}
              value={settings.tempo}
              onChange={(e) => onUpdateSetting('tempo', Number(e.target.value))}
              className="sanctuary-slider w-full"
            />
            <div className="flex justify-between font-mono text-[10px] tabular-nums text-[#769389] mt-1">
              <span>45 BPM</span>
              <span>72 BPM</span>
              <span>100 BPM</span>
            </div>
          </div>

          {/* Spatial Spread (0% to 100%) */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="slider-spread" className="text-xs font-medium text-[#d4e5de]">
                Spatial Spread (Pillar Pan)
              </label>
              <span className="font-mono text-xs tabular-nums text-[#e2c07d]">
                {settings.spatialSpread}%
              </span>
            </div>
            <input
              id="slider-spread"
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.spatialSpread}
              onChange={(e) => onUpdateSetting('spatialSpread', Number(e.target.value))}
              className="sanctuary-slider w-full"
            />
            <div className="flex justify-between text-[10px] text-[#769389] mt-1">
              <span>Centered Mono</span>
              <span>A: Left · B: Center · C: Right</span>
            </div>
          </div>

          {/* Acoustic Resonance / Decay (0.2 to 0.9) */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="slider-resonance" className="text-xs font-medium text-[#d4e5de]">
                Acoustic Resonance / Decay
              </label>
              <span className="font-mono text-xs tabular-nums text-[#e2c07d]">
                {settings.resonance.toFixed(2)}
              </span>
            </div>
            <input
              id="slider-resonance"
              type="range"
              min={0.2}
              max={0.9}
              step={0.01}
              value={settings.resonance}
              onChange={(e) => onUpdateSetting('resonance', Number(e.target.value))}
              className="sanctuary-slider w-full"
            />
            <div className="flex justify-between text-[10px] text-[#769389] mt-1">
              <span>0.20 Dry Frame</span>
              <span>0.90 Courtyard Reverb</span>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#94d2bd]/10" />

        {/* Toggles: Loop Mode & Nature Ambience */}
        <section className="space-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={settings.loopMode}
            onClick={() => onUpdateSetting('loopMode', !settings.loopMode)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-[#94d2bd]/12 bg-white/[0.02] hover:bg-white/[0.045] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <div className="flex items-center gap-3 text-left">
              <Repeat className="w-4 h-4 text-[#e2c07d] shrink-0" />
              <div>
                <div className="text-xs font-medium text-[#e4f0eb]">Seamless Loop Mode</div>
                <div className="text-[11px] text-[#8aa59c]">
                  {settings.loopMode ? 'Reverses A↔C seamlessly forever' : 'Stops when tower completes'}
                </div>
              </div>
            </div>
            <span
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                settings.loopMode ? 'bg-[#3eb489]' : 'bg-[#213a34]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-[#f3f8f5] transition-transform duration-200 ${
                  settings.loopMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={settings.natureEnabled}
            onClick={() => onUpdateSetting('natureEnabled', !settings.natureEnabled)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-[#94d2bd]/12 bg-white/[0.02] hover:bg-white/[0.045] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <div className="flex items-center gap-3 text-left">
              <Trees className="w-4 h-4 text-[#6ee7b7] shrink-0" />
              <div>
                <div className="text-xs font-medium text-[#e4f0eb]">Nature Ambience Layer</div>
                <div className="text-[11px] text-[#8aa59c]">
                  {settings.natureEnabled
                    ? 'Procedural rain, breeze & droplets active'
                    : 'Muted — pure Daf frame drum only'}
                </div>
              </div>
            </div>
            <span
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                settings.natureEnabled ? 'bg-[#3eb489]' : 'bg-[#213a34]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-[#f3f8f5] transition-transform duration-200 ${
                  settings.natureEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </section>
      </div>
    </aside>
  );
}
