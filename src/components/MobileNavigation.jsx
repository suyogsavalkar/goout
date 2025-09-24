"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Calendar, 
  Users, 
  User, 
  Menu,
  Bell,
  Plus,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export default function MobileNavigation({ 
  notifications = [], 
  onCreateEvent = null 
}) {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const navigationItems = [
    {
      name: 'Plans',
      href: '/plans',
      icon: Calendar,
      description: 'Discover and join events'
    },
    {
      name: 'People',
      href: '/people',
      icon: Users,
      description: 'Connect with other students'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage your profile'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const NavItem = ({ item, isActive }) => (
    <Link href={item.href} onClick={handleNavClick}>
      <div className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
        isActive 
          ? "bg-blue-50 text-blue-700 border border-blue-200" 
          : "text-gray-700 hover:bg-gray-100"
      )}>
        <item.icon className={cn("h-5 w-5", isActive && "text-blue-600")} />
        <div className="flex-1">
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-gray-500">{item.description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h1 className="text-xl font-bold text-gray-900">GoOut</h1>
                  <p className="text-sm text-gray-500">U-M Social Events</p>
                </div>

                {/* User Profile Section */}
                {user && (
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile?.profile_pic_url || user.photoURL} />
                        <AvatarFallback>
                          {profile?.name ? profile.name.charAt(0).toUpperCase() : 
                           user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {profile?.name || user.displayName || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {profile?.username ? `@${profile.username}` : user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="p-6 border-b border-gray-200">
                  <Button 
                    onClick={() => {
                      onCreateEvent && onCreateEvent();
                      setIsOpen(false);
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-6 space-y-2">
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
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-blue-50 rounded-lg">
                      <div className="relative">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {unreadNotifications}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {unreadNotifications} new notification{unreadNotifications !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-blue-700">
                          Tap to view
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      // Handle settings
                    }}
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
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-semibold text-gray-900">GoOut</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notifications Bell */}
          {unreadNotifications > 0 && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
              >
                {unreadNotifications}
              </Badge>
            </Button>
          )}

          {/* Create Event Button */}
          <Button 
            size="sm"
            onClick={onCreateEvent}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}>
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}