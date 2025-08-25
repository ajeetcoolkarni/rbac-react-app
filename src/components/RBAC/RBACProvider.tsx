import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CircularProgress, Box, Alert } from '@mui/material';

interface RBACContextType {
  isLoading: boolean;
  error?: string;
  isInitialized: boolean;
}

const RBACContext = createContext<RBACContextType>({
  isLoading: false,
  error: undefined,
  isInitialized: false,
});

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({
  children,
  fallbackComponent: FallbackComponent,
}) => {
  const { isLoading, error, roles, resources, actions } = useSelector(
    (state: RootState) => state.rbac
  );

  const isInitialized = roles.length > 0 && resources.length > 0 && actions.length > 0;

  const contextValue: RBACContextType = {
    isLoading,
    error,
    isInitialized,
  };

  if (isLoading && !isInitialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !isInitialized) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return (
      <Alert severity="error">
        Failed to initialize RBAC system: {error}
      </Alert>
    );
  }

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};
