export default function Pagination({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    onPageChange,
    darkMode = false,
    siblingCount = 1,
    showItemsInfo = true,
}) {
    const canPaginate = totalPages > 1 && typeof onPageChange === "function";
    if (!canPaginate) return null;

    /* ---------------- Pagination Logic ---------------- */

    const getPaginationRange = (totalPages, currentPage, siblingCount = 1) => {
        const totalNumbers = siblingCount * 2 + 5;

        if (totalPages <= totalNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSibling = Math.max(currentPage - siblingCount, 1);
        const rightSibling = Math.min(currentPage + siblingCount, totalPages);

        const showLeftDots = leftSibling > 2;
        const showRightDots = rightSibling < totalPages - 1;

        let pages = [];

        if (!showLeftDots && showRightDots) {
            const count = 3 + siblingCount * 2;
            pages = [
                ...Array.from({ length: count }, (_, i) => i + 1),
                "...",
                totalPages,
            ];
        } else if (showLeftDots && !showRightDots) {
            const count = 3 + siblingCount * 2;
            pages = [
                1,
                "...",
                ...Array.from({ length: count }, (_, i) => totalPages - count + i + 1),
            ];
        } else {
            pages = [
                1,
                "...",
                ...Array.from(
                    { length: rightSibling - leftSibling + 1 },
                    (_, i) => leftSibling + i
                ),
                "...",
                totalPages,
            ];
        }

        // ✅ Deduplicate to prevent repeated pages
        return [...new Set(pages)];
    };

    /* ---------------- Styles ---------------- */

    const btnBase = darkMode
        ? "h-8 min-w-8 px-3 border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs rounded"
        : "h-8 min-w-8 px-3 border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 text-xs rounded";

    const btnActive =
        "h-8 min-w-8 px-3 border border-blue-300 bg-blue-50 text-blue-700 text-xs rounded";

    const selectBase = darkMode
        ? "border-neutral-700 bg-neutral-800 text-neutral-200"
        : "border-gray-300 bg-white text-gray-700";

    /* ---------------- Render ---------------- */

    return (
        <div
            className={`border-t px-3 py-2 ${darkMode
                    ? "border-neutral-800 bg-neutral-900/60"
                    : "border-gray-200 bg-gray-50"
                }`}
        >
            {/* ---------- MOBILE ---------- */}
            <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center justify-between gap-2">
                    <button
                        className={btnBase}
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        Prev
                    </button>

                    <select
                        value={currentPage}
                        onChange={(e) => onPageChange(Number(e.target.value))}
                        className={`h-8 px-2 text-xs rounded border focus:ring-2 focus:ring-blue-200 ${selectBase}`}
                    >
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <option key={i} value={i + 1}>
                                Page {i + 1}
                            </option>
                        ))}
                    </select>

                    <button
                        className={btnBase}
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        Next
                    </button>
                </div>

                {showItemsInfo && (
                    <div
                        className={`text-xs text-center ${darkMode ? "text-neutral-400" : "text-gray-600"
                            }`}
                    >
                        Page {currentPage} of {totalPages}
                        {totalItems > 0 && (
                            <span className="ml-1">({totalItems} items)</span>
                        )}
                    </div>
                )}
            </div>

            {/* ---------- DESKTOP ---------- */}
            <div className="hidden sm:flex items-center justify-between gap-4">
                {showItemsInfo && (
                    <div
                        className={`text-xs ${darkMode ? "text-neutral-400" : "text-gray-600"
                            }`}
                    >
                        Page {currentPage} of {totalPages}
                        {totalItems > 0 && (
                            <span className="ml-1">({totalItems} items)</span>
                        )}
                    </div>
                )}

                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                        className={btnBase}
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(1)}
                    >
                        {"<<"}
                    </button>

                    <button
                        className={btnBase}
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        {"<"}
                    </button>

                    {getPaginationRange(
                        totalPages,
                        currentPage,
                        siblingCount
                    ).map((p, idx) =>
                        p === "..." ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="px-2 text-gray-400 select-none"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={`page-${p}-${idx}`}
                                onClick={() => onPageChange(p)}
                                aria-current={
                                    p === currentPage ? "page" : undefined
                                }
                                className={
                                    p === currentPage ? btnActive : btnBase
                                }
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        className={btnBase}
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        {">"}
                    </button>

                    <button
                        className={btnBase}
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(totalPages)}
                    >
                        {">>"}
                    </button>

                    {/* Page Select (Desktop) */}
                    <select
                        value={currentPage}
                        onChange={(e) =>
                            onPageChange(Number(e.target.value))
                        }
                        className={`ml-2 h-8 px-2 text-xs rounded border focus:ring-2 focus:ring-blue-200 ${selectBase}`}
                    >
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <option key={i} value={i + 1}>
                                Page {i + 1}
                            </option>
                        ))}
                    </select>
                </nav>
            </div>
        </div>
    );
}
