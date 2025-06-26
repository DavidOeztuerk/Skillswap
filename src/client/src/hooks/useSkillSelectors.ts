// // src/hooks/skillSelectors.ts
// import { useMemo } from 'react';
// import { useAppSelector } from '../store/store.hooks';
// import {
//   selectAllSkills,
//   selectAllUserSkills,
//   selectAllCategories,
//   selectAllProficiencyLevels,
//   selectSkillsStatus,
// } from '../features/skills/skillsSlice';
// import { Skill } from '../types/models/Skill';

// /**
//  * Hook, der Skills nach Kategorien gruppiert zurückgibt
//  */
// export const useSkillsByCategories = (userSkillsOnly = false) => {
//   const allSkills = useAppSelector(selectAllSkills);
//   const userSkills = useAppSelector(selectAllUserSkills);
//   const categories = useAppSelector(selectAllCategories);
//   const status = useAppSelector(selectSkillsStatus);

//   const skills = userSkillsOnly ? userSkills : allSkills;

//   return useMemo(() => {
//     const skillsByCategory: Record<string, Skill[]> = {};

//     // Initialisiere alle Kategorien mit leeren Arrays
//     categories.forEach((category) => {
//       skillsByCategory[category.id] = [];
//     });

//     // Füge Skills in die entsprechenden Kategorien ein
//     skills.forEach((skill) => {
//       if (skill.skillCategoryId) {
//         if (!skillsByCategory[skill.skillCategoryId]) {
//           skillsByCategory[skill.skillCategoryId] = [];
//         }
//         skillsByCategory[skill.skillCategoryId].push(skill);
//       }
//     });

//     return {
//       skillsByCategory,
//       isLoading: userSkillsOnly
//         ? status.userSkills === 'loading'
//         : status.skills === 'loading',
//       categoriesLoading: status.categories === 'loading',
//     };
//   }, [skills, categories, status, userSkillsOnly]);
// };

// /**
//  * Hook, der Skills nach Fertigkeitsstufen gruppiert zurückgibt
//  */
// export const useSkillsByProficiencyLevel = (userSkillsOnly = false) => {
//   const allSkills = useAppSelector(selectAllSkills);
//   const userSkills = useAppSelector(selectAllUserSkills);
//   const proficiencyLevels = useAppSelector(selectAllProficiencyLevels);
//   const status = useAppSelector(selectSkillsStatus);

//   const skills = userSkillsOnly ? userSkills : allSkills;

//   return useMemo(() => {
//     const skillsByLevel: Record<string, Skill[]> = {};

//     // Initialisiere alle Fertigkeitsstufen mit leeren Arrays
//     proficiencyLevels.forEach((level) => {
//       skillsByLevel[level.id] = [];
//     });

//     // Füge Skills in die entsprechenden Fertigkeitsstufen ein
//     skills.forEach((skill) => {
//       if (skill.proficiencyLevelId) {
//         if (!skillsByLevel[skill.proficiencyLevelId]) {
//           skillsByLevel[skill.proficiencyLevelId] = [];
//         }
//         skillsByLevel[skill.proficiencyLevelId].push(skill);
//       }
//     });

//     return {
//       skillsByLevel,
//       isLoading: userSkillsOnly
//         ? status.userSkills === 'loading'
//         : status.skills === 'loading',
//       levelsLoading: status.proficiencyLevels === 'loading',
//     };
//   }, [skills, proficiencyLevels, status, userSkillsOnly]);
// };

// /**
//  * Hook, der Top-Skills basierend auf einem bestimmten Kriterium zurückgibt
//  */
// export const useTopSkills = (limit: number = 5, userSkillsOnly = false) => {
//   const allSkills = useAppSelector(selectAllSkills);
//   const userSkills = useAppSelector(selectAllUserSkills);
//   const status = useAppSelector(selectSkillsStatus);

//   const skills = userSkillsOnly ? userSkills : allSkills;

//   return useMemo(() => {
//     // Hier könnte eine eigene Sortierlogik implementiert werden, z.B. nach Bewertungen
//     // Für dieses Beispiel sortieren wir nach Namen
//     const sortedSkills = [...skills].sort((a, b) =>
//       a.name.localeCompare(b.name)
//     );
//     const topSkills = sortedSkills.slice(0, limit);

//     return {
//       topSkills,
//       isLoading: userSkillsOnly
//         ? status.userSkills === 'loading'
//         : status.skills === 'loading',
//     };
//   }, [skills, limit, status, userSkillsOnly]);
// };

// /**
//  * Hook, der Kategorien mit der Anzahl der Skills pro Kategorie zurückgibt
//  */
// export const useCategoriesWithSkillCount = (userSkillsOnly = false) => {
//   const allSkills = useAppSelector(selectAllSkills);
//   const userSkills = useAppSelector(selectAllUserSkills);
//   const categories = useAppSelector(selectAllCategories);
//   const status = useAppSelector(selectSkillsStatus);

//   const skills = userSkillsOnly ? userSkills : allSkills;

//   return useMemo(() => {
//     const categoriesWithCount = categories.map((category) => {
//       const count = skills.filter(
//         (skill) => skill.skillCategoryId === category.id
//       ).length;
//       return {
//         ...category,
//         skillCount: count,
//       };
//     });

//     return {
//       categoriesWithCount,
//       isLoading: userSkillsOnly
//         ? status.userSkills === 'loading'
//         : status.skills === 'loading',
//       categoriesLoading: status.categories === 'loading',
//     };
//   }, [skills, categories, status, userSkillsOnly]);
// };

// /**
//  * Hook, der nach Skills sucht und gefilterte Ergebnisse zurückgibt
//  */
// export const useSkillSearch = (query: string, userSkillsOnly = false) => {
//   const allSkills = useAppSelector(selectAllSkills);
//   const userSkills = useAppSelector(selectAllUserSkills);
//   const status = useAppSelector(selectSkillsStatus);

//   const skills = userSkillsOnly ? userSkills : allSkills;

//   return useMemo(() => {
//     if (!query) {
//       return {
//         results: skills,
//         isLoading: userSkillsOnly
//           ? status.userSkills === 'loading'
//           : status.skills === 'loading',
//       };
//     }

//     const lowerQuery = query.toLowerCase();
//     const filteredSkills = skills.filter(
//       (skill) =>
//         skill.name.toLowerCase().includes(lowerQuery) ||
//         (skill.description &&
//           skill.description.toLowerCase().includes(lowerQuery))
//     );

//     return {
//       results: filteredSkills,
//       isLoading: userSkillsOnly
//         ? status.userSkills === 'loading'
//         : status.skills === 'loading',
//     };
//   }, [skills, query, status, userSkillsOnly]);
// };
