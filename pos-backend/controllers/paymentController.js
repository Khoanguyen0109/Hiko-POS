const Payment = require("../models/paymentModel");
const { getCurrentVietnamTime, toVietnamTime } = require("../utils/dateUtils");
const createHttpError = require("http-errors");

// Simple cash payment processing
const processCashPayment = async (req, res, next) => {
  try {
    const { amount, orderId, customerDetails } = req.body;
    
    if (!amount || !orderId) {
      return next(createHttpError(400, "Amount and Order ID are required"));
    }

    // Create payment record for cash transaction
    const newPayment = new Payment({
      paymentId: `cash_${getCurrentVietnamTime().getTime()}`,
      orderId: orderId,
      amount: amount,
      currency: "VND",
      status: "captured",
      method: "cash",
      email: customerDetails?.email || null,
      contact: customerDetails?.phone || null,
      createdAt: getCurrentVietnamTime()
    });

    await newPayment.save();
    
    res.status(200).json({ 
      success: true, 
      payment: newPayment,
      message: "Cash payment processed successfully"
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get payment by order ID
const getPaymentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return next(createHttpError(404, "Payment not found"));
    }
    
    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get all payments
const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, method } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(filter);
    
    res.status(200).json({ 
      success: true, 
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { 
  processCashPayment, 
  getPaymentByOrderId, 
  getAllPayments 
};