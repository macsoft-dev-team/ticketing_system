import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, X, Search } from "lucide-react";

/**
 * MultiSelect Component
 * - Similar to Select but allows multiple selections
 * - Shows selected values as chips with remove buttons
 * - Supports keyboard navigation and accessibility
 * - Compatible with the existing Select component styling
 */

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isEqual = (a, b) => String(a) === String(b);

const getVal = (opt) => (opt && Object.prototype.hasOwnProperty.call(opt, "value") ? opt.value : opt);
const getLbl = (opt) => (opt && Object.prototype.hasOwnProperty.call(opt, "label") ? opt.label : String(opt ?? ""));

const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  className = "",
  disabled = false,
  id,
  name,
  direction = "auto",
  maxMenuHeight = 240,
  portalWithin,
  onBlur,
  maxSelectedDisplay = 3, // Show up to 3 chips, then show "+X more"
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const [showAllSelected, setShowAllSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [actualDirection, setActualDirection] = useState("down");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const values = useMemo(() => options.map(getVal), [options]);
  const labels = useMemo(() => options.map(getLbl), [options]);
  
  // Ensure value is always an array
  const selectedValues = Array.isArray(value) ? value : [];
  
  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter(opt => 
      getLbl(opt).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);
  
  const filteredValues = useMemo(() => filteredOptions.map(getVal), [filteredOptions]);
  const filteredLabels = useMemo(() => filteredOptions.map(getLbl), [filteredOptions]);
  
  const selectedIndices = useMemo(
    () => values.map((v, i) => selectedValues.some(sv => isEqual(sv, v)) ? i : -1).filter(i => i !== -1),
    [values, selectedValues]
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

  // Outside click handler
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (!containerRef.current) return;
      const inTrigger = containerRef.current.contains(e.target);
      const inList = listRef.current && listRef.current.contains(e.target);
      const inSearch = searchInputRef.current && searchInputRef.current.contains(e.target);
      if (!inTrigger && !inList && !inSearch) setOpen(false);
    };
    document.addEventListener("mousedown", handle, true);
    return () => document.removeEventListener("mousedown", handle, true);
  }, [open]);

  // Manage highlight index when opening and focus search input
  useEffect(() => {
    if (open) {
      setHighlightIndex(0);
      setSearchQuery("");
      // Focus search input after dropdown opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      setShowAllSelected(false);
    }
  }, [open]);

  const toggleOption = (idx, useFiltered = false) => {
    const targetValues = useFiltered ? filteredValues : values;
    const val = targetValues[idx];
    let newSelectedValues;
    
    if (selectedValues.some(sv => isEqual(sv, val))) {
      // Remove from selection
      newSelectedValues = selectedValues.filter(sv => !isEqual(sv, val));
    } else {
      // Add to selection
      newSelectedValues = [...selectedValues, val];
    }
    
    if (onChange) {
      onChange({ target: { value: newSelectedValues, name, id } });
    }
  };

  const removeOption = (valToRemove) => {
    const newSelectedValues = selectedValues.filter(sv => !isEqual(sv, valToRemove));
    if (onChange) {
      onChange({ target: { value: newSelectedValues, name, id } });
    }
  };

  // Keyboard navigation
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlightIndex((i) => clamp(i + 1, 0, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlightIndex((i) => clamp(i - 1, 0, filteredOptions.length - 1));
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
          setHighlightIndex(filteredOptions.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) setOpen(true);
        else if (highlightIndex >= 0) toggleOption(highlightIndex, true);
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

  // Handle search input key events
  const handleSearchKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => clamp(i + 1, 0, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => clamp(i - 1, 0, filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0) toggleOption(highlightIndex, true);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  };

  // Get selected labels for display
  const selectedLabels = selectedValues.map(val => {
    const idx = values.findIndex(v => isEqual(v, val));
    return idx >= 0 ? labels[idx] : String(val);
  });

  const renderSelectedChips = () => {
    if (selectedLabels.length === 0) {
      return <span className="text-gray-400">{placeholder}</span>;
    }

    // If showAllSelected is true, show all chips
    const displayLabels = showAllSelected ? selectedLabels : selectedLabels.slice(0, maxSelectedDisplay);
    const remainingCount = showAllSelected ? 0 : selectedLabels.length - maxSelectedDisplay;

    return (
      <div className="flex flex-wrap gap-1">
        {displayLabels.map((label, idx) => {
          const value = selectedValues[idx];
          return (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(value);
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        {remainingCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllSelected(true);
            }}
            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            +{remainingCount} more
          </button>
        )}
        {showAllSelected && selectedLabels.length > maxSelectedDisplay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllSelected(false);
            }}
            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    );
  };

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
          aria-multiselectable="true"
          className={`rounded shadow-lg border border-gray-300 bg-white ${actualDirection === "up" ? "rounded-b-none" : "rounded-t-none"}`}
          style={{ maxHeight: dropdownStyle.maxHeight }}
        >
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightIndex(0); // Reset highlight to first filtered item
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search options..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Options List */}
          <div className="overflow-auto" style={{ maxHeight: (dropdownStyle.maxHeight || 240) - 60 }}>
            {filteredOptions.length === 0 && (
              <div className="px-4 py-2 text-gray-400">
                {searchQuery ? 'No matching options' : 'No options'}
              </div>
            )}
            {filteredOptions.map((opt, i) => {
              const originalIndex = values.findIndex(v => isEqual(v, getVal(opt)));
              const isSelected = selectedIndices.includes(originalIndex);
              const isActive = i === highlightIndex;
              return (
                <div
                  key={i}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  className={`px-4 py-2 cursor-pointer whitespace-nowrap flex items-center ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setHighlightIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(i, true);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Controlled by onClick
                    className="mr-2"
                    tabIndex={-1}
                  />
                  {getLbl(opt)}
                </div>
              );
            })}
          </div>
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
        onClick={(e) => {
          // Don't open if clicking on chip remove buttons or "more" buttons
          if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
          }
          if (!disabled) setOpen((p) => !p);
        }}
        onKeyDown={handleTriggerKeyDown}
        onBlur={onBlur}
        {...props}
      >
        <div className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded focus:outline-none min-h-[42px]">
          <div className="flex-1 mr-2">
            {renderSelectedChips()}
          </div>
          <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
        </div>
      </div>
      {open && !disabled && ReactDOM.createPortal(dropdown, portalWithin || document.body)}
    </>
  );
};

export default MultiSelect;