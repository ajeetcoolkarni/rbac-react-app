import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Card,
  CardContent,
  Chip,
  TextField,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { RBACGuard } from '../RBAC/RBACGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentUserRole, fetchSimpleDemoData, fetchSimpleDemoPermissions } from '../../store/slices/rbacSlice';
import { useFormFieldPermissions, useRBACPermissions } from '../../hooks/useRBACHooks';

const SimpleDemo3: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUserRoleId, isLoading, roles } = useSelector((state: RootState) => state.rbac);
  const { transformFormSchema } = useFormFieldPermissions();
  const { checkEnabled } = useRBACPermissions();
  
  const [rjsfFormData, setRjsfFormData] = useState({
    name: '',
    email: '',
  });
  const [manualFormData, setManualFormData] = useState({
    phone: '',
    address: '',
  });

  // Initialize with first role if data is available but no role selected
  useEffect(() => {
    if (!currentUserRoleId && roles.length > 0) {
      handleRoleChange(roles[0].RoleId);
    }
  }, [roles, currentUserRoleId]);

  const handleRoleChange = async (roleId: number) => {
    dispatch(setCurrentUserRole(roleId));
    // Load permissions for the selected role
    await dispatch(fetchSimpleDemoPermissions(roleId));
  };

  // RJSF Form Schema (for name and email)
  const rjsfSchema: JSONSchema7 = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        title: 'Full Name',
        description: 'Enter your full name (RJSF)',
      },
      email: {
        type: 'string',
        title: 'Email Address',
        format: 'email',
        description: 'Enter your email address (RJSF)',
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
  };

  // Transform UI schema based on permissions
  const uiSchema = transformFormSchema(rjsfSchema, baseUISchema, '/simple-demo-3/rjsf-section');

  const handleRjsfSubmit = (data: any) => {
    const { formData } = data;
    setRjsfFormData(formData);
  };

  const handleManualInputChange = (field: string, value: string) => {
    setManualFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedData = { ...rjsfFormData, ...manualFormData };
    alert(`Combined form submitted successfully!\n${JSON.stringify(combinedData, null, 2)}`);
  };

  const currentRole = roles.find(role => role.RoleId === currentUserRoleId);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Simple Demo 3: Partial RJSF
      </Typography>
      
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        This demo combines RJSF for some fields and standard MUI components for others.
      </Typography>

      {/* Role Selector */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Role Selection
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Role</InputLabel>
          <Select
            value={currentUserRoleId || ''}
            label="Select Role"
            onChange={(e) => handleRoleChange(Number(e.target.value))}
          >
            {roles.map((role) => (
              <MenuItem key={role.RoleId} value={role.RoleId}>
                {role.RoleName} - {role.Description}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {currentRole && (
          <Alert severity="info">
            <strong>Current Role:</strong> {currentRole.RoleName} - {currentRole.Description}
          </Alert>
        )}
      </Paper>

      {/* Permission Scenarios */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Permission Scenarios
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label="Admin: Full Access" 
            color={currentUserRoleId === 1 ? 'success' : 'default'} 
            variant={currentUserRoleId === 1 ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Manager: RJSF Section Only" 
            color={currentUserRoleId === 2 ? 'success' : 'default'} 
            variant={currentUserRoleId === 2 ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Editor: No Submit Button" 
            color={currentUserRoleId === 3 ? 'success' : 'default'} 
            variant={currentUserRoleId === 3 ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Viewer: Only Name Field (RJSF)" 
            color={currentUserRoleId === 4 ? 'success' : 'default'} 
            variant={currentUserRoleId === 4 ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Restricted: Page Disabled" 
            color={currentUserRoleId === 5 ? 'error' : 'default'} 
            variant={currentUserRoleId === 5 ? 'filled' : 'outlined'}
          />
        </Box>
      </Paper>

      {/* Main Form */}
      <RBACGuard
        resourcePath="/simple-demo-3"
        action="READ"
        disableOnDenied
        fallback={
          <Alert severity="error">
            You don't have permission to access this page.
          </Alert>
        }
      >
        <Grid container spacing={3}>
          {/* RJSF Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  RJSF Section
                </Typography>
                
                <RBACGuard
                  resourcePath="/simple-demo-3/rjsf-section"
                  action="READ"
                  fallback={
                    <Alert severity="warning">
                      RJSF section is not accessible with your current role.
                    </Alert>
                  }
                >
                  <Form
                    schema={rjsfSchema}
                    uiSchema={uiSchema}
                    formData={rjsfFormData}
                    validator={validator}
                    onSubmit={handleRjsfSubmit}
                    onChange={(data) => setRjsfFormData(data.formData)}
                  >
                    <Box sx={{ mt: 1 }}>
                      {/* Hide the default submit button since we have a custom one */}
                      <style>{`
                        .rjsf button[type="submit"] { display: none; }
                      `}</style>
                    </Box>
                  </Form>
                </RBACGuard>
              </CardContent>
            </Card>
          </Grid>

          {/* Manual Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  Manual MUI Section
                </Typography>
                
                <RBACGuard
                  resourcePath="/simple-demo-3/manual-section"
                  action="READ"
                  fallback={
                    <Alert severity="warning">
                      Manual section is not accessible with your current role.
                    </Alert>
                  }
                >
                  <Box sx={{ mt: 2 }}>
                    {/* Phone Field */}
                    <RBACGuard
                      resourcePath="/simple-demo-3/manual-section/phone"
                      action="READ"
                      hideOnDenied
                      fallback={
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Phone field is hidden due to insufficient permissions.
                        </Alert>
                      }
                    >
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={manualFormData.phone}
                        onChange={(e) => handleManualInputChange('phone', e.target.value)}
                        disabled={!checkEnabled('/simple-demo-3/manual-section/phone', 'UPDATE')}
                        margin="normal"
                        helperText={
                          !checkEnabled('/simple-demo-3/manual-section/phone', 'UPDATE') 
                            ? "Read-only: No edit permission" 
                            : "Enter your phone number (Manual)"
                        }
                      />
                    </RBACGuard>

                    {/* Address Field */}
                    <RBACGuard
                      resourcePath="/simple-demo-3/manual-section/address"
                      action="READ"
                      hideOnDenied
                      fallback={
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Address field is hidden due to insufficient permissions.
                        </Alert>
                      }
                    >
                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={3}
                        value={manualFormData.address}
                        onChange={(e) => handleManualInputChange('address', e.target.value)}
                        disabled={!checkEnabled('/simple-demo-3/manual-section/address', 'UPDATE')}
                        margin="normal"
                        helperText={
                          !checkEnabled('/simple-demo-3/manual-section/address', 'UPDATE') 
                            ? "Read-only: No edit permission" 
                            : "Enter your address (Manual)"
                        }
                      />
                    </RBACGuard>
                  </Box>
                </RBACGuard>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Combined Submit Section */}
        <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Combined Form Submission
          </Typography>
          
          <RBACGuard
            resourcePath="/simple-demo-3/submit"
            action="SUBMIT"
            hideOnDenied
            fallback={
              <Alert severity="warning">
                Submit button is hidden - you don't have submit permissions.
              </Alert>
            }
          >
            <Box component="form" onSubmit={handleFinalSubmit}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Submit Combined Form
              </Button>
            </Box>
          </RBACGuard>
        </Paper>
      </RBACGuard>

      {/* Current Form Data Display */}
      {(rjsfFormData.name || rjsfFormData.email || manualFormData.phone || manualFormData.address) ? (
        <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Form Data
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary">
                RJSF Data:
              </Typography>
              <pre>{JSON.stringify(rjsfFormData, null, 2)}</pre>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="secondary">
                Manual Data:
              </Typography>
              <pre>{JSON.stringify(manualFormData, null, 2)}</pre>
            </Grid>
          </Grid>
        </Paper>
      ) : null}
    </Container>
  );
};

export default SimpleDemo3;
