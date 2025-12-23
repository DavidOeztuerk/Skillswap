import { createContext, useContext } from 'react';

export interface TwoFactorDialogContextType {
  showDialog: () => void;
  hideDialog: () => void;
  isOpen: boolean;
  hasSecret: boolean;
  setHasSecret: (value: boolean) => void;
}

export const TwoFactorDialogContext = createContext<TwoFactorDialogContextType | undefined>(
  undefined
);

export const useTwoFactorDialog = (): TwoFactorDialogContextType => {
  const context = useContext(TwoFactorDialogContext);
  if (!context) {
    throw new Error('useTwoFactorDialog must be used within TwoFactorDialogProvider');
  }
  return context;
};
