import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
  useSearchCustomersQuery,
  useGetCustomerRewardsQuery,
  useAddCustomerMutation,
} from "../../redux/api/endpoints";
import { unwrapList } from "../../redux/api/queryResult";
import {
  fetchCustomerRewards,
  clearCustomerRewards,
} from "../../redux/slices/rewardSlice";
import { setCustomer, removeCustomer } from "../../redux/slices/customerSlice";
import { MdPerson, MdClose, MdSearch } from "react-icons/md";
import { getAvatarName } from "../../utils";
import RewardCategoryCounts from "./RewardCategoryCounts";

const CustomerLookup = () => {
  const dispatch = useDispatch();
  const sliceCustomerRewards = useSelector((state) => state.rewards.customerRewards);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResult, isLoading: searchLoading } = useSearchCustomersQuery(
    debouncedQuery,
    { skip: debouncedQuery.length < 2 }
  );
  const searchResults = unwrapList(searchResult);
  const { data: queriedRewards } = useGetCustomerRewardsQuery(
    selectedCustomer?._id ?? skipToken
  );
  const customerRewards = queriedRewards || sliceCustomerRewards;
  const [addCustomer] = useAddCustomerMutation();

  useEffect(() => {
    if (!sliceCustomerRewards) {
      setSelectedCustomer(null);
      setQuery("");
      setShowDropdown(false);
    }
  }, [sliceCustomerRewards]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isValidPhone = /^\d{10}$/.test(query);
  const showNewRow =
    isValidPhone && !searchLoading && searchResults.length === 0;

  const handleSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowDropdown(false);
    setQuery("");
    dispatch(
      setCustomer({
        name: customer.name || "",
        phone: customer.phone || "",
        guests: 0,
      })
    );
    // Keep reward slice populated for RewardSelector/Bill (client session).
    dispatch(fetchCustomerRewards(customer._id));
  };

  const handleCreateAndSelect = async () => {
    try {
      const result = await addCustomer({ phone: query }).unwrap();
      handleSelect(result);
    } catch {
      /* mutation error surfaced by query cache */
    }
  };

  const handleDeselect = () => {
    setSelectedCustomer(null);
    setQuery("");
    setShowDropdown(false);
    dispatch(removeCustomer());
    dispatch(clearCustomerRewards());
  };

  if (selectedCustomer) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg p-3">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-[#f5f5f5] font-bold text-sm shrink-0">
            {getAvatarName(selectedCustomer.name || selectedCustomer.phone)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f5f5f5] text-sm font-medium truncate">
              {selectedCustomer.name || selectedCustomer.phone}
            </p>
            <p className="text-[#ababab] text-xs">{selectedCustomer.phone}</p>
            <RewardCategoryCounts
              className="mt-1"
              progress={customerRewards?.progress}
            />
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
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[#f5f5f5] font-bold text-xs shrink-0">
                  {getAvatarName(c.name || c.phone)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f5f5] text-sm truncate">
                    {c.name || c.phone}
                  </p>
                  <p className="text-[#ababab] text-xs">{c.phone}</p>
                </div>
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
