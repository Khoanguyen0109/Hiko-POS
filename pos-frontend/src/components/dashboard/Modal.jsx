import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTable } from "../../redux/slices/tableSlice";
import { enqueueSnackbar } from "notistack"
import PropTypes from "prop-types";
import BottomSheet from "../shared/BottomSheet";

const Modal = ({ setIsTableModalOpen }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.tables);
  
  const [tableData, setTableData] = useState({
    tableNo: "",
    seats: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTableData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(tableData);
    
    dispatch(createTable(tableData))
      .unwrap()
      .then(() => {
        setIsTableModalOpen(false);
        enqueueSnackbar("Table created successfully!", { variant: "success" });
      })
      .catch((error) => {
        enqueueSnackbar(error, { variant: "error" });
        console.log(error);
      });
  };

  const handleCloseModal = () => {
    setIsTableModalOpen(false);
  };


  return (
    <BottomSheet
      isOpen
      onClose={handleCloseModal}
      title="Add Table"
      size="sm"
      bodyClassName="p-4 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
              Table Number
            </label>
            <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
              <input
                type="number"
                name="tableNo"
                value={tableData.tableNo}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
              Number of Seats
            </label>
            <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
              <input
                type="number"
                name="seats"
                value={tableData.seats}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg mt-10 mb-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding Table..." : "Add Table"}
          </button>
        </form>
    </BottomSheet>
  );
};

Modal.propTypes = {
  setIsTableModalOpen: PropTypes.func.isRequired
}

export default Modal;
