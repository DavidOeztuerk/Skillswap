import { SliceError } from '../../store/types';

export interface RequestState {
  isLoading: boolean;
  error: SliceError | null;
}
