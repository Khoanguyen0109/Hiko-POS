import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveStore } from "../redux/slices/storeSlice";
import { MdStore, MdLocationOn, MdArrowForward } from "react-icons/md";
import logo from "../assets/images/logo.png";

const SelectStore = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stores } = useSelector((state) => state.store);
  const { name: userName } = useSelector((state) => state.user);

  const handleSelectStore = (store) => {
    dispatch(setActiveStore(store));
    navigate("/");
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Owner": return "bg-yellow-500/20 text-yellow-400";
      case "Manager": return "bg-blue-500/20 text-blue-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src={logo} alt="Hiko Logo" className="h-14 w-14 border-2 rounded-full p-1" />
          <h1 className="text-2xl font-bold text-[#f5f5f5]">Select Store</h1>
          <p className="text-[#ababab] text-sm">
            Welcome back, <span className="text-yellow-400">{userName}</span>. Choose a store to continue.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {stores.map((store) => (
            <button
              key={store._id}
              onClick={() => handleSelectStore(store)}
              className="w-full flex items-center gap-4 p-4 bg-[#1f1f1f] rounded-xl border border-[#2a2a2a] hover:border-yellow-400/50 hover:bg-[#262626] transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center">
                <MdStore className="text-yellow-400 text-2xl" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-[#f5f5f5] font-semibold">{store.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(store.role)}`}>
                    {store.role}
                  </span>
                </div>
                {store.address && (
                  <p className="text-[#ababab] text-sm flex items-center gap-1 mt-0.5">
                    <MdLocationOn className="text-xs" />
                    {store.address}
                  </p>
                )}
                <p className="text-[#666] text-xs mt-0.5">Code: {store.code}</p>
              </div>
              <MdArrowForward className="text-[#666] group-hover:text-yellow-400 transition-colors text-xl" />
            </button>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-12">
            <MdStore className="text-[#666] text-5xl mx-auto mb-3" />
            <p className="text-[#ababab]">No stores assigned to your account.</p>
            <p className="text-[#666] text-sm mt-1">Contact an administrator to get access.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectStore;
