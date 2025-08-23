import { forwardRef } from "react";
import PropTypes from "prop-types";
import { formatVND } from "../../utils";

const ThermalReceiptTemplate = forwardRef(({ orderData }, ref) => {
  const currentTime = new Date().toLocaleString();
  const itemCount = orderData.items?.length || 0;
  const isLargeOrder = itemCount > 20;

  // Group identical items to reduce length
  const groupedItems = orderData.items?.reduce((acc, item) => {
    const key = `${item.name}-${item.price}`;
    if (acc[key]) {
      acc[key].quantity += (item.quantity || 1);
      acc[key].totalPrice += item.price;
    } else {
      acc[key] = {
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.price / (item.quantity || 1),
        totalPrice: item.price
      };
    }
    return acc;
  }, {}) || {};

  const groupedItemsArray = Object.values(groupedItems);

  return (
    <div ref={ref} style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.1' }}>
      <style>
        {`
          @media print {
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            body { margin: 0; }
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '3px' }}>
          RESTRO
        </div>
        <div style={{ fontSize: '9px' }}>
          Restaurant POS System
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: '8px', fontSize: '9px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Order ID:</span>
          <span>#{orderData.orderId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Table:</span>
          <span>{orderData.table}</span>
        </div>
        {orderData.customerName && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer:</span>
            <span>{orderData.customerName}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Time:</span>
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Large order warning */}
      {isLargeOrder && (
        <div style={{ 
          textAlign: 'center', 
          fontSize: '8px', 
          backgroundColor: '#f0f0f0', 
          padding: '2px', 
          marginBottom: '5px',
          border: '1px solid #ccc'
        }}>
          ⚠️ Large Order - Items grouped for readability
        </div>
      )}

      {/* Items */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '9px', 
          fontWeight: 'bold',
          marginBottom: '2px'
        }}>
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>
        
        {groupedItemsArray.map((item, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: isLargeOrder ? '8px' : '9px',
              lineHeight: '1.1'
            }}>
              <span style={{ 
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: isLargeOrder ? '40mm' : '45mm'
              }}>
                {item.name.length > (isLargeOrder ? 20 : 25) 
                  ? item.name.substring(0, isLargeOrder ? 17 : 22) + '...' 
                  : item.name}
              </span>
              <span style={{ minWidth: '15mm', textAlign: 'center' }}>
                x{item.quantity}
              </span>
              <span style={{ minWidth: '20mm', textAlign: 'right' }}>
                {formatVND(item.totalPrice || 0)}
              </span>
            </div>
            {/* Show unit price for quantities > 1 */}
            {item.quantity > 1 && (
              <div style={{ fontSize: '7px', color: '#666', paddingLeft: '2px', lineHeight: '1.0' }}>
                @{formatVND(item.unitPrice || 0)} each
              </div>
            )}
          </div>
        ))}
        
        <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>
      </div>

      {/* Summary for large orders */}
      {isLargeOrder && (
        <div style={{ fontSize: '8px', textAlign: 'center', marginBottom: '5px' }}>
          {groupedItemsArray.length} unique items, {itemCount} total quantity
        </div>
      )}

      {/* Total */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '2px' }}>
          <span>Subtotal:</span>
          <span>{formatVND(orderData.subtotal || 0)}</span>
        </div>
        <div style={{ borderTop: '1px solid #000', margin: '2px 0' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
          <span>TOTAL:</span>
          <span>{formatVND(orderData.total || 0)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '10px' }}>
        <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>
        <div>Thank you for dining with us!</div>
        <div style={{ marginTop: '3px' }}>Visit again soon</div>
      </div>
    </div>
  );
});

ThermalReceiptTemplate.displayName = 'ThermalReceiptTemplate';

ThermalReceiptTemplate.propTypes = {
  orderData: PropTypes.shape({
    orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    table: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customerName: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number,
      price: PropTypes.number.isRequired
    })),
    subtotal: PropTypes.number,
    total: PropTypes.number
  }).isRequired
};

export default ThermalReceiptTemplate; 