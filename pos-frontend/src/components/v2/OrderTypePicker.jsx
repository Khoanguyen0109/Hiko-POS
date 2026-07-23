import { useDispatch, useSelector } from "react-redux";
import { MdStore, MdStorefront } from "react-icons/md";
import { setThirdPartyVendor } from "../../redux/slices/cartSlice";

const VENDOR_OPTIONS = [
  {
    value: "None",
    label: "None",
    icon: MdStore,
    activeClass: "bg-blue-600 text-white border-2 border-blue-400 shadow-lg",
    hoverClass: "hover:border-blue-500",
  },
  {
    value: "Grab",
    label: "Grab",
    icon: MdStore,
    activeClass: "bg-blue-600 text-white border-2 border-blue-400 shadow-lg",
    hoverClass: "hover:border-blue-500",
  },
  {
    value: "Shopee",
    label: "Shopee",
    icon: MdStorefront,
    activeClass: "bg-orange-600 text-white border-2 border-orange-400 shadow-lg",
    hoverClass: "hover:border-orange-500",
  },
  {
    value: "BeFood",
    label: "BeFood",
    icon: MdStore,
    activeClass: "bg-purple-600 text-white border-2 border-purple-400 shadow-lg",
    hoverClass: "hover:border-purple-500",
  },
  {
    value: "XanhSM",
    label: "XanhSM",
    icon: MdStore,
    activeClass: "bg-teal-600 text-white border-2 border-teal-400 shadow-lg",
    hoverClass: "hover:border-teal-500",
  },
];

const OrderTypePicker = () => {
  const dispatch = useDispatch();
  const selectedVendor = useSelector((state) => state.cart.thirdPartyVendor);
  const { loading } = useSelector((state) => state.orders);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-[#ababab]">Order type</label>
      <div className="flex flex-wrap gap-2">
        {VENDOR_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = selectedVendor === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={loading}
              onClick={() => dispatch(setThirdPartyVendor(option.value))}
              className={`flex min-h-[40px] items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? option.activeClass
                  : `border-[#343434] bg-[#262626] text-[#f5f5f5] ${option.hoverClass}`
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Icon size={14} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTypePicker;
