import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLUMNS,
  normalizeCandidate,
  validateStatusChange,
  isAdjacentStatus,
  canDragIntoColumn,
  resolveTargetColumnId,
  resolveDropTargetColumnId,
  isPointWithinBoardBounds,
  mergeFetchedCandidates,
  moveCandidateAcrossColumns,
  reorderCandidateInColumn,
  restoreSingleCandidate,
  setCandidateStatus,
} from './kanbanUtils.js';

const sampleCandidates = [
  { id: 'c1', candidateCode: 'C1', name: 'A', position: 'FE', status: 'applied' },
  { id: 'c2', candidateCode: 'C2', name: 'B', position: 'BE', status: 'applied' },
  { id: 'c3', candidateCode: 'C3', name: 'C', position: 'QA', status: 'screening' },
  { id: 'c4', candidateCode: 'C4', name: 'D', position: 'PM', status: 'interview' },
];

test('normalizeCandidate maps legacy statuses and fills defaults safely', () => {
  assert.deepEqual(
    normalizeCandidate({ id: 'abcdef123', fullName: 'Nguyen Van A', jobTitle: 'Dev', status: 'unverified' }),
    { id: 'abcdef123', candidateCode: 'ABCDEF', name: 'Nguyen Van A', position: 'Dev', status: 'applied' }
  );
  assert.equal(normalizeCandidate({ _id: 'xyz', status: 'verified' }).status, 'screening');
  assert.equal(normalizeCandidate({ id: '1', status: 'scheduled' }).status, 'interview');
  assert.equal(normalizeCandidate({ id: '2', status: 'risky' }).status, 'applied');
  assert.equal(normalizeCandidate({ id: '3', status: 'unknown_status' }).status, 'applied');
  assert.equal(normalizeCandidate({}).name, 'Chưa cập nhật');
  assert.equal(normalizeCandidate({}).position, 'Chưa cập nhật');
  assert.equal(normalizeCandidate({ id: '4', status: 'offer' }).status, 'offer');
});

test('validateStatusChange enforces adjacent step transitions only', () => {
  assert.deepEqual(validateStatusChange('applied', 'screening'), { isValid: true, reason: 'ok' });
  assert.deepEqual(validateStatusChange('screening', 'applied'), { isValid: true, reason: 'ok' });
  assert.deepEqual(validateStatusChange('interview', 'offer'), { isValid: true, reason: 'ok' });

  const same = validateStatusChange('applied', 'applied');
  assert.equal(same.isValid, false);
  assert.equal(same.reason, 'unchanged');

  const skipForward = validateStatusChange('applied', 'interview');
  assert.equal(skipForward.isValid, false);
  assert.equal(skipForward.reason, 'skip');

  const skipFar = validateStatusChange('applied', 'offer');
  assert.equal(skipFar.isValid, false);
  assert.equal(skipFar.reason, 'skip');

  const skipBackward = validateStatusChange('offer', 'screening');
  assert.equal(skipBackward.isValid, false);
  assert.equal(skipBackward.reason, 'skip');

  const unknown = validateStatusChange('applied', 'nonexistent');
  assert.equal(unknown.isValid, false);
  assert.equal(unknown.reason, 'unknown');
});

test('isAdjacentStatus and canDragIntoColumn check boundary columns', () => {
  assert.equal(COLUMNS.length, 4);
  assert.equal(isAdjacentStatus('applied', 'screening'), true);
  assert.equal(isAdjacentStatus('applied', 'applied'), false);
  assert.equal(isAdjacentStatus('applied', 'interview'), false);
  assert.equal(isAdjacentStatus('offer', 'interview'), true);

  assert.equal(canDragIntoColumn('applied', 'applied'), true);
  assert.equal(canDragIntoColumn('applied', 'screening'), true);
  assert.equal(canDragIntoColumn('applied', 'interview'), false);
  assert.equal(canDragIntoColumn('offer', 'applied'), false);
  assert.equal(canDragIntoColumn(null, 'applied'), false);
});

test('resolveTargetColumnId resolves both column IDs and card IDs', () => {
  assert.equal(resolveTargetColumnId('screening', sampleCandidates), 'screening');
  assert.equal(resolveTargetColumnId('c3', sampleCandidates), 'screening');
  assert.equal(resolveTargetColumnId('c4', sampleCandidates), 'interview');
  assert.equal(resolveTargetColumnId('missing', sampleCandidates), null);
  assert.equal(resolveTargetColumnId(null, sampleCandidates), null);
});

test('moveCandidateAcrossColumns moves card onto column or before target card without mutating input', () => {
  const originalCopy = structuredClone(sampleCandidates);

  // Move c1 onto empty/column container 'screening' -> appended with new status
  const ontoCol = moveCandidateAcrossColumns(sampleCandidates, 'c1', 'screening', 'screening');
  assert.deepEqual(sampleCandidates, originalCopy);
  const movedC1 = ontoCol.find((c) => c.id === 'c1');
  assert.equal(movedC1.status, 'screening');
  assert.equal(ontoCol.at(-1).id, 'c1');

  // Move c1 directly over c3 in 'screening' -> inserted before c3
  const ontoCard = moveCandidateAcrossColumns(sampleCandidates, 'c1', 'c3', 'screening');
  const screeningIds = ontoCard.filter((c) => c.status === 'screening').map((c) => c.id);
  assert.deepEqual(screeningIds, ['c1', 'c3']);

  // No-op when already in target column
  const sameCol = moveCandidateAcrossColumns(sampleCandidates, 'c1', 'c2', 'applied');
  assert.equal(sameCol, sampleCandidates);
});

