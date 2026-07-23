import { createContext, useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  isV2UiEnabled,
  setV2UiEnabled as persistV2UiEnabled,
  V2_UI_STORAGE_KEY,
} from "../utils/featureFlags.js";

// eslint-disable-next-line react-refresh/only-export-components -- hook consumers need this context
export const V2UiContext = createContext(null);

export function V2UiProvider({ children }) {
  const [v2UiEnabled, setV2UiEnabledState] = useState(isV2UiEnabled);

  const setV2UiEnabled = useCallback((enabled) => {
    setV2UiEnabledState(enabled);
    persistV2UiEnabled(enabled);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === V2_UI_STORAGE_KEY) {
        setV2UiEnabledState(event.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <V2UiContext.Provider value={{ v2UiEnabled, setV2UiEnabled }}>
      {children}
    </V2UiContext.Provider>
  );
}

V2UiProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useV2UiContext() {
  const context = useContext(V2UiContext);
  if (!context) {
    throw new Error("useV2UiContext must be used within V2UiProvider");
  }
  return context;
}
