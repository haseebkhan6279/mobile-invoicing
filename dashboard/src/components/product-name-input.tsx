"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { searchProductNames } from "@/actions/stock";
import { cn } from "@/lib/utils";

/**
 * Product name field with suggestions from every name used before (stock,
 * invoices, purchase orders). Renders a textarea that wraps and grows with its
 * text, so a long model name stays fully readable in a narrow column. Enter
 * never inserts a newline: it picks the highlighted suggestion, or submits.
 */
export function ProductNameInput({
  name,
  form,
  defaultValue = "",
  required,
  placeholder,
  className,
}: {
  name: string;
  form?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const listId = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [hits, setHits] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Only look up names once the user has typed, not for the saved value.
  const [dirty, setDirty] = useState(false);
  // The list is position: fixed so a scrolling table wrapper can't clip it.
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);

  // Grow to fit the wrapped text; re-measure when the column width changes.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, value]);

  useEffect(() => {
    const term = value.trim();
    if (!dirty || term.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const results = await searchProductNames(term).catch(() => []);
      if (cancelled) return;
      // Don't offer the exact text already in the field.
      const filtered = results.filter((hit) => hit.toLowerCase() !== term.toLowerCase());
      setHits(filtered);
      setActive(-1);
      setOpen(filtered.length > 0 && document.activeElement === ref.current);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value, dirty]);

  const pick = (hit: string) => {
    setValue(hit);
    setDirty(false);
    setHits([]);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (open && event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && active >= 0) pick(hits[active]);
      else event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <>
      <textarea
        ref={ref}
        name={name}
        form={form}
        rows={1}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(event) => {
          // Pasted line breaks would never be meaningful in a product name.
          const next = event.target.value.replace(/[\r\n]+/g, " ");
          setValue(next);
          setDirty(true);
          if (next.trim().length < 2) {
            setHits([]);
            setOpen(false);
          }
        }}
        onKeyDown={onKeyDown}
        onFocus={() => hits.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={cn("block resize-none overflow-hidden break-words", className)}
      />
      {open && anchor && hits.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          style={{ top: anchor.top, left: anchor.left, minWidth: Math.max(anchor.width, 220) }}
          className="fixed z-50 max-h-64 w-max max-w-[22rem] overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {hits.map((hit, i) => (
            <li
              key={hit}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: it fires before the textarea blurs.
              onMouseDown={(event) => {
                event.preventDefault();
                pick(hit);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "cursor-pointer px-3 py-1.5",
                i === active && "bg-slate-100 dark:bg-slate-800",
              )}
            >
              {hit}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
