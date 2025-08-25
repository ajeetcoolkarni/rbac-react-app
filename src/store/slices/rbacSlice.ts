import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RBACState, PermissionMatrix, UserPermission, Role, Resource, Action } from '../../types/rbac.types';
import { rbacAPI } from '../../services/rbacAPI';

// Async thunks for API calls
export const fetchPermissionMatrix = createAsyncThunk(
  'rbac/fetchPermissionMatrix',
  async (userId: number) => {
    const response = await rbacAPI.getPermissionMatrix(userId);
    return response;
  }
);

export const fetchRoles = createAsyncThunk(
  'rbac/fetchRoles',
  async () => {
    const response = await rbacAPI.getRoles();
    return response;
  }
);

export const fetchResources = createAsyncThunk(
  'rbac/fetchResources',
  async () => {
    const response = await rbacAPI.getResources();
    return response;
  }
);

export const fetchActions = createAsyncThunk(
  'rbac/fetchActions',
  async () => {
    const response = await rbacAPI.getActions();
    return response;
  }
);

// Simple Demo Data Thunks
export const fetchSimpleDemoData = createAsyncThunk(
  'rbac/fetchSimpleDemoData',
  async (_, { dispatch }) => {
    const [roles, resources, actions] = await Promise.all([
      rbacAPI.getSimpleDemoRoles(),
      rbacAPI.getSimpleDemoResources(),
      rbacAPI.getSimpleDemoActions()
    ]);
    
    return { roles, resources, actions };
  }
);

export const fetchSimpleDemoPermissions = createAsyncThunk(
  'rbac/fetchSimpleDemoPermissions',
  async (roleId: number) => {
    const response = await rbacAPI.getSimpleDemoPermissionMatrix(roleId);
    return response;
  }
);

// External bootstrap thunks (Option B)
export const initializeRBACWithApi = createAsyncThunk(
  'rbac/initializeWithApi',
  async (userId: number | undefined, { dispatch }) => {
    await Promise.all([
      dispatch(fetchRoles()),
      dispatch(fetchResources()),
      dispatch(fetchActions()),
    ]);
    if (typeof userId === 'number') {
      dispatch(setCurrentUserRole(userId));
      await dispatch(fetchPermissionMatrix(userId));
    }
  }
);

export const initializeRBACWithDemo = createAsyncThunk(
  'rbac/initializeWithDemo',
  async (roleId: number | undefined, { dispatch }) => {
    await dispatch(fetchSimpleDemoData());
    if (typeof roleId === 'number') {
      dispatch(setCurrentUserRole(roleId));
      await dispatch(fetchSimpleDemoPermissions(roleId));
    }
  }
);

const initialState: RBACState = {
  roles: [],
  resources: [],
  actions: [],
  permissionMatrix: [],
  userPermissions: [],
  currentUserRoleId: undefined,
  workflowStage: undefined,
  isLoading: false,
  error: undefined,
};

// Helper function to build hierarchical resource tree
const buildResourceHierarchy = (resources: Resource[]): Resource[] => {
  const resourceMap = new Map<number, Resource>();
  const rootResources: Resource[] = [];

  // Create a map of all resources
  resources.forEach(resource => {
    resourceMap.set(resource.ResourceId, { ...resource, children: [] });
  });

  // Build the hierarchy
  resources.forEach(resource => {
    const resourceNode = resourceMap.get(resource.ResourceId)!;
    if (resource.ParentResourceId) {
      const parent = resourceMap.get(resource.ParentResourceId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(resourceNode);
      }
    } else {
      rootResources.push(resourceNode);
    }
  });

  return rootResources;
};

