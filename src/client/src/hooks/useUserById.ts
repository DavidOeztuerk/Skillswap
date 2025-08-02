// import { useCallback, useEffect, useState } from 'react';
// import authService from '../api/services/authService';
// import { User } from '../types/models/User';

// export function useUserById(userId?: string) {
//   const [user, setUser] = useState<Partial<User> | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchUser = useCallback(async (id: string) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await authService.getUserById(id);
//       setUser(data);
//     } catch {
//       setError('Unbekannter Fehler');
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (userId) {
//       fetchUser(userId);
//     } else {
//       setUser(null);
//     }
//   }, [userId, fetchUser]);

//   return { user, loading, error };
// }
