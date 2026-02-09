import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { SnackbarProvider } from "notistack";
import ErrorBoundary from "./components/shared/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <SnackbarProvider autoHideDuration={1000}>
          <App />
        </SnackbarProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
