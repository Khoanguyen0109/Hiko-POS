import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  MdAdd, 
  MdSearch, 
  MdEdit, 
  MdDelete, 
  MdVisibility,
  MdAccountBalanceWallet,
  MdCategory,
  MdBusiness,
  MdAnalytics,
  MdDateRange,
  MdPayment,
  MdReceipt
} from "react-icons/md";
import {
  fetchSpending,
  fetchSpendingCategories,
  fetchVendors,
  fetchSpendingDashboard,
  removeSpending,
  removeSpendingCategory,
  removeVendor,
  setFilters,
  setPagination
} from "../redux/slices/spendingSlice";
import { formatVND } from "../utils";
import SpendingModal from "../components/spending/SpendingModal";
import CategoryModal from "../components/spending/CategoryModal";
import VendorModal from "../components/spending/VendorModal";

const SpendingManager = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const {
    items: spending,
    categories,
    vendors,
    dashboardData,
    loading,
    error,
    filters: reduxFilters,
    pagination: reduxPagination
  } = useSelector((state) => state.spending);

  // Local UI state
  const [activeTab, setActiveTab] = useState("spending");
  
  // Local filter state (for form inputs before applying to Redux)
  const [localFilters, setLocalFilters] = useState({
    startDate: "",
    endDate: "",
    category: "all",
    vendor: "all",
    paymentStatus: "all",
    search: ""
  });

  // Modals
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // create, edit, view

  // const user = getStoredUser();

  // Define callback functions first
  const loadInitialData = useCallback(async () => {
    try {
      console.log("🔄 Loading initial spending data...");
      const results = await Promise.all([
        dispatch(fetchSpendingCategories()),
        dispatch(fetchVendors())
      ]);
      console.log("✅ Initial data loaded:", results);
    } catch (err) {
      console.error("❌ Error loading initial data:", err);
    }
  }, [dispatch]);

  const loadSpending = useCallback(async () => {
    try {
      const params = {
        page: reduxPagination.currentPage,
        limit: reduxPagination.itemsPerPage,
        ...reduxFilters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === "all" || params[key] === null) {
          delete params[key];
        }
      });

      await dispatch(fetchSpending(params));
    } catch (err) {
      console.error("Error loading spending:", err);
    }
  }, [dispatch, reduxPagination.currentPage, reduxPagination.itemsPerPage, reduxFilters]);

  const loadDashboard = useCallback(async () => {
    try {
      await dispatch(fetchSpendingDashboard());
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
  }, [dispatch]);

  // Effects after callback definitions
  useEffect(() => {
    document.title = "POS | Spending Management";
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (activeTab === "spending") {
      loadSpending();
    } else if (activeTab === "analytics") {
      loadDashboard();
    }
  }, [activeTab, reduxFilters, reduxPagination.currentPage, loadSpending, loadDashboard]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    // Convert local filters to Redux format
    const reduxFilterFormat = {
      startDate: localFilters.startDate || null,
      endDate: localFilters.endDate || null,
      categoryId: localFilters.category !== "all" ? localFilters.category : null,
      vendorId: localFilters.vendor !== "all" ? localFilters.vendor : null,
      paymentStatus: localFilters.paymentStatus !== "all" ? localFilters.paymentStatus : null
    };
    
    dispatch(setFilters(reduxFilterFormat));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const handleDelete = async (id, type = "spending") => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      if (type === "spending") {
        await dispatch(removeSpending(id));
      } else if (type === "category") {
        await dispatch(removeSpendingCategory(id));
      } else if (type === "vendor") {
        await dispatch(removeVendor(id));
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  };

  const openModal = (mode, item = null, type = "spending") => {
    setModalMode(mode);
    setSelectedItem(item);
    
    if (type === "spending") setShowSpendingModal(true);
    else if (type === "category") setShowCategoryModal(true);
    else if (type === "vendor") setShowVendorModal(true);
  };

  const closeModals = () => {
    setShowSpendingModal(false);
    setShowCategoryModal(false);
    setShowVendorModal(false);
    setSelectedItem(null);
    setModalMode("create");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "overdue": return "bg-red-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const tabs = [
    { id: "spending", label: "Spending Records", icon: <MdAccountBalanceWallet /> },
    { id: "categories", label: "Categories", icon: <MdCategory /> },
    { id: "vendors", label: "Vendors", icon: <MdBusiness /> },
    { id: "analytics", label: "Analytics", icon: <MdAnalytics /> }
  ];

  if (loading && !spending.length && !categories.length) {
    return (
      <div className="bg-[#1f1f1f] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
          <p className="text-[#ababab] text-lg">Loading spending management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] min-h-screen pb-20">
      {/* Header */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#f5f5f5] mb-2">
              Spending Management
            </h1>
            <p className="text-[#ababab]">
              Track expenses, manage vendors, and analyze spending patterns
            </p>
          </div>

          {/* Add Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openModal("create", null, "spending")}
              className="bg-[#f6b100] hover:bg-[#e5a000] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <MdAdd /> Add Expense
            </button>
            <button
              onClick={() => openModal("create", null, "category")}
              className="bg-[#262626] hover:bg-[#343434] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <MdCategory /> Add Category
            </button>
            <button
              onClick={() => openModal("create", null, "vendor")}
              className="bg-[#262626] hover:bg-[#343434] text-[#f5f5f5] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <MdBusiness /> Add Vendor
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-8 border-b border-[#343434]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#262626] text-[#f6b100] border-b-2 border-[#f6b100]"
                  : "text-[#ababab] hover:text-[#f5f5f5] hover:bg-[#262626]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 md:px-6 mb-6">
          <div className="bg-red-500 text-white p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="container mx-auto px-4 md:px-6">
        {activeTab === "spending" && (
          <SpendingRecords
            spending={spending}
            categories={categories}
            vendors={vendors}
            filters={localFilters}
            pagination={reduxPagination}
            loading={loading}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onPageChange={(page) => dispatch(setPagination({ currentPage: page }))}
            onEdit={(item) => openModal("edit", item, "spending")}
            onView={(item) => openModal("view", item, "spending")}
            onDelete={(id) => handleDelete(id, "spending")}
            getStatusColor={getStatusColor}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            categories={categories}
            onEdit={(item) => openModal("edit", item, "category")}
            onDelete={(id) => handleDelete(id, "category")}
          />
        )}

        {activeTab === "vendors" && (
          <VendorsTab
            vendors={vendors}
            onEdit={(item) => openModal("edit", item, "vendor")}
            onView={(item) => openModal("view", item, "vendor")}
            onDelete={(id) => handleDelete(id, "vendor")}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab
            dashboardData={dashboardData}
            loading={loading}
          />
        )}
      </div>

      {/* Modals */}
      <SpendingModal
        isOpen={showSpendingModal}
        onClose={closeModals}
        mode={modalMode}
        spending={selectedItem}
        categories={categories}
        vendors={vendors}
        onSuccess={() => {
          loadSpending();
          closeModals();
        }}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={closeModals}
        mode={modalMode}
        category={selectedItem}
        onSuccess={() => {
          loadInitialData();
          closeModals();
        }}
      />

      <VendorModal
        isOpen={showVendorModal}
        onClose={closeModals}
        mode={modalMode}
        vendor={selectedItem}
        onSuccess={() => {
          loadInitialData();
          closeModals();
        }}
      />
    </div>
  );
};

// Spending Records Tab Component
const SpendingRecords = ({ 
  spending, 
  categories, 
  vendors, 
  filters, 
  pagination, 
  loading,
  onFilterChange,
  onApplyFilters, 
  onPageChange, 
  onEdit, 
  onView, 
  onDelete,
  getStatusColor 
}) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#262626] rounded-lg p-4 border border-[#343434]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[#ababab] text-sm mb-2">Search</label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab]" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
                className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#f6b100]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange("category", e.target.value)}
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Vendor</label>
            <select
              value={filters.vendor}
              onChange={(e) => onFilterChange("vendor", e.target.value)}
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100]"
            >
              <option value="all">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#ababab] text-sm mb-2">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => onFilterChange("paymentStatus", e.target.value)}
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-[#ababab] text-sm mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100]"
            />
          </div>
          <div>
            <label className="block text-[#ababab] text-sm mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="w-full bg-[#1a1a1a] text-[#f5f5f5] border border-[#343434] rounded-lg px-4 py-2 focus:outline-none focus:border-[#f6b100]"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onApplyFilters}
            className="bg-[#f6b100] hover:bg-[#e5a000] text-[#1f1f1f] px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Spending List */}
      <div className="bg-[#262626] rounded-lg border border-[#343434] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
            <p className="text-[#ababab]">Loading spending records...</p>
          </div>
        ) : spending.length === 0 ? (
          <div className="p-8 text-center">
            <MdAccountBalanceWallet className="mx-auto text-6xl text-[#ababab] mb-4" />
            <p className="text-[#ababab] text-lg">No spending records found</p>
            <p className="text-[#ababab] text-sm">Add your first expense to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Title</th>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Amount</th>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Category</th>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Vendor</th>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Date</th>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Status</th>
                    <th className="text-left p-4 text-[#f5f5f5] font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spending.map((item) => (
                    <tr key={item._id} className="border-t border-[#343434] hover:bg-[#2a2a2a]">
                      <td className="p-4">
                        <div>
                          <p className="text-[#f5f5f5] font-medium">{item.title}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-[#f5f5f5] font-semibold">{formatVND(item.amount)}</p>
                      </td>
                      <td className="p-4">
                        {item.category && (
                          <span
                            className="px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: item.category.color || '#6B7280' }}
                          >
                            {item.category.name}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-[#f5f5f5]">{item.vendor?.name || item.vendorName || '-'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[#f5f5f5]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(item.paymentStatus)}`}>
                          {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onView(item)}
                            className="text-[#ababab] hover:text-[#f6b100] transition-colors"
                            title="View"
                          >
                            <MdVisibility />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="text-[#ababab] hover:text-[#f6b100] transition-colors"
                            title="Edit"
                          >
                            <MdEdit />
                          </button>
                          <button
                            onClick={() => onDelete(item._id)}
                            className="text-[#ababab] hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {spending.map((item) => (
                <div key={item._id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#343434]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-[#f5f5f5] font-semibold">{item.title}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(item.paymentStatus)}`}>
                      {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-[#ababab] text-xs">Amount</p>
                      <p className="text-[#f5f5f5] font-semibold">{formatVND(item.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[#ababab] text-xs">Date</p>
                      <p className="text-[#f5f5f5]">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {item.category && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: item.category.color || '#6B7280' }}
                        >
                          {item.category.name}
                        </span>
                      )}
                      {item.vendor?.name && (
                        <span className="text-[#ababab] text-xs">{item.vendor.name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(item)}
                        className="text-[#ababab] hover:text-[#f6b100] transition-colors p-1"
                      >
                        <MdVisibility />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="text-[#ababab] hover:text-[#f6b100] transition-colors p-1"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => onDelete(item._id)}
                        className="text-[#ababab] hover:text-red-500 transition-colors p-1"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-[#343434] flex justify-between items-center">
                <p className="text-[#ababab] text-sm">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 bg-[#1a1a1a] text-[#f5f5f5] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#343434]"
                  >
                    Previous
                  </button>
                  <span className="text-[#ababab] text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 bg-[#1a1a1a] text-[#f5f5f5] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#343434]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Categories Tab Component
const CategoriesTab = ({ categories, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <div key={category._id} className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            ></div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(category)}
                className="text-[#ababab] hover:text-[#f6b100] transition-colors"
              >
                <MdEdit />
              </button>
              <button
                onClick={() => onDelete(category._id)}
                className="text-[#ababab] hover:text-red-500 transition-colors"
              >
                <MdDelete />
              </button>
            </div>
          </div>
          <h3 className="text-[#f5f5f5] font-semibold text-lg mb-2">{category.name}</h3>
          {category.description && (
            <p className="text-[#ababab] text-sm">{category.description}</p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              category.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-[#ababab] text-xs">
              Created {new Date(category.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Vendors Tab Component
const VendorsTab = ({ vendors, onEdit, onView, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <div key={vendor._id} className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#f5f5f5] font-semibold text-lg">{vendor.name}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(vendor)}
                className="text-[#ababab] hover:text-[#f6b100] transition-colors"
              >
                <MdVisibility />
              </button>
              <button
                onClick={() => onEdit(vendor)}
                className="text-[#ababab] hover:text-[#f6b100] transition-colors"
              >
                <MdEdit />
              </button>
              <button
                onClick={() => onDelete(vendor._id)}
                className="text-[#ababab] hover:text-red-500 transition-colors"
              >
                <MdDelete />
              </button>
            </div>
          </div>
          
          {vendor.phone && (
            <p className="text-[#ababab] text-sm mb-2">
              <strong>Phone:</strong> {vendor.phone}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              vendor.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {vendor.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ dashboardData, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4"></div>
        <p className="text-[#ababab] text-lg">Loading analytics...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <MdAnalytics className="mx-auto text-6xl text-[#ababab] mb-4" />
        <p className="text-[#ababab] text-lg">No analytics data available</p>
      </div>
    );
  }

  const { monthlyStats, yearlyStats, recentSpending, upcomingPayments, topCategories, topVendors } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <MdAccountBalanceWallet className="text-2xl text-[#f6b100]" />
            <span className="text-[#ababab] text-sm">This Month</span>
          </div>
          <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatVND(monthlyStats?.totalAmount || 0)}
          </h3>
          <p className="text-[#ababab] text-sm">Total Spending</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <MdReceipt className="text-2xl text-[#10B981]" />
            <span className="text-[#ababab] text-sm">This Month</span>
          </div>
          <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
            {monthlyStats?.count || 0}
          </h3>
          <p className="text-[#ababab] text-sm">Total Records</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <MdPayment className="text-2xl text-[#EF4444]" />
            <span className="text-[#ababab] text-sm">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatVND(monthlyStats?.pendingAmount || 0)}
          </h3>
          <p className="text-[#ababab] text-sm">Pending Payments</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-4">
            <MdDateRange className="text-2xl text-[#8B5CF6]" />
            <span className="text-[#ababab] text-sm">This Year</span>
          </div>
          <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatVND(yearlyStats?.totalAmount || 0)}
          </h3>
          <p className="text-[#ababab] text-sm">Yearly Total</p>
        </div>
      </div>

      {/* Recent Spending & Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Recent Spending</h3>
          <div className="space-y-3">
            {recentSpending?.slice(0, 5).map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                <div>
                  <p className="text-[#f5f5f5] font-medium">{item.title}</p>
                  <p className="text-[#ababab] text-sm">
                    {new Date(item.spendingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#f5f5f5] font-semibold">{formatVND(item.amount)}</p>
                  {item.category && (
                    <span
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: item.category.color }}
                    >
                      {item.category.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Upcoming Payments</h3>
          <div className="space-y-3">
            {upcomingPayments?.slice(0, 5).map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0">
                <div>
                  <p className="text-[#f5f5f5] font-medium">{item.title}</p>
                  <p className="text-[#ababab] text-sm">
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#f5f5f5] font-semibold">{formatVND(item.amount)}</p>
                  {item.vendor && (
                    <p className="text-[#ababab] text-xs">{item.vendor.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Categories & Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories?.map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[#f5f5f5] font-medium">{item.categoryName}</p>
                  <p className="text-[#ababab] text-sm">{item.count} records</p>
                </div>
                <p className="text-[#f5f5f5] font-semibold">{formatVND(item.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-lg mb-4">Top Vendors</h3>
          <div className="space-y-3">
            {topVendors?.map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[#f5f5f5] font-medium">{item.vendorName}</p>
                  <p className="text-[#ababab] text-sm">{item.count} records</p>
                </div>
                <p className="text-[#f5f5f5] font-semibold">{formatVND(item.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingManager;
