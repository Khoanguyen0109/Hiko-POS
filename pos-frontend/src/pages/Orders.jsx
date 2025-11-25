import { useState, useEffect, useRef } from "react";
import { MdFilterList, MdPerson, MdPayment, MdStore } from "react-icons/md";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import DateFilter from "../components/shared/DateFilter";
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
  } = useSelector((state) => state.orders);
  const { members } = useSelector((state) => state.members);
  const isAdmin = role === "Admin";

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

  useEffect(() => {
    document.title = "POS | Orders";
    // Reset the scroll restoration flag when component mounts
    hasRestoredScroll.current = false;
    
    // Fetch members for createdBy filter (Admin only)
    if (isAdmin) {
      dispatch(fetchMembers());
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

  // Fetch orders when component mounts or filters change
  useEffect(() => {
    const params = { status };
    if (isAdmin) {
      params.startDate = startDate;
      params.endDate = endDate;
      params.createdBy = createdBy;
      params.paymentMethod = paymentMethod;
      params.thirdPartyVendor = thirdPartyVendor;
    } else {
      // Non-admin users only see today's orders
      const today = getTodayDate();
      params.startDate = today;
      params.endDate = today;
    }

    dispatch(setFilters(params));
    dispatch(fetchOrders(params));
  }, [dispatch, status, startDate, endDate, createdBy, paymentMethod, thirdPartyVendor, isAdmin]);

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
    { key: "all", label: "All", count: orders?.length || 0 },
    {
      key: "progress",
      label: "In Progress",
      count: orders?.filter((o) => o.orderStatus === "progress").length || 0,
    },
    {
      key: "completed",
      label: "Completed",
      count: orders?.filter((o) => o.orderStatus === "completed").length || 0,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: orders?.filter((o) => o.orderStatus === "cancelled").length || 0,
    },
  ];

  if (loading && !orders.length) {
    return <FullScreenLoader />;
  }

  return (
    <section className="bg-[#1f1f1f] pb-20 min-h-screen ">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 border-b border-[#343434] gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-bold tracking-wider">
              Orders
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#ababab] mt-1 sm:mt-0">
              <span>•</span>
              <span>
                {orders.length} orders found
                {isAdmin && createdBy !== "all" && (
                  <span className="ml-1 hidden sm:inline">
                    by {members.find(m => m._id === createdBy)?.name || "Unknown"}
                  </span>
                )}
                {isAdmin && paymentMethod !== "all" && (
                  <span className="ml-1 hidden sm:inline">
                    • {paymentMethod} payments
                  </span>
                )}
                {isAdmin && thirdPartyVendor !== "all" && (
                  <span className="ml-1 hidden sm:inline">
                    • {thirdPartyVendor === "None" ? "Direct orders" : thirdPartyVendor}
                  </span>
                )}
                {isAdmin && startDate === endDate && (
                  <span className="ml-1 hidden sm:inline">
                    for {new Date(startDate).toLocaleDateString("vi-VN")}
                  </span>
                )}
                {isAdmin && startDate !== endDate && (
                  <span className="ml-1 hidden sm:inline">
                    from {new Date(startDate).toLocaleDateString("vi-VN")} to{" "}
                    {new Date(endDate).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showDateFilter
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]"
                }`}
              >
                <MdFilterList size={16} />
                Date Filter
              </button>
              <button
                onClick={() => setShowCreatedByFilter(!showCreatedByFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showCreatedByFilter
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]"
                }`}
              >
                <MdPerson size={16} />
                Created By
              </button>
              <button
                onClick={() => setShowPaymentFilter(!showPaymentFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showPaymentFilter
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]"
                }`}
              >
                <MdPayment size={16} />
                Payment
              </button>
              <button
                onClick={() => setShowVendorFilter(!showVendorFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showVendorFilter
                    ? "bg-[#f6b100] text-[#1f1f1f]"
                    : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]"
                }`}
              >
                <MdStore size={16} />
                Vendor
              </button>
            </>
          )}
        </div>
      </div>

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
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
                >
                  <option value="all">All Staff Members</option>
                  {members.map((member) => (
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
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
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
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] transition-colors"
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
     
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {statusButtons.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                status === key
                  ? key === "cancelled"
                    ? "bg-red-600 text-white"
                    : "bg-[#f6b100] text-[#1f1f1f]"
                  : key === "cancelled"
                  ? "bg-[#262626] text-red-400 hover:bg-red-900/30 hover:text-red-300 border border-red-800/50"
                  : "bg-[#262626] text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] border border-[#343434]"
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  status === key
                    ? key === "cancelled"
                      ? "bg-white/20 text-white"
                      : "bg-[#1f1f1f]/20 text-[#1f1f1f]"
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
        className="px-4 sm:px-10 py-4 overflow-y-scroll scrollbar-hide h-[calc(100vh-320px)] sm:h-[calc(100%-280px)]"
      >
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4">
              <MdFilterList size={32} className="text-[#ababab]" />
            </div>
            <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">
              No Orders Found
            </h3>
            <p className="text-[#ababab] text-sm max-w-md">
              {status === "all"
                ? isAdmin
                  ? "No orders found for the selected date range. Try selecting a different date or check if there are any orders in the system."
                  : "No orders found in the system. Orders will appear here once customers start placing them."
                : isAdmin
                ? `No orders with status "${status}" found for the selected date range. Try changing the status filter or date range.`
                : `No orders with status "${status}" found. Try changing the status filter.`}
            </p>
            <button
              onClick={() => {
                setStatus("all");
                if (isAdmin) {
                  setStartDate(getTodayDate());
                  setEndDate(getTodayDate());
                  setCreatedBy("all");
                  setPaymentMethod("all");
                  setThirdPartyVendor("all");
                }
              }}
              className="mt-4 px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg text-sm font-medium hover:bg-[#f6b100]/90 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Orders;
