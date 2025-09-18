import { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { setAuthData } from "../../utils/auth";
 
const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, isAuth } = useSelector((state) => state.user);
    
    const[formData, setFormData] = useState({
      phone: "",
      password: "",
    });
  
    const handleChange = (e) => {
      setFormData({...formData, [e.target.name]: e.target.value});
    }

    const handleSubmit = (e) => {
      e.preventDefault();
      dispatch(loginUser(formData))
        .unwrap()
        .then((userData) => {
          const { accessToken, user } = userData;
          // Store token and user data in localStorage
          setAuthData(accessToken, user);
          enqueueSnackbar("Login successful!", { variant: "success" });
          navigate("/");
        })
        .catch((error) => {
          enqueueSnackbar(error, { variant: "error" });
        });
    }

    // Clear error when component unmounts or error changes
    useEffect(() => {
      if (error) {
        dispatch(clearError());
      }
    }, [dispatch, error]);

    // Redirect if already authenticated
    useEffect(() => {
      if (isAuth) {
        navigate("/");
      }
    }, [isAuth, navigate]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
            Employee Phone
          </label>
          <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter employee phone number (10 digits)"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
            Password
          </label>
          <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg mt-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default Login;
