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
  Toppings,
  PromotionManager,
  SpendingManager,
  WeeklySchedule,
  ShiftTemplates,
  Storage,
  StorageItems,
  Suppliers,
  SelectStore,
  Stores,
  Tickets,
} from "./pages";
import Header from "./components/shared/Header";
import { useSelector, useDispatch } from "react-redux";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
import { getStoredUser, clearAuthData } from "./utils/auth";
import { setUser } from "./redux/slices/userSlice";
import { setStores, setActiveStore } from "./redux/slices/storeSlice";
import { getUserData } from "./https";
import { logger } from "./utils/logger";
import {
  ROUTES,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  HEADER_HIDDEN_ROUTES,
} from "./constants";
import Sidebar from "./components/shared/Sidebar";

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
  Toppings,
  PromotionManager,
  SpendingManager,
  WeeklySchedule,
  ShiftTemplates,
  Storage,
  StorageItems,
  Suppliers,
  SelectStore,
  Stores,
  Tickets,
};

function Layout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuth } = useSelector((state) => state.user);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Only attempt validation if we have a cached user profile.
      // The actual auth is via the httpOnly cookie sent automatically.
      const cachedUser = getStoredUser();
      if (!cachedUser) {
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await getUserData();
        const { data } = response.data;

        dispatch(setUser(data));

        if (data.stores && data.stores.length > 0) {
          dispatch(setStores(data.stores));

          const storedActiveStore = localStorage.getItem("activeStore");
          if (storedActiveStore) {
            try {
              const parsed = JSON.parse(storedActiveStore);
              const stillValid = data.stores.find(s => s._id === parsed._id);
              if (stillValid) {
                dispatch(setActiveStore(stillValid));
              } else if (data.stores.length === 1) {
                dispatch(setActiveStore(data.stores[0]));
              }
            } catch {
              if (data.stores.length === 1) {
                dispatch(setActiveStore(data.stores[0]));
              }
            }
          } else if (data.stores.length === 1) {
            dispatch(setActiveStore(data.stores[0]));
          }
        }
      } catch (error) {
        logger.error("Session validation failed:", error);
        clearAuthData();
      }

      setIsValidatingToken(false);
    };

    initializeAuth();
  }, [dispatch]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  if (isValidatingToken) return <FullScreenLoader />;

  return (
    <>
      {isAuth && <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} onOpen={openSidebar} />}
      <div className={isAuth ? "ml-[56px] transition-[margin] duration-300" : ""}>
      {!HEADER_HIDDEN_ROUTES.includes(location.pathname) && (
        <Header />
      )}
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

        {/* Store Selection Route */}
        <Route
          path={ROUTES.SELECT_STORE}
          element={
            <ProtectedRoutes>
              <SelectStore />
            </ProtectedRoutes>
          }
        />

        {/* Protected Routes (require auth + active store) */}
        {PROTECTED_ROUTES.map((route) => {
          const Component = COMPONENT_MAP[route.componentName];
          const requiresAdmin = route.adminOnly === true;

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                requiresAdmin ? (
                  <AdminProtectedRoutes>
                    <StoreRequiredRoutes>
                      <Component />
                    </StoreRequiredRoutes>
                  </AdminProtectedRoutes>
                ) : (
                  <ProtectedRoutes>
                    <StoreRequiredRoutes>
                      <Component />
                    </StoreRequiredRoutes>
                  </ProtectedRoutes>
                )
              }
            />
          );
        })}

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
    </>
  );
}

function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to={ROUTES.AUTH} />;
  }
  return children;
}

function AdminProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  const isAdmin = useSelector((state) => state.user.role) === "Admin";
  if (!isAuth || !isAdmin) {
    return <Navigate to={ROUTES.AUTH} />;
  }
  return children;
}

function StoreRequiredRoutes({ children }) {
  const { activeStore, stores } = useSelector((state) => state.store);

  // If user has stores but hasn't selected one, redirect to store selection
  if (stores.length > 0 && !activeStore) {
    return <Navigate to={ROUTES.SELECT_STORE} />;
  }

  return children;
}

ProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

AdminProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

StoreRequiredRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
