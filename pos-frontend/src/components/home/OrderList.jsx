import PropTypes from "prop-types";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";

const OrderList = ({ order }) => {
  return (
    <div className="flex items-center gap-5 mb-3">
      <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
        {getAvatarName(order.customerDetails?.name)}
      </button>
      <div className="flex items-center justify-between w-[100%]">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            {order.customerDetails?.name}
          </h1>
          <p className="text-[#ababab] text-sm">{order.items.reduce((total, item) => total + item.quantity, 0)} Items</p>
        </div>


        <div className="flex flex-col items-end gap-2">
          {order.orderStatus === "Ready" ? (
            <>
              <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
                <FaCheckDouble className="inline mr-2" /> {order.orderStatus}
              </p>
            </>
          ) : (
            <>
              <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
                <FaCircle className="inline mr-2" /> {order.orderStatus}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

OrderList.propTypes = {
  order: PropTypes.shape({
    customerDetails: PropTypes.shape({
      name: PropTypes.string.isRequired
    }).isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    table: PropTypes.shape({ tableNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired }).isRequired,
    orderStatus: PropTypes.string.isRequired
  }).isRequired
}

export default OrderList;
