"use client";

import React, { useState, useEffect } from "react";
import {
    Save,
    MapPin,
    Clock,
    Monitor,
    User,
    Layers,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EndpointFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function EndpointForm({ initialData, isEdit = false }: EndpointFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        screenType: "inside",
        venueTypeId: "",
        vistarVenueGroupId: "",
        venueHoursOpen: "09:00",
        venueHoursClose: "21:00",
        is24Hour: false,
        isLgScreen: false,
        pocEmail: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id || "",
                name: initialData.name || "",
                address: initialData.address || "",
                latitude: initialData.latitude?.toString() || "",
                longitude: initialData.longitude?.toString() || "",
                screenType: initialData.screenType || "inside",
                venueTypeId: initialData.venueTypeId?.toString() || "",
                vistarVenueGroupId: initialData.vistarVenueGroupId || "",
                venueHoursOpen: initialData.venueHoursOpen || "09:00",
                venueHoursClose: initialData.venueHoursClose || "21:00",
                is24Hour: initialData.is24Hour || false,
                isLgScreen: initialData.isLgScreen || false,
                pocEmail: initialData.pocEmail || "",
            });
        }
    }, [initialData]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.id) newErrors.id = "Endpoint ID is required";
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.latitude || isNaN(Number(formData.latitude))) newErrors.latitude = "Valid latitude required";
        if (!formData.longitude || isNaN(Number(formData.longitude))) newErrors.longitude = "Valid longitude required";
        if (!formData.venueTypeId) newErrors.venueTypeId = "Venue Type ID is required";
        if (!formData.vistarVenueGroupId) newErrors.vistarVenueGroupId = "Venue Group ID is required";
        if (!formData.pocEmail) newErrors.pocEmail = "POC Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(formData.pocEmail)) newErrors.pocEmail = "Invalid email format";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
        
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const url = isEdit ? `/api/endpoints/${formData.id}` : '/api/endpoints';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(`http://localhost:3002${url}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    latitude: Number(formData.latitude),
                    longitude: Number(formData.longitude),
                    venueTypeId: Number(formData.venueTypeId)
                }),
            });

            const result = await response.json();
            if (result.success) {
                setIsSuccess(true);
                if (!isEdit) {
                    setTimeout(() => {
                        router.push('/dashboard/endpoints');
                    }, 2000);
                }
            } else {
                setErrors({ submit: result.error || 'Failed to save endpoint' });
            }
        } catch (error) {
            setErrors({ submit: 'Network error or server unavailable' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {isEdit && (
                        <button 
                            type="button"
                            onClick={() => router.back()}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {isEdit ? "Edit Endpoint" : "Endpoint Onboarding"}
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {isEdit ? `Modifying ${formData.id}` : "Register a new screen to the Snowflake system."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
                    <ChevronRight size={14} />
                    <Link href="/dashboard/endpoints" className="hover:text-cyan-400 transition-colors">Endpoints</Link>
                    <ChevronRight size={14} />
                    <span className="text-cyan-400">{isEdit ? "Edit" : "Onboarding"}</span>
                </div>
            </div>

            {isSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in zoom-in-95 duration-300">
                    <CheckCircle2 size={24} />
                    <div>
                        <p className="font-semibold">Success!</p>
                        <p className="text-sm opacity-90">
                            {isEdit ? "Changes saved successfully." : `Endpoint ${formData.id} has been created and synced.`}
                        </p>
                    </div>
                </div>
            )}

            {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-400">
                    <AlertCircle size={24} />
                    <p className="text-sm">{errors.submit}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <div className="lg:col-span-2 space-y-6">
                    <section className="glass p-8 rounded-3xl space-y-6 border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <Monitor size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">General Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Endpoint ID (Primary Key)</label>
                                <input
                                    name="id"
                                    value={formData.id}
                                    onChange={handleChange}
                                    disabled={isEdit}
                                    className={`w-full bg-slate-950/50 border ${errors.id ? "border-red-500/50" : "border-slate-800 focus:border-cyan-500/50"} rounded-xl p-3 text-white outline-none transition-all disabled:opacity-50`}
                                    placeholder="e.g. SN-NYC-001"
                                />
                                {errors.id && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Endpoint Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.name ? "border-red-500/50" : "border-slate-800 focus:border-cyan-500/50"} rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="e.g. Starbucks Times Sq Screen 1"
                                />
                                {errors.name && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.name}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Full Address</label>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all"
                                placeholder="123 Example St, New York, NY 10001"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin size={14} className="text-slate-500" />
                                    <label className="text-sm font-medium text-slate-300">Latitude</label>
                                </div>
                                <input
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.latitude ? "border-red-500/50" : "border-slate-800 focus:border-cyan-500/50"} rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="40.7128"
                                />
                                {errors.latitude && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.latitude}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin size={14} className="text-slate-500" />
                                    <label className="text-sm font-medium text-slate-300">Longitude</label>
                                </div>
                                <input
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.longitude ? "border-red-500/50" : "border-slate-800 focus:border-cyan-500/50"} rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="-74.0060"
                                />
                                {errors.longitude && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.longitude}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="glass p-8 rounded-3xl space-y-6 border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Clock size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Operations & Timing</h2>
                        </div>

                        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is24Hour"
                                    name="is24Hour"
                                    checked={formData.is24Hour}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50"
                                />
                                <label htmlFor="is24Hour" className="text-sm font-medium text-slate-200 cursor-pointer select-none">Operates 24 Hours</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isLgScreen"
                                    name="isLgScreen"
                                    checked={formData.isLgScreen}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50"
                                />
                                <label htmlFor="isLgScreen" className="text-sm font-medium text-slate-200 cursor-pointer select-none text-nowrap">LG Screen (Cortex Enabled)</label>
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${formData.is24Hour ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Earliest Open Time</label>
                                <input
                                    type="time"
                                    name="venueHoursOpen"
                                    disabled={formData.is24Hour}
                                    value={formData.venueHoursOpen}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Latest Close Time</label>
                                <input
                                    type="time"
                                    name="venueHoursClose"
                                    disabled={formData.is24Hour}
                                    value={formData.venueHoursClose}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="glass p-8 rounded-3xl space-y-6 border-white/5 h-full">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                                <Layers size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Platform Configuration</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Screen Type</label>
                                <select
                                    name="screenType"
                                    value={formData.screenType}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="inside">Inside (Indoor)</option>
                                    <option value="outside">Outside (Outdoor)</option>
                                </select>
                            </div>

                            <div className="space-y-2 text-xs p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-slate-400 italic">
                                {formData.screenType === "inside"
                                    ? "Auto-calculated: 5.0 impressions/spot, 500 CPM floor"
                                    : "Auto-calculated: 10.0 impressions/spot, 575+ CPM floor"}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Venue Type ID</label>
                                <input
                                    name="venueTypeId"
                                    value={formData.venueTypeId}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.venueTypeId ? "border-red-500/50" : "border-slate-800"} focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="e.g. 104"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Vistar Venue Group ID</label>
                                <input
                                    name="vistarVenueGroupId"
                                    value={formData.vistarVenueGroupId}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.vistarVenueGroupId ? "border-red-500/50" : "border-slate-800"} focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="e.g. VG-7729"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-3 mb-2 text-slate-300 uppercase text-[10px] font-bold tracking-widest text-nowrap">
                                    Primary Contact
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User size={14} className="text-slate-500" />
                                        <label className="text-sm font-medium text-slate-300">POC Email</label>
                                    </div>
                                    <input
                                        type="email"
                                        name="pocEmail"
                                        value={formData.pocEmail}
                                        onChange={handleChange}
                                        className={`w-full bg-slate-950/50 border ${errors.pocEmail ? "border-red-500/50" : "border-slate-800"} focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all`}
                                        placeholder="poc@client.com"
                                    />
                                    {errors.pocEmail && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.pocEmail}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-4 px-4 mt-8 rounded-xl text-base font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-xl shadow-cyan-900/10 transition-all disabled:opacity-50 group active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                        {isEdit ? "Save Changes" : "Create Endpoint"}
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
}
