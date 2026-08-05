import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import BottomSheet from "../shared/BottomSheet";
import WheelSlotEditor from "./WheelSlotEditor";
import { fetchDishes } from "../../redux/slices/dishSlice";

const DEFAULT_SLOTS = [
  {
    label: "10% Off",
    rewardType: "percentage_discount",
    discountPercent: 10,
    freeDish: "",
    weight: 20,
    color: "#b9d77a",
  },
  {
    label: "Free Drink",
    rewardType: "free_product",
    discountPercent: "",
    freeDish: "",
    weight: 10,
    color: "#016d3b",
  },
  {
    label: "Try Again",
    rewardType: "no_prize",
    discountPercent: "",
    freeDish: "",
    weight: 70,
    color: "#5d6b63",
  },
];

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const CampaignForm = ({ campaign, onSubmit, onClose }) => {
  const dispatch = useDispatch();
  const { items: dishes, loading: dishesLoading } = useSelector(
    (state) => state.dishes
  );

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
    maxPlaysPerPhone: 1,
    isActive: true,
    wheelSlots: DEFAULT_SLOTS,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (dishes.length === 0 && !dishesLoading) {
      dispatch(fetchDishes());
    }
  }, [dispatch, dishes.length, dishesLoading]);

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || "",
        slug: campaign.slug || "",
        description: campaign.description || "",
        startDate: campaign.startDate
          ? new Date(campaign.startDate).toISOString().split("T")[0]
          : "",
        endDate: campaign.endDate
          ? new Date(campaign.endDate).toISOString().split("T")[0]
          : "",
        maxPlaysPerPhone: campaign.maxPlaysPerPhone ?? 1,
        isActive: campaign.isActive !== undefined ? campaign.isActive : true,
        wheelSlots: (campaign.wheelSlots || []).map((slot) => ({
          label: slot.label || "",
          rewardType: slot.rewardType || "no_prize",
          discountPercent: slot.discountPercent ?? "",
          freeDish:
            typeof slot.freeDish === "object"
              ? slot.freeDish?._id || ""
              : slot.freeDish || "",
          weight: slot.weight ?? 1,
          color: slot.color || "#5d6b63",
        })),
      });
      setSlugTouched(true);
    }
  }, [campaign]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !slugTouched && !campaign) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!formData.slug.trim()) {
      nextErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      nextErrors.slug = "Slug must be lowercase letters, numbers, and hyphens";
    }
    if (formData.wheelSlots.length < 2) {
      nextErrors.wheelSlots = "At least 2 wheel slots are required";
    }

    formData.wheelSlots.forEach((slot, index) => {
      if (!slot.label.trim()) {
        nextErrors[`slot_${index}_label`] = "Label is required";
      }
      if (!slot.color || !/^#[0-9A-Fa-f]{6}$/.test(slot.color)) {
        nextErrors[`slot_${index}_color`] = "Valid hex color required";
      }
      if (Number(slot.weight) < 1) {
        nextErrors[`slot_${index}_weight`] = "Weight must be at least 1";
      }
      if (
        slot.rewardType === "percentage_discount" &&
        (slot.discountPercent === "" || Number(slot.discountPercent) < 0)
      ) {
        nextErrors[`slot_${index}_discount`] = "Discount % is required";
      }
      if (slot.rewardType === "free_product" && !slot.freeDish) {
        nextErrors[`slot_${index}_dish`] = "Free dish is required";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        description: formData.description.trim(),
        maxPlaysPerPhone: Number(formData.maxPlaysPerPhone) || 1,
        isActive: formData.isActive,
        wheelSlots: formData.wheelSlots.map((slot) => {
          const normalized = {
            label: slot.label.trim(),
            rewardType: slot.rewardType,
            weight: Number(slot.weight),
            color: slot.color,
          };
          if (slot.rewardType === "percentage_discount") {
            normalized.discountPercent = Number(slot.discountPercent);
          }
          if (slot.rewardType === "free_product") {
            normalized.freeDish = slot.freeDish;
          }
          return normalized;
        }),
      };

      if (formData.startDate) {
        payload.startDate = formData.startDate;
      }
      if (formData.endDate) {
        payload.endDate = formData.endDate;
      }

      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={campaign ? "Edit Campaign" : "New Campaign"}
      size="xl"
      bodyClassName="p-4 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-brand"
              placeholder="Summer Spin 2026"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => {
                setSlugTouched(true);
                handleInputChange("slug", e.target.value.toLowerCase());
              }}
              className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-brand font-mono text-sm"
              placeholder="summer-spin-2026"
            />
            {errors.slug && (
              <p className="text-sm text-red-400 mt-1">{errors.slug}</p>
            )}
            {formData.slug && (
              <p className="text-xs text-[#ababab] mt-1">
                Spin link: https://hikomatcha.vn/spin/{formData.slug}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-brand resize-none"
            placeholder="Optional campaign description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              Start date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              End date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
              Max plays per phone
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxPlaysPerPhone}
              onChange={(e) =>
                handleInputChange("maxPlaysPerPhone", e.target.value)
              }
              className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleInputChange("isActive", e.target.checked)}
            className="rounded border-[#343434] bg-[#262626] text-brand focus:ring-brand focus:ring-2"
          />
          <span className="text-sm font-medium text-[#f5f5f5]">Active</span>
        </label>

        <WheelSlotEditor
          slots={formData.wheelSlots}
          onChange={(wheelSlots) =>
            setFormData((prev) => ({ ...prev, wheelSlots }))
          }
          dishes={dishes}
          errors={errors}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[#343434]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#ababab] bg-[#262626] border border-[#343434] rounded-md hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand text-[#f5f5f5] rounded-md hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "Saving..." : campaign ? "Update" : "Create"} Campaign
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

CampaignForm.propTypes = {
  campaign: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    maxPlaysPerPhone: PropTypes.number,
    isActive: PropTypes.bool,
    wheelSlots: PropTypes.array,
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CampaignForm;
