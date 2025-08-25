import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Person,
  WorkOutline,
} from '@mui/icons-material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { RBACGuard, RBACDebugInfo } from '../RBAC/RBACGuard';
import { useRBACPermissions, useFormFieldPermissions, useWorkflowPermissions } from '../../hooks/useRBACHooks';
import { AppDispatch } from '../../store';
import { fetchSimpleDemoPermissions } from '../../store/slices/rbacSlice';

const DemoPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    currentUserRoleId,
    currentRole,
    workflowStage,
    roles,
    changeUserRole,
    checkPermission,
    checkVisibility,
    checkEnabled,
  } = useRBACPermissions();

  const { transformFormSchema } = useFormFieldPermissions();
  const { progressWorkflow, getWorkflowActions } = useWorkflowPermissions();

  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    salary: '',
  });

  // Demo form schema
  const formSchema: JSONSchema7 = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        title: 'Full Name',
      },
      email: {
        type: 'string',
        title: 'Email Address',
        format: 'email',
      },
      department: {
        type: 'string',
        title: 'Department',
        enum: ['Engineering', 'Marketing', 'Sales', 'HR'],
      },
      salary: {
        type: 'number',
        title: 'Salary',
        minimum: 0,
      },
    },
  };

  const baseUISchema = {
    name: {
      'ui:placeholder': 'Enter your full name',
    },
    email: {
      'ui:placeholder': 'Enter your email address',
    },
    salary: {
      'ui:widget': 'updown',
    },
  };

  // Transform UI schema based on permissions
  const uiSchema = transformFormSchema(formSchema, baseUISchema, '/demo/form');

  const handleRoleChange = (roleId: number) => {
    // Update current role in state
    changeUserRole(roleId);
    // In demo mode, also fetch the permission matrix for the selected role
    if (process.env.REACT_APP_RBAC_SIMPLE_DEMO === 'true') {
      dispatch(fetchSimpleDemoPermissions(roleId));
    }
  };

  const handleWorkflowChange = (stage: string) => {
    progressWorkflow(stage);
  };

  const handleFormSubmit = (data: any) => {
    const { formData } = data;
    setFormData(formData);
    // Simulate form submission workflow progression
    if (workflowStage === 'draft') {
      progressWorkflow('submitted');
    } else if (workflowStage === 'submitted') {
      progressWorkflow('approved');
    }
  };

  const workflowStages = ['draft', 'submitted', 'approved', 'completed'];
  const availableActions = getWorkflowActions('/demo/form');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        RBAC Demo Page
      </Typography>
      
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        This page demonstrates the comprehensive RBAC system with hierarchical permissions,
        workflow stages, and dynamic UI control.
      </Typography>

      {/* Control Panel */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          Control Panel
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Current Role</InputLabel>
              <Select
                value={currentUserRoleId || ''}
                label="Current Role"
                onChange={(e) => handleRoleChange(Number(e.target.value))}
              >
                {roles.map((role) => (
                  <MenuItem key={role.RoleId} value={role.RoleId}>
                    {role.RoleName} - {role.Description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Workflow Stage</InputLabel>
              <Select
                value={workflowStage || 'draft'}
                label="Workflow Stage"
                onChange={(e) => handleWorkflowChange(e.target.value)}
              >
                {workflowStages.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={showDebugInfo}
                  onChange={(e) => setShowDebugInfo(e.target.checked)}
                />
              }
              label="Show Debug Info"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Current Role:</strong> {currentRole?.RoleName || 'None'} | 
            <strong> Workflow Stage:</strong> {workflowStage || 'draft'} |
            <strong> Available Actions:</strong> {availableActions.join(', ') || 'None'}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Page Level Permissions */}
        <Grid item xs={12}>
          <RBACGuard
            resourcePath="/demo"
            action="READ"
            fallback={
              <Alert severity="error">
                You don't have permission to view this demo page.
              </Alert>
            }
          >
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                📄 Page Level Access Control
              </Typography>
              <Typography variant="body1" paragraph>
                This entire section is controlled by page-level permissions for "/demo" with READ action.
                If you don't have READ permission for this page, you would see an error message instead.
              </Typography>
              
              {showDebugInfo && (
                <RBACDebugInfo resourcePath="/demo" action="READ" />
              )}
            </Paper>
          </RBACGuard>
        </Grid>

        {/* Section Level Permissions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔧 Section Level Control
              </Typography>
              
              <RBACGuard
                resourcePath="/demo/stats"
                action="READ"
                fallback={
                  <Alert severity="warning">
                    Statistics section is hidden due to insufficient permissions.
                  </Alert>
                }
              >
                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle1">Statistics Dashboard</Typography>
                  <Typography variant="body2">
                    This section is only visible if you have READ permission for "/demo/stats".
                  </Typography>
                  
                  <RBACGuard
                    resourcePath="/demo/stats/revenue"
                    action="READ"
                    hideOnDenied
                    fallback={<Chip label="Revenue: Hidden" color="error" size="small" />}
                  >
                    <Chip label="Revenue: $125,000" color="success" size="small" sx={{ mr: 1 }} />
                  </RBACGuard>
                  
                  <RBACGuard
                    resourcePath="/demo/stats/users"
                    action="READ"
                    hideOnDenied
                    fallback={<Chip label="Users: Hidden" color="error" size="small" />}
                  >
                    <Chip label="Users: 1,234" color="primary" size="small" />
                  </RBACGuard>
                </Box>
                
                {showDebugInfo && (
                  <RBACDebugInfo resourcePath="/demo/stats" action="READ" />
                )}
              </RBACGuard>
            </CardContent>
          </Card>
        </Grid>

        {/* Button Level Permissions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔘 Button Level Control
              </Typography>
              <Typography variant="body2" paragraph>
                These buttons demonstrate different permission behaviors:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <RBACGuard
                  resourcePath="/demo/actions/create"
                  action="CREATE"
                  hideOnDenied
                  fallback={
                    <Button disabled startIcon={<VisibilityOff />}>
                      Create Button (Hidden)
                    </Button>
                  }
                >
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Visibility />}
                  >
                    Create New Item
                  </Button>
                </RBACGuard>

                <RBACGuard
                  resourcePath="/demo/actions/delete"
                  action="DELETE"
                  disableOnDenied
                  fallback={
                    <Button disabled startIcon={<Lock />}>
                      Delete Button (No Permission)
                    </Button>
                  }
                >
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<LockOpen />}
                  >
                    Delete Item
                  </Button>
                </RBACGuard>

                <RBACGuard
                  resourcePath="/demo/actions/approve"
                  action="APPROVE"
                  hideOnDenied={false}
                  disableOnDenied={true}
                >
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<WorkOutline />}
                  >
                    Approve Request
                  </Button>
                </RBACGuard>
              </Box>
              
              {showDebugInfo && (
                <>
                  <RBACDebugInfo resourcePath="/demo/actions/create" action="CREATE" />
                  <RBACDebugInfo resourcePath="/demo/actions/delete" action="DELETE" />
                  <RBACDebugInfo resourcePath="/demo/actions/approve" action="APPROVE" />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Form with Field-Level Permissions */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              📝 Form with Field-Level Permissions & Workflow Integration
            </Typography>
            
            <RBACGuard
              resourcePath="/demo/form"
              action="READ"
              fallback={
                <Alert severity="error">
                  You don't have permission to view this form.
                </Alert>
              }
            >
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Workflow Stage:</strong> {workflowStage || 'draft'}<br />
                Form fields are dynamically controlled based on your role permissions and current workflow stage.
                Different fields may be hidden, disabled, or fully accessible based on your permissions.
              </Alert>

              <Form
                schema={formSchema}
                uiSchema={uiSchema}
                formData={formData}
                validator={validator}
                onSubmit={handleFormSubmit}
              >
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <RBACGuard
                    resourcePath="/demo/form/submit"
                    action="SUBMIT"
                    disableOnDenied
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={workflowStage === 'approved' || workflowStage === 'completed'}
                    >
                      {workflowStage === 'draft' ? 'Submit Form' : 'Update Form'}
                    </Button>
                  </RBACGuard>

                  <RBACGuard
                    resourcePath="/demo/form/reset"
                    action="UPDATE"
                    disableOnDenied
                  >
                    <Button
                      variant="outlined"
                      onClick={() => setFormData({ name: '', email: '', department: '', salary: '' })}
                      disabled={workflowStage === 'approved' || workflowStage === 'completed'}
                    >
                      Reset Form
                    </Button>
                  </RBACGuard>
                </Box>
              </Form>

              {showDebugInfo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Field-Level Debug Info:</Typography>
                  <RBACDebugInfo resourcePath="/demo/form/name" action="READ" />
                  <RBACDebugInfo resourcePath="/demo/form/email" action="READ" />
                  <RBACDebugInfo resourcePath="/demo/form/department" action="READ" />
                  <RBACDebugInfo resourcePath="/demo/form/salary" action="READ" />
                  <RBACDebugInfo resourcePath="/demo/form/submit" action="SUBMIT" />
                </>
              )}
            </RBACGuard>
          </Paper>
        </Grid>

        {/* Hierarchical Override Example */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🏗️ Hierarchical Permission Override Example
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              This demonstrates how specific permissions can override parent permissions.
              Even if the entire section is disabled, specific fields can still be enabled through override permissions.
            </Alert>

            <RBACGuard
              resourcePath="/demo/restricted-section"
              action="READ"
              disableOnDenied
              fallback={
                <Alert severity="warning">
                  Restricted section is completely hidden.
                </Alert>
              }
            >
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Restricted Section (May be disabled)
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <RBACGuard
                      resourcePath="/demo/restricted-section/field1"
                      action="READ"
                      hideOnDenied
                      fallback={<Typography color="error">Field 1: Hidden</Typography>}
                    >
                      <Typography color="success.main">
                        ✅ Field 1: Visible (may inherit or override parent permission)
                      </Typography>
                    </RBACGuard>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <RBACGuard
                      resourcePath="/demo/restricted-section/field2"
                      action="READ"
                      hideOnDenied
                      fallback={<Typography color="error">Field 2: Hidden</Typography>}
                    >
                      <Typography color="success.main">
                        ✅ Field 2: Visible with override permission
                      </Typography>
                    </RBACGuard>
                  </Grid>
                </Grid>
                
                {showDebugInfo && (
                  <>
                    <RBACDebugInfo resourcePath="/demo/restricted-section" action="READ" />
                    <RBACDebugInfo resourcePath="/demo/restricted-section/field1" action="READ" />
                    <RBACDebugInfo resourcePath="/demo/restricted-section/field2" action="READ" />
                  </>
                )}
              </Box>
            </RBACGuard>
          </Paper>
        </Grid>
      </Grid>

      {/* Summary */}
      <Paper elevation={3} sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h5" gutterBottom>
          📋 RBAC Features Demonstrated
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>✨ Core Features:</Typography>
            <ul>
              <li>Page-level access control</li>
              <li>Section-level visibility control</li>
              <li>Field-level permissions</li>
              <li>Button-level action control</li>
              <li>Hierarchical permission inheritance</li>
              <li>Permission override support</li>
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>🔄 Advanced Features:</Typography>
            <ul>
              <li>Workflow stage integration</li>
              <li>Dynamic role switching</li>
              <li>Real-time permission updates</li>
              <li>RJSF form integration</li>
              <li>Development debug tools</li>
              <li>Production-ready architecture</li>
            </ul>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DemoPage;
