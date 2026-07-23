import PropTypes from "prop-types";

const EmptyState = ({
  icon: Icon,
  title,
  message,
  action,
  variant = "simple",
}) => {
  if (variant === "rich") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        {Icon ? (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#262626]">
            <Icon size={32} className="text-[#6a6a6a]" />
          </div>
        ) : null}
        {title ? (
          <h3 className="mb-2 text-lg font-semibold text-[#f5f5f5]">{title}</h3>
        ) : null}
        {message ? <p className="max-w-md text-sm text-[#ababab]">{message}</p> : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      {Icon ? <Icon size={48} className="mx-auto mb-3 text-[#343434]" /> : null}
      {title ? <p className="mb-1 text-sm font-medium text-[#f5f5f5]">{title}</p> : null}
      {message ? <p className="text-[#ababab]">{message}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  message: PropTypes.string,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  variant: PropTypes.oneOf(["simple", "rich"]),
};

export default EmptyState;
