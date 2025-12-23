import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { router } from './core/router/Router';
import { store } from './core/store/store';
import { setStoreDispatch as setChatHubDispatch } from './features/chat/services/chatHub';
import { setNotificationHubStore } from './features/notifications/services/notificationHub';
import './styles/global.css';
// Optimiert: Nur die meistgenutzten Font-Weights laden (spart ~400KB)
import '@fontsource/roboto/400.css'; // Regular - Basis
import '@fontsource/roboto/500.css'; // Medium - Buttons, Überschriften

setChatHubDispatch(store.dispatch);
setNotificationHubStore(store.dispatch, () => store.getState());

const container = document.querySelector('#root');

if (!container) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in your HTML.'
  );
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
