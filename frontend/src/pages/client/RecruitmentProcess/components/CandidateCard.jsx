import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-toastify';
import { MoreVertical, Check, GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLUMNS, validateStatusChange, isAdjacentStatus } from '../kanbanUtils';

const STATUS_CONFIG = {
  applied: {
    label: 'Ứng tuyển',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    cardBorder: 'border-l-[3px] border-l-blue-500',
  },
  screening: {
    label: 'Sàng lọc',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    cardBorder: 'border-l-[3px] border-l-purple-500',
  },
  interview: {
    label: 'Phỏng vấn',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    cardBorder: 'border-l-[3px] border-l-amber-500',
  },
  offer: {
    label: 'Đề nghị',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    cardBorder: 'border-l-[3px] border-l-emerald-500',
  },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || {
    label: status,
    badgeClass: 'bg-slate-100 text-subtle border-border',
    cardBorder: 'border-l-[3px] border-l-brand',
  };

const STOP_DRAG_EVENTS = {
  onPointerDown: (e) => e.stopPropagation(),
  onMouseDown: (e) => e.stopPropagation(),
  onTouchStart: (e) => e.stopPropagation(),
  onKeyDown: (e) => e.stopPropagation(),
};

export const CandidateCardOverlay = ({ candidate }) => {
  if (!candidate) return null;
  const { candidateCode, name, position, status } = candidate;
  const currentConfig = getStatusConfig(status);

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-card border border-brand/50 rounded-sm p-2 shadow-lg ring-2 ring-brand/25 select-none cursor-grabbing rotate-[0.75deg]',
        currentConfig.cardBorder
      )}
    >
      <div className="flex justify-between items-center mb-1.5 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <GripVertical className="size-3.5 text-brand shrink-0" aria-hidden="true" />
          <span
            className={cn(
              'inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 leading-none rounded-sm border',
              currentConfig.badgeClass
            )}
          >
            {currentConfig.label}
          </span>
        </div>
        <span className="p-0.5 text-subtle">
          <MoreVertical className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-col gap-0.5 mb-2 min-w-0">
        <div className="font-semibold text-[13px] leading-snug text-ink truncate">
          {name}
        </div>
        <div className="text-[11.5px] leading-snug text-subtle truncate">
          {position}
        </div>
      </div>

      <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1.5">
        <span className="font-mono text-[10.5px] text-subtle font-medium truncate">
          #{candidateCode}
        </span>
        <span className="inline-flex items-center justify-center h-6 px-2 rounded-sm bg-emerald-600 text-white text-[11px] font-medium whitespace-nowrap shrink-0">
          Chi tiết ứng viên
        </span>
      </div>
    </div>
  );
};

const CandidateCard = ({ candidate, onStatusChange, isPending = false }) => {
  const navigate = useNavigate();
  const { id, candidateCode, name, position, status } = candidate;
  const [menuOpen, setMenuOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'candidate',
      candidate,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    if (!menuOpen && menuTriggerRef.current) {
      const rect = menuTriggerRef.current.getBoundingClientRect();
      const estimatedMenuHeight = 186;
      const menuMinWidth = 164;
      const top =
        rect.bottom + 4 + estimatedMenuHeight > window.innerHeight
          ? Math.max(8, rect.top - estimatedMenuHeight - 4)
          : rect.bottom + 4;
      const left = Math.max(menuMinWidth + 8, Math.min(rect.right, window.innerWidth - 8));
      setPopoverPos({
        top,
        left,
      });
    }
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuTriggerRef.current &&
        !menuTriggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    const handleScroll = () => {
      setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const handleStatusSelect = (newStatus) => {
    if (newStatus === status) {
      setMenuOpen(false);
      return;
    }
    const validation = validateStatusChange(status, newStatus);
    if (!validation.isValid) {
      toast.error(validation.message);
      setMenuOpen(false);
      return;
    }
    onStatusChange(id, newStatus);
    setMenuOpen(false);
  };

  const currentConfig = getStatusConfig(status);

  const popoverEl = menuOpen
    ? ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="bg-white dark:bg-card border border-border rounded-sm shadow-lg overflow-hidden min-w-[164px] z-[99999] animate-in fade-in zoom-in-95 duration-100"
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            transform: 'translateX(-100%)',
          }}
          {...STOP_DRAG_EVENTS}
        >
          <div className="bg-brand-light dark:bg-brand/10 text-brand px-3 py-1.5 text-[11px] font-bold border-b border-brand/15">
            Chuyển giai đoạn
          </div>
          <div className="flex flex-col py-0.5">
            {COLUMNS.map((col) => {
              const isCurrent = col.id === status;
              const isAllowed = isCurrent || isAdjacentStatus(status, col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between',
                    isCurrent
                      ? 'bg-brand text-white font-semibold hover:bg-brand-dark'
                      : isAllowed
                        ? 'text-ink hover:bg-slate-100 dark:hover:bg-muted'
                        : 'text-subtle/60 hover:bg-red-50/70 hover:text-red-600'
                  )}
                  onClick={() => handleStatusSelect(col.id)}
                >
                  <span>{col.title}</span>
                  {isCurrent && <Check className="size-3.5 ml-2 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'w-full bg-white dark:bg-card border border-border rounded-sm p-2 shadow-2xs select-none relative shrink-0 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          currentConfig.cardBorder,
          isDragging
            ? 'opacity-35 border-dashed border-brand/60 bg-brand-light/20 shadow-none'
            : 'cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600',
          isPending && !isDragging && 'ring-1 ring-brand/25'
        )}
      >
        {/* Header row */}
        <div className="flex justify-between items-center mb-1.5 gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <GripVertical className="size-3.5 text-hint shrink-0" aria-hidden="true" />
            <span
              className={cn(
                'inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 leading-none rounded-sm border',
                currentConfig.badgeClass
              )}
            >
              {currentConfig.label}
            </span>
            {isPending && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-brand shrink-0"
                title="Đang đồng bộ trạng thái"
              >
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              </span>
            )}
          </div>
          <button
            ref={menuTriggerRef}
            type="button"
            className="p-0.5 rounded-sm text-subtle hover:text-ink hover:bg-slate-100 dark:hover:bg-muted active:scale-95 transition-colors cursor-pointer shrink-0"
            {...STOP_DRAG_EVENTS}
            onClick={handleMenuToggle}
            aria-label="Chuyển giai đoạn"
            title="Chuyển giai đoạn"
          >
            <MoreVertical className="size-3.5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex flex-col gap-0.5 mb-2 min-w-0">
          <div className="font-semibold text-[13px] leading-snug text-ink truncate" title={name}>
            {name}
          </div>
          <div className="text-[11.5px] leading-snug text-subtle truncate" title={position}>
            {position}
          </div>
        </div>

        {/* Compact Card Footer */}
        <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1.5">
          <span
            className="font-mono text-[10.5px] text-subtle font-medium truncate"
            title={`Mã ứng viên: ${candidateCode}`}
          >
            #{candidateCode}
          </span>
          <button
            type="button"
            className="inline-flex items-center justify-center h-6 px-2 rounded-sm text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600"
            {...STOP_DRAG_EVENTS}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/candidates/${id}`);
            }}
          >
            Chi tiết ứng viên
          </button>
        </div>
      </div>

      {popoverEl}
    </>
  );
};

export default CandidateCard;
