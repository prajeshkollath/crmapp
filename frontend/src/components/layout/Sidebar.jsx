import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Settings,
  User,
} from 'lucide-react';

const navItems = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { text: 'Contacts', icon: Users, path: '/contacts' },
  { text: 'Audit Logs', icon: FileText, path: '/audit' },
];

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            'flex h-14 items-center border-b border-border px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Building2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold tracking-tight">CRM Pro</span>
              </div>
            )}
            {collapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              const button = (
                <Button
                  key={item.text}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                    collapsed && 'justify-center px-2'
                  )}
                  onClick={() => navigate(item.path)}
                  data-testid={`sidebar-${item.text.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.text}</span>}
                </Button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.text}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.text}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return button;
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* User Profile */}
          <div className={cn('p-3', collapsed && 'flex justify-center')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {collapsed ? (
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.picture} alt={user?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user?.name?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full justify-start h-auto p-2 hover:bg-accent">
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.picture} alt={user?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.name?.charAt(0) || user?.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                  </Button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account')}>
                  <User className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
