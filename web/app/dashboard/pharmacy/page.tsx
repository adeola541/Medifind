"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, TrendingUp, AlertTriangle, Package, Loader2 } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
    todaysOrders: number;
    todaysRevenue: number;
    lowStock: number;
    totalProducts: number;
    recentOrders: {
        id: string;
        customerName: string;
        customerInitials: string;
        itemCount: number;
        totalAmount: number;
        status: string;
        createdAt: string;
    }[];
}

export default function PharmacyOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/pharmacies/stats");
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
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
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                    <p className="text-gray-500">Welcome back, Pharmacy Admin.</p>
                </div>
                <Link href="/dashboard/pharmacy/orders">
                    <Button>View Orders</Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Today's Orders"
                    value={stats?.todaysOrders || 0}
                    change="Since midnight"
                    icon={ShoppingCart}
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <StatsCard
                    title="Revenue (Today)"
                    value={`₦${(stats?.todaysRevenue || 0).toLocaleString()}`}
                    change="Gross sales"
                    icon={TrendingUp}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <StatsCard
                    title="Unavailable Items"
                    value={stats?.lowStock || 0}
                    change="Out of stock"
                    icon={AlertTriangle}
                    color="text-orange-500"
                    bg="bg-orange-50"
                />
                <StatsCard
                    title="Total Products"
                    value={stats?.totalProducts || 0}
                    change="In catalog"
                    icon={Package}
                    color="text-purple-500"
                    bg="bg-purple-50"
                />
            </div>

            {/* Recent Orders Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <Card className="lg:col-span-2 shadow-sm border-gray-100">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Recent Orders</h3>
                            <Link href="/dashboard/pharmacy/orders" className="text-sm text-emerald-600 font-medium hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {stats?.recentOrders.length === 0 ? (
                                <p className="text-gray-500 text-sm py-4 text-center">No recent orders found.</p>
                            ) : (
                                stats?.recentOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {order.customerInitials}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{order.customerName}</p>
                                                <p className="text-xs text-gray-500">{order.itemCount} items • ₦{Number(order.totalAmount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'READY_FOR_PICKUP' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100 bg-emerald-900 text-white">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Pro Tips</h3>
                            <p className="text-emerald-100 text-sm">Keep your inventory updated to ensure users find your pharmacy in search results.</p>
                        </div>
                        <Link href="/dashboard/pharmacy/inventory">
                            <Button variant="secondary" className="w-full mt-4">Update Stock</Button>
                        </Link>
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
                    <p className="text-xs text-gray-500 font-medium mt-1">{change}</p>
                </div>
            </CardContent>
        </Card>
    );
}
