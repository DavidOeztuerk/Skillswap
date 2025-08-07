import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorDialogContextType {
  showDialog: () => void;
  hideDialog: () => void;
  isOpen: boolean;
  hasSecret: boolean;
  setHasSecret: (value: boolean) => void;
}

const TwoFactorDialogContext = createContext<TwoFactorDialogContextType | undefined>(undefined);

export const useTwoFactorDialog = () => {
  const context = useContext(TwoFactorDialogContext);
  if (!context) {
    throw new Error('useTwoFactorDialog must be used within TwoFactorDialogProvider');
  }
  return context;
};

interface TwoFactorDialogProviderProps {
  children: ReactNode;
}

export const TwoFactorDialogProvider: React.FC<TwoFactorDialogProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);

  const showDialog = useCallback(() => {
    console.log('🎭 TwoFactorDialog: Opening dialog');
    setIsOpen(true);
  }, []);

  const hideDialog = useCallback(() => {
    console.log('🎭 TwoFactorDialog: Closing dialog');
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback(async () => {
    console.log('✅ TwoFactorDialog: Setup successful');
    hideDialog();
    // Reload the page to refresh status
    window.location.reload();
  }, [hideDialog]);

  return (
    <TwoFactorDialogContext.Provider value={{ showDialog, hideDialog, isOpen, hasSecret, setHasSecret }}>
      {children}
      {/* Dialog is always rendered at root level, outside of any component that might unmount */}
      <TwoFactorSetup
        open={isOpen}
        onClose={hideDialog}
        onSuccess={handleSuccess}
        hasExistingSecret={hasSecret}
      />
    </TwoFactorDialogContext.Provider>
  );
};