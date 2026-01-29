"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, Upload, Package, Loader2, Trash2, Edit2, AlertCircle } from "lucide-react";

interface PharmacyDrug {
    price: number | string;
    inStock: boolean;
    drug: {
        id: string;
        name: string;
        description: string;
        image: string;
        manufacturer: string;
    }
}

export default function InventoryPage() {
    const [drugs, setDrugs] = useState<PharmacyDrug[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Master Catalog search
    const [masterDrugs, setMasterDrugs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchingMaster, setIsSearchingMaster] = useState(false);

    // Add Form State
    const [selectedDrugId, setSelectedDrugId] = useState("");
    const [price, setPrice] = useState("");
    const [addPrices, setAddPrices] = useState<Record<string, string>>({});

    // Category Filter State
    const [selectedCategory, setSelectedCategory] = useState("ALL");

    // Categories matching the seed data
    const CATEGORIES = [
        "ALL",
        "Pain Relief & Fever",
        "Antibiotics",
        "Antimalarial",
        "Cold, Flu & Allergy",
        "Blood Pressure & Heart",
        "Diabetes",
        "Women’s Health",
        "Stomach & Digestive",
        "Mental Health",
        "Topical & Skin",
        "Vitamins & Supplements"
    ];

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/pharmacies/me");
            setDrugs(res.data.drugs || []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Live Search Effect - triggers on search OR category change
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Allow searching with empty query if a specific category is selected (to browse)
            if (searchQuery.trim().length > 0 || selectedCategory !== "ALL") {
                handleSearchMaster(searchQuery);
            } else {
                setMasterDrugs([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedCategory]);

    const handleSearchMaster = async (query: string = searchQuery) => {
        try {
            setIsSearchingMaster(true);
            // Construct URL parameters manually or use URLSearchParams
            const params = new URLSearchParams();
            if (query) params.append("search", query);
            if (selectedCategory !== "ALL") params.append("category", selectedCategory);

            const res = await api.get(`/drugs?${params.toString()}`);
            setMasterDrugs(res.data);
        } catch (error) {
            console.error("Master search failed", error);
        } finally {
            setIsSearchingMaster(false);
        }
    };

    const handleAddToInventory = async (drugId: string, itemPrice: string) => {
        if (!itemPrice) {
            alert("Please enter a price");
            return;
        }
        try {
            await api.post("/drugs/inventory", {
                drugId,
                price: parseFloat(itemPrice),
                inStock: true
            });
            setShowAddForm(false);
            setSearchQuery("");
            setMasterDrugs([]);
            setAddPrices({});
            fetchInventory();
            alert("Success: Item added to your inventory! 📦");
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to add drug");
        }
    };

    const handleToggleStock = async (drugId: string, currentStock: boolean) => {
        try {
            await api.put(`/drugs/inventory/${drugId}`, { inStock: !currentStock });
            fetchInventory();
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleRemove = async (drugId: string) => {
        if (!confirm("Remove this item from your inventory?")) return;
        try {
            await api.delete(`/drugs/inventory/${drugId}`);
            fetchInventory();
        } catch (error) {
            console.error("Remove failed", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Management</h1>
                    <p className="text-muted-foreground">Manage your pharmacy's drug catalog and stock availability.</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {showAddForm ? "Cancel" : (
                        <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add from Master Catalog
                        </>
                    )}
                </Button>
            </div>

            {showAddForm && (
                <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border-emerald-100 bg-emerald-50/20 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-emerald-900">Add to Local Inventory</CardTitle>
                        <CardDescription>Search the global catalog to add products to your pharmacy.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            {/* Category Filter */}
                            <select
                                className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-emerald-500"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat === "ALL" ? "All Categories" : cat}</option>
                                ))}
                            </select>

                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search global list (e.g. Paracetamol)..."
                                    className="pl-10 bg-white"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {/* Search Button removed/hidden as search is live, or kept as loading indicator */}
                            {isSearchingMaster && <div className="absolute right-12 top-2"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>}
                        </div>

                        {masterDrugs.length > 0 && (
                            <div className="mt-4 border rounded-lg bg-white overflow-hidden max-h-60 overflow-y-auto">
                                {masterDrugs.map((drug) => (
                                    <div key={drug.id} className="p-3 border-b last:border-0 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                {drug.image ? <img src={drug.image} className="w-full h-full object-cover rounded" /> : <Package className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{drug.name}</p>
                                                <p className="text-xs text-gray-500">{drug.manufacturer}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-xs font-bold text-gray-400">₦</span>
                                                <Input
                                                    type="number"
                                                    placeholder="Price"
                                                    className="w-24 h-8 text-sm pl-5"
                                                    value={addPrices[drug.id] || ''}
                                                    onChange={(e) => setAddPrices(prev => ({ ...prev, [drug.id]: e.target.value }))}
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                className={cn(
                                                    "h-8",
                                                    drugs.some(d => d.drug.id === drug.id)
                                                        ? "bg-blue-600 hover:bg-blue-700"
                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                )}
                                                onClick={() => handleAddToInventory(drug.id, addPrices[drug.id])}
                                            >
                                                {drugs.some(d => d.drug.id === drug.id) ? "Update" : "Add"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {masterDrugs.length === 0 && searchQuery && !isSearchingMaster && (
                            <div className="text-center py-6 text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>No drugs found in master catalog matching "{searchQuery}"</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Local Inventory Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : drugs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Your inventory is empty</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mt-1">Start by adding products from the master catalog above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drugs.map(item => (
                        <Card key={item.drug.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-100 group">
                            <div className="h-44 bg-gray-50 relative overflow-hidden">
                                <img src={item.drug.image} alt={item.drug.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button size="icon" variant="secondary" className="rounded-full shadow-lg"><Edit2 className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="destructive" className="rounded-full shadow-lg" onClick={() => handleRemove(item.drug.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                                <div className={cn(
                                    "absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    item.inStock ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                )}>
                                    {item.inStock ? "In Stock" : "Unavailable"}
                                </div>
                            </div>
                            <CardContent className="p-5 bg-white">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 leading-tight line-clamp-1">{item.drug.name}</h3>
                                    <p className="font-black text-emerald-600">₦{Number(item.price).toLocaleString()}</p>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">{item.drug.manufacturer}</p>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", item.inStock ? "bg-emerald-500" : "bg-red-500")} />
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Visibility</span>
                                    </div>
                                    <button
                                        onClick={() => handleToggleStock(item.drug.id, item.inStock)}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                            item.inStock ? "bg-emerald-500" : "bg-gray-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                                            item.inStock ? "translate-x-4" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
