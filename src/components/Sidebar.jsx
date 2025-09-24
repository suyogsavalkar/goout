"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Users, 
  User, 
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export default function Sidebar({ 
  notifications = [], 
  onCreateEvent = null,
  className = "" 
}) {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const navigationItems = [
    {
      name: 'Plans',
      href: '/plans',
      icon: Calendar,
      description: 'Discover and join events',
      badge: null
    },
    {
      name: 'People',
      href: '/people',
      icon: Users,
      description: 'Connect with other students',
      badge: null
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage your profile',
      badge: null
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const NavItem = ({ item, isActive }) => (
    <Link href={item.href}>
      <div className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
        isActive 
          ? "bg-blue-50 text-blue-700 border border-blue-200" 
          : "text-gray-700 hover:bg-gray-100",
        isCollapsed && "justify-center px-2"
      )}>
        <item.icon className={cn("h-5 w-5", isActive && "text-blue-600")} />
        {!isCollapsed && (
          <>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </div>
    </Link>
  );

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">GoOut</h1>
              <p className="text-xs text-gray-500">U-M Social Events</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className={cn(
            "flex items-center space-x-3",
            isCollapsed && "justify-center"
          )}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.profile_pic_url || user.photoURL} />
              <AvatarFallback>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 
                 user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {profile?.name || user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.username ? `@${profile.username}` : user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={onCreateEvent}
          className={cn(
            "w-full",
            isCollapsed && "px-2"
          )}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Create Event</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <NavItem 
              key={item.name} 
              item={item} 
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* Notifications */}
      {unreadNotifications > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className={cn(
            "flex items-center space-x-3 px-3 py-2 bg-blue-50 rounded-lg",
            isCollapsed && "justify-center px-2"
          )}>
            <div className="relative">
              <Bell className="h-5 w-5 text-blue-600" />
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadNotifications}
              </Badge>
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {unreadNotifications} new notification{unreadNotifications !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-700">
                  Click to view
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCollapsed && (
          <>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {/* Handle settings */}}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </>
        )}
        
        {isCollapsed && (
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full p-2"
              onClick={() => {/* Handle settings */}}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}