// Helper function to transform permission matrix to user permissions
const transformToUserPermissions = (
  permissionMatrix: PermissionMatrix[],
  resources: Resource[],
  actions: Action[],
  currentRoleId?: number
): UserPermission[] => {
  if (!currentRoleId) {

    return [];
  }



  const resourceMap = new Map(resources.map(r => [r.ResourceId, r]));
  const actionMap = new Map(actions.map(a => [a.ActionId, a]));

  const userPermissions: UserPermission[] = [];
  const permissionsByResource = new Map<number, PermissionMatrix[]>();

  // Group permissions by resource
  const rolePermissions = permissionMatrix.filter(p => p.RoleId === currentRoleId && p.IsActive);
  


  rolePermissions.forEach(permission => {
    if (!permissionsByResource.has(permission.ResourceId)) {
      permissionsByResource.set(permission.ResourceId, []);
    }
    permissionsByResource.get(permission.ResourceId)!.push(permission);
  });

  // Transform to user permissions
  permissionsByResource.forEach((permissions, resourceId) => {
    const resource = resourceMap.get(resourceId);
    if (!resource) {

      return;
    }

    const actions = permissions.map(p => {
      const action = actionMap.get(p.ActionId);
      return action ? action.Action : '';
    }).filter(Boolean);

    // Check for time-based validity
    const now = new Date();
    const validPermissions = permissions.filter(p => {
      if (p.ValidFrom && new Date(p.ValidFrom) > now) return false;
      if (p.ValidTo && new Date(p.ValidTo) < now) return false;
      return true;
    });

    if (validPermissions.length > 0) {
      const firstPermission = validPermissions[0];
      userPermissions.push({
        resourcePath: resource.ResourcePath,
        resourceId: resource.ResourceId,
        actions,
        isActive: true,
        isOverride: firstPermission.IsOverride,
        hierarchyLevel: resource.HierarchyLevel,
        validFrom: firstPermission.ValidFrom,
        validTo: firstPermission.ValidTo,
        metadata: firstPermission.Metadata ? JSON.parse(firstPermission.Metadata) : undefined,
      });
    }
  });

  return userPermissions;
};

const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    setCurrentUserRole: (state, action: PayloadAction<number>) => {
      state.currentUserRoleId = action.payload;
      // Recalculate user permissions when role changes
      state.userPermissions = transformToUserPermissions(
        state.permissionMatrix,
        state.resources,
        state.actions,
        action.payload
      );
    },
    setWorkflowStage: (state, action: PayloadAction<string>) => {
      state.workflowStage = action.payload;
    },
    clearError: (state) => {
      state.error = undefined;
    },
    resetRBAC: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Permission Matrix
      .addCase(fetchPermissionMatrix.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchPermissionMatrix.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissionMatrix = action.payload;
        // Recalculate user permissions
        state.userPermissions = transformToUserPermissions(
          action.payload,
          state.resources,
          state.actions,
          state.currentUserRoleId
        );
      })
      .addCase(fetchPermissionMatrix.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Fetch Roles
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.error = action.error.message;
      })
      // Fetch Resources
      .addCase(fetchResources.fulfilled, (state, action) => {
        // Store resources as a flat list to preserve all entries for permission mapping
        state.resources = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.error = action.error.message;
      })
      // Fetch Actions
      .addCase(fetchActions.fulfilled, (state, action) => {
        state.actions = action.payload;
      })
      .addCase(fetchActions.rejected, (state, action) => {
        state.error = action.error.message;
      })
      // Simple Demo Data
      .addCase(fetchSimpleDemoData.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchSimpleDemoData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = action.payload.roles;
        // Keep resources flat; build hierarchy only where needed in the UI layer
        state.resources = action.payload.resources;
        state.actions = action.payload.actions;
      })
      .addCase(fetchSimpleDemoData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Simple Demo Permissions
      .addCase(fetchSimpleDemoPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchSimpleDemoPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissionMatrix = action.payload;
        // Recalculate user permissions
        state.userPermissions = transformToUserPermissions(
          action.payload,
          state.resources,
          state.actions,
          state.currentUserRoleId
        );
      })
      .addCase(fetchSimpleDemoPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { setCurrentUserRole, setWorkflowStage, clearError, resetRBAC } = rbacSlice.actions;
export default rbacSlice.reducer;
