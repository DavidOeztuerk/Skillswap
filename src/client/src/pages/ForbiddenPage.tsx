// src/pages/ForbiddenPage.tsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper,
  Stack 
} from '@mui/material';
import { 
  Block as BlockIcon, 
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * 403 Forbidden Page - Displayed when user doesn't have permission to access a resource
 */
const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogin = () => {
    navigate('/login', { 
      state: { from: location.pathname } 
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Stack spacing={4} alignItems="center">
          <BlockIcon 
            sx={{ 
              fontSize: 120, 
              color: 'error.main',
              opacity: 0.8,
            }} 
          />
          
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'text.primary',
                mb: 2,
              }}
            >
              403 - Access Forbidden
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {user 
                ? "You don't have permission to access this resource."
                : "You need to be logged in to access this resource."
              }
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ maxWidth: 500, mx: 'auto' }}
            >
              {user 
                ? "If you believe this is an error, please contact support or check if you have the required permissions."
                : "Please log in with an account that has the necessary permissions."
              }
            </Typography>
          </Box>

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            sx={{ mt: 4 }}
          >
            {user ? (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={handleGoHome}
                  sx={{ 
                    minWidth: 160,
                    py: 1.5,
                  }}
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleGoBack}
                  sx={{ 
                    minWidth: 160,
                    py: 1.5,
                  }}
                >
                  Go Back
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleLogin}
                  sx={{ 
                    minWidth: 160,
                    py: 1.5,
                  }}
                >
                  Log In
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/')}
                  sx={{ 
                    minWidth: 160,
                    py: 1.5,
                  }}
                >
                  Go Home
                </Button>
              </>
            )}
          </Stack>

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <Box 
              sx={{ 
                mt: 4, 
                p: 2, 
                bgcolor: 'grey.100',
                borderRadius: 1,
                textAlign: 'left',
                width: '100%',
                maxWidth: 400,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                <strong>Debug Info:</strong>
                <br />
                Current Path: {location.pathname}
                <br />
                User ID: {user?.id || 'Not logged in'}
                <br />
                User Roles: {user?.roles?.join(', ') || 'None'}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default ForbiddenPage;