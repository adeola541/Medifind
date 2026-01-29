'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        if (allowedRoles && allowedRoles.length > 0) {
            const user = JSON.parse(userStr);
            if (!allowedRoles.includes(user.role)) {
                // Redirect based on role or to access denied
                // For simplicity, just redirect to their Dashboard or Login
                router.push('/login');
                return;
            }
        }

        setAuthorized(true);
    }, [router, allowedRoles]);

    if (!authorized) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return <>{children}</>;
}
