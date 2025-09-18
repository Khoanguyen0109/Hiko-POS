import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  Home,
  Auth,
  Orders,
  OrderDetail,
  Tables,
  Menu,
  Dashboard,
  MenuOrder,
  MobileCart,
  Dishes,
  Categories,
  Members,
  AccountSettings,
  NotFound,
} from "./pages";
import Header from "./components/shared/Header";
import { useSelector, useDispatch } from "react-redux";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { getAuthData } from "./utils/auth";
import { setUser } from "./redux/slices/userSlice";
import { getUserData } from "./https";
import {
  ROUTES,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  HEADER_HIDDEN_ROUTES,
} from "./constants";
import BottomNav from "./components/shared/BottomNav";

// Component mapping for dynamic rendering
const COMPONENT_MAP = {
  Home,
  Auth,
  Orders,
  OrderDetail,
  Tables,
  Menu,
  Dashboard,
  MenuOrder,
  MobileCart,
  Dishes,
  Categories,
  Members,
  AccountSettings,
  NotFound,
};

function Layout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuth } = useSelector((state) => state.user);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  // Initialize authentication state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const { isAuthenticated, accessToken } = getAuthData();

      if (isAuthenticated && accessToken) {
        try {
          // Fetch user data to validate token
          const response = await getUserData();
          const { data } = response.data;

          // If successful, set user data in Redux
          dispatch(setUser(data));
        } catch (error) {
          // Token is invalid or expired, clear auth data
          console.log("Token validation failed:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }

      setIsValidatingToken(false);
    };

    initializeAuth();
  }, [dispatch]);

  // Show loading while validating token
  if (isValidatingToken) return <FullScreenLoader />;

  return (
    <>
      {!HEADER_HIDDEN_ROUTES.includes(location.pathname) && <Header />}
      <Routes>
        {/* Public Routes */}
        {PUBLIC_ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              isAuth && route.redirectIfAuth ? (
                <Navigate to={route.redirectIfAuth} />
              ) : (
                <Auth />
              )
            }
          />
        ))}

        {/* Protected Routes */}
        {PROTECTED_ROUTES.map((route) => {
          const Component = COMPONENT_MAP[route.componentName];

          // Check if route requires admin access
          const isAdminRoute = [
            "Home",
            "Dishes",
            "Categories",
            "Dashboard",
            "Members",
          ].includes(route.componentName);

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                isAdminRoute ? (
                  <AdminProtectedRoutes>
                    <Component />
                  </AdminProtectedRoutes>
                ) : (
                  <ProtectedRoutes>
                    <Component />
                  </ProtectedRoutes>
                )
              }
            />
          );
        })}

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  console.log("isAuth", isAuth);
  if (!isAuth) {
    return <Navigate to={ROUTES.AUTH} />;
  }

  return children;
}

function AdminProtectedRoutes({ children }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to={ROUTES.AUTH} />;
  }

  if (role !== "Admin") {
    return <Navigate to={ROUTES.ORDERS} />;
  }

  return children;
}

ProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

AdminProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  const { isAuth } = useSelector((state) => state.user);

  return (
    <Router>
      <Layout />
      {isAuth && <BottomNav />}
    </Router>
  );
}

export default App;
