import React, { useState, useMemo } from 'react';
import { 
    ChevronUp, 
    ChevronDown, 
    Settings2, 
    ChevronLeft, 
    ChevronRight, 
    MoreVertical,
    Check,
    X,
    Columns,
    Search
} from 'lucide-react';

const Table = ({ 
    columns, 
    data = [], 
    className = "", 
    pagination = true, 
    defaultItemsPerPage = 10,
    showViewConfig = true,
    onRowClick
}) => {
    // State for Sorting
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    
    // State for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
    
    // State for Column Visibility
    const [visibleColumnIds, setVisibleColumnIds] = useState(
        columns.map((col, idx) => col.id || col.accessor || `col-${idx}`)
    );
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Sorting Logic
    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage, pagination]);

    // Visibility Logic
    const activeColumns = columns.filter((col, idx) => 
        visibleColumnIds.includes(col.id || col.accessor || `col-${idx}`)
    );

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (id) => {
        setVisibleColumnIds(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id) 
                : [...prev, id]
        );
    };

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Table Controls */}
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    {pagination && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <span>Show</span>
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-700 cursor-pointer"
                            >
                                {[5, 10, 20, 50, 100].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span>entries</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {showViewConfig && (
                        <div className="relative">
                            <button 
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <Columns size={14} />
                                View Config
                            </button>
                            
                            {isConfigOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsConfigOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Display Columns</h4>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {columns.map((col, idx) => {
                                                const id = col.id || col.accessor || `col-${idx}`;
                                                const isVisible = visibleColumnIds.includes(id);
                                                return (
                                                    <button
                                                        key={id}
                                                        onClick={() => toggleColumn(id)}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <span>{col.header}</span>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isVisible ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                                            {isVisible && <Check size={10} strokeWidth={4} />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                        <tr>
                            {activeColumns.map((col, idx) => {
                                const id = col.id || col.accessor || `col-${idx}`;
                                const isSortable = col.accessor && col.sortable !== false;
                                return (
                                    <th 
                                        key={id} 
                                        className={`px-6 py-4 font-bold tracking-wider ${isSortable ? 'cursor-pointer hover:bg-slate-100 transition-colors group' : ''}`}
                                        onClick={() => isSortable && requestSort(col.accessor)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.header}
                                            {isSortable && (
                                                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronUp size={10} className={sortConfig.key === col.accessor && sortConfig.direction === 'asc' ? 'text-blue-600 opacity-100' : 'text-slate-300'} />
                                                    <ChevronDown size={10} className={sortConfig.key === col.accessor && sortConfig.direction === 'desc' ? 'text-blue-600 opacity-100' : 'text-slate-300'} />
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIdx) => (
                                <tr 
                                    key={rowIdx} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`bg-white hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {activeColumns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={activeColumns.length} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <Search size={20} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-400">No data found matching your criteria</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-bold text-slate-700">{sortedData.length}</span> results
                    </div>
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                            >
                                &lt; Prev
                            </button>
                            
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`min-w-[36px] h-9 px-2 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-[#00b020] text-white shadow-md' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                            >
                                Next &gt;
                            </button>
                        </div>
                </div>
            )}
        </div>
    );
};

export default Table;
