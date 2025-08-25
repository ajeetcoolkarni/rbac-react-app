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
} from '@mui/material';
import { RBACGuard } from '../RBAC/RBACGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentUserRole, fetchSimpleDemoData, fetchSimpleDemoPermissions } from '../../store/slices/rbacSlice';
import { rbacAPI } from '../../services/rbacAPI';
import { useRBACPermissions } from '../../hooks/useRBACHooks';

const SimpleDemo2: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUserRoleId, isLoading, roles } = useSelector((state: RootState) => state.rbac);
  const { checkEnabled } = useRBACPermissions();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted successfully!');
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
        Simple Demo 2: Without RJSF
      </Typography>
      
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        This demo uses standard Material-UI form components without RJSF.
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
            label="Manager: Form Section Only" 
            color={currentUserRoleId === 2 ? 'success' : 'default'} 
            variant={currentUserRoleId === 2 ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Editor: No Submit Button" 
            color={currentUserRoleId === 3 ? 'success' : 'default'} 
            variant={currentUserRoleId === 3 ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Viewer: Only Name Field" 
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
        resourcePath="/simple-demo-2"
        action="READ"
        disableOnDenied
        fallback={
          <Alert severity="error">
            You don't have permission to access this page.
          </Alert>
        }
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Information Form (Standard MUI)
            </Typography>
            
            <RBACGuard
              resourcePath="/simple-demo-2/form"
              action="READ"
              fallback={
                <Alert severity="warning">
                  Form section is not accessible with your current role.
                </Alert>
              }
            >
              <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 2 }}>
                {/* Name Field */}
                <RBACGuard
                  resourcePath="/simple-demo-2/form/name"
                  action="READ"
                  hideOnDenied
                  fallback={
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Name field is hidden due to insufficient permissions.
                    </Alert>
                  }
                >
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!checkEnabled('/simple-demo-2/form/name', 'UPDATE')}
                    margin="normal"
                    required
                    helperText={
                      !checkEnabled('/simple-demo-2/form/name', 'UPDATE') 
                        ? "Read-only: No edit permission" 
                        : "Enter your full name"
                    }
                  />
                </RBACGuard>

                {/* Email Field */}
                <RBACGuard
                  resourcePath="/simple-demo-2/form/email"
                  action="READ"
                  hideOnDenied
                  fallback={
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Email field is hidden due to insufficient permissions.
                    </Alert>
                  }
                >
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!checkEnabled('/simple-demo-2/form/email', 'UPDATE')}
                    margin="normal"
                    required
                    helperText={
                      !checkEnabled('/simple-demo-2/form/email', 'UPDATE') 
                        ? "Read-only: No edit permission" 
                        : "Enter your email address"
                    }
                  />
                </RBACGuard>

                {/* Phone Field */}
                <RBACGuard
                  resourcePath="/simple-demo-2/form/phone"
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
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!checkEnabled('/simple-demo-2/form/phone', 'UPDATE')}
                    margin="normal"
                    helperText={
                      !checkEnabled('/simple-demo-2/form/phone', 'UPDATE') 
                        ? "Read-only: No edit permission" 
                        : "Enter your phone number"
                    }
                  />
                </RBACGuard>

                {/* Submit Button */}
                <RBACGuard
                  resourcePath="/simple-demo-2/form/submit"
                  action="SUBMIT"
                  hideOnDenied
                >
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        alert('Form submitted successfully!');

                      }}
                      fullWidth
                    >
                      Submit Form
                    </Button>
                  </Box>
                </RBACGuard>
              </Box>
            </RBACGuard>
          </CardContent>
        </Card>
      </RBACGuard>

      {/* Current Form Data Display */}
      {formData.name || formData.email || formData.phone ? (
        <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Form Data
          </Typography>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </Paper>
      ) : null}
    </Container>
  );
};

export default SimpleDemo2;
