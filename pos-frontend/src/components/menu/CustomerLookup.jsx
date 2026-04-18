import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  searchCustomers,
  createCustomer,
  clearSearchResults,
} from "../../redux/slices/customersSlice";
import {
  fetchCustomerRewards,
  clearCustomerRewards,
} from "../../redux/slices/rewardSlice";
import { MdPerson, MdClose, MdSearch } from "react-icons/md";
import { getAvatarName } from "../../utils";

const CustomerLookup = () => {
  const dispatch = useDispatch();
  const { searchResults, searchLoading } = useSelector(
    (state) => state.customersData
  );

  const customerRewards = useSelector((state) => state.rewards.customerRewards);

  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!customerRewards && selectedCustomer) {
      setSelectedCustomer(null);
    }
  }, [customerRewards, selectedCustomer]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        dispatch(searchCustomers(query));
      }, 300);
    } else {
      dispatch(clearSearchResults());
    }
    return () => clearTimeout(debounceRef.current);
  }, [query, dispatch]);

  const isValidPhone = /^\d{10}$/.test(query);
  const showNewRow =
    isValidPhone && !searchLoading && searchResults.length === 0;

  const handleSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowDropdown(false);
    setQuery("");
    dispatch(clearSearchResults());
    dispatch(fetchCustomerRewards(customer._id));
  };

  const handleCreateAndSelect = async () => {
    try {
      const result = await dispatch(createCustomer({ phone: query })).unwrap();
      handleSelect(result);
    } catch {
      /* createCustomer thunk already handles errors */
    }
  };

  const handleDeselect = () => {
    setSelectedCustomer(null);
    dispatch(clearCustomerRewards());
    dispatch(clearSearchResults());
  };

  if (selectedCustomer) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg p-3">
          <div className="w-9 h-9 rounded-full bg-[#f6b100] flex items-center justify-center text-[#1a1a1a] font-bold text-sm shrink-0">
            {getAvatarName(selectedCustomer.name || selectedCustomer.phone)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f5f5f5] text-sm font-medium truncate">
              {selectedCustomer.name || selectedCustomer.phone}
            </p>
            <p className="text-[#ababab] text-xs">
              {selectedCustomer.phone}
              {selectedCustomer.totalDishCount != null &&
                ` · ${selectedCustomer.totalDishCount} dishes`}
            </p>
          </div>
          <button
            onClick={handleDeselect}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 relative" ref={wrapperRef}>
      <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg px-3 py-2">
        <MdSearch size={18} className="text-[#ababab] shrink-0" />
        <input
          type="text"
          placeholder="Phone or nickname…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          className="bg-transparent text-[#f5f5f5] text-sm placeholder-[#ababab] outline-none w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              dispatch(clearSearchResults());
              setShowDropdown(false);
            }}
            className="text-[#ababab] hover:text-[#f5f5f5]"
          >
            <MdClose size={16} />
          </button>
        )}
      </div>

      {showDropdown && query.length >= 2 && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-[#2a2a2a] rounded-lg shadow-lg border border-[#343434] max-h-60 overflow-y-auto z-50">
          {searchLoading && (
            <p className="text-[#ababab] text-xs text-center py-3">
              Searching…
            </p>
          )}

          {!searchLoading &&
            searchResults.map((c) => (
              <button
                key={c._id}
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#343434] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#f6b100] flex items-center justify-center text-[#1a1a1a] font-bold text-xs shrink-0">
                  {getAvatarName(c.name || c.phone)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f5f5] text-sm truncate">
                    {c.name || c.phone}
                  </p>
                  <p className="text-[#ababab] text-xs">{c.phone}</p>
                </div>
                {c.totalDishCount != null && (
                  <span className="text-[#ababab] text-xs whitespace-nowrap">
                    {c.totalDishCount} dishes
                  </span>
                )}
              </button>
            ))}

          {showNewRow && (
            <button
              onClick={handleCreateAndSelect}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#343434] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                <MdPerson size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#f5f5f5] text-sm">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-2">
                    NEW
                  </span>
                  {query}
                </p>
                <p className="text-[#ababab] text-xs">
                  Create new customer
                </p>
              </div>
            </button>
          )}

          {!searchLoading && searchResults.length === 0 && !showNewRow && (
            <p className="text-[#ababab] text-xs text-center py-3">
              No customers found
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerLookup;
