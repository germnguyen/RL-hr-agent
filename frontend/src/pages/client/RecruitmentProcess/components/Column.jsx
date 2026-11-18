import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import CandidateCard from './CandidateCard';
import { cn } from '@/lib/utils';

const COLUMN_DOT_COLORS = {
  applied: 'bg-blue-500',
  screening: 'bg-purple-500',
  interview: 'bg-amber-500',
  offer: 'bg-emerald-500',
};

const Column = ({
  id,
  title,
  candidates,
  onStatusChange,
  pendingIds,
  isOverValid = false,
  isOverInvalid = false,
  isValidDropTarget = false,
}) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      columnId: id,
    },
  });

  const candidateIds = useMemo(() => candidates.map((c) => c.id), [candidates]);
  const dotColor = COLUMN_DOT_COLORS[id] || 'bg-brand';

  return (
    <section
      ref={setNodeRef}
      aria-label={`Cột ${title}`}
      className={cn(
        'h-full min-h-0 flex-1 min-w-[216px] rounded-sm border bg-slate-50/90 dark:bg-muted/30 flex flex-col overflow-hidden transition-colors',
        isOverInvalid
          ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-300/70'
          : isOverValid
            ? 'border-brand/70 bg-brand-light/25 dark:bg-brand/10 ring-1 ring-brand/30'
            : isValidDropTarget
              ? 'border-brand/35'
              : 'border-border'
      )}
    >
      {/* Pinned Column Header */}
      <header className="shrink-0 px-2.5 py-2 bg-white dark:bg-card border-b border-border flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('size-2 rounded-sm shrink-0', dotColor)} aria-hidden="true" />
          <h2 className="font-semibold text-[13px] text-ink truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isOverInvalid && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 border border-red-200">
              Sai bước
            </span>
          )}
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 leading-none text-[11px] font-semibold rounded-sm bg-slate-100 dark:bg-muted text-subtle border border-border/70 tabular-nums">
            {candidates.length}
          </span>
        </div>
      </header>

      {/* Vertically Scrollable Card List */}
      <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1.5 flex flex-col gap-1.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onStatusChange={onStatusChange}
              isPending={pendingIds?.has(candidate.id)}
            />
          ))}

          {candidates.length === 0 && (
            <div
              className={cn(
                'flex flex-1 min-h-[110px] flex-col items-center justify-center py-6 px-3 text-center border border-dashed rounded-sm transition-colors',
                isOverInvalid
                  ? 'border-red-300 bg-red-50/70 text-red-600'
                  : isOverValid
                    ? 'border-brand/60 bg-brand-light/40 text-brand'
                    : 'border-border/80 bg-white/50 text-subtle'
              )}
            >
              <span className="text-xs font-medium">
                {isOverInvalid
                  ? 'Chỉ chuyển từng bước liên tiếp'
                  : isOverValid
                    ? 'Thả ứng viên vào đây'
                    : 'Không có ứng viên'}
              </span>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
};

export default Column;
