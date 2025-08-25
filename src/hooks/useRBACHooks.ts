import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState } from '../store';
import { setCurrentUserRole, setWorkflowStage } from '../store/slices/rbacSlice';
import { hasPermission, isResourceVisible, isResourceEnabled } from '../utils/rbacUtils';
import { PermissionCheckParams } from '../types/rbac.types';

/**
 * Main RBAC hook that provides all permission-related functionality
 */
export const useRBACPermissions = () => {
  const dispatch = useDispatch();
  const { userPermissions, workflowStage, currentUserRoleId, roles } = useSelector(
    (state: RootState) => state.rbac
  );

  // Check if user has specific permission
  const checkPermission = useCallback(
    (resourcePath: string, action: string, customWorkflowStage?: string) => {
      return hasPermission(
        userPermissions,
        { resourcePath, action },
        customWorkflowStage || workflowStage
      );
    },
    [userPermissions, workflowStage]
  );

  // Check if resource is visible
  const checkVisibility = useCallback(
    (resourcePath: string, customWorkflowStage?: string) => {
      return isResourceVisible(userPermissions, resourcePath, customWorkflowStage || workflowStage);
    },
    [userPermissions, workflowStage]
  );

  // Check if resource is enabled
  const checkEnabled = useCallback(
    (resourcePath: string, action: string, customWorkflowStage?: string) => {
      return isResourceEnabled(
        userPermissions,
        resourcePath,
        action,
        customWorkflowStage || workflowStage
      );
    },
    [userPermissions, workflowStage]
  );

  // Get all actions available for a resource
  const getResourceActions = useCallback(
    (resourcePath: string) => {
      const permission = userPermissions.find(p => p.resourcePath === resourcePath);
      return permission ? permission.actions : [];
    },
    [userPermissions]
  );

  // Change user role
  const changeUserRole = useCallback(
    (roleId: number) => {
      dispatch(setCurrentUserRole(roleId));
    },
    [dispatch]
  );

  // Change workflow stage
  const changeWorkflowStage = useCallback(
    (stage: string) => {
      dispatch(setWorkflowStage(stage));
    },
    [dispatch]
  );

  // Get current role information
  const currentRole = useMemo(() => {
    return roles.find(role => role.RoleId === currentUserRoleId);
  }, [roles, currentUserRoleId]);

  return {
    // Permission checking functions
    checkPermission,
    checkVisibility,
    checkEnabled,
    getResourceActions,
    
    // State management functions
    changeUserRole,
    changeWorkflowStage,
    
    // Current state
    currentUserRoleId,
    currentRole,
    workflowStage,
    userPermissions,
    roles,
    
    // Utility functions
    hasPermission: checkPermission,
    isVisible: checkVisibility,
    isEnabled: checkEnabled,
  };
};

/**
 * Hook for form field permissions with RJSF integration
 */
export const useFormFieldPermissions = () => {
  const { checkPermission, checkEnabled, workflowStage } = useRBACPermissions();

  // Check if field is readable
  const isFieldReadable = useCallback(
    (fieldPath: string) => {
      return checkPermission(fieldPath, 'READ');
    },
    [checkPermission]
  );

  // Check if field is editable
  const isFieldEditable = useCallback(
    (fieldPath: string) => {
      return checkEnabled(fieldPath, 'UPDATE');
    },
    [checkEnabled]
  );

  // Get field UI schema based on permissions
  const getFieldUISchema = useCallback(
    (fieldPath: string, baseUISchema: any = {}) => {
      const canRead = isFieldReadable(fieldPath);
      const canEdit = isFieldEditable(fieldPath);

      if (!canRead) {
        return {
          ...baseUISchema,
          'ui:widget': 'hidden',
        };
      }

      if (!canEdit) {
        return {
          ...baseUISchema,
          'ui:disabled': true,
          'ui:readonly': true,
        };
      }

      return baseUISchema;
    },
    [isFieldReadable, isFieldEditable]
  );

  // Transform entire form schema based on permissions
  const transformFormSchema = useCallback(
    (schema: any, uiSchema: any = {}, basePath: string = '') => {
      const transformedUISchema = { ...uiSchema };

      if (schema.properties) {
        Object.keys(schema.properties).forEach(fieldName => {
          const fieldPath = basePath ? `${basePath}/${fieldName}` : fieldName;
          transformedUISchema[fieldName] = getFieldUISchema(
            fieldPath,
            uiSchema[fieldName]
          );
        });
      }

      return transformedUISchema;
    },
    [getFieldUISchema]
  );

  return {
    isFieldReadable,
    isFieldEditable,
    getFieldUISchema,
    transformFormSchema,
    workflowStage,
  };
};

/**
 * Hook for workflow-aware permissions
 */
export const useWorkflowPermissions = () => {
  const { checkPermission, workflowStage, changeWorkflowStage } = useRBACPermissions();

  // Check permission with specific workflow stage
  const checkWorkflowPermission = useCallback(
    (resourcePath: string, action: string, stage: string) => {
      return checkPermission(resourcePath, action, stage);
    },
    [checkPermission]
  );

  // Get available actions for current workflow stage
  const getWorkflowActions = useCallback(
    (resourcePath: string, stage?: string) => {
      const currentStage = stage || workflowStage;
      const allActions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE'];
      
      return allActions.filter(action => 
        checkPermission(resourcePath, action, currentStage)
      );
    },
    [checkPermission, workflowStage]
  );

  // Simulate workflow progression
  const progressWorkflow = useCallback(
    (newStage: string) => {
      changeWorkflowStage(newStage);
    },
    [changeWorkflowStage]
  );

  return {
    checkWorkflowPermission,
    getWorkflowActions,
    progressWorkflow,
    currentWorkflowStage: workflowStage,
  };
};

/**
 * Hook for debugging permissions in development
 */
export const useRBACDebug = () => {
  const { userPermissions, workflowStage, currentUserRoleId } = useRBACPermissions();

  const debugPermission = useCallback(
    (resourcePath: string, action: string) => {
      if (process.env.NODE_ENV !== 'development') return;

      const hasAccess = hasPermission(
        userPermissions,
        { resourcePath, action },
        workflowStage
      );

      const relevantPermissions = userPermissions.filter(
        p => p.resourcePath === resourcePath || resourcePath.startsWith(p.resourcePath)
      );



      return {
        hasAccess,
        relevantPermissions,
        currentUserRoleId,
        workflowStage,
      };
    },
    [userPermissions, workflowStage, currentUserRoleId]
  );

  const logAllPermissions = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🔐 All User Permissions');
    console.table(userPermissions);
    console.groupEnd();
  }, [userPermissions]);

  return {
    debugPermission,
    logAllPermissions,
  };
};
