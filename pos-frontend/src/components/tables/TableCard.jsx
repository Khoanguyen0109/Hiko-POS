import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils"
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight } from "react-icons/fa";
import PropTypes from "prop-types";

const TableCard = ({id, name, status, initials, seats}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleClick = (name) => {
    if(status === "Booked") return;

    const table = { tableId: id, tableNo: name }
    dispatch(updateTable({table}))
    navigate(`/menu`);
  };

  return (
    <div onClick={() => handleClick(name)} key={id} className="w-full max-w-[300px] hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 gap-2">
        <h1 className="text-[#f5f5f5] text-lg sm:text-xl font-semibold flex items-center">
          Table <FaLongArrowAltRight className="text-[#ababab] ml-2 mr-2 inline" /> {name}
        </h1>
        <p className={`${status === "Booked" ? "text-green-600 bg-[#2e4a40]" : "bg-[#664a04] text-white"} px-2 py-1 rounded-lg text-xs sm:text-sm flex-shrink-0`}>
          {status}
        </p>
      </div>
      <div className="flex items-center justify-center mt-4 sm:mt-5 mb-6 sm:mb-8">
        <h1 className={`text-white rounded-full p-4 sm:p-5 text-lg sm:text-xl`} style={{backgroundColor : initials ? getBgColor() : "#1f1f1f"}} >{getAvatarName(initials) || "N/A"}</h1>
      </div>
      <p className="text-[#ababab] text-xs">Seats: <span className="text-[#f5f5f5]">{seats}</span></p>
    </div>
  );
};

TableCard.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.string.isRequired,
  initials: PropTypes.string,
  seats: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
}

export default TableCard;
