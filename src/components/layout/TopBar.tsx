'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Brain, Menu } from 'lucide-react';
import type { Notification } from '@/lib/types';

interface TopBarProps {
  onMenuToggle: () => void;
}

const TYPE_STYLES: Record<string, string> = {
  warning: 'bg-amber-100 text-amber-800',
  success: 'bg-emerald-100 text-emerald-800',
  info: 'bg-blue-100 text-blue-800',
  error: 'bg-red-100 text-red-800',
};

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const router = useRouter();
  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (): Promise<Notification[]> => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    return data.notifications || [];
  }, []);

  useEffect(() => {
    let active = true;
    fetchNotifications()
      .then((items) => { if (active) setNotifications(items); })
      .catch((e) => { if (active) console.error('Failed to load notifications:', e); });
    return () => { active = false; };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter(n => n.read === 0).length;

  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => n.read === 0);
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    await Promise.all(unreadItems.map(n => fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id }),
    }).catch(() => {})));
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-md hover:bg-gray-100 md:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
          />
        </div>

        <span className="hidden md:inline text-sm text-gray-500">{monthYear}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800">Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications</div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${n.read === 0 ? 'bg-indigo-50/40' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{n.title}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${TYPE_STYLES[n.type] || 'bg-gray-100 text-gray-700'}`}>{n.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/ai-insights')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold cursor-pointer">
          AU
        </div>
      </div>
    </header>
  );
}
