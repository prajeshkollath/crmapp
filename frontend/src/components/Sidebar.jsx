import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
} from 'lucide-react';

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { text: 'Contacts', icon: <Users size={20} />, path: '/contacts' },
    { text: 'Audit Logs', icon: <FileText size={20} />, path: '/audit' },
  ];

  return (
    <Box
      sx={{
        width: 256,
        bgcolor: '#FAFAFA',
        borderRight: '1px solid #E4E4E7',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#002FA7' }}>
          CRM Platform
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1,
                  bgcolor: isActive ? '#002FA7' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#0A0A0A',
                  '&:hover': {
                    bgcolor: isActive ? '#002FA7' : '#F4F4F5',
                  },
                }}
                data-testid={`sidebar-${item.text.toLowerCase().replace(' ', '-')}`}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={user?.picture}
            alt={user?.name}
            sx={{ width: 40, height: 40 }}
          >
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {user?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            >
              {user?.email}
            </Typography>
          </Box>
          <IconButton onClick={onLogout} size="small" data-testid="logout-btn">
            <LogOut size={18} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
