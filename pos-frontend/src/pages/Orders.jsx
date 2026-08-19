import { useState, useEffect, useRef } from "react";
import { MdFilterList, MdPerson, MdPayment, MdStore, MdChevronLeft, MdChevronRight } from "react-icons/md";
import OrderCard from "../components/orders/OrderCard";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import DateFilter from "../components/shared/DateFilter";
import FilterToggleButton from "../components/shared/FilterToggleButton";
import EmptyState from "../components/shared/EmptyState";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import { enqueueSnackbar } from "notistack";
import { getTodayDate } from "../utils";
import { useSelector, useDispatch } from "react-redux";
import { fetchOrders, setFilters } from "../redux/slices/orderSlice";
import { fetchMembers } from "../redux/slices/memberSlice";

const Orders = () => {
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.user);
  const {
    items: orders,
    loading,
    error,
    pagination,
  } = useSelector((state) => state.orders);
  const { members } = useSelector((state) => state.members);
  const isAdmin = role === "Admin";
  const activeMembers = members.filter((member) => member.isActive !== false);

  // Scroll container ref for scroll position persistence
  const scrollContainerRef = useRef(null);
  const hasRestoredScroll = useRef(false);

  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [createdBy, setCreatedBy] = useState("all");
  const [showCreatedByFilter, setShowCreatedByFilter] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [showPaymentFilter, setShowPaymentFilter] = useState(false);
  const [thirdPartyVendor, setThirdPartyVendor] = useState("all");
  const [showVendorFilter, setShowVendorFilter] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    document.title = "POS | Orders";
    hasRestoredScroll.current = false;
    
    if (isAdmin) {
      dispatch(fetchMembers({ isActive: true }));
    }
  }, [dispatch, isAdmin]);

  // Separate effect for scroll position restoration after data loads
  useEffect(() => {
    if (!loading && orders.length > 0 && scrollContainerRef.current && !hasRestoredScroll.current) {
      const savedScrollPosition = sessionStorage.getItem('orders-scroll-position');
      if (savedScrollPosition) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = parseInt(savedScrollPosition, 10);
              hasRestoredScroll.current = true;
            }
          });
        });
      }
    }
  }, [loading, orders.length]);


  // Save scroll position when component unmounts
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    return () => {
      if (scrollContainer) {
        sessionStorage.setItem('orders-scroll-position', scrollContainer.scrollTop.toString());
      }
    };
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [status, startDate, endDate, createdBy, paymentMethod, thirdPartyVendor]);

  // Fetch orders when filters or page changes
  useEffect(() => {
    const params = { status, paginate: true, page, limit: LIMIT };
    if (isAdmin) {
      params.startDate = startDate;
      params.endDate = endDate;
      params.createdBy = createdBy;
      params.paymentMethod = paymentMethod;
      params.thirdPartyVendor = thirdPartyVendor;
    } else {
      const today = getTodayDate();
      params.startDate = today;
      params.endDate = today;
    }

    dispatch(setFilters(params));
    dispatch(fetchOrders(params));
  }, [dispatch, status, startDate, endDate, createdBy, paymentMethod, thirdPartyVendor, isAdmin, page]);

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  // Add scroll event listener to save scroll position continuously
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      sessionStorage.setItem('orders-scroll-position', scrollContainer.scrollTop.toString());
    };

    // Throttle scroll events to improve performance
    let timeoutId;
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    scrollContainer.addEventListener('scroll', throttledHandleScroll);
    
    return () => {
      scrollContainer.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Listen for page visibility changes (when user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !hasRestoredScroll.current) {
        // Page became visible again, try to restore scroll position
        setTimeout(() => {
          if (!loading && scrollContainerRef.current) {
            const savedScrollPosition = sessionStorage.getItem('orders-scroll-position');
            if (savedScrollPosition) {
              scrollContainerRef.current.scrollTop = parseInt(savedScrollPosition, 10);
              hasRestoredScroll.current = true;
            }
          }
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading]);

  const handleDateChange = ({
    startDate: newStartDate,
    endDate: newEndDate,
  }) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Filter orders by status on frontend (createdBy filtering is now done on backend)
  const filteredOrders = orders.filter((order) => {
    // Filter by status
    return status === "all" || order.orderStatus === status;
  });

  // Calculate status counts (backend already filtered by createdBy)
  const statusButtons = [
    { key: "all", label: "All", shortLabel: "ALL", count: orders?.length || 0 },
    {
      key: "progress",
      label: "In Progress",
      shortLabel: "INP",
      count: orders?.filter((o) => o.orderStatus === "progress").length || 0,
    },
    {
      key: "completed",
      label: "Completed",
      shortLabel: "COM",
      count: orders?.filter((o) => o.orderStatus === "completed").length || 0,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      shortLabel: "CAN",
      count: orders?.filter((o) => o.orderStatus === "cancelled").length || 0,
    },
  ];

  if (loading && !orders.length) {
    return <FullScreenLoader />;
  }

  return (
    <section className="min-h-screen bg-[#1f1f1f] pb-20">
      <FeaturePageHeader
        title="Orders"
        subtitle={
          <span>
            {pagination?.total ?? orders.length} orders found
            {isAdmin && createdBy !== "all" ? (
              <span className="ml-1 hidden sm:inline">
                by {members.find((m) => m._id === createdBy)?.name || "Unknown"}
              </span>
            ) : null}
            {isAdmin && paymentMethod !== "all" ? (
              <span className="ml-1 hidden sm:inline">• {paymentMethod} payments</span>
            ) : null}
            {isAdmin && thirdPartyVendor !== "all" ? (
              <span className="ml-1 hidden sm:inline">
                • {thirdPartyVendor === "None" ? "Direct orders" : thirdPartyVendor}
              </span>
            ) : null}
            {isAdmin && startDate === endDate ? (
              <span className="ml-1 hidden sm:inline">
                for {new Date(startDate).toLocaleDateString("vi-VN")}
              </span>
            ) : null}
            {isAdmin && startDate !== endDate ? (
              <span className="ml-1 hidden sm:inline">
                from {new Date(startDate).toLocaleDateString("vi-VN")} to{" "}
                {new Date(endDate).toLocaleDateString("vi-VN")}
              </span>
            ) : null}
          </span>
        }
        actions={
          isAdmin ? (
            <>
              <FilterToggleButton
                active={showDateFilter}
                onClick={() => setShowDateFilter(!showDateFilter)}
                icon={<MdFilterList size={16} />}
                label="Date"
              />
              <FilterToggleButton
                active={showCreatedByFilter}
                onClick={() => setShowCreatedByFilter(!showCreatedByFilter)}
                icon={<MdPerson size={16} />}
                label="Staff"
              />
              <FilterToggleButton
                active={showPaymentFilter}
                onClick={() => setShowPaymentFilter(!showPaymentFilter)}
                icon={<MdPayment size={16} />}
                label="Payment"
              />
              <FilterToggleButton
                active={showVendorFilter}
                onClick={() => setShowVendorFilter(!showVendorFilter)}
                icon={<MdStore size={16} />}
                label="Vendor"
              />
            </>
          ) : null
        }
      />

      {/* Date Filter Section - Admin Only */}
      {isAdmin && showDateFilter && (
        <div className="px-4 sm:px-10 py-4 border-b border-[#343434] bg-[#1a1a1a]">
          <DateFilter
            onDateChange={handleDateChange}
            initialStartDate={startDate}
            initialEndDate={endDate}
          />
        </div>
      )}

      {/* Created By Filter Section - Admin Only */}
      {isAdmin && showCreatedByFilter && (
        <div className="px-4 sm:px-10 py-4 border-b border-[#343434] bg-[#1a1a1a]">
          <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#f5f5f5] text-sm font-semibold flex items-center gap-2">
                <MdPerson size={16} />
                Filter by Created By
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[#ababab] text-xs font-medium mb-2">
                  Select Staff Member
                </label>
                <select
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="all">All Staff Members</option>
                  {activeMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current selection display */}
            <div className="mt-3 pt-3 border-t border-[#343434]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ababab]">Selected:</span>
                <span className="text-[#f5f5f5] font-medium">
                  {createdBy === "all" 
                    ? "All Staff Members"
                    : members.find(m => m._id === createdBy)?.name || "Unknown"
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Filter Section - Admin Only */}
      {isAdmin && showPaymentFilter && (
        <div className="px-4 sm:px-10 py-4 border-b border-[#343434] bg-[#1a1a1a]">
          <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#f5f5f5] text-sm font-semibold flex items-center gap-2">
                <MdPayment size={16} />
                Filter by Payment Method
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[#ababab] text-xs font-medium mb-2">
                  Select Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Banking">Banking</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            {/* Current selection display */}
            <div className="mt-3 pt-3 border-t border-[#343434]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ababab]">Selected:</span>
                <span className="text-[#f5f5f5] font-medium">
                  {paymentMethod === "all" ? "All Payment Methods" : paymentMethod}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Third Party Vendor Filter Section - Admin Only */}
      {isAdmin && showVendorFilter && (
        <div className="px-4 sm:px-10 py-4 border-b border-[#343434] bg-[#1a1a1a]">
          <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#343434]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#f5f5f5] text-sm font-semibold flex items-center gap-2">
                <MdStore size={16} />
                Filter by Third Party Vendor
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[#ababab] text-xs font-medium mb-2">
                  Select Vendor
                </label>
                <select
                  value={thirdPartyVendor}
                  onChange={(e) => setThirdPartyVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-brand transition-colors"
                >
                  <option value="all">All Vendors</option>
                  <option value="None">Direct Orders (No Vendor)</option>
                  <option value="Shopee">Shopee</option>
                  <option value="Grab">Grab</option>
                </select>
              </div>
            </div>

            {/* Current selection display */}
            <div className="mt-3 pt-3 border-t border-[#343434]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ababab]">Selected:</span>
                <span className="text-[#f5f5f5] font-medium">
                  {thirdPartyVendor === "all" 
                    ? "All Vendors" 
                    : thirdPartyVendor === "None" 
                    ? "Direct Orders" 
                    : thirdPartyVendor
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Section */}
      <div className="px-4 sm:px-10 py-4 border-b border-[#343434]">
     
        <div className="flex items-center gap-2">
          {statusButtons.map(({ key, label, shortLabel, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`flex min-h-[40px] min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 sm:flex-none sm:justify-start sm:gap-1.5 sm:px-4 sm:text-sm sm:font-medium ${
                status === key
                  ? key === "cancelled"
                    ? "bg-red-600 text-white"
                    : "bg-brand text-[#f5f5f5]"
                  : key === "cancelled"
                  ? "bg-[#262626] text-red-400 hover:bg-red-900/30 hover:text-red-300 border border-red-800/50"
                  : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]"
              }`}
            >
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  status === key
                    ? key === "cancelled"
                      ? "bg-white/20 text-white"
                      : "bg-[#1f1f1f]/20 text-[#f5f5f5]"
                    : key === "cancelled"
                    ? "bg-red-800/50 text-red-300"
                    : "bg-[#343434] text-[#ababab]"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div 
        ref={scrollContainerRef}
        className="px-4 sm:px-10 py-4 overflow-y-scroll scrollbar-hide h-[calc(100vh-370px)] sm:h-[calc(100%-330px)]"
      >
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MdFilterList}
            variant="rich"
            title="No Orders Found"
            message={
              status === "all"
                ? isAdmin
                  ? "No orders found for the selected date range. Try selecting a different date or check if there are any orders in the system."
                  : "No orders found in the system. Orders will appear here once customers start placing them."
                : isAdmin
                  ? `No orders with status "${status}" found for the selected date range. Try changing the status filter or date range.`
                  : `No orders with status "${status}" found. Try changing the status filter.`
            }
            action={{
              label: "Reset Filters",
              onClick: () => {
                setStatus("all");
                if (isAdmin) {
                  setStartDate(getTodayDate());
                  setEndDate(getTodayDate());
                  setCreatedBy("all");
                  setPaymentMethod("all");
                  setThirdPartyVendor("all");
                }
              },
            }}
          />
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-10 py-3 border-t border-[#343434] bg-[#1a1a1a]">
          <span className="text-xs text-[#ababab]">
            Page {pagination.page} of {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev || loading}
              className="p-1.5 rounded-lg bg-[#262626] border border-[#343434] text-[#ababab] hover:text-[#f5f5f5] hover:bg-[#343434] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <MdChevronLeft size={18} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '…' ? (
                  <span key={`ellipsis-${idx}`} className="text-[#ababab] text-sm px-1">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      item === pagination.page
                        ? 'bg-brand text-[#f5f5f5]'
                        : 'bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext || loading}
              className="p-1.5 rounded-lg bg-[#262626] border border-[#343434] text-[#ababab] hover:text-[#f5f5f5] hover:bg-[#343434] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <MdChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Orders;
