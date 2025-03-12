// // src/pages/skills/SkillsPage.tsx
// import React, { useState, useEffect } from 'react';
// import { Box, Paper, Tabs, Tab } from '@mui/material';

// import PageHeader from '../../components/layout/PageHeader';
// import PageContainer from '../../components/layout/PageContainer';
// // import SkillList from '../../components/skills/SkillList';
// // import SkillForm from '../../components/skills/SkillForm';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';
// import AlertMessage from '../../components/ui/AlertMessage';
// import { useSkills } from '../../hooks/useSkills';
// import { Skill } from '../../types/models/Skill';
// import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';

// /**
//  * Seite zur Verwaltung der Skills des Benutzers
//  */
// const SkillsPage: React.FC = () => {
//   // Custom Hooks
//   const {
//     skills,
//     userSkills,
//     isLoading,
//     error,
//     loadSkills,
//     loadUserSkills,
//     addSkillToProfile,
//     removeSkillFromProfile,
//   } = useSkills();

//   // State für UI
//   const [tabValue, setTabValue] = useState(0);
//   const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
//   const [selectedUserSkill, setSelectedUserSkill] = useState<Skill | null>(
//     null
//   );
//   // const [isDialogOpen, setIsDialogOpen] = useState(false);
//   // const [isSubmitting, setIsSubmitting] = useState(false);
//   const [statusMessage, setStatusMessage] = useState<{
//     text: string;
//     type: 'success' | 'error' | 'info';
//   } | null>(null);

//   // Daten laden
//   useEffect(() => {
//     loadSkills();
//     loadUserSkills();
//   }, [loadSkills, loadUserSkills]);

//   // Tab-Wechsel-Handler
//   const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
//     setTabValue(newValue);
//   };

//   // Dialog-Handler
//   const handleOpenDialog = (skill: Skill) => {
//     setSelectedSkill(skill);
//     setSelectedUserSkill(null);
//     setIsDialogOpen(true);
//   };

//   const handleOpenEditDialog = (userSkill: Skill) => {
//     setSelectedUserSkill(userSkill);
//     setSelectedSkill(userSkill);
//     setIsDialogOpen(true);
//   };

//   const handleCloseDialog = () => {
//     setIsDialogOpen(false);
//     setSelectedSkill(null);
//     setSelectedUserSkill(null);
//   };

//   // Form-Submission-Handler
//   const handleSubmitSkill = async (data: CreateSkillRequest) => {
//     setIsSubmitting(true);

//     try {
//       if (selectedUserSkill) {
//         // Update vorhandenen Skill - diese Funktion müsste im Hook implementiert werden
//         await removeSkillFromProfile(selectedUserSkill.id);
//         await addSkillToProfile(data);
//         setStatusMessage({
//           text: 'Skill erfolgreich aktualisiert',
//           type: 'success',
//         });
//       } else {
//         // Neuen Skill hinzufügen
//         await addSkillToProfile(data);
//         setStatusMessage({
//           text: 'Skill erfolgreich hinzugefügt',
//           type: 'success',
//         });
//       }

//       handleCloseDialog();
//     } catch (err) {
//       setStatusMessage({
//         text: 'Fehler beim Speichern des Skills' + ' ' + error + ' ' + err,
//         type: 'error',
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handler für das Entfernen eines Skills
//   const handleRemoveSkill = async (userSkill: Skill) => {
//     try {
//       await removeSkillFromProfile(userSkill.id);
//       setStatusMessage({
//         text: 'Skill erfolgreich entfernt',
//         type: 'success',
//       });
//     } catch (err) {
//       setStatusMessage({
//         text: 'Fehler beim Speichern des Skills' + ' ' + error + ' ' + err,
//         type: 'error',
//       });
//     }
//   };

//   // Status-Meldung zurücksetzen
//   const clearStatusMessage = () => {
//     setStatusMessage(null);
//   };

//   return (
//     <PageContainer>
//       <PageHeader
//         title="Meine Skills"
//         subtitle="Verwalte deine Fähigkeiten und finde passende Lern- oder Lehrmöglichkeiten"
//         breadcrumbs={[
//           { label: 'Dashboard', href: '/dashboard' },
//           { label: 'Skills' },
//         ]}
//       />

//       {statusMessage && (
//         <AlertMessage
//           severity={statusMessage.type}
//           message={statusMessage.text}
//           onClose={clearStatusMessage}
//         />
//       )}

//       <Paper elevation={0} sx={{ mb: 3 }}>
//         <Tabs
//           value={tabValue}
//           onChange={handleTabChange}
//           indicatorColor="primary"
//           textColor="primary"
//           sx={{ borderBottom: 1, borderColor: 'divider' }}
//         >
//           <Tab label="Meine Skills" />
//           <Tab label="Skills entdecken" />
//         </Tabs>
//       </Paper>

//       {isLoading ? (
//         <LoadingSpinner message="Skills werden geladen..." />
//       ) : (
//         <Box>
//           {tabValue === 0 ? (
//             <SkillList
//               skills={userSkills}
//               isUserSkillList
//               onEditSkill={handleOpenEditDialog}
//               onRemoveSkill={handleRemoveSkill}
//               onTeachSkill={(userSkill) => {
//                 // Hier zur Matchmaking-Seite navigieren
//                 console.log('Lehren: ', userSkill);
//               }}
//               onLearnSkill={(userSkill) => {
//                 // Hier zur Matchmaking-Seite navigieren
//                 console.log('Lernen: ', userSkill);
//               }}
//             />
//           ) : (
//             <SkillList skills={skills} onAddSkill={handleOpenDialog} />
//           )}
//         </Box>
//       )}

//       {/* Dialog für das Hinzufügen/Bearbeiten eines Skills */}
//       {selectedSkill && (
//         // <SkillForm
//         //   open={isDialogOpen}
//         //   onClose={handleCloseDialog}
//         //   onSubmit={handleSubmitSkill}
//         //   skillId={selectedSkill.id}
//         //   skillName={selectedSkill.name}
//         //   // skillCategory={selectedSkill.skillCategoryId}
//         //   // userSkill={selectedUserSkill || undefined}
//         //   isLoading={isSubmitting}
//         // />
//         <div></div>
//       )}
//     </PageContainer>
//   );
// };

// export default SkillsPage;
