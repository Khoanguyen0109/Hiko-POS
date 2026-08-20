import PropTypes from "prop-types";

const RewardCategoryCounts = ({ progress, className = "" }) => {
  if (!progress || progress.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`.trim()}>
      {progress.map((program) => {
        const label =
          program.categoryLabels?.length > 0
            ? program.categoryLabels.join(", ")
            : "All dishes";

        return (
          <span
            key={String(program.rewardProgramId)}
            title={program.name}
            className="inline-flex items-center gap-1 rounded-full border border-[#343434] bg-[#1f1f1f] px-2 py-0.5 text-[11px]"
          >
            <span className="text-[#ababab]">{label}</span>
            <span className="font-semibold text-brand">
              {program.dishCount}/{program.dishThreshold}
            </span>
          </span>
        );
      })}
    </div>
  );
};

RewardCategoryCounts.propTypes = {
  progress: PropTypes.arrayOf(
    PropTypes.shape({
      rewardProgramId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
      ]).isRequired,
      name: PropTypes.string,
      dishCount: PropTypes.number.isRequired,
      dishThreshold: PropTypes.number.isRequired,
      categoryLabels: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  className: PropTypes.string,
};

export default RewardCategoryCounts;
