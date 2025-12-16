import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store/store';
import { router } from './routes/Router';
import './styles/global.css';

// ============================================================================
// Font Loading - Optimized with proper idle callback
// ============================================================================

const loadFonts = (): void => {
  // Load critical font weight immediately
  void import('@fontsource/roboto/400.css');

  // Schedule non-critical font weights during idle time
  const loadRemainingFonts = (): void => {
    void import('@fontsource/roboto/300.css');
    void import('@fontsource/roboto/500.css');
    void import('@fontsource/roboto/700.css');
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadRemainingFonts, { timeout: 2000 });
  } else {
    setTimeout(loadRemainingFonts, 100);
  }
};

// Load fonts after initial render
queueMicrotask(loadFonts);

// ============================================================================
// App Mounting
// ============================================================================

const container = document.getElementById('root');

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
