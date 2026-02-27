import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchStorageAnalytics } from "../../redux/slices/storageAnalyticsSlice";
import { MdStorage, MdWarning, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { formatVND } from "../../utils";

const StorageAnalytics = ({ dateFilter, customDateRange }) => {
    const dispatch = useDispatch();
    const { summary, items, loading, error } = useSelector((state) => state.storageAnalytics);

    useEffect(() => {
        const params = {};
        
        if (dateFilter === "custom" && customDateRange.startDate && customDateRange.endDate) {
            params.startDate = customDateRange.startDate;
            params.endDate = customDateRange.endDate;
        } else if (dateFilter && dateFilter !== "custom") {
            // Convert period to date range
            const today = new Date();
            const start = new Date();
            
            switch (dateFilter) {
                case "today":
                    start.setHours(0, 0, 0, 0);
                    params.startDate = start.toISOString().split('T')[0];
                    params.endDate = today.toISOString().split('T')[0];
                    break;
                case "week":
                    start.setDate(today.getDate() - 7);
                    params.startDate = start.toISOString().split('T')[0];
                    params.endDate = today.toISOString().split('T')[0];
                    break;
                case "month":
                    start.setMonth(today.getMonth() - 1);
                    params.startDate = start.toISOString().split('T')[0];
                    params.endDate = today.toISOString().split('T')[0];
                    break;
                default:
                    // No date filter - show all data
                    break;
            }
        }
        // If no date filter is set, params will be empty and backend will return all records
        
        dispatch(fetchStorageAnalytics(params));
    }, [dispatch, dateFilter, customDateRange]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
                <p className="text-[#ababab] text-lg">Loading storage analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <MdStorage className="mx-auto text-6xl text-red-500 mb-4" />
                <p className="text-red-400 text-lg mb-2">Error loading analytics</p>
                <p className="text-[#ababab] text-sm">{error}</p>
            </div>
        );
    }

    if (!summary || items.length === 0) {
        return (
            <div className="text-center py-12">
                <MdStorage className="mx-auto text-6xl text-[#ababab] mb-4" />
                <p className="text-[#ababab] text-lg">No storage data available</p>
                <p className="text-[#ababab] text-sm mt-2">Create some storage items and import/export records first</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <MdStorage className="text-xl sm:text-2xl text-[#f6b100]" />
                            <span className="text-[#ababab] text-xs sm:text-sm">Total</span>
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
                            {summary.totalItems}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Storage Items</p>
                    </div>

                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <MdWarning className="text-xl sm:text-2xl text-red-500" />
                            <span className="text-[#ababab] text-xs sm:text-sm">Low Stock</span>
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
                            {summary.lowStockItems}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Items Below Minimum</p>
                    </div>

                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <MdTrendingUp className="text-xl sm:text-2xl text-green-500" />
                            <span className="text-[#ababab] text-xs sm:text-sm">Imports</span>
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
                            {formatVND(summary.totalImportCost)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Total Import Cost</p>
                    </div>

                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <MdTrendingDown className="text-xl sm:text-2xl text-orange-500" />
                            <span className="text-[#ababab] text-xs sm:text-sm">Exports</span>
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
                            {formatVND(summary.totalExportCost)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Total Export Cost</p>
                    </div>
                </div>

                {/* Storage Items Table */}
                <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <MdStorage className="text-[#f6b100]" size={24} />
                        <h2 className="text-xl font-semibold text-[#f5f5f5]">Storage Items Overview</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#343434]">
                                    <th className="text-left py-3 px-2 sm:px-4 text-[#ababab] text-xs sm:text-sm font-medium">Item</th>
                                    <th className="text-right py-3 px-2 sm:px-4 text-[#ababab] text-xs sm:text-sm font-medium">Stock</th>
                                    <th className="text-right py-3 px-2 sm:px-4 text-[#ababab] text-xs sm:text-sm font-medium">Import Cost</th>
                                    <th className="text-right py-3 px-2 sm:px-4 text-[#ababab] text-xs sm:text-sm font-medium">Export Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const isOut = item.currentStock === 0;
                                    const isLow = item.isLowStock;
                                    const rowBg = isOut
                                        ? "bg-red-500/15 hover:bg-red-500/25 border-l-4 border-l-red-500"
                                        : isLow
                                        ? "bg-yellow-500/15 hover:bg-yellow-500/25 border-l-4 border-l-yellow-400"
                                        : "hover:bg-[#1f1f1f]";
                                    return (
                                        <tr
                                            key={item._id}
                                            className={`border-b border-[#343434] transition-colors ${rowBg}`}
                                        >
                                            <td className="py-3 px-2 sm:px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[#f5f5f5] font-medium text-sm sm:text-base">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[#ababab] text-xs">{item.code}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {(isOut || isLow) && (
                                                        <MdWarning className={`flex-shrink-0 ${isOut ? "text-red-400" : "text-yellow-400"}`} size={14} />
                                                    )}
                                                    <span className={`font-semibold text-sm sm:text-base ${
                                                        isOut ? "text-red-400" : isLow ? "text-yellow-300" : "text-[#f5f5f5]"
                                                    }`}>
                                                        {item.currentStock}
                                                    </span>
                                                    <span className="text-[#ababab] text-xs">/ {item.minStock} {item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 text-right">
                                                <span className="text-green-400 font-medium text-xs sm:text-sm">
                                                    {formatVND(item.totalImportCost)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 text-right">
                                                <span className="text-orange-400 font-medium text-xs sm:text-sm">
                                                    {formatVND(item.totalExportCost)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageAnalytics;
