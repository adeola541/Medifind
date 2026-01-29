"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Pill, Activity, Loader2 } from "lucide-react";
import Link from 'next/link';

interface SystemStats {
    users: number;
    pharmacies: {
        total: number;
        pending: number;
        active: number;
    };
    drugs: number;
    orders: number;
    pendingActions: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
    }[];
}

export default function AdminOverview() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/admin/stats");
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">System Overview</h1>
                <p className="text-gray-500 mt-1">Monitor the health and growth of the Medifind platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Users"
                    value={stats?.users.toLocaleString() || "0"}
                    change="Registered accounts"
                    icon={Users}
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <StatsCard
                    title="Active Pharmacies"
                    value={stats?.pharmacies.active.toLocaleString() || "0"}
                    change={`${stats?.pharmacies.pending} pending approvals`}
                    icon={Building2}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <StatsCard
                    title="Drugs Listed"
                    value={stats?.drugs.toLocaleString() || "0"}
                    change="Master catalog size"
                    icon={Pill}
                    color="text-purple-500"
                    bg="bg-purple-50"
                />
                <StatsCard
                    title="Total Orders"
                    value={stats?.orders.toLocaleString() || "0"}
                    change="System-wide volume"
                    icon={Activity}
                    color="text-orange-500"
                    bg="bg-orange-50"
                />
            </div>

            {/* Recent Activity / Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <Card className="lg:col-span-2 border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle>Platform Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <span className="text-gray-400">Chart Visualization Placeholder</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle>Pending Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(!stats?.pendingActions || stats.pendingActions.length === 0) ? (
                            <p className="text-sm text-gray-500 text-center py-4">No pending actions required.</p>
                        ) : (
                            stats.pendingActions.map(pharmacy => {
                                const isDeletion = (pharmacy as any).applicationStatus === 'DELETION_REQUESTED';
                                return (
                                    <Link href="/dashboard/admin/pharmacies" key={pharmacy.id} className="block group">
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100 group-hover:shadow-sm">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDeletion ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                {isDeletion ? 'X' : '!'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{isDeletion ? 'Deletion Requested' : 'Pharmacy Approval Required'}</p>
                                                <p className="text-xs text-gray-500">"{pharmacy.name}" {isDeletion ? 'requested to delete account.' : 'requested to join.'}</p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, change, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1">{change}</p>
                </div>
            </CardContent>
        </Card>
    );
}
