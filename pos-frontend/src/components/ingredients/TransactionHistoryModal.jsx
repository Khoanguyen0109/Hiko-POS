import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { MdClose, MdDelete, MdFileDownload, MdFileUpload, MdEdit } from "react-icons/md";
import { fetchTransactions, removeTransaction } from "../../redux/slices/ingredientSlice";
import { enqueueSnackbar } from "notistack";
import { formatVND } from "../../utils";

const TransactionHistoryModal = ({ isOpen, onClose, ingredient }) => {
  const dispatch = useDispatch();
  const { transactions, transactionLoading } = useSelector((state) => state.ingredients);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (isOpen && ingredient) {
      dispatch(fetchTransactions({ ingredientId: ingredient._id, limit: 100 }));
    }
  }, [isOpen, ingredient, dispatch]);

  useEffect(() => {
    if (transactions) {
      if (filterType === "all") {
        setFilteredTransactions(transactions);
      } else {
        setFilteredTransactions(transactions.filter(t => t.type === filterType));
      }
    }
  }, [transactions, filterType]);

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This will recalculate inventory and average cost.")) {
      return;
    }

    try {
      await dispatch(removeTransaction(transactionId)).unwrap();
      enqueueSnackbar("Transaction deleted successfully!", { variant: "success" });
      // Refresh the transaction list
      dispatch(fetchTransactions({ ingredientId: ingredient._id, limit: 100 }));
    } catch (error) {
      enqueueSnackbar(error || "Failed to delete transaction", { variant: "error" });
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "IMPORT":
        return <MdFileDownload className="text-green-400" size={20} />;
      case "EXPORT":
        return <MdFileUpload className="text-red-400" size={20} />;
      case "ADJUSTMENT":
        return <MdEdit className="text-blue-400" size={20} />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "IMPORT":
        return "text-green-400";
      case "EXPORT":
        return "text-red-400";
      case "ADJUSTMENT":
        return "text-blue-400";
      default:
        return "text-[#f5f5f5]";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f1f1f] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#343434]">
          <div>
            <h2 className="text-[#f5f5f5] text-xl font-bold">Transaction History</h2>
            {ingredient && (
              <p className="text-[#ababab] text-sm mt-1">
                {ingredient.name} ({ingredient.code})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#ababab] hover:text-[#f5f5f5] transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[#343434]">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "all"
                  ? "bg-[#f6b100] text-[#1f1f1f]"
                  : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
              }`}
            >
              All ({transactions?.length || 0})
            </button>
            <button
              onClick={() => setFilterType("IMPORT")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "IMPORT"
                  ? "bg-green-600 text-white"
                  : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
              }`}
            >
              Imports ({transactions?.filter(t => t.type === "IMPORT").length || 0})
            </button>
            <button
              onClick={() => setFilterType("EXPORT")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "EXPORT"
                  ? "bg-red-600 text-white"
                  : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
              }`}
            >
              Exports ({transactions?.filter(t => t.type === "EXPORT").length || 0})
            </button>
            <button
              onClick={() => setFilterType("ADJUSTMENT")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === "ADJUSTMENT"
                  ? "bg-blue-600 text-white"
                  : "bg-[#262626] text-[#f5f5f5] hover:bg-[#343434]"
              }`}
            >
              Adjustments ({transactions?.filter(t => t.type === "ADJUSTMENT").length || 0})
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-6">
          {transactionLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto"></div>
              <p className="text-[#ababab] mt-4">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#ababab]">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#343434]">
                      <th className="text-left p-3 text-[#ababab] text-sm font-medium">Type</th>
                      <th className="text-left p-3 text-[#ababab] text-sm font-medium">Transaction #</th>
                      <th className="text-left p-3 text-[#ababab] text-sm font-medium">Date</th>
                      <th className="text-right p-3 text-[#ababab] text-sm font-medium">Quantity</th>
                      <th className="text-right p-3 text-[#ababab] text-sm font-medium">Unit Cost</th>
                      <th className="text-right p-3 text-[#ababab] text-sm font-medium">Total Cost</th>
                      <th className="text-right p-3 text-[#ababab] text-sm font-medium">Stock After</th>
                      <th className="text-left p-3 text-[#ababab] text-sm font-medium">Notes</th>
                      <th className="text-center p-3 text-[#ababab] text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="border-b border-[#343434] hover:bg-[#262626] transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                              {transaction.type}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[#f5f5f5] text-sm font-mono">
                            {transaction.transactionNumber}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[#f5f5f5] text-sm">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </span>
                          <br />
                          <span className="text-[#ababab] text-xs">
                            {new Date(transaction.transactionDate).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === "EXPORT" ? "-" : "+"}{transaction.quantity} {transaction.unit}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[#f5f5f5] text-sm">
                            {formatVND(transaction.unitCost)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[#f5f5f5] text-sm font-semibold">
                            {formatVND(transaction.totalCost)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[#f5f5f5] text-sm">
                            {transaction.stockAfter} {transaction.unit}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[#ababab] text-xs">
                            {transaction.notes || "-"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(transaction._id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-2"
                            title="Delete transaction"
                          >
                            <MdDelete size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="bg-[#262626] rounded-lg p-4 border border-[#343434]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(transaction._id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                        title="Delete transaction"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-[#ababab]">Transaction #: </span>
                        <span className="text-[#f5f5f5] font-mono">{transaction.transactionNumber}</span>
                      </div>
                      
                      <div>
                        <span className="text-[#ababab]">Date: </span>
                        <span className="text-[#f5f5f5]">
                          {new Date(transaction.transactionDate).toLocaleString()}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[#ababab]">Quantity: </span>
                        <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === "EXPORT" ? "-" : "+"}{transaction.quantity} {transaction.unit}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[#ababab]">Unit Cost: </span>
                        <span className="text-[#f5f5f5]">{formatVND(transaction.unitCost)}</span>
                      </div>
                      
                      <div>
                        <span className="text-[#ababab]">Total Cost: </span>
                        <span className="text-[#f5f5f5] font-semibold">{formatVND(transaction.totalCost)}</span>
                      </div>
                      
                      <div>
                        <span className="text-[#ababab]">Stock After: </span>
                        <span className="text-[#f5f5f5]">{transaction.stockAfter} {transaction.unit}</span>
                      </div>
                      
                      {transaction.notes && (
                        <div>
                          <span className="text-[#ababab]">Notes: </span>
                          <span className="text-[#f5f5f5] text-xs">{transaction.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#343434] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

TransactionHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ingredient: PropTypes.object
};

export default TransactionHistoryModal;

