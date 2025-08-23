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
  Tables,
  Menu,
  Dashboard,
  MenuOrder,
  Dishes,
  Categories,
} from "./pages";
import Header from "./components/shared/Header";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import { 
  ROUTES, 
  PUBLIC_ROUTES, 
  PROTECTED_ROUTES, 
  HEADER_HIDDEN_ROUTES 
} from "./constants";
import BottomNav from "./components/shared/BottomNav";

// Component mapping for dynamic rendering
const COMPONENT_MAP = {
  Home,
  Auth,
  Orders,
  Tables,
  Menu,
  Dashboard,
  MenuOrder,
  Dishes,
  Categories,
};

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

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
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoutes>
                  <Component />
                </ProtectedRoutes>
              }
            />
          );
        })}

        {/* Fallback Route */}
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
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

ProtectedRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  return (
    <Router>
      <Layout />
      <BottomNav />
    </Router>
  );
}

export default App;
