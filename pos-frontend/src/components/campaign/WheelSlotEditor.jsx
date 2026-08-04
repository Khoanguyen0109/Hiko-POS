import PropTypes from "prop-types";
import { MdAdd, MdDelete } from "react-icons/md";

const DEFAULT_COLORS = ["#b9d77a", "#016d3b", "#d7b75a", "#5d6b63", "#014a29", "#f5e7cf"];

const REWARD_TYPES = [
  { value: "percentage_discount", label: "Percentage discount" },
  { value: "free_product", label: "Free product" },
  { value: "no_prize", label: "Try again (no prize)" },
];

const createEmptySlot = (index) => ({
  label: "",
  rewardType: "no_prize",
  discountPercent: "",
  freeDish: "",
  weight: 10,
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
});

const WheelSlotEditor = ({ slots, onChange, dishes = [], errors = {} }) => {
  const totalWeight = slots.reduce(
    (sum, slot) => sum + (Number(slot.weight) || 0),
    0
  );

  const updateSlot = (index, field, value) => {
    const next = slots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    onChange(next);
  };

  const addSlot = () => {
    onChange([...slots, createEmptySlot(slots.length)]);
  };

  const removeSlot = (index) => {
    if (slots.length <= 2) return;
    onChange(slots.filter((_, i) => i !== index));
  };

  const getProbability = (weight) => {
    if (totalWeight <= 0) return "0%";
    return `${((Number(weight) / totalWeight) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#f5f5f5]">Wheel slots</h3>
          <p className="text-xs text-[#ababab] mt-1">
            At least 2 slots required. Total weight: {totalWeight}
          </p>
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] hover:bg-[#2a2a2a] transition-colors"
        >
          <MdAdd size={16} className="mr-1" />
          Add slot
        </button>
      </div>

      {errors.wheelSlots && (
        <p className="text-sm text-red-400">{errors.wheelSlots}</p>
      )}

      <div className="space-y-3">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="p-4 bg-[#262626] border border-[#343434] rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-[#343434]"
                  style={{ backgroundColor: slot.color || "#5d6b63" }}
                />
                <span className="text-sm font-medium text-[#f5f5f5]">
                  Slot {index + 1}
                </span>
                <span className="text-xs text-brand">
                  {getProbability(slot.weight)} chance
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeSlot(index)}
                disabled={slots.length <= 2}
                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remove slot"
              >
                <MdDelete size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#ababab] mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={slot.label}
                  onChange={(e) => updateSlot(index, "label", e.target.value)}
                  placeholder="e.g. 10% Off"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#666] focus:outline-none focus:border-brand text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#ababab] mb-1">
                  Reward type
                </label>
                <select
                  value={slot.rewardType}
                  onChange={(e) =>
                    updateSlot(index, "rewardType", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand text-sm"
                >
                  {REWARD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {slot.rewardType === "percentage_discount" && (
                <div>
                  <label className="block text-xs font-medium text-[#ababab] mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={slot.discountPercent}
                    onChange={(e) =>
                      updateSlot(index, "discountPercent", e.target.value)
                    }
                    placeholder="10"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#666] focus:outline-none focus:border-brand text-sm"
                  />
                </div>
              )}

              {slot.rewardType === "free_product" && (
                <div>
                  <label className="block text-xs font-medium text-[#ababab] mb-1">
                    Free dish
                  </label>
                  <select
                    value={slot.freeDish || ""}
                    onChange={(e) =>
                      updateSlot(index, "freeDish", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand text-sm"
                  >
                    <option value="">Select dish</option>
                    {dishes.map((dish) => (
                      <option key={dish._id} value={dish._id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#ababab] mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  min="1"
                  value={slot.weight}
                  onChange={(e) => updateSlot(index, "weight", e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#ababab] mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={slot.color || "#5d6b63"}
                    onChange={(e) => updateSlot(index, "color", e.target.value)}
                    className="w-10 h-10 rounded border border-[#343434] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={slot.color || ""}
                    onChange={(e) => updateSlot(index, "color", e.target.value)}
                    placeholder="#b9d77a"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#666] focus:outline-none focus:border-brand text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

WheelSlotEditor.propTypes = {
  slots: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      rewardType: PropTypes.string,
      discountPercent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      freeDish: PropTypes.string,
      weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      color: PropTypes.string,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  dishes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  errors: PropTypes.object,
};

export default WheelSlotEditor;
