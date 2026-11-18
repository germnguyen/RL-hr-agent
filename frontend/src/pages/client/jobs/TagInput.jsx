import React, { useState } from "react";
import { X } from "lucide-react";

const TagInput = ({ tags, setTags }) => {
  const [inputVal, setInputVal] = useState("");

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      const newTag = inputVal.trim().replace(/,$/, "");
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputVal("");
    }
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-input bg-surface focus-within:bg-background focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all min-h-[46px] cursor-text">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-light text-brand text-xs font-semibold rounded-full border border-brand/20 shadow-2xs transition-all"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="inline-flex items-center justify-center size-3.5 rounded-full hover:bg-brand/20 text-brand/70 hover:text-brand transition-colors cursor-pointer"
            aria-label={`Xóa ${tag}`}
          >
            <X className="size-3" strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-[160px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        placeholder={tags.length === 0 ? "VD: React, Node.js, Figma — nhấn Enter để thêm" : "Thêm kỹ năng..."}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={addTag}
      />
    </div>
  );
};

export default TagInput;
