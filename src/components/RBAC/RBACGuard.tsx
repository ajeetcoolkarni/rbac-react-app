import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { hasPermission } from '../../utils/rbacUtils';
import { RBACComponentProps } from '../../types/rbac.types';
import { Box, Alert } from '@mui/material';

/**
 * RBAC Guard Component - Controls visibility and interaction based on permissions
 * 
 * Features:
 * - Hide/Show content based on permissions
 * - Disable/Enable interactions based on permissions
 * - Hierarchical permission checking
 * - Workflow stage awareness
 * - Override support
 */
export const RBACGuard: React.FC<RBACComponentProps> = ({
  resourcePath,
  action,
  children,
  fallback = null,
  hideOnDenied = false,
  disableOnDenied = false,
}): React.ReactElement | null => {
  const { userPermissions, workflowStage, currentUserRoleId } = useSelector((state: RootState) => state.rbac);

  const hasAccess = hasPermission(
    userPermissions,
    { resourcePath, action },
    workflowStage
  );

  // If access is denied and should hide, return fallback or null
  if (!hasAccess && hideOnDenied) {
    return fallback ? <>{fallback}</> : null;
  }



  // If access is denied and should disable, wrap in disabled container
  if (!hasAccess && disableOnDenied) {
    return (
      <Box
        sx={{
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      >
        {children}
      </Box>
    );
  }

  // If no access and no special handling, show fallback
  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  // Has access, render children normally
  return <>{children}</>;
};

/**
 * Higher-Order Component version of RBACGuard
 */
export const withRBAC = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resourcePath: string,
  action: string,
  options?: {
    fallback?: React.ReactNode;
    hideOnDenied?: boolean;
    disableOnDenied?: boolean;
  }
) => {
  const RBACWrappedComponent: React.FC<P> = (props) => {
    return (
      <RBACGuard
        resourcePath={resourcePath}
        action={action}
        fallback={options?.fallback}
        hideOnDenied={options?.hideOnDenied}
        disableOnDenied={options?.disableOnDenied}
      >
        <WrappedComponent {...props} />
      </RBACGuard>
    );
  };

  RBACWrappedComponent.displayName = `withRBAC(${WrappedComponent.displayName || WrappedComponent.name})`;
  return RBACWrappedComponent;
};

/**
 * Hook for checking permissions in functional components
 */
export const usePermission = (resourcePath: string, action: string) => {
  const { userPermissions, workflowStage } = useSelector((state: RootState) => state.rbac);
  
  return hasPermission(
    userPermissions,
    { resourcePath, action },
    workflowStage
  );
};

/**
 * Hook for getting all permissions for a resource
 */
export const useResourcePermissions = (resourcePath: string) => {
  const { userPermissions } = useSelector((state: RootState) => state.rbac);
  
  const permission = userPermissions.find(p => p.resourcePath === resourcePath);
  return permission ? permission.actions : [];
};

/**
 * Component for displaying permission debug information (development only)
 * Only exported in development mode for debugging purposes
 */
export const RBACDebugInfo: React.FC<{ 
  resourcePath: string; 
  action: string;
  showDetails?: boolean;
}> = ({
  resourcePath,
  action,
  showDetails = false,
}) => {
  const { userPermissions, workflowStage, currentUserRoleId } = useSelector(
    (state: RootState) => state.rbac
  );

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const hasAccess = hasPermission(
    userPermissions,
    { resourcePath, action },
    workflowStage
  );

  const relevantPermissions = userPermissions.filter(
    p => p.resourcePath === resourcePath || resourcePath.startsWith(p.resourcePath)
  );

  return (
    <Alert severity={hasAccess ? 'success' : 'error'} sx={{ mt: 1, fontSize: '0.75rem' }}>
      <strong>RBAC Debug:</strong>
      <br />
      Resource: {resourcePath}
      <br />
      Action: {action}
      <br />
      Role ID: {currentUserRoleId}
      <br />
      Workflow Stage: {workflowStage || 'None'}
      <br />
      Has Access: {hasAccess ? 'Yes' : 'No'}
      {showDetails && (
        <>
          <br />
          Relevant Permissions: {relevantPermissions.length}
          {relevantPermissions.map((p, index) => (
            <div key={index} style={{ marginLeft: '10px', fontSize: '0.7rem' }}>
              {p.resourcePath}: [{p.actions.join(', ')}]
              {p.isOverride && ' (Override)'}
            </div>
          ))}
        </>
      )}
    </Alert>
  );
};
