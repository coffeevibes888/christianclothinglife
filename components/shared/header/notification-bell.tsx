'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface NotificationData {
  newOrders: number;
  openMessages: number;
  unreadMessages: number;
  unreadEmailThreads: number;
  pendingFriendRequests: number;
}

type DismissedNotifications = {
  newOrders: boolean;
  openMessages: boolean;
  unreadMessages: boolean;
  unreadEmailThreads: boolean;
  pendingFriendRequests: boolean;
};

export default function NotificationBell({ isAdmin }: { isAdmin: boolean }) {
  const [notifications, setNotifications] = useState<NotificationData>({
    newOrders: 0,
    openMessages: 0,
    unreadMessages: 0,
    unreadEmailThreads: 0,
    pendingFriendRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState<DismissedNotifications>({
    newOrders: false,
    openMessages: false,
    unreadMessages: false,
    unreadEmailThreads: false,
    pendingFriendRequests: false,
  });

  const STORAGE_KEY = 'notificationBell:dismissed';

  const persistDismissed = (next: DismissedNotifications) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const dismissNotification = (key: keyof DismissedNotifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: 0,
    }));
    setDismissed((prev) => {
      const next = { ...prev, [key]: true };
      persistDismissed(next);
      return next;
    });
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/summary');
      if (response.ok) {
        const data: NotificationData = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<DismissedNotifications>;
          setDismissed((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch {
        // ignore storage errors
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const effectiveNotifications: NotificationData = {
    newOrders: dismissed.newOrders ? 0 : notifications.newOrders,
    openMessages: dismissed.openMessages ? 0 : notifications.openMessages,
    unreadMessages: dismissed.unreadMessages ? 0 : notifications.unreadMessages,
    unreadEmailThreads: dismissed.unreadEmailThreads
      ? 0
      : notifications.unreadEmailThreads,
    pendingFriendRequests: dismissed.pendingFriendRequests
      ? 0
      : notifications.pendingFriendRequests,
  };

  const totalCount = isAdmin
    ? effectiveNotifications.newOrders + effectiveNotifications.openMessages
    :
        effectiveNotifications.unreadMessages +
        effectiveNotifications.pendingFriendRequests;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={totalCount > 0 ? `You have ${totalCount} notifications` : 'Open notifications'}
          className='relative'
        >
          <div className='relative'>
            <Bell className='h-5 w-5' />
            {totalCount > 0 && (
              <Badge
                variant='destructive'
                className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full'
              >
                {totalCount > 9 ? '9+' : totalCount}
              </Badge>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem>Loading...</DropdownMenuItem>
        ) : totalCount === 0 ? (
          <DropdownMenuItem>No new notifications</DropdownMenuItem>
        ) : (
          <>
            {isAdmin && effectiveNotifications.newOrders > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href='/admin/orders'
                  className='cursor-pointer'
                  onClick={() => dismissNotification('newOrders')}
                >
                  <div className='flex items-center justify-between w-full'>
                    <span>New orders</span>
                    <Badge variant='secondary'>
                      {effectiveNotifications.newOrders}
                    </Badge>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
            {isAdmin && effectiveNotifications.openMessages > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href='/admin/messages'
                  className='cursor-pointer'
                  onClick={() => dismissNotification('openMessages')}
                >
                  <div className='flex items-center justify-between w-full'>
                    <span>Open messages</span>
                    <Badge variant='secondary'>
                      {effectiveNotifications.openMessages}
                    </Badge>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
            {!isAdmin && effectiveNotifications.unreadMessages > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href='/user/profile/inbox'
                  className='cursor-pointer'
                  onClick={() => dismissNotification('unreadMessages')}
                >
                  <div className='flex items-center justify-between w-full'>
                    <span>Unread messages</span>
                    <Badge variant='secondary'>
                      {effectiveNotifications.unreadMessages}
                    </Badge>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
            {!isAdmin && effectiveNotifications.pendingFriendRequests > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href='/user/profile/inbox'
                  className='cursor-pointer'
                  onClick={() => dismissNotification('pendingFriendRequests')}
                >
                  <div className='flex items-center justify-between w-full'>
                    <span>Friend requests</span>
                    <Badge variant='secondary'>
                      {effectiveNotifications.pendingFriendRequests}
                    </Badge>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
