import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { SnackbarProvider } from "notistack";
import ErrorBoundary from "./components/shared/ErrorBoundary.jsx";
import { V2UiProvider } from "./context/V2UiContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <V2UiProvider>
          <SnackbarProvider autoHideDuration={1000}>
            <App />
          </SnackbarProvider>
        </V2UiProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
