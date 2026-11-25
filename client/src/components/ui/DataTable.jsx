import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function DataTable({ 
    columns = [], 
    data = [], 
    itemsPerPage = 10, 
    onRowClick,
    totalItems,
    currentPage: controlledPage,
    onPageChange,
    currentSortBy,
    onSortChange,
    loading = false
}) {
    const [sortConfig, setSortConfig] = useState(null);
    const [internalPage, setInternalPage] = useState(1);

    const isControlled = typeof onPageChange === 'function';
    const isServerSorted = typeof onSortChange === 'function';
    const currentPage = isControlled ? (controlledPage || 1) : internalPage;

    // Detect if any column uses groupHeader
    const hasGroupHeaders = useMemo(() => {
        return columns.some(col => !!col.groupHeader);
    }, [columns]);

    // Build grouped header layout if group headers exist
    const headerGroups = useMemo(() => {
        if (!hasGroupHeaders) return null;

        const groups = [];
        let currentGroup = null;

        columns.forEach((col, index) => {
            if (col.groupHeader) {
                if (currentGroup && currentGroup.name === col.groupHeader) {
                    currentGroup.columns.push(col);
                    currentGroup.endIndex = index;
                } else {
                    currentGroup = {
                        name: col.groupHeader,
                        columns: [col],
                        startIndex: index,
                        endIndex: index
                    };
                    groups.push(currentGroup);
                }
            } else {
                currentGroup = null;
                groups.push({
                    name: null,
                    columns: [col],
                    startIndex: index,
                    endIndex: index
                });
            }
        });

        return groups;
    }, [columns, hasGroupHeaders]);

    // Sorting logic (used only when server-side sorting is not active)
    const sortedData = useMemo(() => {
        if (isServerSorted || !sortConfig) return data;
        
        const sorted = [...data].sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            const isEmptyA = valA === null || valA === undefined || valA === '' || valA === '—';
            const isEmptyB = valB === null || valB === undefined || valB === '' || valB === '—';

            if (isEmptyA && isEmptyB) return 0;
            if (isEmptyA) return sortConfig.direction === 'asc' ? 1 : -1;
            if (isEmptyB) return sortConfig.direction === 'asc' ? -1 : 1;

            const numA = typeof valA === 'number' ? valA : (typeof valA === 'string' && valA.trim() !== '' ? Number(valA) : NaN);
            const numB = typeof valB === 'number' ? valB : (typeof valB === 'string' && valB.trim() !== '' ? Number(valB) : NaN);

            if (!isNaN(numA) && !isNaN(numB)) {
                return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            const strA = String(valA);
            const strB = String(valB);
            return sortConfig.direction === 'asc' 
                ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' }) 
                : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        return sorted;
    }, [data, sortConfig, isServerSorted]);

    // Pagination logic
    const totalCount = totalItems !== undefined ? totalItems : sortedData.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

    const paginatedData = useMemo(() => {
        if (isControlled) {
            return sortedData;
        }
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, isControlled, currentPage, itemsPerPage]);

    const handlePageChange = (newPage) => {
        const clamped = Math.max(1, Math.min(newPage, totalPages));
        if (isControlled) {
            onPageChange(clamped);
        } else {
            setInternalPage(clamped);
        }
    };

    const requestSort = (key) => {
        if (!key) return;
        let direction = 'asc';
        const currentActiveKey = isServerSorted ? (currentSortBy ? currentSortBy.split('_')[0] : null) : (sortConfig?.key);
        const currentActiveDir = isServerSorted ? (currentSortBy && currentSortBy.endsWith('_asc') ? 'asc' : 'desc') : (sortConfig?.direction);
        
        if (currentActiveKey === key && currentActiveDir === 'asc') {
            direction = 'desc';
        }
        
        if (isServerSorted) {
            onSortChange(key, direction);
        } else {
            setSortConfig({ key, direction });
        }
    };

    // Calculate page numbers list for direct page selection button bar
    const pageNumbers = useMemo(() => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    }, [currentPage, totalPages]);

    const [pageInput, setPageInput] = React.useState(String(currentPage));

    React.useEffect(() => {
        setPageInput(String(currentPage));
    }, [currentPage]);

    const handleInputPageChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setPageInput('');
            return;
        }
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
            if (num > totalPages) {
                setPageInput(String(totalPages));
                handlePageChange(totalPages);
            } else if (num < 1) {
                setPageInput('1');
                handlePageChange(1);
            } else {
                setPageInput(String(num));
                handlePageChange(num);
            }
        }
    };

    const handleInputBlur = () => {
        const num = parseInt(pageInput, 10);
        if (isNaN(num) || num < 1) {
            setPageInput('1');
            handlePageChange(1);
        } else if (num > totalPages) {
            setPageInput(String(totalPages));
            handlePageChange(totalPages);
        } else {
            setPageInput(String(num));
            handlePageChange(num);
        }
    };

    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className="w-full bg-white rounded-none border border-slate-200/85 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Horizontal scroll wrapper for non-wrapped cells */}
            <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full text-sm whitespace-nowrap min-w-full">
                    <thead className="bg-slate-50/75 border-b border-slate-200/80">
                        {hasGroupHeaders ? (
                            <>
                                {/* Group Header Row (Row 1) */}
                                <tr>
                                    {headerGroups.map((group, gIdx) => {
                                        if (group.name) {
                                            return (
                                                <th
                                                    key={`g-${gIdx}`}
                                                    colSpan={group.columns.length}
                                                    className="px-3 py-2 text-center text-slate-600 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/80 bg-slate-100/60 whitespace-nowrap"
                                                >
                                                    {group.name}
                                                </th>
                                            );
                                        }
                                        const col = group.columns[0];
                                        return (
                                            <th
                                                key={`f-${gIdx}`}
                                                rowSpan={2}
                                                onClick={() => col.sortable && requestSort(col.accessor)}
                                                className={`px-4 py-2.5 text-slate-400 uppercase tracking-wider text-[11px] font-extrabold select-none whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-600 transition-colors' : ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                            >
                                                <div className={`flex items-center gap-1.5 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                                    {col.header}
                                                    {col.sortable && (
                                                        isServerSorted ? (
                                                            currentSortBy && currentSortBy.startsWith(col.accessor) ? (
                                                                currentSortBy.endsWith('_asc') ? <ArrowUp className="w-3 h-3 text-violet-600 font-bold" /> : <ArrowDown className="w-3 h-3 text-violet-600 font-bold" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                        ) : (
                                                            sortConfig && sortConfig.key === col.accessor ? (
                                                                sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-violet-600" /> : <ArrowDown className="w-3 h-3 text-violet-600" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                        )
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                                {/* Sub Header Row (Row 2) */}
                                <tr>
                                    {columns.map((col, idx) => {
                                        if (!col.groupHeader) return null;
                                        return (
                                            <th
                                                key={`sub-${idx}`}
                                                onClick={() => col.sortable && requestSort(col.accessor)}
                                                className={`px-3 py-1.5 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold select-none whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-600 transition-colors' : ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                            >
                                                <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                                    {col.header}
                                                    {col.sortable && (
                                                        isServerSorted ? (
                                                            currentSortBy && currentSortBy.startsWith(col.accessor) ? (
                                                                currentSortBy.endsWith('_asc') ? <ArrowUp className="w-3 h-3 text-violet-600 font-bold" /> : <ArrowDown className="w-3 h-3 text-violet-600 font-bold" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                        ) : (
                                                            sortConfig && sortConfig.key === col.accessor ? (
                                                                sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-violet-600" /> : <ArrowDown className="w-3 h-3 text-violet-600" />
                                                            ) : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                        )
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </>
                        ) : (
                            /* Standard 1-row header */
                            <tr>
                                {columns.map((col, idx) => (
                                    <th 
                                        key={idx} 
                                        onClick={() => col.sortable && requestSort(col.accessor)}
                                        className={`px-4 py-2.5 text-slate-400 uppercase tracking-wider text-[11px] font-extrabold select-none whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-slate-600 transition-colors' : ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                    >
                                        <div className={`flex items-center gap-1.5 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                            {col.header}
                                            {col.sortable && (
                                                isServerSorted ? (
                                                    currentSortBy && currentSortBy.startsWith(col.accessor) ? (
                                                        currentSortBy.endsWith('_asc') ? <ArrowUp className="w-3 h-3 text-violet-600 font-bold" /> : <ArrowDown className="w-3 h-3 text-violet-600 font-bold" />
                                                    ) : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                ) : (
                                                    sortConfig && sortConfig.key === col.accessor ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-violet-600" /> : <ArrowDown className="w-3 h-3 text-violet-600" />
                                                    ) : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: itemsPerPage || 8 }).map((_, rIdx) => (
                                <tr key={`skeleton-row-${rIdx}`} className="animate-pulse">
                                    {columns.map((col, cIdx) => (
                                        <td 
                                            key={`skeleton-cell-${cIdx}`} 
                                            className={`px-4 py-2 whitespace-nowrap ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                        >
                                            <div 
                                                className={`h-4 rounded-none skeleton-shimmer ${
                                                    col.align === 'center' 
                                                        ? 'mx-auto w-12' 
                                                        : col.align === 'right' 
                                                            ? 'ml-auto w-16' 
                                                            : 'w-28'
                                                }`} 
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 font-medium whitespace-nowrap">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIdx) => (
                                <tr 
                                    key={row.id || rowIdx} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td 
                                            key={colIdx} 
                                            className={`px-4 py-2 whitespace-nowrap text-xs ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                        >
                                            {col.cell ? col.cell(row) : row[col.accessor] ?? '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages >= 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                    {/* Item stats & typable page input selector */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500">
                            Showing <span className="font-bold text-slate-700">{startItem}-{endItem}</span> of <span className="font-bold text-slate-700">{totalCount}</span>
                        </span>
                        
                        {totalPages > 1 && (
                            <div className="flex flex-wrap items-center gap-3 ml-2">
                                {/* Select Dropdown */}
                                <div className="flex items-center gap-1.5">
                                    <label htmlFor="page-select" className="text-xs font-semibold text-slate-400">
                                        Page:
                                    </label>
                                    <select
                                        id="page-select"
                                        value={currentPage}
                                        onChange={(e) => handlePageChange(Number(e.target.value))}
                                        className="px-2 py-1 text-xs font-bold rounded-none border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                                    >
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <option key={page} value={page}>
                                                {page}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Typable Input */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-400">Go to:</span>
                                    <input
                                        id="page-input"
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInput}
                                        onChange={handleInputPageChange}
                                        onBlur={handleInputBlur}
                                        onKeyDown={(e) => e.key === 'Enter' && handleInputBlur()}
                                        className="w-14 px-2 py-1 text-xs font-bold text-center rounded-none border border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="1"
                                    />
                                    <span className="text-xs font-bold text-slate-500">
                                        / <span className="text-slate-800">{totalPages}</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Page Numbers Button Bar */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="p-1.5 rounded-none border border-slate-200 bg-white text-slate-500 disabled:opacity-30 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:cursor-not-allowed"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {pageNumbers.map((p, pIdx) =>
                                p === '...' ? (
                                    <span key={`p-${pIdx}`} className="px-2 text-xs font-bold text-slate-400">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={`p-${pIdx}`}
                                        onClick={() => handlePageChange(p)}
                                        className={`min-w-[32px] h-8 px-2 rounded-none text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                            currentPage === p
                                                ? 'bg-slate-900 text-white shadow-xs border border-slate-900'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="p-1.5 rounded-none border border-slate-200 bg-white text-slate-500 disabled:opacity-30 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:cursor-not-allowed"
                                title="Next Page"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DataTable;
