import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Grid,
    Typography,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Tooltip,
    Card,
    CardContent,
    Stack,
    Button,
    Divider,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today,
    ViewModule,
    ViewWeek,
    ViewDay,
    VideoCall,
    SwapHoriz,
    AttachMoney,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, isToday, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../../types/models/Appointment';

type ViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
    appointments: Appointment[];
    onAppointmentClick?: (appointment: Appointment) => void;
    onDateClick?: (date: Date) => void;
}


const CalendarView: React.FC<CalendarViewProps> = ({ appointments, onAppointmentClick, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<ViewType>('month');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    // Auto-update current time every minute for red time indicator and upcoming meetings
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every 60 seconds

        return () => clearInterval(interval);
    }, []);

    // Get upcoming appointments (within next 10 minutes)
    const upcomingAppointments = appointments.filter(apt => {
        if (apt.status !== 'Accepted') return false;

        const startTime = new Date(apt.scheduledDate);
        const now = currentTime;
        const minutesUntilStart = differenceInMinutes(startTime, now);

        // Show if meeting starts within next 10 minutes or already started (but not more than 5 minutes ago)
        return minutesUntilStart >= -5 && minutesUntilStart <= 10 && apt.meetingLink;
    }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
        if (newView !== null) {
            setViewType(newView);
        }
    };

    const handlePrevious = () => {
        switch (viewType) {
            case 'month':
                setCurrentDate(prev => addMonths(prev, -1));
                break;
            case 'week':
                setCurrentDate(prev => addWeeks(prev, -1));
                break;
            case 'day':
                setCurrentDate(prev => addDays(prev, -1));
                break;
        }
    };

    const handleNext = () => {
        switch (viewType) {
            case 'month':
                setCurrentDate(prev => addMonths(prev, 1));
                break;
            case 'week':
                setCurrentDate(prev => addWeeks(prev, 1));
                break;
            case 'day':
                setCurrentDate(prev => addDays(prev, 1));
                break;
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        if (onDateClick) {
            onDateClick(date);
        }
        if (viewType === 'month') {
            setViewType('day');
            setCurrentDate(date);
        }
    };

    const getAppointmentColor = (appointment: Appointment): string => {
        if (appointment.status === 'Cancelled') return '#9e9e9e';
        if (appointment.status === 'Completed') return '#4caf50';
        if (appointment.isSkillExchange) return '#ff9800';
        if (appointment.isMonetary) return '#2196f3';
        return '#9c27b0';
    };

    const getAppointmentIcon = (appointment: Appointment) => {
        if (appointment.isSkillExchange) return <SwapHoriz fontSize="small" />;
        if (appointment.isMonetary) return <AttachMoney fontSize="small" />;
        return <VideoCall fontSize="small" />;
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: de });
        const endDate = endOfWeek(monthEnd, { locale: de });

        const days = [];
        let day = startDate;

        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }

        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        return (
            <Box>
                <Grid container spacing={0}>
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(dayName => (
                        <Grid key={dayName} sx={{ flex: 1, p: 1, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" fontWeight="bold" align="center">
                                {dayName}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
                {weeks.map((week, weekIndex) => (
                    <Grid container spacing={0} key={weekIndex}>
                        {week.map((day, dayIndex) => {
                            const dayAppointments = appointments.filter(apt => 
                                isSameDay(new Date(apt.scheduledDate), day)
                            );
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isTodayDate = isToday(day);

                            return (
                                <Grid 
                                    key={dayIndex}
                                    sx={{
                                        flex: 1,
                                        border: 1,
                                        borderColor: 'divider',
                                        minHeight: 100,
                                        p: 0.5,
                                        bgcolor: !isCurrentMonth ? 'action.hover' : 
                                                isSelected ? 'action.selected' : 
                                                isTodayDate ? 'primary.light' : 'transparent',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                    onClick={() => handleDateSelect(day)}
                                >
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontWeight: isTodayDate ? 'bold' : 'normal',
                                            color: !isCurrentMonth ? 'text.disabled' : 'text.primary',
                                        }}
                                    >
                                        {format(day, 'd')}
                                    </Typography>
                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                        {dayAppointments.slice(0, 3).map((apt) => (
                                            <Chip
                                                key={apt.id}
                                                label={format(new Date(apt.scheduledDate), 'HH:mm')}
                                                size="small"
                                                icon={getAppointmentIcon(apt)}
                                                sx={{
                                                    bgcolor: getAppointmentColor(apt),
                                                    color: 'white',
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                    '& .MuiChip-icon': { color: 'white' },
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAppointmentClick?.(apt);
                                                }}
                                            />
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <Typography variant="caption" color="text.secondary">
                                                +{dayAppointments.length - 3} mehr
                                            </Typography>
                                        )}
                                    </Stack>
                                </Grid>
                            );
                        })}
                    </Grid>
                ))}
            </Box>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { locale: de });
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Calculate current time position in pixels (60px per hour)
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const HOUR_HEIGHT = 60; // px per hour
        const currentTimePositionPx = (currentHour * HOUR_HEIGHT) + (currentMinute / 60 * HOUR_HEIGHT);

        return (
            <Box sx={{ position: 'relative' }}>
                <Grid container>
                    <Grid sx={{ width: '8.33%' }}>
                        {/* Empty corner cell */}
                    </Grid>
                    {weekDays.map(day => (
                        <Grid key={day.toISOString()} sx={{ flex: 1, borderLeft: 1, borderColor: 'divider' }}>
                            <Typography variant="body2" align="center" sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                                <strong>{format(day, 'EEE', { locale: de })}</strong><br />
                                {format(day, 'd.M')}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{
                    position: 'relative',
                    height: '100%',
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    // GPU acceleration + Anti-Aliasing für scharfes Rendering
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    // Bessere Border-Qualität
                    imageRendering: 'crisp-edges'
                }}>
                    {/* Time indicator line */}
                    {isToday(weekStart) || weekDays.some(day => isToday(day)) && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: `${currentTimePositionPx}px`,
                                left: 0,
                                right: 0,
                                height: 2,
                                bgcolor: 'error.main',
                                zIndex: 10,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: -4,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'error.main',
                                },
                            }}
                        />
                    )}
                    {hours.map(hour => (
                        <Grid container key={hour} sx={{ height: 60, borderTop: 1, borderColor: 'divider' }}>
                            <Grid sx={{ width: '8.33%', borderRight: 1, borderColor: 'divider', p: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {`${hour.toString().padStart(2, '0')}:00`}
                                </Typography>
                            </Grid>
                            {weekDays.map(day => {
                                const hourAppointments = appointments.filter(apt => {
                                    const aptDate = new Date(apt.scheduledDate);
                                    return isSameDay(aptDate, day) && aptDate.getHours() === hour;
                                });

                                return (
                                    <Grid 
                                        key={day.toISOString()} 
                                        sx={{ 
                                            flex: 1,
                                            borderLeft: 1, 
                                            borderColor: 'divider',
                                            position: 'relative',
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                        onClick={() => handleDateSelect(day)}
                                    >
                                        {hourAppointments.map(apt => (
                                            <Card 
                                                key={apt.id}
                                                sx={{ 
                                                    position: 'absolute',
                                                    top: `${(new Date(apt.scheduledDate).getMinutes() / 60) * 100}%`,
                                                    left: 2,
                                                    right: 2,
                                                    height: `${(apt.durationMinutes / 60) * 60}px`,
                                                    bgcolor: getAppointmentColor(apt),
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    zIndex: 5,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAppointmentClick?.(apt);
                                                }}
                                            >
                                                <CardContent sx={{ p: 0.5 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                        {format(new Date(apt.scheduledDate), 'HH:mm')}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                                                        {apt.title}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ))}
                </Box>
            </Box>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const dayAppointments = appointments.filter(apt =>
            isSameDay(new Date(apt.scheduledDate), currentDate)
        );

        // Calculate current time position in pixels (60px per hour)
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const HOUR_HEIGHT = 60; // px per hour
        const currentTimePositionPx = (currentHour * HOUR_HEIGHT) + (currentMinute / 60 * HOUR_HEIGHT);

        return (
            <Box sx={{ position: 'relative' }}>
                <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
                </Typography>
                <Box sx={{
                    position: 'relative',
                    height: '100%',
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    // GPU acceleration + Anti-Aliasing für scharfes Rendering
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    // Bessere Border-Qualität
                    imageRendering: 'crisp-edges'
                }}>
                    {/* Time indicator line for today */}
                    {isToday(currentDate) && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: `${currentTimePositionPx}px`,
                                left: 0,
                                right: 0,
                                height: 2,
                                bgcolor: 'error.main',
                                zIndex: 10,
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 60,
                                    top: -4,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'error.main',
                                },
                            }}
                        />
                    )}
                    {hours.map(hour => {
                        const hourAppointments = dayAppointments.filter(apt => 
                            new Date(apt.scheduledDate).getHours() === hour
                        );

                        return (
                            <Box 
                                key={hour} 
                                sx={{ 
                                    display: 'flex',
                                    minHeight: 60,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    position: 'relative',
                                }}
                            >
                                <Box sx={{ width: 60, p: 1, borderRight: 1, borderColor: 'divider' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {`${hour.toString().padStart(2, '0')}:00`}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, position: 'relative', p: 1 }}>
                                    {hourAppointments.map(apt => {
                                        const minutes = new Date(apt.scheduledDate).getMinutes();
                                        return (
                                            <Card
                                                key={apt.id}
                                                sx={{
                                                    position: 'absolute',
                                                    top: `${(minutes / 60) * 60}px`,
                                                    left: 8,
                                                    right: 8,
                                                    minHeight: `${(apt.durationMinutes / 60) * 60}px`,
                                                    bgcolor: getAppointmentColor(apt),
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    zIndex: 5,
                                                }}
                                                onClick={() => onAppointmentClick?.(apt)}
                                            >
                                                <CardContent>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {getAppointmentIcon(apt)}
                                                        <Typography variant="subtitle2">
                                                            {format(new Date(apt.scheduledDate), 'HH:mm')} - {apt.title}
                                                        </Typography>
                                                    </Stack>
                                                    {apt.description && (
                                                        <Typography variant="caption" sx={{ mt: 0.5 }}>
                                                            {apt.description}
                                                        </Typography>
                                                    )}
                                                    {apt.sessionNumber && apt.sessionNumber > 1 && (
                                                        <Chip
                                                            label={`Session ${apt.sessionNumber}/${apt.totalSessionsInSeries || apt.totalSessions || '?'}`}
                                                            size="small"
                                                            sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }}
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    const getViewTitle = () => {
        switch (viewType) {
            case 'month':
                return format(currentDate, 'MMMM yyyy', { locale: de });
            case 'week':
                const weekStart = startOfWeek(currentDate, { locale: de });
                const weekEnd = endOfWeek(currentDate, { locale: de });
                return `${format(weekStart, 'd. MMM')} - ${format(weekEnd, 'd. MMM yyyy')}`;
            case 'day':
                return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
            default:
                return '';
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                height: '100%',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility',
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton onClick={handlePrevious}>
                            <ChevronLeft />
                        </IconButton>
                        <IconButton onClick={handleNext}>
                            <ChevronRight />
                        </IconButton>
                        <Button 
                            variant="outlined" 
                            startIcon={<Today />}
                            onClick={handleToday}
                            size="small"
                        >
                            Heute
                        </Button>
                        <Typography variant="h6" sx={{ ml: 2 }}>
                            {getViewTitle()}
                        </Typography>
                    </Stack>
                    <ToggleButtonGroup
                        value={viewType}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                    >
                        <ToggleButton value="month">
                            <Tooltip title="Monatsansicht">
                                <ViewModule />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="week">
                            <Tooltip title="Wochenansicht">
                                <ViewWeek />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="day">
                            <Tooltip title="Tagesansicht">
                                <ViewDay />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {/* Upcoming Meetings Panel */}
                {upcomingAppointments.length > 0 && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Card sx={{ bgcolor: 'primary.light', borderLeft: 4, borderColor: 'primary.main' }}>
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                                        ⚡ Bevorstehende Termine
                                    </Typography>
                                    {upcomingAppointments.map(apt => {
                                        const minutesUntil = differenceInMinutes(new Date(apt.scheduledDate), currentTime);
                                        const isStartingSoon = minutesUntil >= 0 && minutesUntil <= 5;
                                        const hasStarted = minutesUntil < 0;

                                        return (
                                            <Box
                                                key={apt.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 1.5,
                                                    bgcolor: 'background.paper',
                                                    borderRadius: 1,
                                                    boxShadow: 1
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box>
                                                        {getAppointmentIcon(apt)}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {apt.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {format(new Date(apt.scheduledDate), 'HH:mm', { locale: de })} Uhr
                                                            {hasStarted ? ' (läuft bereits)' : ` (in ${minutesUntil} Min.)`}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Button
                                                    variant={isStartingSoon || hasStarted ? "contained" : "outlined"}
                                                    color={isStartingSoon || hasStarted ? "success" : "primary"}
                                                    size="small"
                                                    startIcon={<VideoCall />}
                                                    onClick={() => navigate(`/videocall/${apt.id}`)}
                                                    sx={{
                                                        minWidth: 120,
                                                        animation: isStartingSoon ? 'pulse 2s infinite' : 'none',
                                                        '@keyframes pulse': {
                                                            '0%, 100%': { opacity: 1 },
                                                            '50%': { opacity: 0.7 }
                                                        }
                                                    }}
                                                >
                                                    {hasStarted ? 'Beitreten' : 'Jetzt beitreten'}
                                                </Button>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Legend */}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip 
                        icon={<VideoCall />} 
                        label="Standard" 
                        size="small" 
                        sx={{ bgcolor: '#9c27b0', color: 'white' }}
                    />
                    <Chip 
                        icon={<SwapHoriz />} 
                        label="Skill-Tausch" 
                        size="small" 
                        sx={{ bgcolor: '#ff9800', color: 'white' }}
                    />
                    <Chip 
                        icon={<AttachMoney />} 
                        label="Bezahlt" 
                        size="small" 
                        sx={{ bgcolor: '#2196f3', color: 'white' }}
                    />
                    <Chip 
                        label="Abgeschlossen" 
                        size="small" 
                        sx={{ bgcolor: '#4caf50', color: 'white' }}
                    />
                    <Chip 
                        label="Abgesagt" 
                        size="small" 
                        sx={{ bgcolor: '#9e9e9e', color: 'white' }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Box sx={{ width: 40, height: 2, bgcolor: 'error.main' }} />
                        <Typography variant="caption" color="error">
                            Aktuelle Zeit
                        </Typography>
                    </Stack>
                </Stack>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ height: 'calc(100% - 120px)', overflowY: 'auto' }}>
                {viewType === 'month' && renderMonthView()}
                {viewType === 'week' && renderWeekView()}
                {viewType === 'day' && renderDayView()}
            </Box>
        </Paper>
    );
};

export default CalendarView;