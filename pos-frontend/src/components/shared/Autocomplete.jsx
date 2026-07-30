import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { MdSearch, MdExpandMore } from "react-icons/md";

const Autocomplete = ({
  value,
  onChange,
  options,
  name,
  placeholder = "Search...",
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  filterOption,
  renderOption,
  disabled = false,
  required = false,
  noOptionsText = "No options found",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => getOptionValue(option) === value),
    [options, value, getOptionValue]
  );

  const defaultFilter = useCallback(
    (option, query) => getOptionLabel(option).toLowerCase().includes(query.toLowerCase()),
    [getOptionLabel]
  );

  const filterFn = filterOption || defaultFilter;

  const filteredOptions = useMemo(() => {
    const query = inputValue.trim();
    if (!query) return options;
    return options.filter((option) => filterFn(option, query));
  }, [options, inputValue, filterFn]);

  useEffect(() => {
    if (isOpen) return;
    if (selectedOption) {
      setInputValue(getOptionLabel(selectedOption));
      return;
    }
    setInputValue("");
  }, [selectedOption, value, isOpen, getOptionLabel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (selectedOption) {
          setInputValue(getOptionLabel(selectedOption));
        } else {
          setInputValue("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption, getOptionLabel]);

  const handleSelect = (option) => {
    onChange({ target: { name, value: getOptionValue(option) } });
    setInputValue(getOptionLabel(option));
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (value) {
      onChange({ target: { name, value: "" } });
    }
  };

  const handleKeyDown = (event) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      handleSelect(filteredOptions[highlightedIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (selectedOption) {
        setInputValue(getOptionLabel(selectedOption));
      } else {
        setInputValue("");
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#343434] focus-within:border-brand">
        <MdSearch className="text-[#ababab] mr-2 shrink-0" size={18} />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !value}
          className="bg-transparent flex-1 text-white focus:outline-none placeholder:text-[#ababab]"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        <MdExpandMore
          className={`text-[#ababab] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          size={20}
        />
      </div>

      {isOpen ? (
        <ul
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[#343434] bg-[#262626] shadow-lg"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[#ababab]">{noOptionsText}</li>
          ) : (
            filteredOptions.map((option, index) => {
              const optionValue = getOptionValue(option);
              const isHighlighted = highlightedIndex === index || optionValue === value;

              return (
                <li
                  key={optionValue}
                  role="option"
                  aria-selected={optionValue === value}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                    isHighlighted
                      ? "bg-brand/20 text-[#f5f5f5]"
                      : "text-[#f5f5f5] hover:bg-[#343434]"
                  }`}
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
};

Autocomplete.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  getOptionLabel: PropTypes.func,
  getOptionValue: PropTypes.func,
  filterOption: PropTypes.func,
  renderOption: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  noOptionsText: PropTypes.string,
};

export default Autocomplete;
