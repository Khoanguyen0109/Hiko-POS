import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdStore, MdCheck, MdLocationOn } from "react-icons/md";
import { Modal } from "../ui";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { fetchAllStores } from "../../redux/slices/storeSlice";
import { updateMemberStores as updateMemberStoresApi } from "../../https";

const STORE_ROLES = ["Staff", "Manager", "Owner"];

const StoreAssignmentModal = ({ isOpen, onClose, member, onUpdated }) => {
  const dispatch = useDispatch();
  const { allStores, allStoresLoading } = useSelector((state) => state.store);

  const [selections, setSelections] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && allStores.length === 0) {
      dispatch(fetchAllStores());
    }
  }, [isOpen, allStores.length, dispatch]);

  useEffect(() => {
    if (!member) return;
    const initial = {};
    for (const store of member.assignedStores || []) {
      if (store.isActive) {
        initial[store._id] = store.storeRole || "Staff";
      }
    }
    setSelections(initial);
  }, [member]);

  const activeStores = allStores.filter((s) => s.isActive !== false);

  const toggleStore = (storeId) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[storeId]) {
        delete next[storeId];
      } else {
        next[storeId] = "Staff";
      }
      return next;
    });
  };

  const changeRole = (storeId, role) => {
    setSelections((prev) => ({ ...prev, [storeId]: role }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const assignments = Object.entries(selections).map(
        ([storeId, role]) => ({ storeId, role })
      );
      const { data } = await updateMemberStoresApi(member._id, assignments);
      enqueueSnackbar("Store assignments updated!", { variant: "success" });
      if (onUpdated) onUpdated(member._id, data.data);
      onClose();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Failed to update store assignments",
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Stores — ${member.name}`}
      size="md"
      footerActions={[
        { label: "Cancel", onClick: onClose, variant: "secondary" },
        {
          label: saving ? "Saving..." : "Save Assignments",
          onClick: handleSave,
          variant: "primary",
          loading: saving,
          disabled: saving,
        },
      ]}
    >
      <div className="space-y-2">
        <p className="text-[#ababab] text-sm mb-4">
          Select which stores{" "}
          <span className="text-yellow-400 font-medium">{member.name}</span>{" "}
          can access and their role in each store.
        </p>

        {allStoresLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeStores.length === 0 ? (
          <p className="text-[#ababab] text-sm text-center py-8">
            No stores available. Create a store first.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {activeStores.map((store) => {
              const isSelected = !!selections[store._id];
              return (
                <div
                  key={store._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-yellow-400/50 bg-yellow-400/5"
                      : "border-[#343434] bg-[#1a1a1a] hover:border-[#555]"
                  }`}
                  onClick={() => toggleStore(store._id)}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-yellow-400/20" : "bg-[#262626]"
                    }`}
                  >
                    {isSelected ? (
                      <MdCheck className="text-yellow-400" />
                    ) : (
                      <MdStore className="text-[#666]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f5] text-sm font-medium truncate">
                      {store.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#888]">
                      <span>{store.code}</span>
                      {store.address && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 truncate">
                            <MdLocationOn size={10} />
                            {store.address}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <select
                      value={selections[store._id]}
                      onChange={(e) => {
                        e.stopPropagation();
                        changeRole(store._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#262626] border border-[#444] rounded-md px-2 py-1 text-xs text-[#f5f5f5] focus:outline-none focus:border-yellow-400 flex-shrink-0"
                    >
                      {STORE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-[#343434] mt-4">
          <p className="text-[#888] text-xs">
            {Object.keys(selections).length} store
            {Object.keys(selections).length !== 1 ? "s" : ""} assigned
          </p>
        </div>
      </div>
    </Modal>
  );
};

StoreAssignmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  member: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    assignedStores: PropTypes.array,
  }),
  onUpdated: PropTypes.func,
};

export default StoreAssignmentModal;
