'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/context';
import { Organization, OrgMember, UserRole } from '@/lib/firebase/types';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    getDoc,
    Timestamp,
    onSnapshot,
} from 'firebase/firestore';

interface OrgContextType {
    organizations: Organization[];
    currentOrg: Organization | null;
    currentRole: UserRole | null;
    loading: boolean;
    setCurrentOrg: (org: Organization) => void;
    createOrganization: (name: string) => Promise<Organization>;
    refreshOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType>({
    organizations: [],
    currentOrg: null,
    currentRole: null,
    loading: true,
    setCurrentOrg: () => { },
    createOrganization: async () => ({} as Organization),
    refreshOrgs: async () => { },
});

export function OrgProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrgs = useCallback(async () => {
        if (!user) {
            setOrganizations([]);
            setCurrentOrg(null);
            setCurrentRole(null);
            setLoading(false);
            return;
        }

        try {
            // Find all orgs where user is a member
            const membersQuery = query(
                collection(db, 'orgMembers'),
                where('userId', '==', user.uid)
            );
            const memberSnap = await getDocs(membersQuery);

            const orgIds = memberSnap.docs.map((d) => d.data().orgId as string);
            const roles = new Map<string, UserRole>();
            memberSnap.docs.forEach((d) => {
                const data = d.data();
                roles.set(data.orgId, data.role as UserRole);
            });

            if (orgIds.length === 0) {
                setOrganizations([]);
                setCurrentOrg(null);
                setCurrentRole(null);
                setLoading(false);
                return;
            }

            const orgs: Organization[] = [];
            for (const orgId of orgIds) {
                const orgDoc = await getDoc(doc(db, 'organizations', orgId));
                if (orgDoc.exists()) {
                    orgs.push({ id: orgDoc.id, ...orgDoc.data() } as Organization);
                }
            }

            setOrganizations(orgs);

            // Restore selected org from localStorage or pick first
            const savedOrgId = localStorage.getItem('pulseboard_current_org');
            const savedOrg = orgs.find((o) => o.id === savedOrgId);
            const selected = savedOrg || orgs[0];
            setCurrentOrg(selected);
            setCurrentRole(roles.get(selected.id) || null);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching orgs:', error);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    useEffect(() => {
        if (currentOrg) {
            localStorage.setItem('pulseboard_current_org', currentOrg.id);
        }
    }, [currentOrg]);

    const createOrganization = async (name: string): Promise<Organization> => {
        if (!user) throw new Error('Must be logged in');

        const orgRef = await addDoc(collection(db, 'organizations'), {
            name,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        const orgData: Organization = {
            id: orgRef.id,
            name,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        // Add creator as owner
        await addDoc(collection(db, 'orgMembers'), {
            orgId: orgRef.id,
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            role: 'owner',
            joinedAt: Timestamp.now(),
        });

        setOrganizations((prev) => [...prev, orgData]);
        setCurrentOrg(orgData);
        setCurrentRole('owner');

        return orgData;
    };

    return (
        <OrgContext.Provider
            value={{
                organizations,
                currentOrg,
                currentRole,
                loading,
                setCurrentOrg,
                createOrganization,
                refreshOrgs: fetchOrgs,
            }}
        >
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const context = useContext(OrgContext);
    if (!context) throw new Error('useOrg must be used within OrgProvider');
    return context;
}
