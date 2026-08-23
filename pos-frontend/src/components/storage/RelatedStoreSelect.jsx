import PropTypes from "prop-types";
import { MdStore } from "react-icons/md";

const RelatedStoreSelect = ({
  name,
  value,
  onChange,
  stores,
  label,
  placeholder = "Select store",
}) => (
  <div>
    <label className="block text-[#ababab] text-sm mb-2">
      <MdStore className="inline mr-1" size={16} />
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-brand">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="bg-transparent w-full text-white focus:outline-none"
      >
        <option value="" className="bg-[#1f1f1f]">{placeholder}</option>
        {stores.map((store) => (
          <option key={store._id} value={store._id} className="bg-[#1f1f1f]">
            {store.name}{store.code ? ` (${store.code})` : ""}
          </option>
        ))}
      </select>
    </div>
  </div>
);

RelatedStoreSelect.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  stores: PropTypes.arrayOf(PropTypes.object).isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
};

export default RelatedStoreSelect;
