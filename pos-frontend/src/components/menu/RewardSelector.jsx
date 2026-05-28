import { useDispatch, useSelector } from "react-redux";
import { applyReward, removeAppliedReward } from "../../redux/slices/rewardSlice";

const RewardSelector = () => {
  const dispatch = useDispatch();
  const { customerRewards, rewardsLoading, appliedReward } = useSelector(
    (state) => state.rewards
  );

  if (!customerRewards) return null;

  const { rewards = [] } = customerRewards;
  if (rewards.length === 0) return null;

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
        {rewards.map((reward, idx) => {
          const active = isApplied(reward);
          const icon = reward.type === "percentage_discount" ? "🎫" : "🍜";

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
    </div>
  );
};

export default RewardSelector;
