import { arrayMove } from '@dnd-kit/sortable';

export const COLUMNS = [
  { id: 'applied', title: 'Ứng tuyển' },
  { id: 'screening', title: 'Sàng lọc' },
  { id: 'interview', title: 'Phỏng vấn' },
  { id: 'offer', title: 'Đề nghị' },
];

export const COLUMN_IDS = COLUMNS.map((col) => col.id);

export const STATUS_MAPPING = {
  unverified: 'applied',
  verified: 'screening',
  scheduled: 'interview',
  risky: 'applied',
};

export function normalizeCandidate(raw) {
  const id = String(raw?.id ?? raw?._id ?? '');
  let kanbanStatus = raw?.status;
  if (!COLUMN_IDS.includes(kanbanStatus)) {
    kanbanStatus = STATUS_MAPPING[kanbanStatus] || 'applied';
  }

  return {
    id,
    candidateCode: id.substring(0, 6).toUpperCase(),
    name: raw?.fullName || 'Chưa cập nhật',
    position: raw?.jobTitle || 'Chưa cập nhật',
    status: kanbanStatus,
  };
}

export function validateStatusChange(currentStatus, newStatus) {
  const currentIndex = COLUMNS.findIndex((col) => col.id === currentStatus);
  const newIndex = COLUMNS.findIndex((col) => col.id === newStatus);

  if (currentIndex === -1 || newIndex === -1) {
    return { isValid: false, reason: 'unknown', message: 'Trạng thái không hợp lệ!' };
  }

  if (currentIndex === newIndex) {
    return { isValid: false, reason: 'unchanged', message: 'Trạng thái không thay đổi.' };
  }

  if (Math.abs(newIndex - currentIndex) > 1) {
    return { isValid: false, reason: 'skip', message: 'Quy trình không hợp lệ!' };
  }

  return { isValid: true, reason: 'ok' };
}

export function isAdjacentStatus(fromStatus, toStatus) {
  const fromIndex = COLUMNS.findIndex((col) => col.id === fromStatus);
  const toIndex = COLUMNS.findIndex((col) => col.id === toStatus);
  if (fromIndex === -1 || toIndex === -1) return false;
  return Math.abs(toIndex - fromIndex) === 1;
}

export function canDragIntoColumn(originStatus, targetColumnId) {
  if (!originStatus || !targetColumnId) return false;
  if (originStatus === targetColumnId) return true;
  return isAdjacentStatus(originStatus, targetColumnId);
}

export function resolveTargetColumnId(overId, candidates) {
  if (!overId) return null;
  const key = String(overId);
  if (COLUMN_IDS.includes(key)) {
    return key;
  }
  const overCandidate = candidates.find((c) => c.id === key);
  return overCandidate ? overCandidate.status : null;
}

/**
 * Resolves target column ID from a dnd-kit `over` object, preferring its live
 * droppable/sortable metadata before falling back to the candidates snapshot.
 */
export function resolveDropTargetColumnId(over, candidates) {
  if (!over) return null;
  const data = over.data?.current;
  if (data?.type === 'column' && COLUMN_IDS.includes(String(data.columnId))) {
    return String(data.columnId);
  }
  if (data?.type === 'candidate' && COLUMN_IDS.includes(String(data.candidate?.status))) {
    return String(data.candidate.status);
  }
  return resolveTargetColumnId(over.id, candidates);
}

/**
 * Checks whether pointer coordinates fall inside the bounding box encompassing
 * a list of column DOM rects (allowing small inter-column gaps to count as
 * "inside the board", while pointers outside the board return false).
 */
export function isPointWithinBoardBounds(point, columnRects) {
  if (!point || !columnRects || columnRects.length === 0) return false;
  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  for (const rect of columnRects) {
    if (!rect) continue;
    if (rect.left < minLeft) minLeft = rect.left;
    if (rect.top < minTop) minTop = rect.top;
    if (rect.right > maxRight) maxRight = rect.right;
    if (rect.bottom > maxBottom) maxBottom = rect.bottom;
  }

  if (!Number.isFinite(minLeft)) return false;
  return (
    point.x >= minLeft &&
    point.x <= maxRight &&
    point.y >= minTop &&
    point.y <= maxBottom
  );
}

/**
 * Merges freshly fetched server candidates with current local optimistic state
 * so in-flight or recently mutated candidates are never overwritten by stale GET responses.
 */
export function mergeFetchedCandidates(
  fetchedCandidates,
  currentCandidates,
  protectedIds
) {
  if (!protectedIds || protectedIds.size === 0) {
    return fetchedCandidates;
  }
  const currentById = new Map(currentCandidates.map((c) => [c.id, c]));
  return fetchedCandidates.map((c) => {
    if (protectedIds.has(c.id) && currentById.has(c.id)) {
      return { ...c, status: currentById.get(c.id).status };
    }
    return c;
  });
}

/**
 * Moves a candidate across columns during drag-over preview, or updates status directly.
 * Only mutates cross-column position; same-column visual sorting is handled by SortableContext
 * until drag-end (avoiding oscillation).
 */
export function moveCandidateAcrossColumns(candidates, activeId, overId, targetColumnId) {
  const activeIndex = candidates.findIndex((c) => c.id === activeId);
  if (activeIndex === -1) return candidates;

  const activeItem = candidates[activeIndex];
  if (activeItem.status === targetColumnId) return candidates;

  const next = candidates.slice();
  const [removed] = next.splice(activeIndex, 1);
  const moved = { ...removed, status: targetColumnId };

  if (!overId || String(overId) === targetColumnId) {
    next.push(moved);
    return next;
  }

  const overIndex = next.findIndex((c) => c.id === String(overId));
  if (overIndex === -1) {
    next.push(moved);
    return next;
  }

  next.splice(overIndex, 0, moved);
  return next;
}

/**
 * Reorders a candidate relative to another card inside the same column on drag-end.
 */
export function reorderCandidateInColumn(candidates, activeId, overId) {
  if (!overId || activeId === String(overId)) return candidates;
  const activeIndex = candidates.findIndex((c) => c.id === activeId);
  const overIndex = candidates.findIndex((c) => c.id === String(overId));
  if (activeIndex === -1 || overIndex === -1) return candidates;
  if (candidates[activeIndex].status !== candidates[overIndex].status) return candidates;
  if (activeIndex === overIndex) return candidates;
  return arrayMove(candidates, activeIndex, overIndex);
}

/**
 * Restores ONLY a single candidate to its original status and index without
 * clobbering concurrent optimistic updates on other candidates.
 */
export function restoreSingleCandidate(candidates, candidateId, originStatus, originIndex) {
  const currentIndex = candidates.findIndex((c) => c.id === candidateId);
  if (currentIndex === -1) return candidates;

  const next = candidates.slice();
  const [item] = next.splice(currentIndex, 1);
  const restored = { ...item, status: originStatus };
  const clampedIndex = Math.max(0, Math.min(originIndex, next.length));
  next.splice(clampedIndex, 0, restored);
  return next;
}

/**
 * Applies a status update to a single candidate (for menu selection or rollback).
 */
export function setCandidateStatus(candidates, candidateId, status) {
  return candidates.map((c) => (c.id === candidateId ? { ...c, status } : c));
}
