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
} from "./pages";
import Header from "./components/shared/Header";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import PropTypes from "prop-types";
import { ROUTES } from "./constants";

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const hideHeaderRoutes = [ROUTES.AUTH];
  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path={ROUTES.ROOT}
          element={
            <ProtectedRoutes>
              <Home />
            </ProtectedRoutes>
          }
        />
        <Route
          path={ROUTES.AUTH}
          element={isAuth ? <Navigate to={ROUTES.ROOT} /> : <Auth />}
        />
        <Route
          path={ROUTES.ORDERS}
          element={
            <ProtectedRoutes>
              <Orders />
            </ProtectedRoutes>
          }
        />
        <Route
          path={ROUTES.TABLES}
          element={
            <ProtectedRoutes>
              <Tables />
            </ProtectedRoutes>
          }
        />
        <Route
          path={ROUTES.MENU}
          element={
            <ProtectedRoutes>
              <Menu />
            </ProtectedRoutes>
          }
        />
        <Route
          path={ROUTES.MENU_ORDER}
          element={
            <ProtectedRoutes>
              <MenuOrder />
            </ProtectedRoutes>
          }
        />

        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
        />
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
    </Router>
  );
}

export default App;
