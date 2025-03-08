import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useTheme } from './hooks/useTheme';
import MainLayout from './components/layout/MainLayout';
import { getProfile } from './features/auth/authSlice';
import { useAppDispatch, useAppSelector } from './store/store.hooks';

const App = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Fetch user profile if authenticated
    if (isAuthenticated) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout>
        <Outlet />
      </MainLayout>
    </ThemeProvider>
  );
};

export default App;
