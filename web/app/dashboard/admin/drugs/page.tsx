"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";

export default function DrugCatalogPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [drugs, setDrugs] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        manufacturer: "",
        description: "",
        image: "",
        category: "",
        dosageForm: "",
        strength: "",
        requiresPrescription: false
    });

    useEffect(() => {
        fetchDrugs();
    }, [searchQuery]);

    const fetchDrugs = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);

            const res = await api.get(`/drugs?${params.toString()}`);
            setDrugs(res.data);
        } catch (error) {
            console.error("Failed to fetch drugs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (drug: any) => {
        setFormData({
            name: drug.name,
            manufacturer: drug.manufacturer || "",
            description: drug.description || "",
            image: drug.image || "",
            category: drug.category || "",
            dosageForm: drug.dosageForm || "",
            strength: drug.strength || "",
            requiresPrescription: drug.requiresPrescription || false
        });
        setEditingId(drug.id);
        setShowForm(true);
    };

    const handleCreate = () => {
        setFormData({
            name: "",
            manufacturer: "",
            description: "",
            image: "",
            category: "",
            dosageForm: "",
            strength: "",
            requiresPrescription: false
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/drugs/${editingId}`, formData);
                alert("Drug updated successfully!");
            } else {
                await api.post("/drugs", formData);
                alert("Drug created successfully!");
            }
            setShowForm(false);
            fetchDrugs();
        } catch (error: any) {
            console.error("Save failed", error);
            alert(error.response?.data?.error || "Failed to save drug");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this drug from the global catalog? This action cannot be undone.")) return;

        try {
            await api.delete(`/drugs/${id}`);
            setDrugs(drugs.filter(d => d.id !== id));
            alert("Drug deleted successfully");
        } catch (error: any) {
            console.error("Delete failed", error);
            alert(error.response?.data?.error || "Failed to delete drug");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Master Drug Catalog</h1>
                    <p className="text-muted-foreground">Manage the centralized database of approved drugs.</p>
                </div>
                <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Drug
                </Button>
            </div>

            {/* Editor Form */}
            {showForm && (
                <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border-emerald-100 bg-emerald-50/20 shadow-sm">
                    <CardContent className="p-6">
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Drug Name</label>
                                    <Input placeholder="e.g. Panadol Extra" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Manufacturer</label>
                                    <Input placeholder="e.g. Emzor" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category...</option>
                                        <option value="Pain Relief & Fever">Pain Relief & Fever</option>
                                        <option value="Antibiotics">Antibiotics</option>
                                        <option value="Antimalarial">Antimalarial</option>
                                        <option value="Cold, Flu & Allergy">Cold, Flu & Allergy</option>
                                        <option value="Blood Pressure & Heart">Blood Pressure & Heart</option>
                                        <option value="Diabetes">Diabetes</option>
                                        <option value="Women’s Health">Women’s Health</option>
                                        <option value="Stomach & Digestive">Stomach & Digestive</option>
                                        <option value="Mental Health">Mental Health</option>
                                        <option value="Topical & Skin">Topical & Skin</option>
                                        <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Dosage Form</label>
                                        <Input placeholder="e.g. Tablet" value={formData.dosageForm} onChange={e => setFormData({ ...formData, dosageForm: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Strength</label>
                                        <Input placeholder="e.g. 500mg" value={formData.strength} onChange={e => setFormData({ ...formData, strength: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input placeholder="Brief description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium">Image URL</label>
                                    <Input placeholder="https://..." value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="rx"
                                        checked={formData.requiresPrescription}
                                        onChange={e => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                    />
                                    <label htmlFor="rx" className="text-sm font-medium text-gray-700">Requires Prescription?</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-emerald-100">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" type="submit">
                                    {editingId ? 'Update Drug' : 'Create Drug'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search global catalog (e.g. Paracetamol)..."
                    className="pl-10 bg-white"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add New Placeholder Card */}
                    <button onClick={handleCreate} className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all h-full min-h-[250px] cursor-pointer bg-gray-50/50">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-gray-400 group-hover:text-emerald-600">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-medium">Add Manual Entry</span>
                    </button>

                    {drugs.map(drug => (
                        <Card key={drug.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-100">
                            <div className="aspect-video bg-gray-50 relative overflow-hidden">
                                {drug.image ? (
                                    <img src={drug.image} alt={drug.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg" onClick={() => handleEdit(drug)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full shadow-lg" onClick={() => handleDelete(drug.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                {drug.requiresPrescription && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        RX ONLY
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase truncate max-w-[120px]">
                                        {drug.category || 'Uncategorized'}
                                    </span>
                                    {drug.strength && (
                                        <span className="text-[10px] text-gray-500 font-medium border px-1.5 py-0.5 rounded">
                                            {drug.strength}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{drug.name}</h3>
                                <p className="text-xs text-gray-500 font-medium mb-3">{drug.manufacturer}</p>
                                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">{drug.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
