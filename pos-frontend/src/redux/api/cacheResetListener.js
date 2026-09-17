import { createListenerMiddleware } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { prefetchPosCatalog } from "./prefetchPosCatalog";
import { setActiveStore, clearStore } from "../slices/storeSlice";
import { logoutUser, removeUser } from "../slices/userSlice";

export const cacheResetListener = createListenerMiddleware();

const resetApiCache = (listenerApi) => {
  listenerApi.dispatch(baseApi.util.resetApiState());
};

cacheResetListener.startListening({
  actionCreator: setActiveStore,
  effect: (action, listenerApi) => {
    const previousId = listenerApi.getOriginalState().store.activeStore?._id;
    const nextId = action.payload?._id;
    if (previousId !== nextId) {
      resetApiCache(listenerApi);
      if (nextId) {
        prefetchPosCatalog(listenerApi.dispatch);
      }
    }
  },
});

cacheResetListener.startListening({
  actionCreator: clearStore,
  effect: (_action, listenerApi) => {
    resetApiCache(listenerApi);
  },
});

cacheResetListener.startListening({
  actionCreator: logoutUser.fulfilled,
  effect: (_action, listenerApi) => {
    resetApiCache(listenerApi);
  },
});

cacheResetListener.startListening({
  actionCreator: logoutUser.rejected,
  effect: (_action, listenerApi) => {
    resetApiCache(listenerApi);
  },
});

cacheResetListener.startListening({
  actionCreator: removeUser,
  effect: (_action, listenerApi) => {
    resetApiCache(listenerApi);
  },
});
