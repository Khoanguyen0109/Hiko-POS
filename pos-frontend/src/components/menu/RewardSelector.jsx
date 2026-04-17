import { useDispatch, useSelector } from "react-redux";
import { applyReward, removeAppliedReward } from "../../redux/slices/rewardSlice";

const RewardSelector = () => {
  const dispatch = useDispatch();
  const { customerRewards, rewardsLoading, appliedReward } = useSelector(
    (state) => state.rewards
  );

  if (!customerRewards) return null;

  const { availableRewards = [], nextReward } = customerRewards;
  if (availableRewards.length === 0 && !nextReward) return null;

  const isApplied = (reward) =>
    appliedReward?.rewardProgramId === reward.rewardProgramId &&
    appliedReward?.type === reward.type;

  return (
    <div className="px-3 py-2">
      <p className="text-[#ababab] text-[11px] uppercase tracking-wider font-semibold mb-2">
        Rewards
      </p>

      {rewardsLoading && (
        <p className="text-[#ababab] text-xs text-center py-2">Loading…</p>
      )}

      <div className="space-y-2">
        {availableRewards.map((reward, idx) => {
          const active = isApplied(reward);
          const icon = reward.type === "percentage" ? "🎫" : "🍜";

          return (
            <div
              key={`${reward.rewardProgramId}-${idx}`}
              className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                active
                  ? "bg-green-500/15 border border-green-500/30"
                  : "bg-[#2a2a2a] border border-transparent"
              }`}
            >
              <span className="text-lg shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    active ? "text-green-400" : "text-[#f5f5f5]"
                  }`}
                >
                  {reward.name}
                </p>
                {reward.description && (
                  <p className="text-[#ababab] text-xs truncate">
                    {reward.description}
                  </p>
                )}
              </div>
              {active ? (
                <button
                  onClick={() => dispatch(removeAppliedReward())}
                  className="text-red-400 text-xs font-semibold px-2 py-1 rounded hover:bg-red-500/15 transition-colors shrink-0"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => dispatch(applyReward(reward))}
                  disabled={!!appliedReward}
                  className="text-green-400 text-xs font-semibold px-2 py-1 rounded hover:bg-green-500/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  Use
                </button>
              )}
            </div>
          );
        })}
      </div>

      {nextReward && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#ababab]">
              Next: {nextReward.name}
            </span>
            <span className="text-[#f6b100] font-medium">
              {nextReward.currentCount}/{nextReward.threshold}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#343434] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f6b100] rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  ((nextReward.currentCount || 0) / (nextReward.threshold || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardSelector;
