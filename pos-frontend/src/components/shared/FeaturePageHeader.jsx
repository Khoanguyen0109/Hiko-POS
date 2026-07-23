import PropTypes from "prop-types";
import BackButton from "./BackButton";

const tabButtonClass = (active) =>
  `flex min-h-[36px] min-w-[5rem] flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
    active
      ? "bg-[#262626] text-brand shadow-sm"
      : "text-[#ababab] hover:bg-[#262626]/60 hover:text-[#f5f5f5]"
  }`;

const FeaturePageHeader = ({
  title,
  onBack,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <header className="border-b border-[#343434] bg-[#1a1a1a]">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <BackButton onClick={onBack} />
          <h1 className="truncate text-base font-semibold text-[#f5f5f5]">
            {title}
          </h1>
        </div>

        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      {tabs?.length > 0 ? (
        <div className="px-4 pb-2.5 sm:px-6">
          <div
            className="flex gap-1 overflow-x-auto rounded-lg bg-[#141414] p-1 scrollbar-hide"
            role="tablist"
          >
            {tabs.map((tab) => {
              const tabId = tab.id ?? tab.key;
              const isActive = activeTab === tabId;
              const iconNode =
                typeof tab.icon === "function" ? (
                  <tab.icon size={16} />
                ) : (
                  tab.icon
                );

              return (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange?.(tabId)}
                  className={tabButtonClass(isActive)}
                >
                  {iconNode}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {children ? (
        <div className="border-t border-[#343434] px-4 py-3 sm:px-6">{children}</div>
      ) : null}
    </header>
  );
};

FeaturePageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  actions: PropTypes.node,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
    })
  ),
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  children: PropTypes.node,
};

export default FeaturePageHeader;
