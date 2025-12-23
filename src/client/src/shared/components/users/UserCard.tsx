import React from 'react';
import { Email as EmailIcon, Person as PersonIcon } from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import type { User } from '../../../features/user/types/User';

export interface UserCardProps {
  user: User;
  onContact?: (user: User) => void;
  onViewProfile?: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onContact, onViewProfile }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme) => theme.shadows[4],
      },
    }}
  >
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar src={user.profilePictureUrl} sx={{ mr: 2, bgcolor: 'primary.main' }}>
          <PersonIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" component="h2" gutterBottom>
            {`${user.firstName} ${user.lastName}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{user.userName}
          </Typography>
        </Box>
      </Box>

      {user.bio ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {user.bio}
        </Typography>
      ) : null}

      {user.roles !== undefined && user.roles.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          {user.roles.slice(0, 3).map((role) => (
            <Chip key={role} label={role} size="small" variant="outlined" color="primary" />
          ))}
          {user.roles.length > 3 && (
            <Chip
              label={`+${user.roles.length - 3} more`}
              size="small"
              variant="outlined"
              color="secondary"
            />
          )}
        </Stack>
      )}

      {user.timeZone ? (
        <Typography variant="caption" color="text.secondary">
          Time Zone: {user.timeZone}
        </Typography>
      ) : null}
    </CardContent>

    <CardActions sx={{ px: 2, pb: 2 }}>
      <Button
        size="small"
        startIcon={<PersonIcon />}
        onClick={() => onViewProfile?.(user)}
        fullWidth
      >
        View Profile
      </Button>
      <Button
        size="small"
        startIcon={<EmailIcon />}
        onClick={() => onContact?.(user)}
        variant="outlined"
        fullWidth
      >
        Contact
      </Button>
    </CardActions>
  </Card>
);

export default UserCard;
