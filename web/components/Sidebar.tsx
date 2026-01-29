"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    LayoutDashboard,
    Pill,
    ShoppingCart,
    Settings,
    Users,
    Building2,
    FileText,
    LogOut,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    const pharmacyLinks = [
        { name: "Overview", href: "/dashboard/pharmacy", icon: LayoutDashboard },
        { name: "Inventory", href: "/dashboard/pharmacy/inventory", icon: Pill },
        { name: "Orders", href: "/dashboard/pharmacy/orders", icon: ShoppingCart },
        { name: "Profile", href: "/dashboard/pharmacy/profile", icon: Building2 },
    ];

    const adminLinks = [
        { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "Pharmacies", href: "/dashboard/admin/pharmacies", icon: Building2 },
        { name: "Drug Catalog", href: "/dashboard/admin/drugs", icon: Pill },
        { name: "My Profile", href: "/dashboard/admin/profile", icon: Settings },
    ];

    const links = user?.role === "SUPER_ADMIN" ? adminLinks : pharmacyLinks;

    if (!user) return null;

    const userInitial = user.name?.charAt(0) || "U";

    return (
        <aside className="w-64 bg-sidebar-bg text-sidebar-fg flex flex-col h-screen fixed left-0 top-0 border-r border-gray-800">
            <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <img src="/logo-icon.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Medifind</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-emerald-900/20"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            )}
                        >
                            <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User Mini Profile */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="font-bold text-sm text-white">{userInitial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
