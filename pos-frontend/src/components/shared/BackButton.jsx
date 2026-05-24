import PropTypes from "prop-types";
import { IoArrowBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const BackButton = ({ onClick }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={onClick || (() => navigate(-1))}
      className="bg-[#025cca] p-2 text-xl font-bold rounded-full text-white"
    >
      <IoArrowBackOutline />
    </button>
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func,
};

export default BackButton;
