'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  LayoutDashboard,
  GitMerge,
  FileText,
  Building2,
  CreditCard,
  AlertTriangle,
  Brain,
  BarChart3,
  ScrollText,
  Settings,
  Upload,
  LogOut,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Data', href: '/upload', icon: Upload },
  { label: 'Reconciliation', href: '/reconciliation', icon: GitMerge },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Bank Transactions', href: '/bank-transactions', icon: Building2 },
  { label: 'Payment Gateway', href: '/payment-gateway', icon: CreditCard },
  { label: 'Exceptions', href: '/exceptions', icon: AlertTriangle },
  { label: 'AI Insights', href: '/ai-insights', icon: Brain },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded] = useState(true);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200
          flex flex-col transition-all duration-300 ease-in-out
          ${expanded ? 'w-64' : 'w-16'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600 flex-shrink-0" />
            {expanded && (
              <span className="text-lg font-bold text-gray-900">ReconcileAI</span>
            )}
          </div>
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-r-md text-sm font-medium
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                    title={!expanded ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {expanded && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              A
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">Finance Manager</p>
              </div>
            )}
          </div>
          {expanded && (
            <button className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
