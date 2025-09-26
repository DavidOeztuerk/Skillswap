import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store.ts';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/Router.tsx';
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary.tsx';

import './styles/global.css';

const loadFonts = () => {
  import('@fontsource/roboto/400.css'); 
  
  const scheduleRemainingFonts = () => {
    import('@fontsource/roboto/300.css');
    import('@fontsource/roboto/500.css');
    import('@fontsource/roboto/700.css');
  };
  
  if (typeof window.requestIdleCallback === 'function') {
    requestIdleCallback(scheduleRemainingFonts);
  } else {
    setTimeout(scheduleRemainingFonts, 100);
  }
};

setTimeout(loadFonts, 0);

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <GlobalErrorBoundary>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </GlobalErrorBoundary>
);
