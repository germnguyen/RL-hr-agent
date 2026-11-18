import React from "react";
import { Bold, Italic, List } from "lucide-react";

const RichToolbar = ({ textareaRef }) => {
  const wrapSelection = (before, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const newVal =
      el.value.slice(0, start) + before + selected + after + el.value.slice(end);

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    nativeInputValueSetter.call(el, newVal);
    el.dispatchEvent(new Event("input", { bubbles: true }));

    el.focus();
    el.selectionStart = start + before.length;
    el.selectionEnd = start + before.length + selected.length;
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-2/80 border-b border-input rounded-t-xl text-subtle text-xs">
      <button
        type="button"
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-surface hover:text-foreground active:scale-95 transition-all cursor-pointer"
        title="In đậm (**text**)"
        onClick={() => wrapSelection("**")}
      >
        <Bold className="size-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-surface hover:text-foreground active:scale-95 transition-all cursor-pointer"
        title="In nghiêng (_text_)"
        onClick={() => wrapSelection("_")}
      >
        <Italic className="size-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-surface hover:text-foreground active:scale-95 transition-all cursor-pointer"
        title="Danh sách dấu chấm"
        onClick={() => wrapSelection("\n• ", "")}
      >
        <List className="size-4" strokeWidth={2.5} />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <span className="ml-auto text-[11px] text-hint font-medium select-none">
        Markdown supported
      </span>
    </div>
  );
};

export default RichToolbar;
