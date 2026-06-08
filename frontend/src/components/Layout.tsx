import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LayoutDashboard,
  Users,
  Upload,
  History,
  ShieldCheck,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

const drawerWidth = 260;

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { text: 'Patient Profiles', icon: <Users size={20} />, path: '/patients' },
    { text: 'Upload Reports', icon: <Upload size={20} />, path: '/upload' },
    { text: 'Analysis History', icon: <History size={20} />, path: '/history' },
  ];

  if (user && user.is_admin) {
    menuItems.push({ text: 'Admin Panel', icon: <ShieldCheck size={20} />, path: '/admin' });
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1321' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 800,
            background: 'linear-gradient(45deg, #0ea5e9 30%, #10b981 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: -0.5,
          }}
        >
          AI Health Assistant
        </Typography>
        <IconButton sx={{ display: { md: 'none' } }} onClick={handleDrawerToggle}>
          <ChevronLeft />
        </IconButton>
      </Toolbar>
      <Divider sx={{ opacity: 0.1 }} />
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                  color: isSelected ? '#0ea5e9' : '#9ca3af',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: '#f3f4f6',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: isSelected ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ opacity: 0.1 }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#0ea5e9', fontWeight: 600 }}>
          {user?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, color: '#f3f4f6' }}>
            {user?.full_name || 'User Profile'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block', color: '#6b7280' }}>
            {user?.email}
          </Typography>
        </Box>
        <Tooltip title="Log Out">
          <IconButton size="small" onClick={logout} sx={{ color: '#9ca3af', '&:hover': { color: '#f43f5e' } }}>
            <LogOut size={18} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon size={24} />
          </IconButton>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.15rem' }}>
              {location.pathname === '/dashboard' ? 'Welcome Back!' : 
               location.pathname.startsWith('/patients') ? 'Patients Reports Profile' :
               location.pathname.startsWith('/upload') ? 'Analyze New Reports' :
               location.pathname.startsWith('/history') ? 'Reports Analysis Archives' :
               location.pathname.startsWith('/admin') ? 'Administrator Control Dashboard' : 'Medical Insights Hub'}
            </Typography>
          </Box>

          <Box>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(14, 165, 233, 0.1)',
                  color: '#0ea5e9',
                  border: '1.5px solid rgba(14, 165, 233, 0.3)',
                  width: 36,
                  height: 36,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {user?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 2,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  minWidth: 150,
                },
              }}
            >
              <MenuItem onClick={handleLogoutClick} sx={{ color: '#f43f5e', py: 1.2 }}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <LogOut size={16} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Drawer Component */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile View Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop View Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255,255,255,0.05)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 10, md: 12 }, // Toolbar offsets
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
export default Layout;
