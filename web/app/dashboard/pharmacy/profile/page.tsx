"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, MapPin, Building2, Phone, Mail, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function PharmacyProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [profile, setProfile] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        latitude: "",
        longitude: "",
        applicationStatus: ""
    });
    const [isNewProfile, setIsNewProfile] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsFetching(true);
            const response = await api.get("/pharmacies/me");
            const data = response.data;
            setProfile({
                name: data.name || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || "",
                latitude: data.latitude?.toString() || "",
                longitude: data.longitude?.toString() || "",
                applicationStatus: data.applicationStatus
            });
            setIsNewProfile(false);
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Not found is fine for first-time setup
                console.log("No pharmacy profile found, switching to setup mode");
                setIsNewProfile(true);
            } else {
                console.error("Failed to fetch profile:", error);
                alert("Failed to load profile. Please try again.");
            }
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic frontend validation
        if (!profile.name || !profile.address || !profile.latitude || !profile.longitude) {
            alert("Please fill in all required fields, including Latitude and Longitude.");
            return;
        }

        setIsLoading(true);

        // Convert string values to numbers for the API
        const payload = {
            ...profile,
            latitude: parseFloat(profile.latitude),
            longitude: parseFloat(profile.longitude)
        };

        try {
            if (isNewProfile) {
                await api.post("/pharmacies", payload);
                setIsNewProfile(false);
                alert("Pharmacy profile created successfully!");
            } else {
                await api.put("/pharmacies/me", payload);
                alert("Profile updated successfully!");
            }
        } catch (error: any) {
            console.error("Failed to save profile:", error);
            const detailMsg = error.response?.data?.details?.[0] || error.response?.data?.error || "Failed to save profile.";
            alert(detailMsg);
        } finally {
            setIsLoading(false);
        }
    };



    const handleRequestDeletion = async () => {
        const reason = prompt("Please provide a reason for deletion:");
        if (reason === null) return; // Cancelled
        if (!reason.trim()) {
            alert("Reason is required.");
            return;
        }

        try {
            await api.post("/pharmacies/delete-request", { reason });
            alert("Deletion request requested. Pending review.");
            // Update local state to show banner
            setProfile({ ...profile, applicationStatus: 'DELETION_REQUESTED' });
        } catch (error: any) {
            console.error("Failed to request deletion:", error);
            alert("Failed to submitting request: " + (error.response?.data?.error || "Unknown error"));
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Profile</h1>
                <p className="text-gray-500">Manage your pharmacy's public information and location.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {/* Basic Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-emerald-600" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>This information will be displayed to users searching for drugs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Pharmacy Name</label>
                                    <Input
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="e.g. HealthPlus Pharmacy"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Contact Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-9"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="080..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Public Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="pl-9"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        placeholder="contact@pharmacy.com"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                                Location Settings
                            </CardTitle>
                            <CardDescription>Accurate location helps users find your store on the map.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Street Address</label>
                                <Input
                                    value={profile.address}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    placeholder="Full street address"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Latitude</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={profile.latitude}
                                        onChange={(e) => setProfile({ ...profile, latitude: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Longitude</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={profile.longitude}
                                        onChange={(e) => setProfile({ ...profile, longitude: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 mt-2">
                                <p className="font-semibold mb-1">💡 Tip:</p>
                                You can find your coordinates by right-clicking your location on Google Maps.
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]" disabled={isLoading}>
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
                </div>

                {/* Danger Zone */}
                <div className="pt-6">
                    <Card className="border-red-100 bg-red-50/50">
                        <CardHeader>
                            <CardTitle className="text-red-700 flex items-center gap-2">
                                <Loader2 className="w-5 h-5 hidden" />
                                Account Actions
                            </CardTitle>
                            <CardDescription className="text-red-600/80">
                                Manage the closure of your pharmacy account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {profile.applicationStatus === 'DELETION_REQUESTED' ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <div>
                                        <p className="font-semibold">Deletion Request Submitted</p>
                                        <p className="text-sm">Your account deletion request is being reviewed by the Super Admin.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-700">
                                        If you wish to close your account, please submit a request. The Super Admin will verify that all orders are settled before approving the deletion.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={handleRequestDeletion}
                                    >
                                        Request Account Deletion
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
