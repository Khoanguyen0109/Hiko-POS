import PropTypes from 'prop-types'
import { formatVND } from '../../utils'

const MiniCard = ({title, icon, number}) => {
  const isLoading = number === "...";
  
  return (
    <div className='bg-[#1a1a1a] py-4 sm:py-5 px-4 sm:px-5 rounded-lg w-full sm:w-[50%]'>
        <div className='flex items-start justify-between'>
            <h1 className='text-[#f5f5f5] text-base sm:text-lg font-semibold tracking-wide'>{title}</h1>
            <button className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-2 sm:p-3 rounded-lg text-[#f5f5f5] text-xl sm:text-2xl`}>{icon}</button>
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
        </div>
    </div>
  )
}

MiniCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  footerNum: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
}

export default MiniCard