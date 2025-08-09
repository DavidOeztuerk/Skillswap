import React, { useEffect } from 'react';
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
import SkillErrorBoundary from '../../components/error/SkillErrorBoundary';
import errorService from '../../services/errorService';

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { results, isLoading, error } = useSelector(
    (state: RootState) => state.search
  );

  useEffect(() => {
    errorService.addBreadcrumb('Viewing search results', 'navigation', { 
      resultsCount: results?.length, 
      isLoading, 
      hasError: !!error 
    });
  }, [results, isLoading, error]);

  const handleViewSkill = (skillId: string, skillName: string) => {
    errorService.addBreadcrumb('Navigating to skill from search results', 'navigation', { skillId, skillName });
    navigate(`/skills/${skillId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Suchergebnisse
      </Typography>

      {isLoading && (
        <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
      )}
      {error && <Typography color="error">Fehler: {error.message}</Typography>}
      {results?.length === 0 && !isLoading && !error && (
        <Typography variant="h6" color="textSecondary">
          Keine Ergebnisse gefunden.
        </Typography>
      )}

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {results.map((skill) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={skill.id}>
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
                  onClick={() => handleViewSkill(skill.id, skill.name)}
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

const WrappedSearchResultsPage: React.FC = () => (
  <SkillErrorBoundary>
    <SearchResultsPage />
  </SkillErrorBoundary>
);

export default WrappedSearchResultsPage;
