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
  Button,
} from '@mui/material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { RBACGuard } from '../RBAC/RBACGuard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setCurrentUserRole, fetchSimpleDemoData, fetchSimpleDemoPermissions } from '../../store/slices/rbacSlice';
import { useFormFieldPermissions } from '../../hooks/useRBACHooks';

const SimpleDemo1: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUserRoleId, isLoading, roles } = useSelector((state: RootState) => state.rbac);
  const { transformFormSchema } = useFormFieldPermissions();
  
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

  // RJSF Form Schema
  const formSchema: JSONSchema7 = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        title: 'Full Name',
        description: 'Enter your full name',
      },
      email: {
        type: 'string',
        title: 'Email Address',
        format: 'email',
        description: 'Enter your email address',
      },
      phone: {
        type: 'string',
        title: 'Phone Number',
        description: 'Enter your phone number',
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
    phone: {
      'ui:placeholder': 'Enter your phone number',
    },
  };

  // Transform UI schema based on permissions
  const uiSchema = transformFormSchema(formSchema, baseUISchema, '/simple-demo-1/form');

  const handleFormSubmit = (data: any) => {
    const { formData } = data;
    setFormData(formData);
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
        Simple Demo 1: All RJSF
      </Typography>
      
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        This demo uses React JSON Schema Form (RJSF) exclusively for all form controls.
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
        resourcePath="/simple-demo-1"
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
              User Information Form (RJSF)
            </Typography>
            
            <RBACGuard
              resourcePath="/simple-demo-1/form"
              action="READ"
              fallback={
                <Alert severity="warning">
                  Form section is not accessible with your current role.
                </Alert>
              }
            >
              <Form
                schema={formSchema}
                uiSchema={uiSchema}
                formData={formData}
                validator={validator}
                onSubmit={handleFormSubmit}
                children={<></>}
              />
              
              <RBACGuard
                resourcePath="/simple-demo-1/form/submit"
                action="SUBMIT"
                hideOnDenied
              >
                <Box sx={{ mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      // Trigger form submission
                      const formElement = document.querySelector('form');
                      if (formElement) {
                        const formData = new FormData(formElement);
                        const data = Object.fromEntries(formData.entries());
                        handleFormSubmit({ formData: data });
                      }
                    }}
                  >
                    Submit Form
                  </Button>
                </Box>
              </RBACGuard>
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

export default SimpleDemo1;
