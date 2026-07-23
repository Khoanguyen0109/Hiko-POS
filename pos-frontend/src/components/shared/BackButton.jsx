import PropTypes from "prop-types";
import { IoArrowBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const BackButton = ({ onClick }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={onClick || (() => navigate(-1))}
      aria-label="Go back"
      className="flex shrink-0 items-center justify-center rounded-md p-0.5 text-[#f5f5f5] transition-colors hover:bg-[#262626] hover:text-white"
    >
      <IoArrowBackOutline size={18} />
    </button>
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func,
};

export default BackButton;
