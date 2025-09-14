import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import { createOrder } from "../../redux/slices/orderSlice";
import { enqueueSnackbar } from "notistack";
import Invoice from "../invoice/Invoice";
import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import ThermalReceiptTemplate from "../print/ThermalReceiptTemplate";
import { formatVND } from "../../utils";



const Bill = () => {
  const dispatch = useDispatch();
  const thermalReceiptRef = useRef();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const { loading } = useSelector((state) => state.orders);

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  const handleThermalPrint = useReactToPrint({
    contentRef: thermalReceiptRef,
    documentTitle: `Receipt-${customerData.orderId || Date.now()}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body { margin: 0; }
      }
    `
  });

  const handlePrintReceipt = () => {
    if (cartData.items?.length === 0) {
      enqueueSnackbar("No items in cart to print", { variant: "warning" });
      return;
    }
    handleThermalPrint();
  };

  const handlePlaceOrder = async () => {
    // Place the order
    const orderData = {
      customerDetails: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      orderStatus: "progress",
      bills: {
        total: total,
        tax: 0,
        totalWithTax: total,
      },
      items: cartData.items,
      paymentMethod: cartData.paymentMethod,
    };
    
    dispatch(createOrder(orderData))
      .unwrap()
      .then((data) => {
        console.log(data);
        setOrderInfo(data);
        
        enqueueSnackbar("Order Placed Successfully!", {
          variant: "success",
        });
        setShowInvoice(true);
        
        // Clear cart and customer data
        setTimeout(() => {
          dispatch(removeCustomer());
          dispatch(removeAllItems());
        }, 1500);
      })
      .catch((error) => {
        console.log(error);
        const errorMessage = error || "Failed to place order";
        enqueueSnackbar(errorMessage, {
          variant: "error",
        });
      });
  };

  // Prepare thermal receipt data
  const thermalReceiptData = {
    orderId: customerData.orderId || Date.now(),
    customerName: customerData.customerName,
    customerPhone: customerData.customerPhone,
    guests: customerData.guests,
    items: cartData.items,
    subtotal: total,
    total: total
  };

  return (
    <>
      {/* Hidden thermal receipt template */}
      <div style={{ display: 'none' }}>
        <ThermalReceiptTemplate ref={thermalReceiptRef} orderData={thermalReceiptData} />
      </div>

      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Items({cartData.items?.length || 0})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          {formatVND(total)}
        </h1>
      </div>
      
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-lg text-[#f5f5f5] font-bold mt-2">
          Total
        </p>
        <h1 className="text-[#f6b100] text-xl font-bold">
          {formatVND(total)}
        </h1>
      </div>

      <div className="flex items-center gap-3 px-5 mt-4">
        <button 
          onClick={handlePrintReceipt} 
          className="bg-[#025cca] px-4 py-3 w-full rounded-lg text-[#f5f5f5] font-semibold text-lg hover:bg-[#0248a3] transition-colors"
        >
          Print Receipt
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={cartData.items?.length === 0 || loading}
          className="bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-lg hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
