'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
                Welcome back, {user?.name || 'User'} ({user?.role})!
            </p>
        </div>
    );
}
