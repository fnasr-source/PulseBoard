'use client';

import { useAuth } from '@/lib/auth/context';
import { useOrg } from '@/lib/auth/org-context';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const { user } = useAuth();
    const { currentOrg } = useOrg();

    return (
        <header className="flex items-center justify-between px-8 py-4 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/60 sticky top-0 z-30">
            <div>
                {title && (
                    <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
                )}
                {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 w-64 bg-gray-900/80 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
                </button>
            </div>
        </header>
    );
}
