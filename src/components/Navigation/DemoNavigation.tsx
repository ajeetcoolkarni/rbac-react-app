import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Container,
} from '@mui/material';
import DemoPage from '../Demo/DemoPage';
import SimpleDemo1 from '../Demo/SimpleDemo1';
import SimpleDemo2 from '../Demo/SimpleDemo2';
import SimpleDemo3 from '../Demo/SimpleDemo3';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`demo-tabpanel-${index}`}
      aria-labelledby={`demo-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `demo-tab-${index}`,
    'aria-controls': `demo-tabpanel-${index}`,
  };
}

const DemoNavigation: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RBAC Demo System
          </Typography>
        </Toolbar>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="demo navigation tabs"
          sx={{ bgcolor: 'primary.dark' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Complex Demo" {...a11yProps(0)} />
          <Tab label="Simple Demo 1 (All RJSF)" {...a11yProps(1)} />
          <Tab label="Simple Demo 2 (No RJSF)" {...a11yProps(2)} />
          <Tab label="Simple Demo 3 (Partial RJSF)" {...a11yProps(3)} />
        </Tabs>
      </AppBar>

      <TabPanel value={value} index={0}>
        <DemoPage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <SimpleDemo1 />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <SimpleDemo2 />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <SimpleDemo3 />
      </TabPanel>
    </Box>
  );
};

export default DemoNavigation;
