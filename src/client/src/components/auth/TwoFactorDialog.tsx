import React, { createContext, useContext, useState, useCallback, ReactNode, memo, useMemo } from 'react';
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

export const TwoFactorDialogProvider: React.FC<TwoFactorDialogProviderProps> = memo(({ children }) => {
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

  const value = useMemo(() => ({
    showDialog, hideDialog, isOpen, hasSecret, setHasSecret
  }), [showDialog, hideDialog, isOpen, hasSecret, setHasSecret]);
  
  return (
    <TwoFactorDialogContext.Provider value={value}>
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
});

TwoFactorDialogProvider.displayName = 'TwoFactorDialogProvider';