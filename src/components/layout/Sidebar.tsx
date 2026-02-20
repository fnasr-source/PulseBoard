'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useOrg } from '@/lib/auth/org-context';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    FileText,
    AlertTriangle,
    Building2,
    Settings,
    Plus,
    ChevronDown,
    LogOut,
} from 'lucide-react';
import { useState } from 'react';

const clientNavItems = [
    { href: '', label: 'Overview', icon: LayoutDashboard },
    { href: '/kpis', label: 'KPI Dictionary', icon: BarChart3 },
    { href: '/data-entry', label: 'Data Entry', icon: Plus },
    { href: '/accountability', label: 'Accountability', icon: AlertTriangle },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/agencies', label: 'Agencies', icon: Building2 },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { currentOrg, organizations, setCurrentOrg } = useOrg();
    const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

    // Extract clientId from path if we're in a client context
    const clientMatch = pathname.match(/\/clients\/([^/]+)/);
    const currentClientId = clientMatch ? clientMatch[1] : null;

    return (
        <aside className="flex flex-col w-64 min-h-screen bg-gray-950 border-r border-gray-800/60">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800/60">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">PulseBoard</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Control Room</p>
                </div>
            </div>

            {/* Org Selector */}
            <div className="px-3 py-3 border-b border-gray-800/60">
                <div className="relative">
                    <button
                        onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/80 hover:bg-gray-800/80 text-sm text-gray-300 transition-colors"
                    >
                        <span className="truncate">{currentOrg?.name || 'Select Organization'}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </button>
                    {orgDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => {
                                        setCurrentOrg(org);
                                        setOrgDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors ${currentOrg?.id === org.id
                                            ? 'text-indigo-400 bg-gray-800/50'
                                            : 'text-gray-300'
                                        }`}
                                >
                                    {org.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === '/dashboard'
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-sm'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                        }`}
                >
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    Dashboard
                </Link>

                <Link
                    href="/clients/new"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === '/clients/new'
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                        }`}
                >
                    <Plus className="w-4.5 h-4.5" />
                    New Client
                </Link>

                {/* Client sub-nav */}
                {currentClientId && (
                    <div className="mt-4 pt-4 border-t border-gray-800/60">
                        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            Client Menu
                        </p>
                        {clientNavItems.map((item) => {
                            const fullPath = `/clients/${currentClientId}${item.href}`;
                            const isActive =
                                item.href === ''
                                    ? pathname === `/clients/${currentClientId}`
                                    : pathname.startsWith(fullPath);
                            return (
                                <Link
                                    key={item.href}
                                    href={fullPath}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-indigo-500/10 text-indigo-400'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                                        }`}
                                >
                                    <item.icon className="w-4.5 h-4.5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-800/60">
                    <Link
                        href="/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === '/settings'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        <Settings className="w-4.5 h-4.5" />
                        Settings
                    </Link>
                </div>
            </nav>

            {/* User */}
            <div className="px-3 py-4 border-t border-gray-800/60">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">
                            {user?.displayName || 'User'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800/50 transition-all"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
