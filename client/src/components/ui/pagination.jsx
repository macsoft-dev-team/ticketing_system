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

    if (!canPaginate) {
        return null;
    }

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
        ? "inline-flex sm:h-9 min-h-6 max-h-6 sm:min-h-9 sm:min-w-9 max-w-4 items-center justify-center border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors px-3 text-[10px] sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        : "inline-flex sm:h-9 min-h-6 max-h-6 sm:min-h-9 sm:min-w-9 max-w-4 items-center justify-center border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors px-3 text-[10px] sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className={`sm:flex items-center grid gap-2 text-center sm:text-start sm:justify-between border-t px-2 sm:px-3 py-2 ${darkMode ? "border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-neutral-900/60" : "border-gray-200 bg-gray-50/40"}`}>
            {showItemsInfo && (
                <div className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-600 dark:text-gray-400" : "text-gray-600"}`}>
                    Page {currentPage} of {totalPages}
                    {totalItems > 0 && (
                        <span className="ml-2">
                            ({totalItems} total items)
                        </span>
                    )}
                </div>
            )}

            <nav className="flex items-center sm:text-xs text-[10px] gap-1" aria-label="Pagination">
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

                {getPaginationRange(totalPages, currentPage, siblingCount).map((p, idx) => {
                    return p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="select-none sm:px-2 text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={`page-${p}`}
                            type="button"
                            onClick={() => onPageChange(p)}
                            aria-current={p === currentPage ? "page" : undefined}
                                className={`inline-flex sm:h-9 sm:min-w-9 min-h-6 sm:min-h-9 max-h-6 items-center justify-center transition-colors px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed border  ${Number(p) === Number(currentPage) 
                                ? (darkMode ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300" : "border-blue-200 bg-blue-50 text-blue-700") 
                                : (darkMode ? "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100")}`}
                        >
                            {p}
                        </button>
                    )
                })}

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
    );
}
