import React from 'react';
import {
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';

interface PaginationControlsProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  totalItems,
  currentPage,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Gesamtzahl der Seiten
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Range der aktuell angezeigten Items (z.B. 11-20 von 73)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    onPageChange(page);
  };

  // MUI's SelectChangeEvent ist standardmäßig string-typed.
  // Hier casten wir auf string und parsen dann manuell.
  const handlePageSizeChange = (event: SelectChangeEvent<string>) => {
    const newPageSize = Number(event.target.value);
    onPageSizeChange(newPageSize);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 2,
        mt: 3,
        mb: 2,
      }}
    >
      {/* Infotext: z.B. "Zeige 11 - 20 von 73 Einträgen" */}
      <Box>
        {totalItems > 0 && (
          <Typography variant="body2" color="text.secondary">
            Zeige {startItem} - {endItem} von {totalItems} Einträgen
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          alignItems: isMobile ? 'flex-start' : 'center',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="page-size-select-label">Pro Seite</InputLabel>
          <Select
            labelId="page-size-select-label"
            id="page-size-select"
            value={String(pageSize)} // string-Value
            onChange={handlePageSizeChange}
            label="Pro Seite"
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={String(option)}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size={isMobile ? 'small' : 'medium'}
          showFirstButton
          showLastButton
          sx={{
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-end',
            width: isMobile ? '100%' : 'auto',
          }}
        />
      </Box>
    </Box>
  );
};

export default PaginationControls;
