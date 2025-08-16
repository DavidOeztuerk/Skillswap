import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Alert,
  Stack,
  Paper,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { format, isBefore, isAfter, addMinutes } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeSlotPickerProps {
  selectedDate: Date;
  availableSlots: Date[];
  onSelectSlot: (slot: Date) => void;
  selectedSlot: Date | null;
  duration?: number; // Duration in minutes
  minTime?: Date; // Minimum selectable time
  maxTime?: Date; // Maximum selectable time
  blockedSlots?: Date[]; // Already booked slots
  showGrouping?: boolean; // Group slots by hour
}

/**
 * Time Slot Picker Component
 * Displays available time slots in a grid layout
 */
const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  availableSlots,
  onSelectSlot,
  selectedSlot,
  duration = 60,
  minTime,
  maxTime,
  blockedSlots = [],
  showGrouping = true,
}) => {
  const theme = useTheme();
  const [hoveredSlot, setHoveredSlot] = useState<Date | null>(null);

  // Group slots by hour for better organization
  const groupedSlots = useMemo(() => {
    if (!showGrouping) {
      return { 'Alle Zeiten': availableSlots };
    }

    const groups: Record<string, Date[]> = {};
    
    availableSlots.forEach(slot => {
      const hour = format(slot, 'HH:00', { locale: de });
      if (!groups[hour]) {
        groups[hour] = [];
      }
      groups[hour].push(slot);
    });

    return groups;
  }, [availableSlots, showGrouping]);

  // Check if a slot is available
  const isSlotAvailable = (slot: Date): boolean => {
    // Check if slot is blocked
    const isBlocked = blockedSlots.some(blocked => 
      blocked.getTime() === slot.getTime()
    );
    if (isBlocked) return false;

    // Check min/max time constraints
    if (minTime && isBefore(slot, minTime)) return false;
    if (maxTime && isAfter(slot, maxTime)) return false;

    return true;
  };

  // Check if slot conflicts with duration
  const hasConflict = (slot: Date): boolean => {
    if (!duration) return false;
    
    const slotEnd = addMinutes(slot, duration);
    
    // Check if the duration extends into a blocked slot
    return blockedSlots.some(blocked => {
      const blockedTime = blocked.getTime();
      const slotTime = slot.getTime();
      const slotEndTime = slotEnd.getTime();
      
      return blockedTime > slotTime && blockedTime < slotEndTime;
    });
  };

  // Format slot time for display
  const formatSlotTime = (slot: Date): string => {
    return format(slot, 'HH:mm', { locale: de });
  };

  // Get slot status color
  const getSlotColor = (slot: Date) => {
    if (!isSlotAvailable(slot)) {
      return 'inherit';
    }
    if (hasConflict(slot)) {
      return 'warning';
    }
    if (selectedSlot && slot.getTime() === selectedSlot.getTime()) {
      return 'primary';
    }
    return 'inherit';
  };

  // Get slot variant
  const getSlotVariant = (slot: Date) => {
    if (selectedSlot && slot.getTime() === selectedSlot.getTime()) {
      return 'contained';
    }
    if (hoveredSlot && slot.getTime() === hoveredSlot.getTime()) {
      return 'outlined';
    }
    return 'outlined';
  };

  // Handle slot selection
  const handleSlotClick = (slot: Date) => {
    if (!isSlotAvailable(slot)) {
      return;
    }
    
    if (hasConflict(slot)) {
      if (!window.confirm('Dieser Zeitslot hat Konflikte mit der gewählten Dauer. Trotzdem auswählen?')) {
        return;
      }
    }
    
    onSelectSlot(slot);
  };

  // No slots available
  if (availableSlots.length === 0) {
    return (
      <Box>
        <Alert severity="info" icon={<EventIcon />}>
          Keine verfügbaren Zeitslots für {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}.
          Bitte wählen Sie ein anderes Datum.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Verfügbare Zeiten für {format(selectedDate, 'EEEE, d. MMMM', { locale: de })}
        </Typography>
        {duration && (
          <Typography variant="body2" color="text.secondary">
            Dauer: {duration} Minuten
          </Typography>
        )}
      </Box>

      {/* Legend */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          size="small"
          icon={<CheckCircleIcon />}
          label="Verfügbar"
          color="success"
          variant="outlined"
        />
        <Chip
          size="small"
          icon={<BlockIcon />}
          label="Nicht verfügbar"
          color="default"
          variant="outlined"
        />
        {selectedSlot && (
          <Chip
            size="small"
            icon={<CheckCircleIcon />}
            label="Ausgewählt"
            color="primary"
          />
        )}
      </Stack>

      {/* Time slots grid */}
      <Box>
        {Object.entries(groupedSlots).map(([hour, slots]) => (
          <Box key={hour} sx={{ mb: 3 }}>
            {showGrouping && (
              <>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TimeIcon fontSize="small" />
                  {hour} Uhr
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </>
            )}
            
            <Grid container spacing={1}>
              {slots.map((slot) => {
                const available = isSlotAvailable(slot);
                const conflict = hasConflict(slot);
                const selected = selectedSlot && slot.getTime() === selectedSlot.getTime();
                
                return (
                  <Grid key={slot.getTime()}>
                    <Button
                      variant={getSlotVariant(slot)}
                      color={getSlotColor(slot)}
                      onClick={() => handleSlotClick(slot)}
                      onMouseEnter={() => setHoveredSlot(slot)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      disabled={!available}
                      sx={{
                        minWidth: 80,
                        height: 40,
                        fontSize: '0.875rem',
                        borderRadius: 1,
                        position: 'relative',
                        ...(selected && {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        }),
                        ...(conflict && !selected && {
                          borderColor: theme.palette.warning.main,
                          color: theme.palette.warning.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.warning.main, 0.08),
                          },
                        }),
                        ...(!available && {
                          textDecoration: 'line-through',
                          opacity: 0.5,
                        }),
                      }}
                    >
                      {formatSlotTime(slot)}
                      {selected && (
                        <CheckCircleIcon 
                          sx={{ 
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            fontSize: 16,
                            backgroundColor: 'white',
                            borderRadius: '50%',
                          }} 
                        />
                      )}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </Box>

      {/* Selected slot info */}
      {selectedSlot && (
        <Paper 
          variant="outlined" 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderColor: theme.palette.primary.main,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" color="primary">
                Ausgewählte Zeit
              </Typography>
              <Typography variant="body1">
                {format(selectedSlot, 'HH:mm', { locale: de })} Uhr
                {duration && ` - ${format(addMinutes(selectedSlot, duration), 'HH:mm', { locale: de })} Uhr`}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Conflict warnings */}
      {selectedSlot && hasConflict(selectedSlot) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Die gewählte Zeit überschneidet sich mit anderen Terminen. 
          Bitte überprüfen Sie die Verfügbarkeit.
        </Alert>
      )}
    </Box>
  );
};

export default TimeSlotPicker;