import React from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { results, loading, error } = useSelector(
    (state: RootState) => state.search
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Suchergebnisse
      </Typography>

      {loading && (
        <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
      )}
      {error && <Typography color="error">Fehler: {error}</Typography>}
      {results.length === 0 && !loading && !error && (
        <Typography variant="h6" color="textSecondary">
          Keine Ergebnisse gefunden.
        </Typography>
      )}

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {results.map((skill) => (
          <Grid item xs={12} sm={6} md={4} key={skill.skillId}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {skill.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {skill.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate(`/skills/${skill.skillId}`)}
                >
                  Mehr erfahren
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SearchResultsPage;
