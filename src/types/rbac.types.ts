// RBAC Types based on the database schema
export interface Role {
  RoleId: number;
  RoleName: string;
  Description?: string;
}

export interface Resource {
  ResourceId: number;
  ResourcePath: string;
  ResourceName: string;
  ResourceType: string;
  HierarchyLevel: number;
  ParentResourceId?: number;
  children?: Resource[];
}

export interface Action {
  ActionId: number;
  Action: string;
  Description?: string;
}

export interface PermissionMatrix {
  PermissionId: number;
  RoleId: number;
  ResourceId: number;
  ActionId: number;
  IsActive: boolean;
  ValidFrom?: string;
  ValidTo?: string;
  IsOverride?: boolean;
  Metadata?: string;
}

// Enhanced types for the RBAC system
export interface UserPermission {
  resourcePath: string;
  resourceId: number;
  actions: string[];
  isActive: boolean;
  isOverride?: boolean;
  hierarchyLevel: number;
  validFrom?: string;
  validTo?: string;
  metadata?: any;
}

export interface RBACState {
  roles: Role[];
  resources: Resource[];
  actions: Action[];
  permissionMatrix: PermissionMatrix[];
  userPermissions: UserPermission[];
  currentUserRoleId?: number;
  workflowStage?: string;
  isLoading: boolean;
  error?: string;
}

export interface PermissionCheckParams {
  resourcePath: string;
  action: string;
  workflowStage?: string;
}

export interface RBACComponentProps {
  resourcePath: string;
  action: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  hideOnDenied?: boolean;
  disableOnDenied?: boolean;
}

export enum ActionTypes {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXECUTE = 'EXECUTE',
  APPROVE = 'APPROVE',
  SUBMIT = 'SUBMIT'
}

export enum ResourceTypes {
  PAGE = 'PAGE',
  SECTION = 'SECTION',
  COMPONENT = 'COMPONENT',
  FIELD = 'FIELD',
  BUTTON = 'BUTTON',
  API = 'API'
}

export interface WorkflowStage {
  stage: string;
  restrictedActions?: string[];
  allowedActions?: string[];
}
