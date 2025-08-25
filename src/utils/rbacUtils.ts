import { UserPermission, PermissionCheckParams, WorkflowStage } from '../types/rbac.types';

/**
 * Check if user has permission for a specific resource and action
 * Implements hierarchical permission checking with override support
 */
export const hasPermission = (
  userPermissions: UserPermission[],
  params: PermissionCheckParams,
  workflowStage?: string
): boolean => {
  const { resourcePath, action, workflowStage: paramWorkflowStage } = params;
  const currentStage = paramWorkflowStage || workflowStage;



  // Find exact match first
  const exactMatch = userPermissions.find(
    permission => permission.resourcePath === resourcePath
  );



  if (exactMatch) {
    // Check if action is allowed
    const hasAction = exactMatch.actions.includes(action);
    
    // If it's an override permission, return the result directly
    if (exactMatch.isOverride) {
      return hasAction;
    }
    
    // Check workflow stage restrictions
    if (currentStage && exactMatch.metadata?.workflowRestrictions) {
      const restrictions = exactMatch.metadata.workflowRestrictions[currentStage];
      if (restrictions) {
        if (restrictions.restrictedActions?.includes(action)) {
          return false;
        }
        if (restrictions.allowedActions && !restrictions.allowedActions.includes(action)) {
          return false;
        }
      }
    }
    
    return hasAction;
  }

  // If no exact match, check hierarchical permissions
  // Find parent permissions by checking resource path hierarchy
  const pathSegments = resourcePath.split('/').filter(Boolean);
  
  for (let i = pathSegments.length - 1; i >= 0; i--) {
    const parentPath = '/' + pathSegments.slice(0, i + 1).join('/');
    const parentPermission = userPermissions.find(
      permission => permission.resourcePath === parentPath
    );
    
    if (parentPermission && parentPermission.actions.includes(action)) {
      // Check if there's a more specific override that denies this permission
      const hasOverride = userPermissions.some(
        permission => 
          permission.resourcePath.startsWith(resourcePath) &&
          permission.isOverride &&
          !permission.actions.includes(action)
      );
      
      if (hasOverride) {
        return false;
      }
      
      // Check workflow stage restrictions for parent
      if (currentStage && parentPermission.metadata?.workflowRestrictions) {
        const restrictions = parentPermission.metadata.workflowRestrictions[currentStage];
        if (restrictions) {
          if (restrictions.restrictedActions?.includes(action)) {
            return false;
          }
          if (restrictions.allowedActions && !restrictions.allowedActions.includes(action)) {
            return false;
          }
        }
      }
      
      return true;
    }
  }

  return false;
};

/**
 * Get all permissions for a specific resource path
 */
export const getResourcePermissions = (
  userPermissions: UserPermission[],
  resourcePath: string
): string[] => {
  const permission = userPermissions.find(p => p.resourcePath === resourcePath);
  return permission ? permission.actions : [];
};

/**
 * Check if resource should be visible based on permissions
 */
export const isResourceVisible = (
  userPermissions: UserPermission[],
  resourcePath: string,
  workflowStage?: string
): boolean => {
  return hasPermission(userPermissions, { resourcePath, action: 'READ' }, workflowStage);
};

/**
 * Check if resource should be enabled based on permissions
 */
export const isResourceEnabled = (
  userPermissions: UserPermission[],
  resourcePath: string,
  action: string,
  workflowStage?: string
): boolean => {
  return hasPermission(userPermissions, { resourcePath, action }, workflowStage);
};

/**
 * Filter resources based on user permissions
 */
export const filterResourcesByPermission = <T extends { resourcePath: string }>(
  resources: T[],
  userPermissions: UserPermission[],
  action: string = 'READ',
  workflowStage?: string
): T[] => {
  return resources.filter(resource =>
    hasPermission(userPermissions, { resourcePath: resource.resourcePath, action }, workflowStage)
  );
};

/**
 * Get workflow stage restrictions for a resource
 */
export const getWorkflowRestrictions = (
  userPermissions: UserPermission[],
  resourcePath: string,
  workflowStage: string
): { restrictedActions?: string[]; allowedActions?: string[] } | null => {
  const permission = userPermissions.find(p => p.resourcePath === resourcePath);
  if (!permission?.metadata?.workflowRestrictions) {
    return null;
  }
  
  return permission.metadata.workflowRestrictions[workflowStage] || null;
};

/**
 * Check if an action is restricted in current workflow stage
 */
export const isActionRestrictedInWorkflow = (
  userPermissions: UserPermission[],
  resourcePath: string,
  action: string,
  workflowStage?: string
): boolean => {
  if (!workflowStage) return false;
  
  const restrictions = getWorkflowRestrictions(userPermissions, resourcePath, workflowStage);
  if (!restrictions) return false;
  
  if (restrictions.restrictedActions?.includes(action)) {
    return true;
  }
  
  if (restrictions.allowedActions && !restrictions.allowedActions.includes(action)) {
    return true;
  }
  
  return false;
};


