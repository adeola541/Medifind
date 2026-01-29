"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, X, MapPin, Phone, Loader2, Calendar } from "lucide-react";

export default function PharmacyVerificationPage() {
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPharmacies();
    }, []);

    const fetchPharmacies = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/pharmacies");
            // Filter to show only pending or all? Let's show all but highlight pending.
            // Or typically verification page focuses on pending. 
            // Let's show PENDING first, then others if needed. 
            // For now, let's just show ALL but sort by status (pending first).
            // Priority: DELETION_REQUESTED -> PENDING -> APPROVED
            const sorted = res.data.sort((a: any, b: any) => {
                const getScore = (p: any) => {
                    if (p.applicationStatus === 'DELETION_REQUESTED') return 2;
                    if (!p.isApproved) return 1;
                    return 0;
                };
                return getScore(b) - getScore(a); // Descending score
            });
            setPharmacies(sorted);
        } catch (error) {
            console.error("Failed to fetch pharmacies", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerification = async (id: string, isApproved: boolean) => {
        try {
            // checking if we are rejecting a deletion request (i.e. restoring to approved)
            // or just approving a registration
            const status = isApproved ? 'APPROVED' : 'REJECTED';

            await api.put(`/pharmacies/${id}/verify`, { isApproved, status });

            // Update local state
            setPharmacies(pharmacies.map(p =>
                p.id === id ? { ...p, isApproved, applicationStatus: status } : p
            ));
            alert("Status updated successfully.");
        } catch (error: any) {
            console.error("Verification failed", error);
            alert("Action failed: " + (error.response?.data?.error || "Unknown error"));
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to DELETE "${name}"?\n\nThis will permanently remove the account and all data.`)) {
            return;
        }

        try {
            await api.delete(`/pharmacies/${id}`);
            // Remove from local state
            setPharmacies(pharmacies.filter(p => p.id !== id));
            alert("Pharmacy account deleted successfully.");
        } catch (error: any) {
            console.error("Deletion failed", error);
            const msg = error.response?.data?.details || error.response?.data?.error || "Unknown error";
            const code = error.response?.data?.code || "";
            alert(`Deletion failed: ${msg} ${code ? `(Code: ${code})` : ''}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Verification</h1>
                    <p className="text-gray-500">Review and approve pharmacy registration requests.</p>
                </div>
                <Button variant="outline">Export List</Button>
            </div>

            <div className="grid gap-6">
                {pharmacies.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No pharmacy records found.</p>
                ) : (
                    pharmacies.map((pharmacy) => {
                        const isDeletion = pharmacy.applicationStatus === 'DELETION_REQUESTED';
                        const isPending = !pharmacy.isApproved && !isDeletion;

                        return (
                            <Card key={pharmacy.id} className={`overflow-hidden border-l-4 ${isDeletion ? 'border-l-red-500' : (isPending ? 'border-l-yellow-500' : 'border-l-emerald-500')}`}>
                                <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 ${isDeletion ? 'bg-red-100 text-red-600' : (isPending ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600')}`}>
                                            <span className="text-2xl font-bold">{pharmacy.name.charAt(0)}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-gray-900">{pharmacy.name}</h3>
                                                {isPending && (
                                                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">Pending Approval</span>
                                                )}
                                                {isDeletion && (
                                                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Deletion Requested</span>
                                                )}
                                            </div>

                                            {isDeletion && pharmacy.deletionReason && (
                                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 italic">
                                                    Reason: "{pharmacy.deletionReason}"
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 hover:underline">
                                                    <MapPin className="w-3 h-3" /> {pharmacy.address}
                                                </a>
                                                <a href={`tel:${pharmacy.phone}`} className="flex items-center gap-1 hover:text-emerald-600 hover:underline">
                                                    <Phone className="w-3 h-3" /> {pharmacy.phone}
                                                </a>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                Applied {new Date(pharmacy.createdAt).toLocaleDateString()}
                                                {pharmacy.owner && ` by ${pharmacy.owner.name}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isDeletion ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="text-gray-600 hover:bg-gray-100"
                                                    onClick={() => handleVerification(pharmacy.id, true)} // Reinstate/Cancel Request
                                                >
                                                    Dismiss Request
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                    onClick={() => handleDelete(pharmacy.id, pharmacy.name)}
                                                >
                                                    Confirm Deletion
                                                </Button>
                                            </>
                                        ) : isPending ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                                                    onClick={() => handleDelete(pharmacy.id, pharmacy.name)}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Reject & Delete
                                                </Button>
                                                <Button
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => handleVerification(pharmacy.id, true)}
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Approve
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                                                onClick={() => handleDelete(pharmacy.id, pharmacy.name)}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Revoke (Delete)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 border-t text-xs text-gray-500 flex gap-6">
                                    <span>Status: <strong>{pharmacy.applicationStatus?.replace('_', ' ')}</strong></span>
                                    <span>
                                        Email: <a href={`mailto:${pharmacy.email || pharmacy.owner?.email}`} className="text-blue-600 hover:underline">
                                            {pharmacy.email || pharmacy.owner?.email || "N/A"}
                                        </a>
                                    </span>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
