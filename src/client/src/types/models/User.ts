export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  profilePicture?: string;
  bio?: string;
  createdAt?: string;
  role?: string;
  token: string;
}
