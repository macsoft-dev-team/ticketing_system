import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import { ChevronDown } from "lucide-react";

/**
 * Select — corrected functionality (final)
 * - Robust outside click handling (backdrop + document capture)
 * - Keyboard navigation: ArrowUp/Down, Home/End, Enter/Space, Escape
 * - ARIA roles (combobox + listbox + option) for accessibility
 * - Portal with smart positioning (auto chooses up/down based on space)
 * - Repositions on scroll/resize; no magic numbers
 * - Works with option objects {label, value} or primitive strings
 * - Type-agnostic equality ("42" equals 42, "true" equals true)
 * - RHF-friendly: forwards onBlur/name/id, event-like onChange
 * - Optional portalWithin to control where the menu is portaled
 */

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isEqual = (a, b) => String(a) === String(b);

const getVal = (opt) => (opt && Object.prototype.hasOwnProperty.call(opt, "value") ? opt.value : opt);
const getLbl = (opt) => (opt && Object.prototype.hasOwnProperty.call(opt, "label") ? opt.label : String(opt ?? ""));

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  id,
  name,
  direction = "auto", // 'auto' | 'down' | 'up'
  maxMenuHeight = 240,
  portalWithin, // optional: specify container for portal
  onBlur, // forwarded (useful for RHF)
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [actualDirection, setActualDirection] = useState("down");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const values = useMemo(() => options.map(getVal), [options]);
  const labels = useMemo(() => options.map(getLbl), [options]);
  const selectedIndex = useMemo(
    () => values.findIndex((v) => isEqual(v, value)),
    [values, value]
  );

  // Compute and set dropdown position
  const computePosition = useCallback(() => {
    const el = containerRef.current;
    if (!open || !el) return;
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportH = window.innerHeight;

    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;

    let dir = direction;
    if (direction === "auto") {
      dir = spaceBelow >= Math.min(maxMenuHeight, viewportH * 0.6) || spaceBelow >= spaceAbove ? "down" : "up";
    }

    const menuHeight = Math.min(
      maxMenuHeight,
      dir === "down" ? Math.max(160, spaceBelow - 8) : Math.max(160, spaceAbove - 8)
    );

    const style = {
      position: "absolute",
      left: rect.left + scrollX,
      top: dir === "up" ? rect.top + scrollY - menuHeight : rect.bottom + scrollY,
      width: rect.width,
      zIndex: 9999,
      maxHeight: menuHeight,
    };

    setActualDirection(dir);
    setDropdownStyle(style);
  }, [direction, maxMenuHeight, open]);

  // Reposition on open/scroll/resize
  useEffect(() => {
    if (!open) return;
    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePosition]);

  // Outside click handler (in addition to backdrop for safety)
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (!containerRef.current) return;
      const inTrigger = containerRef.current.contains(e.target);
      const inList = listRef.current && listRef.current.contains(e.target);
      if (!inTrigger && !inList) setOpen(false);
    };
    document.addEventListener("mousedown", handle, true);
    return () => document.removeEventListener("mousedown", handle, true);
  }, [open]);

  // Manage highlight index when opening
  useEffect(() => {
    if (open) {
      const start = selectedIndex >= 0 ? selectedIndex : 0;
      setHighlightIndex(start);
      setTimeout(() => {
        const el = listRef.current?.querySelector(`[data-index="${start}"]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
      }, 0);
    }
  }, [open, selectedIndex]);

  const commitChange = (idx) => {
    const val = values[idx];
    if (onChange) onChange({ target: { value: val, name, id } });
    setOpen(false);
  };

  // Keyboard navigation on the trigger
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlightIndex((i) => clamp(i + 1, 0, values.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlightIndex((i) => clamp(i - 1, 0, values.length - 1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setHighlightIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setHighlightIndex(values.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) setOpen(true);
        else if (highlightIndex >= 0) commitChange(highlightIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      default:
        break;
    }
  };

  const selectedLabel = selectedIndex >= 0 ? labels[selectedIndex] : "";

  const dropdown = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onClick={() => setOpen(false)}
      />
      <div style={dropdownStyle}>
        <div
          ref={listRef}
          role="listbox"
          id={id ? `${id}-listbox` : undefined}
          aria-labelledby={id}
          className={`rounded shadow-lg border border-gray-300 bg-white overflow-auto ${actualDirection === "up" ? "rounded-b-none" : "rounded-t-none"}`}
          style={{ maxHeight: dropdownStyle.maxHeight }}
        >
          {options.length === 0 && (
            <div className="px-4 py-2 text-gray-400">No options</div>
          )}
          {options.map((opt, i) => {
            const isSelected = i === selectedIndex;
            const isActive = i === highlightIndex;
            return (
              <div
                key={i}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                className={`px-4 py-2 cursor-pointer whitespace-nowrap ${isActive
                    ? "bg-blue-100 text-blue-900"
                    : isSelected
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-gray-700"
                  }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  commitChange(i);
                }}
              >
                {labels[i]}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div
        ref={containerRef}
        id={id}
        tabIndex={disabled ? -1 : 0}
        className={`relative w-full select-none ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
        aria-disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? (id ? `${id}-listbox` : undefined) : undefined}
        onClick={() => !disabled && setOpen((p) => !p)}
        onKeyDown={handleTriggerKeyDown}
        onBlur={onBlur}
        {...props}
      >
        <div className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded focus:outline-none">
          <span className={`${!selectedLabel ? "text-gray-400" : ""} whitespace-nowrap`}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown size={20} className="ml-2 text-gray-400" />
        </div>
      </div>
      {open && !disabled && ReactDOM.createPortal(dropdown, portalWithin || document.body)}
    </>
  );
};

export default Select;
