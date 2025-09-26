import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { User } from "../../types/models/User";
import { RequestState } from "../../types/common/RequestState";
import { LoginRequest } from "../../types/contracts/requests/LoginRequest";
import { getToken } from "../../utils/authHelpers";

export const usersAdapter = createEntityAdapter<User, EntityId>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
});

export interface UsersEntityState extends EntityState<User, EntityId>, RequestState {
  user: User | null;
  isAuthenticated: boolean;
  pendingLoginCredentials: LoginRequest | null;
}

export const initialUsersState: UsersEntityState = usersAdapter.getInitialState({
  user: null,
  isAuthenticated: !!getToken(),
  pendingLoginCredentials: null,
  isLoading: false,
  errorMessage: undefined,
});

export const usersSelectors = usersAdapter.getSelectors();