test('reorderCandidateInColumn reorders only within the same column', () => {
  const reordered = reorderCandidateInColumn(sampleCandidates, 'c1', 'c2');
  const appliedIds = reordered.filter((c) => c.status === 'applied').map((c) => c.id);
  assert.deepEqual(appliedIds, ['c2', 'c1']);

  // Cross-column reorder is ignored
  assert.equal(reorderCandidateInColumn(sampleCandidates, 'c1', 'c3'), sampleCandidates);
  // Same card is ignored
  assert.equal(reorderCandidateInColumn(sampleCandidates, 'c1', 'c1'), sampleCandidates);
  // Column ID is ignored
  assert.equal(reorderCandidateInColumn(sampleCandidates, 'c1', 'applied'), sampleCandidates);
});

test('restoreSingleCandidate restores only the target card without clobbering concurrent changes', () => {
  // Simulate: c1 was preview-moved to screening, AND concurrently c4 was optimistically moved to offer
  let state = moveCandidateAcrossColumns(sampleCandidates, 'c1', 'screening', 'screening');
  state = setCandidateStatus(state, 'c4', 'offer');

  // Now c1's drag is cancelled -> restore ONLY c1 back to applied at index 0
  const restored = restoreSingleCandidate(state, 'c1', 'applied', 0);

  assert.equal(restored[0].id, 'c1');
  assert.equal(restored[0].status, 'applied');
  // Concurrent optimistic move on c4 MUST remain intact!
  assert.equal(restored.find((c) => c.id === 'c4').status, 'offer');
});

test('setCandidateStatus updates only the specified candidate', () => {
  const updated = setCandidateStatus(sampleCandidates, 'c3', 'interview');
  assert.equal(updated.find((c) => c.id === 'c3').status, 'interview');
  assert.equal(updated.find((c) => c.id === 'c1').status, 'applied');
  assert.equal(sampleCandidates.find((c) => c.id === 'c3').status, 'screening');
});

test('resolveDropTargetColumnId prefers live dnd-kit data before falling back to candidates array', () => {
  assert.equal(
    resolveDropTargetColumnId(
      { id: 'screening', data: { current: { type: 'column', columnId: 'screening' } } },
      sampleCandidates
    ),
    'screening'
  );
  // Even if candidatesRef is stale (c1 still 'applied'), live over.data.current reports 'screening'
  assert.equal(
    resolveDropTargetColumnId(
      { id: 'c1', data: { current: { type: 'candidate', candidate: { id: 'c1', status: 'screening' } } } },
      sampleCandidates
    ),
    'screening'
  );
  // Falls back cleanly when data is missing
  assert.equal(resolveDropTargetColumnId({ id: 'c4' }, sampleCandidates), 'interview');
  assert.equal(resolveDropTargetColumnId(null, sampleCandidates), null);
});

test('isPointWithinBoardBounds allows inter-column gaps and rejects pointers outside the board', () => {
  const colRects = [
    { left: 100, top: 100, right: 320, bottom: 700 },
    { left: 328, top: 100, right: 548, bottom: 700 },
  ];
  // Inside column 1
  assert.equal(isPointWithinBoardBounds({ x: 150, y: 200 }, colRects), true);
  // Inside 8px gap between column 1 and column 2
  assert.equal(isPointWithinBoardBounds({ x: 324, y: 300 }, colRects), true);
  // Above board (in page navbar)
  assert.equal(isPointWithinBoardBounds({ x: 250, y: 20 }, colRects), false);
  // Below board
  assert.equal(isPointWithinBoardBounds({ x: 250, y: 750 }, colRects), false);
  // Left/right outside board
  assert.equal(isPointWithinBoardBounds({ x: 50, y: 300 }, colRects), false);
  assert.equal(isPointWithinBoardBounds({ x: 600, y: 300 }, colRects), false);
  // Null / empty safety
  assert.equal(isPointWithinBoardBounds(null, colRects), false);
  assert.equal(isPointWithinBoardBounds({ x: 200, y: 200 }, []), false);
});

test('mergeFetchedCandidates preserves protected optimistic statuses against stale GET responses', () => {
  const staleServer = [
    { id: 'c1', status: 'applied', name: 'A (updated)' },
    { id: 'c2', status: 'applied', name: 'B' },
  ];
  const currentLocal = [
    { id: 'c1', status: 'screening', name: 'A' },
    { id: 'c2', status: 'applied', name: 'B' },
  ];
  const merged = mergeFetchedCandidates(staleServer, currentLocal, new Set(['c1']));
  // Preserves local optimistic status for c1 while keeping fresh metadata
  assert.equal(merged.find((c) => c.id === 'c1').status, 'screening');
  assert.equal(merged.find((c) => c.id === 'c1').name, 'A (updated)');
  assert.equal(merged.find((c) => c.id === 'c2').status, 'applied');

  // Empty protected set returns server array directly
  assert.equal(mergeFetchedCandidates(staleServer, currentLocal, new Set()), staleServer);
});
