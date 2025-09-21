import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getCurrentVietnamTime, formatVietnamTime } from "../../utils/dateUtils";

const Greetings = () => {
  const userData = useSelector(state => state.user);
  const [dateTime, setDateTime] = useState(getCurrentVietnamTime());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(getCurrentVietnamTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-between items-center px-8 mt-5">
      <div>
        <h1 className="text-[#f5f5f5] text-2xl font-semibold tracking-wide">
          Good Morning, {userData.name || "TEST USER"}
        </h1>
        <p className="text-[#ababab] text-sm">
          Give your best services for customers 😀
        </p>
      </div>
      <div>
        <h1 className="text-[#f5f5f5] text-3xl font-bold tracking-wide w-[130px]">{formatVietnamTime(dateTime, 'HH:mm:ss')}</h1>
        <p className="text-[#ababab] text-sm">{formatVietnamTime(dateTime, 'MMMM DD, YYYY')}</p>
      </div>
    </div>
  );
};

export default Greetings;
