import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { initializeRBACWithApi, initializeRBACWithDemo } from '../../store/slices/rbacSlice';

/**
 * External bootstrap component that initializes RBAC once on mount.
 * Decides data source based on environment variables.
 * - REACT_APP_RBAC_SIMPLE_DEMO === 'true' -> demo data
 * - otherwise -> API
 * - Optional: REACT_APP_RBAC_DEFAULT_ROLE_ID (number)
 */
export default function RBACBootstrap() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const useDemo = process.env.REACT_APP_RBAC_SIMPLE_DEMO === 'true';
    const defaultRoleEnv = process.env.REACT_APP_RBAC_DEFAULT_ROLE_ID;
    const defaultRoleId = defaultRoleEnv ? Number(defaultRoleEnv) : undefined;

    if (useDemo) {
      dispatch(initializeRBACWithDemo(defaultRoleId));
    } else {
      dispatch(initializeRBACWithApi(defaultRoleId));
    }
  }, [dispatch]);

  return null;
}
