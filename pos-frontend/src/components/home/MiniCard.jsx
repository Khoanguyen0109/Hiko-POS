import PropTypes from 'prop-types'
import { formatVND } from '../../utils'

const CHANGE_COLOR = {
  up: "text-green-400",
  down: "text-red-400",
  flat: "text-[#ababab]",
};

const MiniCard = ({title, icon, number, change}) => {
  const isLoading = number === "...";
  
  return (
    <div className='bg-[#1a1a1a] py-4 sm:py-5 px-4 sm:px-5 rounded-lg w-full sm:w-[50%]'>
        <div className='flex items-start justify-between'>
            <h1 className='text-[#f5f5f5] text-base sm:text-lg font-semibold tracking-wide'>{title}</h1>
            <button className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-brand"} p-2 sm:p-3 rounded-lg text-[#f5f5f5] text-xl sm:text-2xl`}>{icon}</button>
        </div>
        <div>
            <h1 className='text-[#f5f5f5] text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 sm:mt-5'>
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : title === "Total Earnings" ? (
                formatVND(`${number}`)
              ) : (
                number
              )}
            </h1>
            {change ? (
              <p className={`mt-1 text-sm font-semibold ${CHANGE_COLOR[change.direction]}`}>
                {change.text}
                <span className="ml-1 font-normal text-[#ababab]">vs yesterday</span>
              </p>
            ) : null}
        </div>
    </div>
  )
}

MiniCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.shape({
    text: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(["up", "down", "flat"]).isRequired,
  }),
}

export default MiniCard