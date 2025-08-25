# RBAC Integration Guide (React + TypeScript)

This guide explains how to reuse the RBAC system from this repository in another React app. The RBAC layer is framework-agnostic within React and designed to be plug-and-play.

## Overview

- RBAC State: Redux slice `src/store/slices/rbacSlice.ts`
- Provider: `src/components/RBAC/RBACProvider.tsx`
- Guard component: `src/components/RBAC/RBACGuard.tsx`
- Hooks: `src/hooks/useRBACHooks.ts`
- Core utils: `src/utils/rbacUtils.ts`
- Types: `src/types/rbac.types.ts`
- Demo data (optional): `src/data/simpleDemoPermissions.json`

## Install

- Ensure your app uses Redux Toolkit and React Redux.
- Dependencies used by this RBAC system:
  - `@reduxjs/toolkit`, `react-redux`
  - `axios`
  - Optionally `@mui/material` if you reuse the sample UI (not required for core RBAC)

Note:
- Copy the provided `.env.sample` to `.env` and adjust values to your environment.

## Data Contracts

Your backend should expose 3 lists and a permission matrix compatible with `src/types/rbac.types.ts`:
- `Role { RoleId, RoleName, Description? }`
- `Resource { ResourceId, ResourcePath, ResourceName, ResourceType, HierarchyLevel, ParentResourceId? }`
- `Action { ActionId, Action, Description? }`
- `PermissionMatrix { PermissionId, RoleId, ResourceId, ActionId, IsActive, ValidFrom?, ValidTo?, IsOverride?, Metadata? }`

Notes:
- `ResourcePath` is a unique path like `/page/section/field` used for hierarchical checks.
- `IsOverride` allows specific allow/deny precedence.
- `Metadata` may include workflow stage restrictions, e.g. `{ "workflowRestrictions": { "Draft": { "restrictedActions": ["SUBMIT"] } } }`.

## Core Concepts

- `hasPermission(userPermissions, { resourcePath, action }, workflowStage?)` returns boolean.
- Exact match > override > parent hierarchy resolution.
- Workflow stage restrictions are respected when provided in permission metadata.

## Wiring in Your App

1) Add the RBAC slice to your Redux store:
- Import the reducer from `src/store/slices/rbacSlice` and include it under `rbac` key in your root reducer.

2) Provide RBAC on app root:
```tsx
import { RBACProvider } from '.../components/RBAC/RBACProvider';
import RBACBootstrap from '.../components/RBAC/RBACBootstrap';

function AppRoot() {
  return (
    <Provider store={store}>
      <RBACProvider>
        <RBACBootstrap />
        {/* your routes */}
      </RBACProvider>
    </Provider>
  );
}
```

3) Configure environment variables (recommended):
- `REACT_APP_RBAC_SIMPLE_DEMO`: "true" to use static demo data from `simpleDemoPermissions.json`. Omit or set "false" in production to use real APIs.
- `REACT_APP_RBAC_DEFAULT_ROLE_ID`: optional numeric default role id for initial permission load.

4) Implement service API (if not using demo mode):
- Update `src/services/rbacAPI.ts` to point to your backend endpoints for roles/resources/actions/permissions.
- The module already reads `REACT_APP_API_BASE_URL`.

## Initialization (External Bootstrap)

Initialization is handled outside of the provider by `RBACBootstrap` (Option B). It dispatches one of the thunks based on env:

- `initializeRBACWithDemo(roleId?)` when `REACT_APP_RBAC_SIMPLE_DEMO === 'true'`
- `initializeRBACWithApi(userId?)` otherwise

The core `RBACProvider` does not accept data-source props and contains no PoC/demo branching. This keeps the provider reusable and environment-agnostic.

## Guarding UI

- Wrap blocks/components with `RBACGuard`:
```tsx
<RBACGuard resourcePath="/orders/create" action="READ" fallback={<div>Access denied</div>}>
  <OrdersCreatePage />
</RBACGuard>
```

- Hide or disable on denied:
```tsx
<RBACGuard resourcePath="/orders/create/submit" action="SUBMIT" hideOnDenied>
  <Button type="submit">Submit</Button>
</RBACGuard>
```

### Route protection with React Router

Protect routes and redirect on denied access:

