import { useEffect, useRef } from 'react';
import { PILLAR_LABELS } from '../hanoi/hanoiAlgorithm';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Returns refined translucent jade-emerald & warm sanctum-gold colors for each disc
 * based on its Daf voice and size ratio.
 */
function getDiscPalette(disk, numDiscs, voice) {
  const ratio = numDiscs > 1 ? (disk - 1) / (numDiscs - 1) : 1;

  if (voice === 'dum') {
    // Base recursion discs: deep warm amber-bronze gold infused with emerald shadow
    return {
      fillStart: 'rgba(214, 170, 96, 0.84)',
      fillMid: 'rgba(166, 126, 66, 0.72)',
      fillEnd: 'rgba(62, 114, 96, 0.78)',
      stroke: 'rgba(246, 219, 162, 0.68)',
      glow: 'rgba(226, 184, 108, 0.38)',
      ripple: [232, 192, 116],
    };
  }
  if (voice === 'tak') {
    // Mid recursion discs: luminous sanctuary emerald-jade with subtle gold sheen
    return {
      fillStart: 'rgba(72, 186, 146, 0.80)',
      fillMid: 'rgba(42, 142, 112, 0.70)',
      fillEnd: 'rgba(26, 98, 82, 0.78)',
      stroke: 'rgba(154, 238, 206, 0.60)',
      glow: 'rgba(66, 196, 152, 0.34)',
      ripple: [98, 218, 174],
    };
  }
  // Leaf discs (1-2, Soft Zinj): pale celadon pearl & luminous champagne mist
  const alphaBoost = 0.08 * (1 - ratio);
  return {
    fillStart: `rgba(182, 238, 218, ${0.78 + alphaBoost})`,
    fillMid: 'rgba(118, 202, 176, 0.68)',
    fillEnd: 'rgba(218, 198, 148, 0.70)',
    stroke: 'rgba(232, 250, 242, 0.76)',
    glow: 'rgba(170, 236, 214, 0.38)',
    ripple: [176, 236, 212],
  };
}

