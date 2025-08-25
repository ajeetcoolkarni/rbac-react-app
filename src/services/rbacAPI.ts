import axios from 'axios';
import { Role, Resource, Action, PermissionMatrix } from '../types/rbac.types';
import simpleDemoPermissions from '../data/simpleDemoPermissions.json';

// Configure axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const rbacAPI = {
  // Fetch all roles
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      // Return mock data for development
      return [
        { RoleId: 1, RoleName: 'Admin', Description: 'System Administrator' },
        { RoleId: 2, RoleName: 'Manager', Description: 'Department Manager' },
        { RoleId: 3, RoleName: 'User', Description: 'Regular User' },
      ];
    }
  },

  // Fetch all resources
  getResources: async (): Promise<Resource[]> => {
    try {
      const response = await api.get('/resources');
      return response.data;
    } catch (error) {
      // Return mock data for development
      return [
        {
          ResourceId: 1,
          ResourcePath: '/dashboard',
          ResourceName: 'Dashboard',
          ResourceType: 'PAGE',
          HierarchyLevel: 1,
        },
        {
          ResourceId: 2,
          ResourcePath: '/dashboard/stats',
          ResourceName: 'Statistics Section',
          ResourceType: 'SECTION',
          HierarchyLevel: 2,
          ParentResourceId: 1,
        },
        {
          ResourceId: 3,
          ResourcePath: '/dashboard/stats/revenue',
          ResourceName: 'Revenue Field',
          ResourceType: 'FIELD',
          HierarchyLevel: 3,
          ParentResourceId: 2,
        },
        {
          ResourceId: 4,
          ResourcePath: '/users',
          ResourceName: 'User Management',
          ResourceType: 'PAGE',
          HierarchyLevel: 1,
        },
        {
          ResourceId: 5,
          ResourcePath: '/users/create',
          ResourceName: 'Create User Button',
          ResourceType: 'BUTTON',
          HierarchyLevel: 2,
          ParentResourceId: 4,
        },
        {
          ResourceId: 6,
          ResourcePath: '/demo',
          ResourceName: 'Demo Page',
          ResourceType: 'PAGE',
          HierarchyLevel: 1,
        },
        {
          ResourceId: 7,
          ResourcePath: '/demo/form',
          ResourceName: 'Demo Form',
          ResourceType: 'SECTION',
          HierarchyLevel: 2,
          ParentResourceId: 6,
        },
        {
          ResourceId: 8,
          ResourcePath: '/demo/form/name',
          ResourceName: 'Name Field',
          ResourceType: 'FIELD',
          HierarchyLevel: 3,
          ParentResourceId: 7,
        },
        {
          ResourceId: 9,
          ResourcePath: '/demo/form/email',
          ResourceName: 'Email Field',
          ResourceType: 'FIELD',
          HierarchyLevel: 3,
          ParentResourceId: 7,
        },
        {
          ResourceId: 10,
          ResourcePath: '/demo/form/submit',
          ResourceName: 'Submit Button',
          ResourceType: 'BUTTON',
          HierarchyLevel: 3,
          ParentResourceId: 7,
        },
      ];
    }
  },

  // Fetch all actions
  getActions: async (): Promise<Action[]> => {
    try {
      const response = await api.get('/actions');
      return response.data;
    } catch (error) {
      // Return mock data for development
      return [
        { ActionId: 1, Action: 'READ', Description: 'View/Read access' },
        { ActionId: 2, Action: 'CREATE', Description: 'Create new items' },
        { ActionId: 3, Action: 'UPDATE', Description: 'Modify existing items' },
        { ActionId: 4, Action: 'DELETE', Description: 'Remove items' },
        { ActionId: 5, Action: 'EXECUTE', Description: 'Execute actions' },
        { ActionId: 6, Action: 'APPROVE', Description: 'Approve items' },
        { ActionId: 7, Action: 'SUBMIT', Description: 'Submit forms' },
      ];
    }
  },

  // Fetch permission matrix for a specific user/role
  getPermissionMatrix: async (userId: number): Promise<PermissionMatrix[]> => {
    try {
      const response = await api.get(`/permissions/user/${userId}`);
      return response.data;
    } catch (error) {
      // Return mock data for development based on different roles
      const mockPermissions: PermissionMatrix[] = [];
      
      if (userId === 1) { // Admin - full access
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(resourceId => {
          [1, 2, 3, 4, 5, 6, 7].forEach(actionId => {
            mockPermissions.push({
              PermissionId: mockPermissions.length + 1,
              RoleId: 1,
              ResourceId: resourceId,
              ActionId: actionId,
              IsActive: true,
            });
          });
        });
      } else if (userId === 2) { // Manager - limited access
        // Dashboard access
        [1, 2].forEach(resourceId => {
          [1, 3].forEach(actionId => {
            mockPermissions.push({
              PermissionId: mockPermissions.length + 1,
              RoleId: 2,
              ResourceId: resourceId,
              ActionId: actionId,
              IsActive: true,
            });
          });
        });
        // Demo page access but limited form access
        mockPermissions.push({
          PermissionId: mockPermissions.length + 1,
          RoleId: 2,
          ResourceId: 6,
          ActionId: 1,
          IsActive: true,
        });
        mockPermissions.push({
          PermissionId: mockPermissions.length + 1,
          RoleId: 2,
          ResourceId: 7,
          ActionId: 1,
          IsActive: true,
        });
        // Can read name field but not email
        mockPermissions.push({
          PermissionId: mockPermissions.length + 1,
          RoleId: 2,
          ResourceId: 8,
          ActionId: 1,
          IsActive: true,
        });
      } else { // Regular user - very limited access
        // Only demo page read access
        mockPermissions.push({
          PermissionId: mockPermissions.length + 1,
          RoleId: 3,
          ResourceId: 6,
          ActionId: 1,
          IsActive: true,
        });
      }
      
      return mockPermissions;
    }
  },

  // Update permission matrix
  updatePermissionMatrix: async (permissions: PermissionMatrix[]): Promise<void> => {
    try {
      await api.put('/permissions', permissions);
    } catch (error) {
      // Surface error to caller without logging
      throw error;
    }
  },

  // Simple Demo API Methods
  getSimpleDemoRoles: async (): Promise<Role[]> => {

    // Always use static JSON data for simple demos
    return simpleDemoPermissions.roles;
  },

  getSimpleDemoResources: async (): Promise<Resource[]> => {

    // Always use static JSON data for simple demos
    return simpleDemoPermissions.resources;
  },

  getSimpleDemoActions: async (): Promise<Action[]> => {

    // Always use static JSON data for simple demos
    return simpleDemoPermissions.actions;
  },

  getSimpleDemoPermissionMatrix: async (roleId: number): Promise<PermissionMatrix[]> => {

    // Always use static JSON data for simple demos
    const rolePermissions = (simpleDemoPermissions.permissionMatrix as any)[roleId.toString()];
    if (!rolePermissions) {
      return [];
    }
    return rolePermissions;
  },
};
