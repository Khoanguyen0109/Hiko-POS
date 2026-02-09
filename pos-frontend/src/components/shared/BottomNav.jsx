import { useState } from "react";
import { FaHome, FaUsers, FaCalendarAlt } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar, MdReceipt, MdStorage } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";

import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Modal from "./Modal";
import { ROUTES } from "../../constants";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useSelector((state) => state.user);
  const isAdmin = role === "Admin";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState();
  const [phone, setPhone] = useState();

  const closeModal = () => setIsModalOpen(false);

  const increment = () => {
    if (guestCount >= 6) return;
    setGuestCount((prev) => prev + 1);
  };
  const decrement = () => {
    if (guestCount <= 0) return;
    setGuestCount((prev) => prev - 1);
  };

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    // send the data to store
    // dispatch(setCustomer({name, phone, guests: guestCount}));
    navigate(ROUTES.MENU_ORDER);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around items-center">
      {/* Home button - Admin only */}
      <button
        onClick={() => navigate(ROUTES.ROOT)}
        className={`flex items-center justify-center font-bold ${
          isActive(ROUTES.ROOT)
            ? "text-[#f5f5f5] bg-[#343434]"
            : "text-[#ababab]"
        } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
      >
        <FaHome className="inline mr-1 sm:mr-2" size={16} />
        <p className="text-sm sm:text-base hidden xs:block">Home</p>
      </button>

      {/* Orders button - All users */}
      <button
        onClick={() => navigate(ROUTES.ORDERS)}
        className={`flex items-center justify-center font-bold ${
          isActive(ROUTES.ORDERS)
            ? "text-[#f5f5f5] bg-[#343434]"
            : "text-[#ababab]"
        } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
      >
        <MdOutlineReorder className="inline mr-1 sm:mr-2" size={16} />
        <p className="text-sm sm:text-base hidden xs:block">Orders</p>
      </button>

      {/* Expenses button - All users */}
      <button
        onClick={() => navigate(ROUTES.SPENDING)}
        className={`flex items-center justify-center font-bold ${
          isActive(ROUTES.SPENDING)
            ? "text-[#f5f5f5] bg-[#343434]"
            : "text-[#ababab]"
        } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
      >
        <MdReceipt className="inline mr-1 sm:mr-2" size={16} />
        <p className="text-sm sm:text-base hidden xs:block">Expenses</p>
      </button>

      {/* Storage button - All users */}
      <button
        onClick={() => navigate(ROUTES.STORAGE)}
        className={`flex items-center justify-center font-bold ${
          isActive(ROUTES.STORAGE)
            ? "text-[#f5f5f5] bg-[#343434]"
            : "text-[#ababab]"
        } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
      >
        <MdStorage className="inline mr-1 sm:mr-2" size={16} />
        <p className="text-sm sm:text-base hidden xs:block">Storage</p>
      </button>

      {/* Dishes button - Admin only */}
      {isAdmin && (
        <button
          onClick={() => navigate(ROUTES.DISHES)}
          className={`flex items-center justify-center font-bold ${
            isActive(ROUTES.DISHES)
              ? "text-[#f5f5f5] bg-[#343434]"
              : "text-[#ababab]"
          } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
        >
          <MdTableBar className="inline mr-1 sm:mr-2" size={16} />
          <p className="text-sm sm:text-base hidden xs:block">Dishes</p>
        </button>
      )}

      {/* Members button - Admin only */}
      {isAdmin && (
        <button
          onClick={() => navigate(ROUTES.MEMBERS)}
          className={`flex items-center justify-center font-bold ${
            isActive(ROUTES.MEMBERS)
              ? "text-[#f5f5f5] bg-[#343434]"
              : "text-[#ababab]"
          } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
        >
          <FaUsers className="inline mr-1 sm:mr-2" size={16} />
          <p className="text-sm sm:text-base hidden xs:block">Members</p>
        </button>
      )}

      {/* Schedules button - All users can view */}
      <button
        onClick={() => navigate(ROUTES.SCHEDULES)}
        className={`flex items-center justify-center font-bold ${
          isActive(ROUTES.SCHEDULES)
            ? "text-[#f5f5f5] bg-[#343434]"
            : "text-[#ababab]"
        } flex-1 max-w-[120px] sm:max-w-[200px] md:max-w-[300px] rounded-[20px] py-2 px-2`}
      >
        <FaCalendarAlt className="inline mr-1 sm:mr-2" size={16} />
        <p className="text-sm sm:text-base hidden xs:block">Schedules</p>
      </button>

      <button
        onClick={handleCreateOrder}
        className="absolute bottom-14 right-4 bg-[#F6B100] text-[#f5f5f5] rounded-full p-3 md:p-4 items-center shadow-lg"
      >
        <BiSolidDish size={32} className="md:hidden" />
        <BiSolidDish size={40} className="hidden md:block" />
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Order">
        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">
            Customer Name
          </label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              name=""
              placeholder="Enter customer name"
              id=""
              className="bg-transparent flex-1 text-white focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
            Customer Phone
          </label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="number"
              name=""
              placeholder="+91-9999999999"
              id=""
              className="bg-transparent flex-1 text-white focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">
            Guest
          </label>
          <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
            <button onClick={decrement} className="text-yellow-500 text-2xl">
              &minus;
            </button>
            <span className="text-white">{guestCount} Person</span>
            <button onClick={increment} className="text-yellow-500 text-2xl">
              &#43;
            </button>
          </div>
        </div>
        <button
          onClick={handleCreateOrder}
          className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700"
        >
          Create Order
        </button>
      </Modal>
    </div>
  );
};

export default BottomNav;
