"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Filter, ShoppingBag, Clock, CheckCircle, Loader2, User, Package, AlertTriangle, X, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface OrderItem {
    id: string;
    quantity: number;
    price: string;
    drug: {
        name: string;
    }
}

interface Order {
    id: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    items: OrderItem[];
}

export default function PharmacyOrdersPage() {
    const [filter, setFilter] = useState("ALL");
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/orders/pharmacy");
            setOrders(res.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            setUpdatingId(orderId);
            await api.put(`/orders/${orderId}/status`, { status });
            fetchOrders();
            // Also update selected order if it's open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error("Status update failed", error);
            alert("Failed to update order status");
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === "ALL") return true;
        return order.status === filter;
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING": return "Incoming";
            case "CONFIRMED": return "Processing";
            case "COMPLETED": return "Ready for Pickup";
            case "CANCELLED": return "Cancelled";
            default: return status;
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order Management</h1>
                    <p className="text-muted-foreground">Track and fulfill customer orders in real-time.</p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                    {["ALL", "PENDING", "CONFIRMED", "COMPLETED"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                                filter === f
                                    ? "bg-white text-emerald-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mt-1">Orders from customers will appear here once they check out.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <Card key={order.id} className="hover:shadow-md transition-all border-none shadow-sm ring-1 ring-gray-100 group">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row justify-between gap-6">
                                    <div className="flex gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
                                            <ShoppingBag className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-black text-gray-900 tracking-tight uppercase text-sm">#{order.id.slice(0, 8)}</h3>
                                                <Badge status={order.status} />
                                            </div>

                                            <div className="flex items-center gap-4 mt-3 text-sm">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="font-medium">{order.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {order.items.map(item => (
                                                    <span key={item.id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-[10px] font-bold border border-gray-100">
                                                        <Package className="w-3 h-3" />
                                                        {item.quantity}x {item.drug.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between min-w-[200px] gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400 font-medium">Total Amount</p>
                                            <p className="text-2xl font-black text-gray-900 leading-none mt-1">₦{Number(order.totalAmount).toLocaleString()}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {order.status === "PENDING" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4"
                                                    onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {updatingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Order"}
                                                </Button>
                                            )}
                                            {order.status === "CONFIRMED" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4"
                                                    onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                                                    disabled={updatingId === order.id}
                                                >
                                                    Mark Ready
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 font-bold bg-white"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-emerald-600" />
                                    Order Details
                                </h2>
                                <p className="text-xs text-gray-500 font-mono mt-1">#{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Status Bar */}
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-600">Current Status</span>
                                <Badge status={selectedOrder.status} />
                            </div>

                            {/* Customer Info */}
                            <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl shadow-sm bg-white">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{selectedOrder.user.name}</p>
                                    <p className="text-xs text-gray-500">{selectedOrder.user.email}</p>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Items</h3>
                                    <span className="text-xs text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-100">x{item.quantity}</span>
                                                <span className="text-gray-700 font-medium">{item.drug.name}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">₦{Number(item.price).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="mt-4 pt-4 border-t border-gray-200 border-dashed flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Total Amount</span>
                                        <span className="text-xl font-black text-emerald-600">₦{Number(selectedOrder.totalAmount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                            {selectedOrder.status === "PENDING" && (
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMED")}
                                >
                                    Confirm Order
                                </Button>
                            )}
                            {selectedOrder.status === "CONFIRMED" && (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleUpdateStatus(selectedOrder.id, "COMPLETED")}
                                >
                                    Mark Ready for Pickup
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-600 border-amber-100",
        CONFIRMED: "bg-blue-50 text-blue-600 border-blue-100",
        COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
        CANCELLED: "bg-red-50 text-red-600 border-red-100"
    };

    const label: Record<string, string> = {
        PENDING: "Incoming",
        CONFIRMED: "Processing",
        COMPLETED: "Ready for Pickup",
        CANCELLED: "Cancelled"
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
            styles[status] || "bg-gray-50 text-gray-500 border-gray-100"
        )}>
            {label[status] || status}
        </span>
    );
}
