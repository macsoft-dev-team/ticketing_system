import { Eye, Pencil, Trash2 } from "lucide-react";

// - Sticky header, zebra striping, subtle borders/rings
// - Keyboard-accessible rows when clickable (Enter triggers onRowClick)
// - Compact size control (sm | md | lg)
// - Action buttons are pure Tailwind (no external Button dependency)
// - Graceful loading/empty states within a single tbody
// - Supports custom cell renderer via renderCell

export default function ReusableTable({
    columns = [],
    data = [],
    headerColor,
    headerTextColor,
    size = "md",
    onRowClick,
    onEdit,
    onDelete,
    onView,
    loading = false,
    SNo = false,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    onPageChange,
    bordered = false,
    renderCell,
    darkMode = false,
}) {
    const showActions = !!(onEdit || onDelete || onView);

    const getAlignClass = (align) => {
        if (align === "right" || align === "end") return "text-right";
        if (align === "center") return "text-center";
        return "text-left";
    };

    const getWrapClass = (textWrap, truncate) => {
        if (truncate) return "truncate";
        if (textWrap === "nowrap") return "whitespace-nowrap";
        if (textWrap === "wrap") return "whitespace-normal";
        return "";
    };

    const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm";
    const cellPad = size === "sm" ? "px-3 py-2" : size === "lg" ? "px-4 py-3" : "px-3 py-2";

    const headerBg = headerColor || (darkMode ? "bg-gray-50 dark:bg-neutral-900/70" : "bg-gray-50");
    const headerText = headerTextColor || (darkMode ? "text-gray-700 dark:text-gray-200" : "text-gray-700");

    const tableChrome = bordered
        ? (darkMode ? "border border-gray-200 dark:border-gray-800" : "border border-gray-200")
        : (darkMode ? "ring-1 ring-gray-200/70 dark:ring-neutral-800/70" : "ring-1 ring-gray-200/70");

    // Calculate items per page safely
    const perPage = totalItems > 0 && totalPages > 0 ? Math.ceil(totalItems / totalPages) : data.length || 1;

    const serialBase = (index) => (Math.max(1, currentPage) - 1) * perPage + index + 1;

    const totalCols = columns.length + (showActions ? 1 : 0) + (SNo ? 1 : 0);

    const rowBaseClasses = darkMode 
        ? "bg-gray-50/60 dark:bg-gray-900 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors"
        : "bg-gray-50/60 hover:bg-blue-50/60 transition-colors";

    const rowClickableClasses = darkMode
        ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

    const buttonBase = darkMode
        ? "inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        : "inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

    const canPaginate = totalPages > 1 && typeof onPageChange === "function";

    const getPaginationRange = (tp, cp, siblingCount = 1) => {
        const totalNumbers = siblingCount * 2 + 5;
        if (tp <= totalNumbers) {
            return Array.from({ length: tp }, (_, i) => i + 1);
        }

        const leftSibling = Math.max(cp - siblingCount, 1);
        const rightSibling = Math.min(cp + siblingCount, tp);

        const showLeftDots = leftSibling > 2;
        const showRightDots = rightSibling < tp - 1;

        if (!showLeftDots && showRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, "...", tp];
        }

        if (showLeftDots && !showRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const start = tp - rightItemCount + 1;
            const rightRange = Array.from({ length: rightItemCount }, (_, i) => start + i);
            return [1, "...", ...rightRange];
        }

        const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
        return [1, "...", ...middleRange, "...", tp];
    };

    const pageBtnBase = darkMode
        ? "inline-flex h-9 min-w-9 items-center justify-center border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        : "inline-flex h-9 min-w-9 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className={`overflow-x-auto w-full ${tableChrome} ${darkMode ? "bg-white dark:bg-neutral-900" : "bg-white"}`}>
            <table className={`w-full table-auto ${textSize}`}>
                <thead className="sticky top-0 z-10 select-none">
                    <tr>
                        {SNo && (
                            <th
                                className={`${headerBg} ${headerText} ${cellPad} uppercase font-semibold text-xs tracking-wide text-center ${bordered ? (darkMode ? "border-b border-gray-200 dark:border-gray-800" : "border-b border-gray-200") : ""
                                    } sticky top-0`}
                                style={{ minWidth: 56 }}
                                scope="col"
                            >
                                SNo
                            </th>
                        )}
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`${headerBg} ${headerText} ${cellPad} uppercase font-semibold text-xs tracking-wide ${getAlignClass(
                                    col.align
                                )} ${getWrapClass(col.textWrap, col.truncate)} ${bordered ? (darkMode ? "border-b border-gray-200 dark:border-gray-800" : "border-b border-gray-200") : ""
                                    } sticky top-0`}
                                style={{
                                    ...(col.width ? { width: col.width, minWidth: 72 } : { minWidth: 72 }),
                                }}
                                scope="col"
                            >
                                {col.label}
                            </th>
                        ))}
                        {showActions && (
                            <th
                                className={`${headerBg} ${headerText} ${cellPad} uppercase font-semibold text-xs tracking-wide text-center ${bordered ? (darkMode ? "border-b border-gray-200 dark:border-gray-800" : "border-b border-gray-200") : ""
                                    } sticky top-0`}
                                scope="col"
                                style={{ minWidth: 96 }}
                            >
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {loading && (
                        <tr>
                            <td className={`text-center ${cellPad} ${darkMode ? "text-blue-600 dark:text-blue-300" : "text-blue-600"}`} colSpan={totalCols}>
                                <div className="mx-auto flex h-10 items-center justify-center gap-2">
                                    <span className="sr-only">Loading</span>
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                    <span>Loading...</span>
                                </div>
                            </td>
                        </tr>
                    )}

                    {!loading && data.length === 0 && (
                        <tr>
                            <td className={`text-center ${cellPad} ${darkMode ? "text-gray-500 dark:text-gray-300" : "text-gray-500"}`} colSpan={totalCols}>
                                No data available
                            </td>
                        </tr>
                    )}

                    {!loading &&
                        data.length > 0 &&
                        data.map((row, i) => {
                            const clickable = typeof onRowClick === "function";
                            const onKey = (e) => {
                                if (!clickable) return;
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onRowClick(row);
                                }
                            };
                            return (
                                <tr
                                    key={i}
                                    className={`${rowBaseClasses} ${clickable ? rowClickableClasses : ""}`}
                                    onClick={() => clickable && onRowClick(row)}
                                    tabIndex={clickable ? 0 : undefined}
                                    role={clickable ? "button" : undefined}
                                    onKeyDown={onKey}
                                >
                                    {SNo && (
                                        <td
                                            className={`text-center ${cellPad} ${darkMode ? "text-gray-700 dark:text-gray-200" : "text-gray-700"} ${bordered ? (darkMode ? "border-t border-gray-100 dark:border-gray-800" : "border-t border-gray-100") : ""
                                                }`}
                                        >
                                            {serialBase(i)}
                                        </td>
                                    )}

                                    {columns.map((col) => {
                                        const value =
                                            col.dataType === "date"
                                                ? row[col.key]
                                                    ? new Date(row[col.key]).toLocaleString()
                                                    : ""
                                                : row[col.key];

                                        return (
                                            <td
                                                key={col.key}
                                                style={col.width ? { width: col.width, minWidth: 72 } : { minWidth: 72 }}
                                                className={`${cellPad} ${getAlignClass(col.align)} ${getWrapClass(
                                                    col.textWrap,
                                                    col.truncate
                                                )} ${darkMode ? "text-gray-800 dark:text-gray-200" : "text-gray-800"} ${bordered ? (darkMode ? "border-t border-gray-100 dark:border-gray-800" : "border-t border-gray-100") : ""}`}
                                            >
                                                {typeof renderCell === "function"
                                                    ? renderCell(col, row)
                                                    : value !== undefined && value !== null && value !== ""
                                                        ? value
                                                        : <div className={darkMode ? "text-gray-400 dark:text-gray-500" : "text-gray-400"}>--</div>}
                                            </td>
                                        );
                                    })}

                                    {showActions && (
                                        <td
                                            className={`text-center ${cellPad} ${bordered ? (darkMode ? "border-t border-gray-100 dark:border-gray-800" : "border-t border-gray-100") : ""
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {onView && (
                                                    <button
                                                        type="button"
                                                        className={`${buttonBase} ${darkMode ? "text-blue-600 dark:text-blue-400" : "text-blue-600"}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onView(row);
                                                        }}
                                                        aria-label="View row"
                                                        title="View"
                                                    >
                                                        <Eye size={16} aria-hidden="true" />
                                                        <span className="sr-only">View</span>
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        className={`${buttonBase} ${darkMode ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-600"}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(row);
                                                        }}
                                                        aria-label="Edit row"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} aria-hidden="true" />
                                                        <span className="sr-only">Edit</span>
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        className={`${buttonBase} ${darkMode ? "text-red-600 dark:text-red-400" : "text-red-600"}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(row);
                                                        }}
                                                        aria-label="Delete row"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                        <span className="sr-only">Delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                </tbody>
            </table>

            {canPaginate && (
                <div className={`flex flex-col-reverse sm:flex-row items-center gap-2 w-full justify-between border-t px-3 py-2 ${darkMode ? "border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-neutral-900/60" : "border-gray-200 bg-gray-50/40"}`}>
                    <div className={`text-xs text-nowrap ${darkMode ? "text-gray-600 dark:text-gray-400" : "text-gray-600"}`}>
                        Page {currentPage} of {totalPages}
                    </div>

                    <nav className="flex ms-auto items-center gap-1" aria-label="Pagination">
                        <button
                            type="button"
                            className={pageBtnBase}
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            aria-label="First page"
                        >
                            {"<<"}
                        </button>
                        <button
                            type="button"
                            className={pageBtnBase}
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                        >
                            {"<"}
                        </button>

                        {getPaginationRange(totalPages, currentPage).map((p, idx) => {
                            return p === "..." ? (
                                <span key={`ellipsis-${idx}`} className="select-none px-2 text-gray-400">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={`page-${p}`}
                                    type="button"
                                    onClick={() => onPageChange(p)}
                                    aria-current={p === currentPage ? "page" : undefined}
                                    className={`inline-flex h-9 min-w-9 items-center justify-center transition-colors px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed border  ${Number(p) === Number(currentPage) 
                                        ? (darkMode ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300" : "border-blue-200 bg-blue-50 text-blue-700") 
                                        : (darkMode ? "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100")}`}
                                >
                                    {p}
                                </button>
                            )
                        }
                        )}

                        <button
                            type="button"
                            className={pageBtnBase}
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                        >
                            {">"}
                        </button>
                        <button
                            type="button"
                            className={pageBtnBase}
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            aria-label="Last page"
                        >
                            {">>"}
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
}
