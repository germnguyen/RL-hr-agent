import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import Column from './components/Column';
import { CandidateCardOverlay } from './components/CandidateCard';
import candidateService from '../../../services/client/candidateService';
import {
  COLUMNS,
  COLUMN_IDS,
  normalizeCandidate,
  validateStatusChange,
  isAdjacentStatus,
  canDragIntoColumn,
  resolveDropTargetColumnId,
  isPointWithinBoardBounds,
  mergeFetchedCandidates,
  moveCandidateAcrossColumns,
  reorderCandidateInColumn,
  restoreSingleCandidate,
  setCandidateStatus,
} from './kanbanUtils';

const DROP_ANIMATION = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.35',
      },
    },
  }),
};

const RecruitmentBoard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeOriginStatus, setActiveOriginStatus] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const candidatesRef = useRef([]);
  const dragOriginRef = useRef(null);
  const confirmedStatusRef = useRef(new Map());
  const requestSeqRef = useRef(new Map());
  const pendingIdsRef = useRef(new Set());
  const candidateQueueRef = useRef(new Map());
  const mutationEpochRef = useRef(0);
  const candidateMutationEpochRef = useRef(new Map());

  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  const addPendingId = useCallback((candidateId) => {
    const next = new Set(pendingIdsRef.current);
    next.add(candidateId);
    pendingIdsRef.current = next;
    setPendingIds(next);
  }, []);

  const removePendingId = useCallback((candidateId) => {
    if (!pendingIdsRef.current.has(candidateId)) return;
    const next = new Set(pendingIdsRef.current);
    next.delete(candidateId);
    pendingIdsRef.current = next;
    setPendingIds(next);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy = useCallback((args) => {
    const activeKey = String(args.active.id);
    const nonActiveContainers = args.droppableContainers.filter(
      (container) => String(container.id) !== activeKey
    );
    const filteredArgs = {
      ...args,
      droppableContainers: nonActiveContainers,
    };

    if (args.pointerCoordinates) {
      const pointerCollisions = pointerWithin(filteredArgs);
      if (pointerCollisions.length > 0) {
        const cardHit = pointerCollisions.find(
          (c) => !COLUMN_IDS.includes(String(c.id))
        );
        if (cardHit) {
          return [cardHit];
        }
        const columnHit = pointerCollisions.find((c) =>
          COLUMN_IDS.includes(String(c.id))
        );
        if (columnHit) {
          return [columnHit];
        }
        return pointerCollisions;
      }

      // Pointer is not inside a specific droppable: if it's over a thin gap inside
      // the Kanban board, snap ONLY to the fixed column containers (never shifting
      // cards, which would cause cross-column oscillation / React #185). If outside
      // the board, return [] so releasing cancels the drag cleanly.
      const columnContainers = nonActiveContainers.filter((container) =>
        COLUMN_IDS.includes(String(container.id))
      );
      const columnRects = columnContainers
        .map((container) => args.droppableRects.get(container.id))
        .filter(Boolean);
      if (isPointWithinBoardBounds(args.pointerCoordinates, columnRects)) {
        return closestCorners({
          ...args,
          droppableContainers: columnContainers,
        });
      }
      return [];
    }

    // Keyboard sensor drag (no pointerCoordinates)
    return closestCorners(filteredArgs);
  }, []);

  const fetchCandidates = useCallback(async () => {
    const fetchStartEpoch = mutationEpochRef.current;
    try {
      setLoading(true);
      const res = await candidateService.getAll();
      const mapped = (res.candidates || []).map(normalizeCandidate);

      const protectedIds = new Set(pendingIdsRef.current);
      candidateMutationEpochRef.current.forEach((epoch, id) => {
        if (epoch > fetchStartEpoch) {
          protectedIds.add(id);
        }
      });

      const nextConfirmed = new Map(confirmedStatusRef.current);
      mapped.forEach((c) => {
        if (!protectedIds.has(c.id)) {
          nextConfirmed.set(c.id, c.status);
        }
      });
      confirmedStatusRef.current = nextConfirmed;

      setCandidates((prev) => mergeFetchedCandidates(mapped, prev, protectedIds));
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách ứng viên!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const commitStatusChange = useCallback(
    (candidateId, newStatus, fallbackStatus) => {
      const nextSeq = (requestSeqRef.current.get(candidateId) || 0) + 1;
      requestSeqRef.current.set(candidateId, nextSeq);

      const epoch = ++mutationEpochRef.current;
      candidateMutationEpochRef.current.set(candidateId, epoch);

      addPendingId(candidateId);

      const prevTask = candidateQueueRef.current.get(candidateId) || Promise.resolve();

      const task = prevTask
        .catch(() => {})
        .then(async () => {
          const updateRes = await candidateService.updateStatus(candidateId, newStatus);
          if (updateRes && updateRes.success === false) {
            throw new Error(updateRes.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
          }

          confirmedStatusRef.current.set(candidateId, newStatus);
          candidateMutationEpochRef.current.set(candidateId, ++mutationEpochRef.current);

          const syncData = {
            timestamp: Date.now(),
            candidateId,
            newStatus,
            type: 'candidate-status-changed',
          };
          localStorage.setItem('hr-agent-sync', JSON.stringify(syncData));
          window.dispatchEvent(
            new CustomEvent('candidate-status-changed', {
              detail: { candidateId, newStatus, timestamp: syncData.timestamp },
            })
          );

          if (requestSeqRef.current.get(candidateId) === nextSeq) {
            removePendingId(candidateId);
          }
        })
        .catch((error) => {
          console.error('Lỗi khi cập nhật trạng thái', error);

          if (requestSeqRef.current.get(candidateId) === nextSeq) {
            const revertStatus = confirmedStatusRef.current.get(candidateId) ?? fallbackStatus;

            removePendingId(candidateId);
            setCandidates((prev) => setCandidateStatus(prev, candidateId, revertStatus));
            toast.error(
              error?.response?.data?.message ||
                error?.message ||
                'Có lỗi xảy ra khi cập nhật trạng thái'
            );
          }
        })
        .finally(() => {
          if (requestSeqRef.current.get(candidateId) === nextSeq) {
            candidateQueueRef.current.delete(candidateId);
          }
        });

      candidateQueueRef.current.set(candidateId, task);
      return task;
    },
    [addPendingId, removePendingId]
  );

  const handleMenuStatusChange = useCallback(
    (candidateId, newStatus) => {
      const candidate = candidatesRef.current.find((c) => c.id === candidateId);
      if (!candidate) {
        toast.error('Không tìm thấy ứng viên!');
        return;
      }

      const currentStatus = candidate.status;
      const validation = validateStatusChange(currentStatus, newStatus);
      if (!validation.isValid) {
        if (validation.reason !== 'unchanged') {
          toast.error(validation.message);
        }
        return;
      }

      // Immediate silent optimistic update
      setCandidates((prev) => setCandidateStatus(prev, candidateId, newStatus));
      commitStatusChange(candidateId, newStatus, currentStatus);
    },
    [commitStatusChange]
  );

  const resetDragState = useCallback(() => {
    dragOriginRef.current = null;
    setActiveId(null);
    setActiveOriginStatus(null);
    setOverColumnId(null);
  }, []);

  const handleDragStart = useCallback((event) => {
    const candidateId = String(event.active.id);
    const currentList = candidatesRef.current;
    const originIndex = currentList.findIndex((c) => c.id === candidateId);
    if (originIndex === -1) return;

    const originStatus = currentList[originIndex].status;
    dragOriginRef.current = { candidateId, originStatus, originIndex };
    setActiveId(candidateId);
    setActiveOriginStatus(originStatus);
    setOverColumnId(originStatus);
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    const origin = dragOriginRef.current;
    if (!origin) return;

    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeKey = String(active.id);
    const overKey = String(over.id);
    const targetColumnId = resolveDropTargetColumnId(over, candidatesRef.current);
    setOverColumnId(targetColumnId);

    if (!targetColumnId) return;
    if (!canDragIntoColumn(origin.originStatus, targetColumnId)) return;

    setCandidates((prev) => {
      const currentItem = prev.find((c) => c.id === activeKey);
      if (!currentItem || currentItem.status === targetColumnId) {
        return prev;
      }
      return moveCandidateAcrossColumns(prev, activeKey, overKey, targetColumnId);
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    const origin = dragOriginRef.current;
    if (origin) {
      setCandidates((prev) =>
        restoreSingleCandidate(prev, origin.candidateId, origin.originStatus, origin.originIndex)
      );
    }
    resetDragState();
  }, [resetDragState]);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      const origin = dragOriginRef.current;
      resetDragState();

      if (!origin) return;

      const activeKey = String(active.id);

      // Dropped outside any valid droppable zone -> restore original position
      if (!over) {
        setCandidates((prev) =>
          restoreSingleCandidate(prev, origin.candidateId, origin.originStatus, origin.originIndex)
        );
        return;
      }

      const overKey = String(over.id);
      const targetColumnId = resolveDropTargetColumnId(over, candidatesRef.current);

      if (!targetColumnId) {
        setCandidates((prev) =>
          restoreSingleCandidate(prev, origin.candidateId, origin.originStatus, origin.originIndex)
        );
        return;
      }

      // Check step rule relative to where the drag started
      if (!canDragIntoColumn(origin.originStatus, targetColumnId)) {
        setCandidates((prev) =>
          restoreSingleCandidate(prev, origin.candidateId, origin.originStatus, origin.originIndex)
        );
        toast.error('Quy trình không hợp lệ!');
        return;
      }

      // Dropped back into the same column -> reorder locally without API call
      if (targetColumnId === origin.originStatus) {
        setCandidates((prev) => {
          const item = prev.find((c) => c.id === activeKey);
          const inOrigin =
            item && item.status !== origin.originStatus
              ? moveCandidateAcrossColumns(prev, activeKey, overKey, origin.originStatus)
              : prev;
          return reorderCandidateInColumn(inOrigin, activeKey, overKey);
        });
        return;
      }

      // Valid adjacent column drop -> finalize optimistic position & sync silently with server
      setCandidates((prev) => {
        const item = prev.find((c) => c.id === activeKey);
        if (!item) return prev;
        if (item.status !== targetColumnId) {
          return moveCandidateAcrossColumns(prev, activeKey, overKey, targetColumnId);
        }
        return reorderCandidateInColumn(prev, activeKey, overKey);
      });

      commitStatusChange(activeKey, targetColumnId, origin.originStatus);
    },
    [commitStatusChange, resetDragState]
  );

  const candidatesByColumn = useMemo(() => {
    const grouped = Object.fromEntries(COLUMN_IDS.map((id) => [id, []]));
    for (const candidate of candidates) {
      const bucket = grouped[candidate.status] ? candidate.status : 'applied';
      grouped[bucket].push(candidate);
    }
    return grouped;
  }, [candidates]);

  const activeCandidate = useMemo(
    () => (activeId ? candidates.find((c) => c.id === activeId) || null : null),
    [activeId, candidates]
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-128px)] min-h-[420px] items-center justify-center rounded-sm border border-border bg-white/80 dark:bg-card/60 shadow-2xs max-md:h-[calc(100dvh-104px)]">
        <div className="flex items-center gap-2 text-subtle text-sm">
          <Loader2 className="size-4 text-brand animate-spin" aria-hidden="true" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-128px)] min-h-[420px] flex-col overflow-hidden rounded-sm border border-border bg-white/80 dark:bg-card/60 shadow-2xs max-md:h-[calc(100dvh-104px)]">
      {/* Bounded Kanban Board Only (horizontal scroll if columns overflow, vertical scroll inside each column) */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        autoScroll={{ threshold: { x: 0.12, y: 0.15 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          <div className="flex h-full min-h-0 w-max min-w-full gap-2 items-stretch p-2">
            {COLUMNS.map((col) => {
              const isDraggingActive = Boolean(activeOriginStatus);
              const isValidTarget =
                isDraggingActive && isAdjacentStatus(activeOriginStatus, col.id);
              const isHovered = isDraggingActive && overColumnId === col.id;
              const isOverValid =
                isHovered &&
                canDragIntoColumn(activeOriginStatus, col.id) &&
                col.id !== activeOriginStatus;
              const isOverInvalid =
                isHovered && !canDragIntoColumn(activeOriginStatus, col.id);

              return (
                <Column
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  candidates={candidatesByColumn[col.id]}
                  onStatusChange={handleMenuStatusChange}
                  pendingIds={pendingIds}
                  isValidDropTarget={isValidTarget}
                  isOverValid={isOverValid}
                  isOverInvalid={isOverInvalid}
                />
              );
            })}
          </div>
        </div>

        {typeof document !== 'undefined' &&
          ReactDOM.createPortal(
            <DragOverlay dropAnimation={DROP_ANIMATION} zIndex={9999}>
              {activeCandidate ? <CandidateCardOverlay candidate={activeCandidate} /> : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
};

export default RecruitmentBoard;