```tsx
import { Navigate } from 'react-router-dom';
import { RBACGuard } from '.../components/RBAC/RBACGuard';

function ProtectedRoute() {
  return (
    <RBACGuard resourcePath="/orders" action="READ" fallback={<Navigate to="/403" replace />}> 
      <OrdersPage />
    </RBACGuard>
  );
}

// In your router
<Routes>
  <Route path="/orders" element={<ProtectedRoute />} />
  <Route path="/403" element={<ForbiddenPage />} />
</Routes>
```

## Hooks

- `useRBACPermissions()` returns:
  - `checkPermission(resourcePath, action, workflowStage?)`
  - `checkVisibility(resourcePath, workflowStage?)`
  - `checkEnabled(resourcePath, action, workflowStage?)`
  - `getResourceActions(resourcePath)`
  - `changeUserRole(roleId)`, `changeWorkflowStage(stage)`
  - `currentUserRoleId`, `currentRole`, `workflowStage`, `userPermissions`

- Form helpers (for RJSF or any forms): `useFormFieldPermissions()`
  - `isFieldReadable(fieldPath)`
  - `isFieldEditable(fieldPath)`
  - `transformFormSchema(schema, uiSchema, basePath)` produces a permission-aware UI schema

## Workflow Support

- `useWorkflowPermissions()` helps query allowed actions per workflow stage and move between stages.
- `hasPermission` accepts an explicit `workflowStage` or uses the one from Redux state.

### Workflow Restrictions Metadata

You can attach workflow-aware rules to a permission via the `PermissionMatrix.Metadata` JSON (stored as a string). The slice parses it in `transformToUserPermissions()` and `hasPermission()` enforces it.

- Path: `metadata.workflowRestrictions[stage]`
- Keys per stage:
  - `allowedActions: string[]` -> when present, only actions in this list are allowed for that stage.
  - `restrictedActions: string[]` -> actions explicitly denied for that stage.
- Precedence: If both are provided for a stage, `restrictedActions` takes priority for listed actions; otherwise `allowedActions` gates access. Then normal exact/override/hierarchy rules apply.

Example snippet attached to a permission row (as string in `PermissionMatrix.Metadata`):

```json
{
  "workflowRestrictions": {
    "draft": { "allowedActions": ["READ", "UPDATE", "SUBMIT"] },
    "submitted": { "allowedActions": ["READ", "UPDATE", "APPROVE"] },
    "approved": { "allowedActions": ["READ"] },
    "completed": { "allowedActions": ["READ"] }
  }
}
```

How it’s applied in code:

- In `rbacSlice.transformToUserPermissions()`: metadata is parsed from the first valid permission row for a resource and attached to the `UserPermission` for that `resourcePath`.
- In `rbacUtils.hasPermission()`:
  - For the current `workflowStage`, read `metadata.workflowRestrictions[stage]`.
  - Deny if `restrictedActions` includes `action`.
  - If `allowedActions` exists and does not include `action`, deny.
  - Otherwise, fall back to standard checks (exact/override/parent).

## Resource Hierarchy

- Store `resources` as a flat list in Redux. Hierarchy is derived by `ParentResourceId` only where needed for navigation trees.
- `transformToUserPermissions` maps permissions using `ResourceId -> ResourcePath` from the flat list.

## Production Readiness

- No debug logs in production. Dev-only debug is gated by `process.env.NODE_ENV === 'development'`.
- No hardcoded demo user/role. Configure via env or your app’s auth.
- Axios interceptors support auth token injection.
- Errors surface via Redux state; handle with your app’s UI.

## Migrating From Demo to Real Backend

1) Set `REACT_APP_RBAC_SIMPLE_DEMO=false` (or remove it).
2) Ensure `REACT_APP_API_BASE_URL` points to your API.
3) Implement your backend endpoints to return the contracts above.
4) Remove demo-specific UI or data if not needed.

## Testing Checklist

- Page access: `READ` on main page resources.
- Section/field/button access cascades from parent when explicit permission not present.
- Overrides deny/allow as expected.
- Workflow stage restrictions enforced.
- Different roles see expected UI states (hidden vs disabled) via `hideOnDenied`/`disableOnDenied`.

## Example Resource Paths

- `/orders` (PAGE)
- `/orders/form` (SECTION)
- `/orders/form/amount` (FIELD)
- `/orders/form/submit` (BUTTON)

## FAQ

- Q: Do I need MUI? A: No, only for sample UI. Core RBAC is independent.
- Q: Can I use with React Router? A: Yes, guard routes with `RBACGuard` or redirect on denied.
- Q: How do I map my existing roles/actions? A: Align your DB tables to the types and ensure `ResourcePath` uniquely identifies resources.
