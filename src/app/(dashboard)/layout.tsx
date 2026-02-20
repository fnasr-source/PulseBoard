'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth/context';
import { OrgProvider } from '@/lib/auth/org-context';
import Sidebar from '@/components/layout/Sidebar';
import { BarChart3, Loader2 } from 'lucide-react';

function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-pulse w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <OrgProvider>
            <div className="flex min-h-screen bg-gray-950">
                <Sidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </OrgProvider>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <DashboardShell>{children}</DashboardShell>
        </AuthProvider>
    );
}
