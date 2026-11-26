/**
 * Classic Recursive Tower of Hanoi Engine
 * Computes the complete recursive move sequence along with live call-stack frames,
 * recursion depth, and Daf frame-drum percussion voice mapping.
 */

export const PILLAR_LABELS = ['A', 'B', 'C'];

/**
 * Maps a disk number (1 = smallest leaf, numDiscs = largest base) to its
 * authentic Daf percussion articulation:
 * - Largest discs (base recursion levels) -> 'dum' (Deep membrane thump)
 * - Middle discs (mid recursion levels)   -> 'tak' (Crisp goatskin rim tap)
 * - Smallest discs (leaf levels 1-2)      -> 'zinj' (Soft metallic ring shimmer)
 */
export function getDafVoiceForDisk(disk, numDiscs) {
  if (numDiscs <= 3) {
    if (disk === numDiscs) return 'dum';
    if (disk === 2) return 'tak';
    return 'zinj';
  }
  if (numDiscs === 4) {
    if (disk === 4) return 'dum';
    if (disk === 3) return 'tak';
    return 'zinj';
  }
  // For 5 to 8 discs:
  // Leaf levels 1-2 -> soft Zinj / Shimmer
  // Largest base discs -> Deep Dum
  // Intermediate discs -> Crisp Tak
  if (disk <= 2) return 'zinj';
  const dumThreshold = numDiscs >= 6 ? numDiscs - 1 : numDiscs;
  if (disk >= dumThreshold) return 'dum';
  return 'tak';
}

export function getVoiceDisplayName(voice) {
  if (voice === 'dum') return 'Deep Dum';
  if (voice === 'tak') return 'Crisp Tak';
  return 'Soft Zinj';
}

/**
 * Generates the Tower of Hanoi recursive move sequence via classic recursion:
 * hanoi(n, source, auxiliary, target)
 *
 * @param {number} numDiscs - Number of discs (3 to 8)
 * @param {number} sourcePillar - Starting pillar index (0 for A, 2 for C in reverse loop)
 * @param {number} targetPillar - Destination pillar index (2 for C, 0 for A in reverse loop)
 * @returns {Array<object>} Ordered list of 2^N - 1 move descriptors with recursion telemetry
 */
export function generateHanoiSequence(numDiscs, sourcePillar = 0, targetPillar = 2) {
  const auxPillar = 3 - sourcePillar - targetPillar;
  const moves = [];
  const callStack = [];

  function hanoi(n, source, auxiliary, target, depth) {
    if (n <= 0) return;

    const frame = {
      n,
      source,
      auxiliary,
      target,
      depth,
      label: `hanoi(${n}, ${PILLAR_LABELS[source]}→${PILLAR_LABELS[target]})`,
    };
    callStack.push(frame);

    // 1. Recursively move n - 1 discs from source to auxiliary
    hanoi(n - 1, source, target, auxiliary, depth + 1);

    // 2. Move largest disc n directly from source to target
    const voice = getDafVoiceForDisk(n, numDiscs);
    moves.push({
      step: moves.length + 1,
      disk: n,
      from: source,
      to: target,
      fromLabel: PILLAR_LABELS[source],
      toLabel: PILLAR_LABELS[target],
      depth: depth + 1, // 1-indexed human-readable recursion depth (1 = root, N = leaf)
      maxDepth: numDiscs,
      voice,
      voiceLabel: getVoiceDisplayName(voice),
      // Normalized size: 0 (smallest) to 1 (largest)
      sizeRatio: numDiscs > 1 ? (n - 1) / (numDiscs - 1) : 1,
      callStack: callStack.map((f) => ({ ...f })),
    });

    // 3. Recursively move n - 1 discs from auxiliary to target
    hanoi(n - 1, auxiliary, source, target, depth + 1);

    callStack.pop();
  }

  hanoi(numDiscs, sourcePillar, auxPillar, targetPillar, 0);
  return moves;
}

/**
 * Creates the initial pillar arrays with all discs stacked largest-to-smallest on startPillar.
 */
export function createInitialTowers(numDiscs, startPillar = 0) {
  const towers = [[], [], []];
  for (let d = numDiscs; d >= 1; d--) {
    towers[startPillar].push(d);
  }
  return towers;
}

/**
 * Reconstructs the exact tower configuration after `completedCount` moves.
 */
export function buildTowersAtStep(numDiscs, moves, completedCount, startPillar = 0) {
  const towers = createInitialTowers(numDiscs, startPillar);
  const limit = Math.min(completedCount, moves.length);
  for (let i = 0; i < limit; i++) {
    const move = moves[i];
    const popped = towers[move.from].pop();
    if (popped !== undefined) {
      towers[move.to].push(popped);
    }
  }
  return towers;
}
