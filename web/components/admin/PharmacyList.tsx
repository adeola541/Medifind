'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Pharmacy {
    id: string;
    name: string;
    address: string;
    isApproved: boolean;
    owner: {
        name: string;
        email: string;
    };
}

export default function PharmacyList() {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPharmacies();
    }, []);

    const fetchPharmacies = async () => {
        try {
            const response = await api.get('/pharmacies');
            setPharmacies(response.data);
        } catch (error) {
            console.error('Failed to fetch pharmacies', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyPharmacy = async (pharmacyId: string, isApproved: boolean) => {
        try {
            await api.put(`/pharmacies/${pharmacyId}/verify`, { isApproved });
            setPharmacies(pharmacies.map(p => p.id === pharmacyId ? { ...p, isApproved } : p));
        } catch (error) {
            console.error('Failed to verify pharmacy', error);
            alert('Failed to update pharmacy status');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Pharmacy Management</h1>

            {loading ? (
                <p>Loading pharmacies...</p>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {pharmacies.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">No pharmacies registered yet.</li>
                        ) : (
                            pharmacies.map((pharmacy) => (
                                <li key={pharmacy.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{pharmacy.name}</h3>
                                        <p className="text-sm text-gray-500">{pharmacy.address}</p>
                                        <p className="text-xs text-gray-400">Owner: {pharmacy.owner?.name || 'Unknown'} ({pharmacy.owner?.email})</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pharmacy.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {pharmacy.isApproved ? 'Approved' : 'Pending'}
                                        </span>

                                        {pharmacy.isApproved ? (
                                            <Button
                                                variant="danger"
                                                onClick={() => verifyPharmacy(pharmacy.id, false)}
                                                className="text-sm"
                                            >
                                                Revoke
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                onClick={() => verifyPharmacy(pharmacy.id, true)}
                                                className="text-sm"
                                            >
                                                Approve
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
