import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { MdWarning, MdTrendingUp, MdTrendingDown, MdInventory, MdReceipt, MdStore } from "react-icons/md";
import { fetchStorageVariance } from "../../redux/slices/storageVarianceSlice";
import { formatVND } from "../../utils";
import { getTodayDateVietnam, getDateRangeByPeriodVietnam } from "../../utils/dateUtils";
import LoadingState from "../shared/LoadingState";
import StoreSummariesTable from "./StoreSummariesTable";

const formatQty = (qty) => Number(Number(qty || 0).toFixed(3));

const formatPct = (pct) => {
    if (pct === null || pct === undefined) return "—";
    return `${(pct * 100).toFixed(1)}%`;
};

const varianceClass = (value) => {
    if (value > 0) return "text-red-400";
    if (value < 0) return "text-amber-400";
    return "text-[#f5f5f5]";
};

const MaterialVariance = ({ dateFilter, customDateRange }) => {
    const dispatch = useDispatch();
    const { summary, items, storeSummaries, stores, coverage, scope, loading, error } = useSelector(
        (state) => state.storageVariance
    );
    const [storeFilter, setStoreFilter] = useState("");

    useEffect(() => {
        const params = {};
        const today = getTodayDateVietnam();

        if (dateFilter === "custom" && customDateRange.startDate && customDateRange.endDate) {
            params.startDate = customDateRange.startDate;
            params.endDate = customDateRange.endDate;
        } else if (dateFilter && dateFilter !== "custom") {
            switch (dateFilter) {
                case "today":
                    params.startDate = today;
                    params.endDate = today;
                    break;
                case "week": {
                    const { start } = getDateRangeByPeriodVietnam("thisWeek");
                    params.startDate = start;
                    params.endDate = today;
                    break;
                }
                case "month": {
                    const { start } = getDateRangeByPeriodVietnam("thisMonth");
                    params.startDate = start;
                    params.endDate = today;
                    break;
                }
                default:
                    break;
            }
        }

        dispatch(fetchStorageVariance({ ...params, scope: "all" }));
    }, [dispatch, dateFilter, customDateRange]);

    const storeOptions = useMemo(() => {
        if (stores?.length) {
            return stores.map((store) => ({
                id: String(store._id || store.id),
                name: store.name,
                code: store.code,
            }));
        }
        return (storeSummaries || []).map((row) => ({
            id: String(row.store?.id || row.store?._id),
            name: row.store?.name,
            code: row.store?.code,
        }));
    }, [stores, storeSummaries]);

    const filteredItems = useMemo(
        () => (storeFilter ? items.filter((item) => item.storeId === storeFilter) : items),
        [items, storeFilter]
    );
    const filteredMissing = useMemo(
        () => (coverage?.missingRecipes || []).filter((row) => !storeFilter || row.storeId === storeFilter),
        [coverage, storeFilter]
    );
    const filteredMismatches = useMemo(
        () => (coverage?.unitMismatches || []).filter((row) => !storeFilter || row.storeId === storeFilter),
        [coverage, storeFilter]
    );
    const filteredStoreSummaries = useMemo(
        () => (storeFilter
            ? storeSummaries.filter((row) => String(row.store?.id) === storeFilter)
            : storeSummaries),
        [storeSummaries, storeFilter]
    );

    const displayScope = storeFilter ? "single" : scope;
    const storeSummary = filteredStoreSummaries[0]?.summary;
    const displaySummary = storeFilter
        ? {
            theoreticalCost: storeSummary?.theoreticalCost || 0,
            actualCost: storeSummary?.actualCost || 0,
            varianceCost: storeSummary?.varianceCost || 0,
            completedOrderCount: storeSummary?.completedOrderCount || 0,
        }
        : summary;

    const hasCoverage = filteredMissing.length > 0 || filteredMismatches.length > 0;
    const selectedStoreName = storeOptions.find((store) => store.id === storeFilter)?.name;

    const storeFilterBar = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#ababab]">
                {storeFilter
                    ? `${selectedStoreName || "Store"} · theoretical usage vs production exports`
                    : "All stores · theoretical usage vs production exports"}
            </p>
            {storeOptions.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-[#ababab]">
                    <MdStore size={18} className="flex-shrink-0" />
                    <span>Store</span>
                    <select
                        value={storeFilter}
                        onChange={(event) => setStoreFilter(event.target.value)}
                        className="rounded-lg border border-[#343434] bg-[#262626] px-3 py-2 text-sm text-[#f5f5f5] focus:border-brand focus:outline-none"
                    >
                        <option value="">All stores</option>
                        {storeOptions.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name}{store.code ? ` (${store.code})` : ""}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </div>
    );

    if (loading && !summary) {
        return (
            <div className="container mx-auto px-4 md:px-6">
                {storeFilterBar}
                <LoadingState message="Loading material variance..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 md:px-6 space-y-4">
                {storeFilterBar}
                <div className="text-center py-12">
                    <MdWarning className="mx-auto text-6xl text-red-500 mb-4" />
                    <p className="text-red-400 text-lg mb-2">Error loading variance</p>
                    <p className="text-[#ababab] text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if ((!displaySummary || filteredItems.length === 0) && !hasCoverage) {
        return (
            <div className="container mx-auto px-4 md:px-6 space-y-4">
                {storeFilterBar}
                <div className="text-center py-12">
                    <MdInventory className="mx-auto text-6xl text-[#ababab] mb-4" />
                    <p className="text-[#ababab] text-lg">No order or production export data for this period.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {storeFilterBar}

                {hasCoverage && (
                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <MdWarning className="text-amber-400 mt-0.5 flex-shrink-0" size={22} />
                            <div className="space-y-2">
                                <p className="text-amber-200 font-medium">
                                    Coverage gaps — variance may be understated
                                </p>
                                {filteredMissing.length > 0 && (
                                    <ul className="text-sm text-[#f5f5f5] space-y-1">
                                        {filteredMissing.map((row) => (
                                            <li key={`${row.type}-${row.storeId}-${row.id}`}>
                                                {row.portions} {row.type} portions sold with no recipe: {row.name}
                                                {displayScope === "all" ? ` (${row.storeName})` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {filteredMismatches.length > 0 && (
                                    <ul className="text-sm text-[#f5f5f5] space-y-1">
                                        {filteredMismatches.map((row) => (
                                            <li key={`${row.storeId}-${row.storageItemId}-${row.fromUnit}`}>
                                                Cannot convert {row.name} {row.fromUnit}
                                                {row.toUnit ? ` → ${row.toUnit}` : ""} ({row.portions} portions)
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdTrendingUp className="text-xl text-green-500" />
                            <span className="text-[#ababab] text-xs">Theoretical</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5]">
                            {formatVND(displaySummary?.theoreticalCost || 0)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Recipe usage from completed orders</p>
                    </div>
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdTrendingDown className="text-xl text-orange-500" />
                            <span className="text-[#ababab] text-xs">Actual</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5]">
                            {formatVND(displaySummary?.actualCost || 0)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Production exports</p>
                    </div>
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdInventory className="text-xl text-brand" />
                            <span className="text-[#ababab] text-xs">Variance</span>
                        </div>
                        <h3 className={`text-lg sm:text-xl font-bold ${varianceClass(displaySummary?.varianceCost || 0)}`}>
                            {formatVND(displaySummary?.varianceCost || 0)}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Actual minus theoretical</p>
                    </div>
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <div className="flex items-center justify-between mb-3">
                            <MdReceipt className="text-xl text-brand" />
                            <span className="text-[#ababab] text-xs">Orders</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#f5f5f5]">
                            {displaySummary?.completedOrderCount || 0}
                        </h3>
                        <p className="text-[#ababab] text-xs sm:text-sm">Completed in this period</p>
                    </div>
                </div>

                {displayScope === "all" && filteredStoreSummaries?.length > 0 && (
                    <StoreSummariesTable
                        title="Variance by Store"
                        summaries={filteredStoreSummaries}
                        columns={[
                            {
                                key: "theoreticalCost",
                                label: "Theoretical",
                                format: (row) => formatVND(row.summary?.theoreticalCost || 0),
                            },
                            {
                                key: "actualCost",
                                label: "Actual",
                                format: (row) => formatVND(row.summary?.actualCost || 0),
                            },
                            {
                                key: "varianceCost",
                                label: "Variance",
                                format: (row) => formatVND(row.summary?.varianceCost || 0),
                            },
                        ]}
                    />
                )}

                {filteredItems.length > 0 && (
                    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
                        <h2 className="text-xl font-semibold text-[#f5f5f5] mb-4">Material variance</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#343434]">
                                        {displayScope === "all" && (
                                            <th className="text-left py-3 px-2 text-[#ababab] text-xs font-medium">Store</th>
                                        )}
                                        <th className="text-left py-3 px-2 text-[#ababab] text-xs font-medium">Item</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Unit</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Theoretical</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Actual</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Var qty</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Var %</th>
                                        <th className="text-right py-3 px-2 text-[#ababab] text-xs font-medium">Var VND</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item) => (
                                        <tr
                                            key={`${item.storeId}-${item.storageItemId}`}
                                            className="border-b border-[#343434] hover:bg-[#1f1f1f]"
                                        >
                                            {displayScope === "all" && (
                                                <td className="py-3 px-2 text-[#ababab] text-xs whitespace-nowrap">
                                                    {item.storeName}
                                                </td>
                                            )}
                                            <td className="py-3 px-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[#f5f5f5] font-medium text-sm">{item.name}</span>
                                                    <span className="text-[#ababab] text-xs">{item.code}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-[#ababab] text-xs">{item.unit}</td>
                                            <td className="py-3 px-2 text-right text-[#f5f5f5] text-sm">
                                                {formatQty(item.theoreticalQty)}
                                            </td>
                                            <td className="py-3 px-2 text-right text-[#f5f5f5] text-sm">
                                                {formatQty(item.actualQty)}
                                            </td>
                                            <td className={`py-3 px-2 text-right text-sm font-medium ${varianceClass(item.varianceQty)}`}>
                                                {formatQty(item.varianceQty)}
                                            </td>
                                            <td className={`py-3 px-2 text-right text-sm ${varianceClass(item.varianceQty)}`}>
                                                {formatPct(item.variancePct)}
                                            </td>
                                            <td className={`py-3 px-2 text-right text-sm font-medium ${varianceClass(item.varianceCost)}`}>
                                                {formatVND(item.varianceCost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

MaterialVariance.propTypes = {
    dateFilter: PropTypes.string.isRequired,
    customDateRange: PropTypes.shape({
        startDate: PropTypes.string,
        endDate: PropTypes.string,
    }).isRequired,
};

export default MaterialVariance;
