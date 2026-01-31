"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, User, Mail, Lock, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function AdminProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        password: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsFetching(true);
            const response = await api.get("/users/profile");
            const data = response.data;
            setProfile({
                name: data.name || "",
                email: data.email || "",
                password: "" // Don't pre-fill password
            });
        } catch (error: any) {
            console.error("Failed to fetch profile:", error);
            alert("Failed to load profile.");
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile.name || !profile.email) {
            alert("Name and Email are required.");
            return;
        }

        setIsLoading(true);

        const payload: any = {
            name: profile.name,
            email: profile.email
        };

        if (profile.password) {
            if (profile.password.length < 6) {
                alert("Password must be at least 6 characters.");
                setIsLoading(false);
                return;
            }
            payload.password = profile.password;
        }

        try {
            await api.put("/users/profile", payload);
            alert("Profile updated successfully!");

            // Update local storage to reflect changes immediately
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            const updatedUser = { ...currentUser, name: profile.name, email: profile.email };
            localStorage.setItem("user", JSON.stringify(updatedUser)); // Persist update

            // Dispatch storage event to notify other components (if they listen) or force a reload if needed
            // For now, the sidebar will update on next refresh, but this ensures consistency.
            window.location.reload(); // Force reload to update Sidebar

            setProfile(p => ({ ...p, password: "" })); // Clear password field
        } catch (error: any) {
            console.error("Failed to save profile:", error);
            const detailMsg = error.response?.data?.error || "Failed to save profile.";
            alert(detailMsg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
                <p className="text-gray-500">Manage your personal account settings.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-600" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Update your login credentials and display name.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    placeholder="admin@medifind.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-100">
                            <label className="text-sm font-medium">Change Password (Optional)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    type="password"
                                    value={profile.password}
                                    onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                                    placeholder="Enter new password to change..."
                                    autoComplete="new-password"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Leave blank to keep your current password.</p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">Saving...</span>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
