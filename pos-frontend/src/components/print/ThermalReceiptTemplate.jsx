import { forwardRef } from "react";
import PropTypes from "prop-types";

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

      {/* Time */}
      <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '8px' }}>
        Printed: {currentTime}
      </div>

      {/* Order Details */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>
          ORDER DETAILS
        </div>
        <div style={{ fontSize: '9px' }}>
          Order ID: #{orderData.orderId || 'N/A'}
        </div>
        <div style={{ fontSize: '9px' }}>
          Table: {orderData.table || 'N/A'} | Items: {itemCount}
        </div>
        {orderData.customerName && (
          <div style={{ fontSize: '9px' }}>
            Customer: {orderData.customerName}
          </div>
        )}
        <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }}></div>
      </div>

      {/* Large Order Warning */}
      {isLargeOrder && (
        <div style={{ textAlign: 'center', fontSize: '8px', marginBottom: '5px', fontStyle: 'italic' }}>
          *** LARGE ORDER - {itemCount} ITEMS ***
        </div>
      )}

      {/* Items */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: isLargeOrder ? '8px' : '10px', marginBottom: '2px' }}>
          <span>ITEM</span>
          <span>QTY</span>
          <span>AMOUNT</span>
        </div>
        <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>
        
        {groupedItemsArray.map((item, index) => (
          <div key={index} style={{ marginBottom: '1px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isLargeOrder ? '8px' : '9px', lineHeight: '1.0' }}>
              <span style={{ 
                flex: 1, 
                paddingRight: '3px',
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
                ₹{Number(item.totalPrice || 0).toFixed(2)}
              </span>
            </div>
            {/* Show unit price for quantities > 1 */}
            {item.quantity > 1 && (
              <div style={{ fontSize: '7px', color: '#666', paddingLeft: '2px', lineHeight: '1.0' }}>
                @₹{Number(item.unitPrice || 0).toFixed(2)} each
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '1px' }}>
          <span>Subtotal:</span>
          <span>₹{Number(orderData.subtotal || 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '1px' }}>
          <span>Tax:</span>
          <span>₹{Number(orderData.tax || 0).toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid #000', margin: '2px 0' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
          <span>TOTAL:</span>
          <span>₹{Number(orderData.total || 0).toFixed(2)}</span>
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
    tax: PropTypes.number,
    total: PropTypes.number
  }).isRequired
};

export default ThermalReceiptTemplate; 