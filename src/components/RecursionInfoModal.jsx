import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function RecursionInfoModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recursion-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030807]/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[86vh] rounded-2xl border border-[#94d2bd]/18 bg-[#091815]/95 shadow-[0_28px_80px_rgba(0,0,0,0.68)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#94d2bd]/12 shrink-0">
          <div>
            <h2
              id="recursion-modal-title"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#edf5f1] tracking-tight"
            >
              How Recursion Maps to Rhythm
            </h2>
            <p className="text-xs sm:text-sm text-[#9cb5ac] mt-1">
              Translating the classic Tower of Hanoi call stack into procedural Daf frame-drum cycles
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-[#9cb5ac] hover:text-[#edf5f1] hover:bg-white/6 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sanctuary-scroll px-6 py-6 space-y-6 text-sm text-[#c7dcd4] leading-relaxed">
          {/* 1. Recursive Self-Similarity */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#edf5f1]">
              01. The Binary Ruler of Tower of Hanoi
            </h3>
            <p>
              Solving <span className="font-mono text-[#e2c07d]">hanoi(N, A, B, C)</span> requires
              exactly <span className="font-mono tabular-nums text-[#e2c07d]">2^N − 1</span> moves.
              Every step follows the recursive binary ruler sequence — moving disc{' '}
              <span className="font-mono text-[#edf5f1]">1, 2, 1, 3, 1, 2, 1, 4, 1, 2, 1, 3...</span>
            </p>
            <p className="text-[#9cb5ac]">
              Because smaller discs move twice as frequently as the disc directly beneath them, the
              algorithm naturally creates nested, meditative polyrhythmic phrases with exact
              palindrome symmetry around the center move of the largest disc.
            </p>
          </section>

          <div className="h-px bg-[#94d2bd]/10" />

          {/* 2. Daf Frame-Drum Voice Mapping */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#edf5f1]">
              02. Recursion Depth to Authentic Daf Articulations
            </h3>
            <p className="text-[#9cb5ac]">
              Every audio element is synthesized natively in real time via the Web Audio API using
              strictly percussive Daf drum acoustics and procedural nature ambience — zero melodic
              instruments or external samples.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl border border-[#e2c07d]/20 bg-[#e2c07d]/[0.04] p-3.5">
                <div className="font-mono text-xs text-[#e2c07d]">Base Levels · Largest Discs</div>
                <div className="text-sm font-semibold text-[#edf5f1] mt-1">Deep “Dum”</div>
                <p className="text-xs text-[#9cb5ac] mt-1.5 leading-relaxed">
                  Pitch-enveloped goatskin membrane thump (110Hz dropping to 55Hz) anchoring rare,
                  deep cycle transitions.
                </p>
              </div>

              <div className="rounded-xl border border-[#3eb489]/22 bg-[#3eb489]/[0.05] p-3.5">
                <div className="font-mono text-xs text-[#6ee7b7]">Mid Levels · Middle Discs</div>
                <div className="text-sm font-semibold text-[#edf5f1] mt-1">Crisp “Tak”</div>
                <p className="text-xs text-[#9cb5ac] mt-1.5 leading-relaxed">
                  Tight wooden-rim transient plus 800–1400Hz band-pass slap burst shaping the
                  rhythmic pulse.
                </p>
              </div>

              <div className="rounded-xl border border-[#b6eed9]/20 bg-white/[0.03] p-3.5">
                <div className="font-mono text-xs text-[#c7ece0]">Leaf Levels 1–2 · Smallest</div>
                <div className="text-sm font-semibold text-[#edf5f1] mt-1">Soft “Zinj”</div>
                <p className="text-xs text-[#9cb5ac] mt-1.5 leading-relaxed">
                  Delicate high-pass metallic ring shimmer echoing the brass rings inside a
                  traditional Daf frame.
                </p>
              </div>
            </div>
          </section>

          <div className="h-px bg-[#94d2bd]/10" />

          {/* 3. Spatial Architecture & Shortcuts */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-[#edf5f1]">
                03. Spatial Pillar Panning
              </h3>
              <p className="text-xs text-[#9cb5ac] leading-relaxed">
                Each landing pillar maps directly across the stereo field: Pillar{' '}
                <span className="font-mono text-[#edf5f1]">A</span> resonates in the Left ear,
                Pillar <span className="font-mono text-[#edf5f1]">B</span> anchors the Center, and
                Pillar <span className="font-mono text-[#edf5f1]">C</span> opens into the Right ear.
                With Loop Mode enabled, completed towers glide back seamlessly from C to A.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-[#edf5f1]">Keyboard Shortcuts</h3>
              <dl className="grid grid-cols-2 gap-y-2 text-xs">
                <dt className="font-mono text-[#e2c07d]">Space</dt>
                <dd className="text-[#9cb5ac]">Play / Pause</dd>
                <dt className="font-mono text-[#e2c07d]">→ Arrow</dt>
                <dd className="text-[#9cb5ac]">Step Forward</dd>
                <dt className="font-mono text-[#e2c07d]">R</dt>
                <dd className="text-[#9cb5ac]">Reset Recursion</dd>
                <dt className="font-mono text-[#e2c07d]">Z</dt>
                <dd className="text-[#9cb5ac]">Toggle Zen Mode</dd>
              </dl>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#94d2bd]/12 flex items-center justify-between text-xs text-[#88a59b] shrink-0">
          <span>100% Client-Side Web Audio &amp; HTML5 Canvas</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#e2c07d] text-[#081512] font-medium hover:bg-[#edd096] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c07d]/70"
          >
            Return to Sanctuary
          </button>
        </div>
      </div>
    </div>
  );
}
