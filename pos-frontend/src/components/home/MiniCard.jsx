import PropTypes from 'prop-types'

const MiniCard = ({title, icon, number, footerNum}) => {
  return (
    <div className='bg-[#1a1a1a] py-5 px-5 rounded-lg w-[50%]'>
        <div className='flex items-start justify-between'>
            <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>{title}</h1>
            <button className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-3 rounded-lg text-[#f5f5f5] text-2xl`}>{icon}</button>
        </div>
        <div>
            <h1 className='text-[#f5f5f5] text-4xl font-bold mt-5'>
              {title === "Total Earnings" ? `₹${number}` : number}</h1>
            <h1 className='text-[#f5f5f5] text-lg mt-2'><span className='text-[#02ca3a]'>{footerNum}%</span> than yesterday</h1>
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