export default function HanoiCanvas({
  engineStateRef,
  settings,
  isDrawerOpen,
  zenMode,
  onMoveStarted,
  onMoveImpact,
  onMoveCompleted,
}) {
  const canvasRef = useRef(null);
  const settingsRef = useRef(settings);
  const layoutRef = useRef({ isDrawerOpen, zenMode });
  const callbacksRef = useRef({ onMoveStarted, onMoveImpact, onMoveCompleted });

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    layoutRef.current = { isDrawerOpen, zenMode };
  }, [isDrawerOpen, zenMode]);

  useEffect(() => {
    callbacksRef.current = { onMoveStarted, onMoveImpact, onMoveCompleted };
  }, [onMoveStarted, onMoveImpact, onMoveCompleted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Subtle atmospheric fireflies
    const fireflies = Array.from({ length: 36 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.78,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.5) * 9,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.1,
      radius: 1.1 + Math.random() * 1.9,
      warm: i % 3 !== 0,
    }));

    // Subtle ambient raindrops
    const raindrops = Array.from({ length: 68 }, () => ({
      x: Math.random() * (width + 200) - 100,
      y: Math.random() * height,
      len: 12 + Math.random() * 20,
      speed: 240 + Math.random() * 210,
      alpha: 0.08 + Math.random() * 0.14,
    }));

    // Water surface micro-ripples from rain
    const rainSplashes = [];
    // Disc landing golden-emerald ripple waves
    const impactRipples = [];
    // Soft glowing flight trail motes
    const trailMotes = [];
    // Pillar impact luminance glow (0..1)
    const pillarGlow = [0, 0, 0];

    let stageCenterShift = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const getStageGeometry = (currentShift) => {
      const usableW = Math.min(width * 0.86, 1020);
      const centerX = width * 0.5 + currentShift;
      const baseY = Math.min(height * 0.73, height - 148);
      const pillarHeight = Math.max(170, Math.min(height * 0.36, 310));
      const pillarSpacing = Math.max(115, Math.min(usableW / 3.05, 295));
      const pillarXs = [centerX - pillarSpacing, centerX, centerX + pillarSpacing];

      const numDiscs = settingsRef.current.numDiscs;
      const maxDiscW = Math.min(pillarSpacing * 0.84, 232);
      const minDiscW = Math.max(46, maxDiscW * 0.29);
      const discHeight = Math.max(15, Math.min((pillarHeight - 44) / Math.max(numDiscs, 5), 25));
      const discGap = 3.5;

      return {
        centerX,
        baseY,
        pillarHeight,
        pillarSpacing,
        pillarXs,
        maxDiscW,
        minDiscW,
        discHeight,
        discGap,
      };
    };

    const getDiscWidth = (disk, numDiscs, minW, maxW) => {
      if (numDiscs <= 1) return maxW;
      const t = (disk - 1) / (numDiscs - 1);
      return minW + t * (maxW - minW);
    };

    const getSlotY = (stackIndex, baseY, discHeight, discGap) => {
      return baseY - 12 - discHeight * 0.5 - stackIndex * (discHeight + discGap);
    };

    const drawRoundedRect = (x, y, w, h, r) => {
      const radius = Math.min(r, h * 0.5, w * 0.5);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const drawDisc = (cx, cy, w, h, disk, numDiscs, voice, liftFactor = 0, isReflection = false) => {
      const palette = getDiscPalette(disk, numDiscs, voice);
      const x = cx - w * 0.5;
      const y = cy - h * 0.5;
      const r = h * 0.46;

      ctx.save();
      if (isReflection) {
        ctx.globalAlpha = 0.14;
      }

      // Soft luminescent aura
      if (!isReflection) {
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 14 + liftFactor * 16;
      }

      // Translucent lacquer body gradient
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, palette.fillStart);
      grad.addColorStop(0.5, palette.fillMid);
      grad.addColorStop(1, palette.fillEnd);

      drawRoundedRect(x, y, w, h, r);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowBlur = 0;

      if (!isReflection) {
        // Upper beveled glass specular sheen
        const sheenGrad = ctx.createLinearGradient(cx, y, cx, y + h * 0.55);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        drawRoundedRect(x + 2, y + 1.5, w - 4, h * 0.48, r * 0.8);
        ctx.fillStyle = sheenGrad;
        ctx.fill();

        // Crisp translucent rim border
        drawRoundedRect(x, y, w, h, r);
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 1.1 + liftFactor * 0.5;
        ctx.stroke();

        // Minimalist center resonance notch
        ctx.beginPath();
        ctx.moveTo(cx - Math.min(10, w * 0.12), cy);
        ctx.lineTo(cx + Math.min(10, w * 0.12), cy);
        ctx.strokeStyle = 'rgba(244, 248, 244, 0.34)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    };

    const spawnImpactRipples = (x, y, disk, numDiscs, voice) => {
      const palette = getDiscPalette(disk, numDiscs, voice);
      const sizeScale = voice === 'dum' ? 1.32 : voice === 'tak' ? 1.0 : 0.78;
      const ringCount = voice === 'dum' ? 3 : 2;

      for (let i = 0; i < ringCount; i++) {
        impactRipples.push({
          x,
          y,
          radius: 14 + i * 10,
          maxRadius: (105 + i * 38) * sizeScale,
          alpha: (0.68 - i * 0.16) * (voice === 'zinj' ? 0.8 : 1),
          speed: (105 + i * 24) * (0.9 + sizeScale * 0.12),
          rgb: palette.ripple,
          lineWidth: voice === 'dum' ? 2.1 - i * 0.45 : 1.5 - i * 0.35,
          delay: i * 0.065,
        });
      }
    };

    const renderFrame = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const engine = engineStateRef.current;
      const curSettings = settingsRef.current;
      const { isDrawerOpen: drawerOpen, zenMode: inZen } = layoutRef.current;

      // Smooth horizontal shift when control drawer opens on wide screens
      const targetShift = !inZen && drawerOpen && width >= 1024 ? -160 : 0;
      stageCenterShift += (targetShift - stageCenterShift) * Math.min(1, dt * 8);

      const geo = getStageGeometry(stageCenterShift);

      // --- 1. Advance Recursive Animation State Machine ---
      const stepDurationSec = 60 / Math.max(45, Math.min(100, curSettings.tempo));

      // Launch next move if playing or a single step was requested
      if (!engine.activeMove && (engine.isPlaying || engine.pendingSingleStep)) {
        if (engine.currentStepIndex < engine.moves.length) {
          const nextMove = engine.moves[engine.currentStepIndex];
          // Remove disc from source pillar into active airborne state
          const sourceStack = engine.towers[nextMove.from];
          const poppedDisk = sourceStack.pop();
          if (poppedDisk !== undefined) {
            const fromSlot = sourceStack.length;
            const toSlot = engine.towers[nextMove.to].length;
            engine.activeMove = {
              move: nextMove,
              fromSlot,
              toSlot,
              progress: 0,
              impactFired: false,
            };
            engine.pendingSingleStep = false;
            callbacksRef.current.onMoveStarted?.(nextMove);
          }
        } else {
          engine.pendingSingleStep = false;
        }
      }

      // Advance active airborne disc
      if (engine.activeMove && (engine.isPlaying || engine.animatingSingleStep)) {
        const am = engine.activeMove;
        am.progress += dt / stepDurationSec;

        // Fire Daf percussion & golden-emerald ripple wave on exact touch-down impact
        if (!am.impactFired && am.progress >= 0.93) {
          am.impactFired = true;
          const landX = geo.pillarXs[am.move.to];
          const landY = getSlotY(am.toSlot, geo.baseY, geo.discHeight, geo.discGap);
          pillarGlow[am.move.to] = Math.min(1, pillarGlow[am.move.to] + (am.move.voice === 'dum' ? 1.0 : 0.72));
          spawnImpactRipples(landX, landY, am.move.disk, curSettings.numDiscs, am.move.voice);
          callbacksRef.current.onMoveImpact?.(am.move);
        }

        if (am.progress >= 1) {
          // Commit landed disc to destination stack
          engine.towers[am.move.to].push(am.move.disk);
          const finishedMove = am.move;
          engine.activeMove = null;
          engine.currentStepIndex += 1;
          engine.animatingSingleStep = false;
          callbacksRef.current.onMoveCompleted?.(finishedMove, engine.currentStepIndex);
        }
      }

      // Decay pillar glow smoothly
      for (let i = 0; i < 3; i++) {
        pillarGlow[i] = Math.max(0, pillarGlow[i] - dt * 1.25);
      }

      // --- 2. Paint Deep Emerald-Twilight Sanctuary Background ---
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#060d0c');
      bgGrad.addColorStop(0.54, '#0a1816');
      bgGrad.addColorStop(0.75, '#0e1f1c');
      bgGrad.addColorStop(1, '#050b0a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft nocturnal sanctuary glow behind the pillars
      const auraGrad = ctx.createRadialGradient(
        geo.centerX,
        geo.baseY - geo.pillarHeight * 0.52,
        10,
        geo.centerX,
        geo.baseY - geo.pillarHeight * 0.42,
        Math.max(width, height) * 0.48
      );
      auraGrad.addColorStop(0, 'rgba(46, 134, 108, 0.14)');
      auraGrad.addColorStop(0.45, 'rgba(24, 72, 60, 0.07)');
      auraGrad.addColorStop(1, 'rgba(6, 13, 12, 0)');
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle architectural horizon glow separating sky & dark reflecting courtyard pool
      const poolTop = geo.baseY + 12;
      const poolGrad = ctx.createLinearGradient(0, poolTop, 0, height);
      poolGrad.addColorStop(0, 'rgba(14, 34, 30, 0.52)');
      poolGrad.addColorStop(0.3, 'rgba(7, 17, 15, 0.72)');
      poolGrad.addColorStop(1, 'rgba(4, 9, 8, 0.96)');
      ctx.fillStyle = poolGrad;
      ctx.fillRect(0, poolTop, width, height - poolTop);

      // Hairline water horizon shimmer
      const horizonGrad = ctx.createLinearGradient(
        geo.centerX - geo.pillarSpacing * 1.7,
        poolTop,
        geo.centerX + geo.pillarSpacing * 1.7,
        poolTop
      );
      horizonGrad.addColorStop(0, 'rgba(130, 200, 176, 0)');
      horizonGrad.addColorStop(0.5, 'rgba(218, 192, 134, 0.20)');
      horizonGrad.addColorStop(1, 'rgba(130, 200, 176, 0)');
      ctx.strokeStyle = horizonGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(geo.centerX - geo.pillarSpacing * 1.7, poolTop);
      ctx.lineTo(geo.centerX + geo.pillarSpacing * 1.7, poolTop);
      ctx.stroke();

      // --- 3. Render Ambient Raindrops (scaled to preset & nature volume) ---
      const rainIntensity = curSettings.natureEnabled
        ? curSettings.natureVolume * (curSettings.ambienceProfile?.rainDensity ?? 0.65)
        : 0.08;
      const activeRainCount = Math.floor(raindrops.length * Math.min(1, rainIntensity * 1.15));

      if (activeRainCount > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < activeRainCount; i++) {
          const drop = raindrops[i];
          drop.y += drop.speed * dt;
          drop.x -= drop.speed * 0.14 * dt;

          if (drop.y > poolTop + 40) {
            // Occasionally spawn a delicate raindrop ripple on the courtyard pool
            if (Math.random() < 0.22 && rainSplashes.length < 24) {
              rainSplashes.push({
                x: drop.x,
                y: poolTop + 8 + Math.random() * Math.max(20, (height - poolTop) * 0.55),
                r: 2,
                maxR: 16 + Math.random() * 14,
                alpha: 0.24 * rainIntensity,
              });
            }
            drop.y = -20 - Math.random() * 120;
            drop.x = Math.random() * (width + 240) - 60;
          }

          ctx.strokeStyle = `rgba(176, 226, 210, ${drop.alpha * Math.max(0.25, rainIntensity)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.len * 0.14, drop.y - drop.len);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Render rain pool micro-ripples
      for (let i = rainSplashes.length - 1; i >= 0; i--) {
        const s = rainSplashes[i];
        s.r += dt * 26;
        const life = 1 - s.r / s.maxR;
        if (life <= 0) {
          rainSplashes.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = `rgba(164, 224, 204, ${s.alpha * life})`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r, s.r * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // --- 4. Render Floating Fireflies ---
      const fireflyFactor = curSettings.ambienceProfile?.fireflyDensity ?? 0.7;
      const visibleFireflies = Math.max(10, Math.floor(fireflies.length * (0.35 + fireflyFactor * 0.65)));

      for (let i = 0; i < visibleFireflies; i++) {
        const f = fireflies[i];
        f.phase += dt * f.speed;
        f.x += (f.vx + Math.sin(f.phase * 0.7) * 8) * dt;
        f.y += (f.vy + Math.cos(f.phase * 0.5) * 6) * dt;

        if (f.x < -30) f.x = width + 30;
        if (f.x > width + 30) f.x = -30;
        if (f.y < 30) f.y = poolTop - 40;
        if (f.y > poolTop - 20) f.y = 40;

        const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f.phase));
        const rgb = f.warm ? '234, 200, 128' : '126, 226, 188';

        const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 5.2);
        glow.addColorStop(0, `rgba(${rgb}, ${0.58 * twinkle})`);
        glow.addColorStop(0.45, `rgba(${rgb}, ${0.18 * twinkle})`);
        glow.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 5.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 250, 232, ${0.85 * twinkle})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 5. Render Minimalist Glowing Zen Pillars & Plinths ---
      const pillarWidth = 10;
      const plinthW = geo.maxDiscW * 1.12;
      const panTags = ['L', 'C', 'R'];

      for (let i = 0; i < 3; i++) {
        const px = geo.pillarXs[i];
        const glowAmt = pillarGlow[i];
        const topY = geo.baseY - geo.pillarHeight;

        // Vertical atmospheric light column behind active pillar
        if (glowAmt > 0.01) {
          const colGrad = ctx.createLinearGradient(px, topY - 40, px, geo.baseY);
          colGrad.addColorStop(0, 'rgba(226, 192, 125, 0)');
          colGrad.addColorStop(0.55, `rgba(98, 212, 172, ${0.15 * glowAmt})`);
          colGrad.addColorStop(1, `rgba(226, 192, 125, ${0.24 * glowAmt})`);
          ctx.fillStyle = colGrad;
          ctx.fillRect(px - 28, topY - 40, 56, geo.pillarHeight + 40);
        }

        // Reflection of pillar in courtyard pool
        const reflGrad = ctx.createLinearGradient(px, poolTop, px, poolTop + 92);
        reflGrad.addColorStop(0, `rgba(94, 186, 154, ${0.16 + glowAmt * 0.16})`);
        reflGrad.addColorStop(1, 'rgba(6, 13, 12, 0)');
        ctx.fillStyle = reflGrad;
        ctx.fillRect(px - pillarWidth * 0.42, poolTop + 2, pillarWidth * 0.84, 90);

        // Main Zen pillar shaft
        const shaftGrad = ctx.createLinearGradient(px - pillarWidth * 0.5, topY, px + pillarWidth * 0.5, geo.baseY);
        shaftGrad.addColorStop(0, `rgba(226, 196, 134, ${0.38 + glowAmt * 0.45})`);
        shaftGrad.addColorStop(0.35, `rgba(76, 168, 138, ${0.34 + glowAmt * 0.35})`);
        shaftGrad.addColorStop(1, `rgba(22, 62, 54, ${0.65 + glowAmt * 0.25})`);

        drawRoundedRect(px - pillarWidth * 0.5, topY, pillarWidth, geo.pillarHeight - 6, 5);
        ctx.fillStyle = shaftGrad;
        ctx.fill();

        // Inner luminous filament
        ctx.strokeStyle = `rgba(232, 246, 238, ${0.22 + glowAmt * 0.52})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, topY + 6);
        ctx.lineTo(px, geo.baseY - 12);
        ctx.stroke();

        // Golden finial bead at pillar crown
        ctx.save();
        ctx.shadowColor = `rgba(226, 192, 125, ${0.45 + glowAmt * 0.5})`;
        ctx.shadowBlur = 10 + glowAmt * 12;
        ctx.fillStyle = `rgba(236, 206, 146, ${0.72 + glowAmt * 0.28})`;
        ctx.beginPath();
        ctx.arc(px, topY, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Serene stone plinth base
        const plinthGrad = ctx.createLinearGradient(px - plinthW * 0.5, geo.baseY - 10, px + plinthW * 0.5, geo.baseY + 6);
        plinthGrad.addColorStop(0, 'rgba(30, 62, 56, 0.24)');
        plinthGrad.addColorStop(0.5, `rgba(56, 114, 98, ${0.46 + glowAmt * 0.22})`);
        plinthGrad.addColorStop(1, 'rgba(30, 62, 56, 0.24)');

        drawRoundedRect(px - plinthW * 0.5, geo.baseY - 10, plinthW, 12, 6);
        ctx.fillStyle = plinthGrad;
        ctx.fill();

        ctx.strokeStyle = `rgba(218, 192, 134, ${0.22 + glowAmt * 0.35})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Subtle Pillar Label (A / B / C) + stereo spatial cue
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '500 12px "IBM Plex Mono", monospace';
        ctx.fillStyle = `rgba(214, 232, 224, ${0.62 + glowAmt * 0.34})`;
        const panHint = curSettings.spatialSpread > 0 ? ` · ${panTags[i]}` : '';
        ctx.fillText(`${PILLAR_LABELS[i]}${panHint}`, px, geo.baseY + 28);
        ctx.restore();
      }

      // --- 6. Render Stacked Discs & Soft Reflections ---
      for (let p = 0; p < 3; p++) {
        const stack = engine.towers[p];
        const px = geo.pillarXs[p];
        for (let s = 0; s < stack.length; s++) {
          const disk = stack[s];
          const w = getDiscWidth(disk, curSettings.numDiscs, geo.minDiscW, geo.maxDiscW);
          const cy = getSlotY(s, geo.baseY, geo.discHeight, geo.discGap);
          const voice =
            curSettings.numDiscs <= 3
              ? disk === curSettings.numDiscs
                ? 'dum'
                : disk === 2
                  ? 'tak'
                  : 'zinj'
              : curSettings.numDiscs === 4
                ? disk === 4
                  ? 'dum'
                  : disk === 3
                    ? 'tak'
                    : 'zinj'
                : disk <= 2
                  ? 'zinj'
                  : disk >= (curSettings.numDiscs >= 6 ? curSettings.numDiscs - 1 : curSettings.numDiscs)
                    ? 'dum'
                    : 'tak';

          // Soft pool reflection for bottom 3 discs
          if (s < 3) {
            const reflY = poolTop + 14 + s * (geo.discHeight * 0.65);
            drawDisc(px, reflY, w * 0.94, geo.discHeight * 0.55, disk, curSettings.numDiscs, voice, 0, true);
          }

          drawDisc(px, cy, w, geo.discHeight, disk, curSettings.numDiscs, voice, 0, false);
        }
      }

      // --- 7. Render Active Gliding Disc & Motion Trail Motes ---
      if (engine.activeMove) {
        const am = engine.activeMove;
        const p = Math.max(0, Math.min(1, am.progress));
        const startX = geo.pillarXs[am.move.from];
        const endX = geo.pillarXs[am.move.to];
        const startY = getSlotY(am.fromSlot, geo.baseY, geo.discHeight, geo.discGap);
        const endY = getSlotY(am.toSlot, geo.baseY, geo.discHeight, geo.discGap);
        const liftCeilingY = geo.baseY - geo.pillarHeight - 44;

        let curX = startX;
        let curY = startY;
        let liftFactor = 0;

        if (p < 0.24) {
          // Phase 1: Lift vertically off source pillar
          const t = easeOutCubic(p / 0.24);
          curX = startX;
          curY = startY + (liftCeilingY - startY) * t;
          liftFactor = t;
        } else if (p < 0.78) {
          // Phase 2: Smooth parabolic arc glide across the sanctuary
          const t = easeInOutSine((p - 0.24) / 0.54);
          const arcLift = Math.sin(t * Math.PI) * Math.min(54, Math.abs(endX - startX) * 0.14);
          curX = startX + (endX - startX) * t;
          curY = liftCeilingY - arcLift;
          liftFactor = 1;
        } else {
          // Phase 3: Settle softly onto destination pillar stack
          const t = easeInOutCubic((p - 0.78) / 0.22);
          curX = endX;
          curY = liftCeilingY + (endY - liftCeilingY) * t;
          liftFactor = 1 - t;
        }

        // Emit soft luminous trail motes while gliding
        if (p > 0.12 && p < 0.88 && Math.random() < 0.45) {
          const palette = getDiscPalette(am.move.disk, curSettings.numDiscs, am.move.voice);
          trailMotes.push({
            x: curX + (Math.random() - 0.5) * 28,
            y: curY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 14,
            vy: -6 - Math.random() * 14,
            alpha: 0.48,
            r: 1.3 + Math.random() * 1.6,
            rgb: palette.ripple,
          });
        }

        const w = getDiscWidth(am.move.disk, curSettings.numDiscs, geo.minDiscW, geo.maxDiscW);
        drawDisc(curX, curY, w, geo.discHeight, am.move.disk, curSettings.numDiscs, am.move.voice, liftFactor, false);
      }

      // Render flight trail motes
      for (let i = trailMotes.length - 1; i >= 0; i--) {
        const m = trailMotes[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.alpha -= dt * 0.95;
        if (m.alpha <= 0) {
          trailMotes.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(${m.rgb[0]}, ${m.rgb[1]}, ${m.rgb[2]}, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 8. Render Golden-Emerald Impact Ripple Waves ---
      for (let i = impactRipples.length - 1; i >= 0; i--) {
        const rip = impactRipples[i];
        if (rip.delay > 0) {
          rip.delay -= dt;
          continue;
        }
        rip.radius += rip.speed * dt;
        const progress = rip.radius / rip.maxRadius;
        if (progress >= 1) {
          impactRipples.splice(i, 1);
          continue;
        }
        const fade = Math.pow(1 - progress, 1.7) * rip.alpha;
        ctx.save();
        ctx.strokeStyle = `rgba(${rip.rgb[0]}, ${rip.rgb[1]}, ${rip.rgb[2]}, ${fade})`;
        ctx.lineWidth = rip.lineWidth * (1 - progress * 0.45);
        ctx.shadowColor = `rgba(${rip.rgb[0]}, ${rip.rgb[1]}, ${rip.rgb[2]}, ${fade * 0.7})`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y + 4, rip.radius, rip.radius * 0.27, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [engineStateRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive Tower of Hanoi Zen pillars and glowing discs animation"
      className="fixed inset-0 h-full w-full block select-none"
    />
  );
}
