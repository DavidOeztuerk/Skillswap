import React, { useState, useCallback, type ReactNode, memo, useMemo } from 'react';
import { TwoFactorDialogContext } from '../hooks/useTwoFactorDialog';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorDialogProviderProps {
  children: ReactNode;
}

export const TwoFactorDialogProvider: React.FC<TwoFactorDialogProviderProps> = memo(
  ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSecret, setHasSecret] = useState(false);

    const showDialog = useCallback(() => {
      console.debug('🎭 TwoFactorDialog: Opening dialog');
      setIsOpen(true);
    }, []);

    const hideDialog = useCallback(() => {
      console.debug('🎭 TwoFactorDialog: Closing dialog');
      setIsOpen(false);
    }, []);

    const handleSuccess = useCallback(() => {
      console.debug('✅ TwoFactorDialog: Setup successful');
      hideDialog();
      // Reload the page to refresh status
      window.location.reload();
    }, [hideDialog]);

    const value = useMemo(
      () => ({
        showDialog,
        hideDialog,
        isOpen,
        hasSecret,
        setHasSecret,
      }),
      [showDialog, hideDialog, isOpen, hasSecret, setHasSecret]
    );

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
  }
);

TwoFactorDialogProvider.displayName = 'TwoFactorDialogProvider';
