import { createLazyRoute } from '../components/routing/withSuspense';

// Lazy route for skills page - created here to avoid circular dependencies
const skillsListRoute = createLazyRoute(() => import('../pages/skills/SkillsPage'), {
  requireAuth: true,
  useSkeleton: true,
  skeletonVariant: 'list',
});

/**
 * Skills-Komponente Wrapper für verschiedene showOnly Props
 */
export const SkillsPageAll = (): React.JSX.Element => {
  const Component = skillsListRoute.component;
  return <Component showOnly="all" />;
};

export const SkillsPageMine = (): React.JSX.Element => {
  const Component = skillsListRoute.component;
  return <Component showOnly="mine" />;
};

export const SkillsPageFavorite = (): React.JSX.Element => {
  const Component = skillsListRoute.component;
  return <Component showOnly="favorite" />;
};
