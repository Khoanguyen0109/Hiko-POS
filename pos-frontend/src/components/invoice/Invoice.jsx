import { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { formatVND } from "../../utils";
const Invoice = ({ orderInfo, setShowInvoice }) => {
  console.log('orderInfo', orderInfo)
  const invoiceRef = useRef(null);
  const navigate = useNavigate();

  const handleViewOrderDetail = () => {
    // Close the invoice modal
    setShowInvoice(false);
    // Navigate to the order detail page
    navigate(`/orders/${orderInfo._id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg w-[400px]">
        {/* Modal Header with Close Button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Order Receipt</h2>
          <button
            onClick={() => setShowInvoice(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Receipt Content for Printing */}

        <div ref={invoiceRef} className="p-4">
          {/* Receipt Header */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="w-12 h-12 border-8 border-green-500 rounded-full flex items-center justify-center shadow-lg bg-green-500"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-2xl"
              >
                <FaCheck className="text-white" />
              </motion.span>
            </motion.div>
          </div>

          <p className="text-gray-600 text-center mb-2">Thank you for your order!</p>

          {/* Order Details */}

          <div className="mt-4 border-t pt-4 text-sm text-gray-700">
            <p>
              <strong>Order ID:</strong>{" "}
              {Math.floor(new Date(orderInfo.orderDate).getTime())}
            </p>
            <p>
              <strong>Name:</strong> {orderInfo.customerDetails?.name}
            </p>
          </div>

          {/* Items Summary */}

          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Items Ordered</h3>
            <div className="text-sm text-gray-700 space-y-3">
              {orderInfo.items.map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                  {/* Main item */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {item?.name} ×{item?.quantity}
                      </div>
                      {item.variant && (
                        <div className="text-xs text-gray-500 mt-1">
                          Size: {item.variant.size}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-gray-800">
                      {formatVND(item.price)}
                    </span>
                  </div>
                  
                  {/* Toppings */}
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="mt-2 ml-4 space-y-1">
                      <div className="text-xs text-gray-600 font-medium">Add-ons:</div>
                      {item.toppings.map((topping, toppingIndex) => (
                        <div key={toppingIndex} className="flex justify-between items-center text-xs text-gray-600">
                          <span className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {topping.name} ×{topping.quantity}
                          </span>
                          <span>{formatVND(topping.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Special instructions */}
                  {item.note && (
                    <div className="mt-2 text-xs text-gray-500 italic">
                      Note: {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bills Summary */}

          <div className="mt-4 border-t pt-4 text-sm">
            <p>
              <strong>Subtotal:</strong> {formatVND(orderInfo.bills.total)}
            </p>
            <p>
              <strong>Tax:</strong> {formatVND(orderInfo.bills.tax)}
            </p>
            <p className="text-md font-semibold">
              <strong>Grand Total:</strong> {formatVND(orderInfo.bills.totalWithTax)}
            </p>
          </div>

          {/* Payment Details */}

          <div className="mb-2 mt-2 text-xs">
            {orderInfo.paymentMethod === "Cash" ? (
              <>
                <p>
                  <strong>Payment Method:</strong> {orderInfo.paymentMethod}
                </p>
                <p>
                  <strong>3rd Party Vendor:</strong> {orderInfo.thirdPartyVendor || 'None'}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Payment Method:</strong> {orderInfo.paymentMethod}
                </p>
                <p>
                  <strong>3rd Party Vendor:</strong> {orderInfo.thirdPartyVendor || 'None'}
                </p>
                <p>
                  <strong>Payment Status:</strong> Completed
                </p>
              </>
            )}
          </div>
        </div>

        {/* Order Detail Button */}
        <div className="flex justify-center p-4 border-t border-gray-200">
          <button
            onClick={handleViewOrderDetail}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Order Detail
          </button>
        </div>
      </div>
    </div>
  );
};

Invoice.propTypes = {
  setShowInvoice: PropTypes.func.isRequired,
  orderInfo: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    orderDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    customerDetails: PropTypes.shape({
      name: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      guests: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    }).isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      variant: PropTypes.shape({
        size: PropTypes.string,
        price: PropTypes.number,
        cost: PropTypes.number,
      }),
      toppings: PropTypes.arrayOf(
        PropTypes.shape({
          toppingId: PropTypes.string,
          name: PropTypes.string.isRequired,
          price: PropTypes.number.isRequired,
          quantity: PropTypes.number.isRequired,
          totalPrice: PropTypes.number.isRequired,
        })
      ),
      note: PropTypes.string,
    })).isRequired,
    bills: PropTypes.shape({
      total: PropTypes.number.isRequired,
      tax: PropTypes.number.isRequired,
      totalWithTax: PropTypes.number.isRequired
    }).isRequired,
    paymentMethod: PropTypes.string.isRequired,
    thirdPartyVendor: PropTypes.string,
    paymentData: PropTypes.shape({
      paymentStatus: PropTypes.string
    })
  }).isRequired
}

export default Invoice;
