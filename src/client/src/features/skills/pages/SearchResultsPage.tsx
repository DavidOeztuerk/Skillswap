import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import errorService from '../../../core/services/errorService';
import SkillErrorBoundary from '../../../shared/components/error/SkillErrorBoundary';
import type { RootState } from '../../../core/store/store';

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { results, isLoading, errorMessage } = useSelector((state: RootState) => state.search);

  useEffect(() => {
    errorService.addBreadcrumb('Viewing search results', 'navigation', {
      resultsCount: results.length,
      isLoading,
      hasError: !!errorMessage,
    });
  }, [results, isLoading, errorMessage]);

  const handleViewSkill = async (skillId: string, skillName: string): Promise<void> => {
    errorService.addBreadcrumb('Navigating to skill from search results', 'navigation', {
      skillId,
      skillName,
    });
    await navigate(`/skills/${skillId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Suchergebnisse
      </Typography>

      {isLoading ? <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} /> : null}
      {errorMessage ? <Typography color="error">Fehler: {errorMessage}</Typography> : null}
      {results.length === 0 && !isLoading && !errorMessage && (
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
                  onClick={async () => {
                    await handleViewSkill(skill.id, skill.name);
                  }}
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
