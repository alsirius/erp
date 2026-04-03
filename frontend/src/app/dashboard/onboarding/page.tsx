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
    ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
    const [formData, setFormData] = useState({
        endpoint_id: "",
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        screen_type: "inside",
        venue_type_id: "",
        vistar_venue_group_id: "",
        venue_hours_open: "09:00",
        venue_hours_close: "21:00",
        is_24_hour: false,
        is_lg_screen: false,
        poc_email: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.endpoint_id) newErrors.endpoint_id = "Endpoint ID is required";
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.latitude || isNaN(Number(formData.latitude))) newErrors.latitude = "Valid latitude required";
        if (!formData.longitude || isNaN(Number(formData.longitude))) newErrors.longitude = "Valid longitude required";
        if (!formData.venue_type_id) newErrors.venue_type_id = "Venue Type ID is required";
        if (!formData.vistar_venue_group_id) newErrors.vistar_venue_group_id = "Venue Group ID is required";
        if (!formData.poc_email) newErrors.poc_email = "POC Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(formData.poc_email)) newErrors.poc_email = "Invalid email format";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
        // Clear error
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
        // Simulate snowflake intake
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
        setIsSuccess(true);

        setTimeout(() => setIsSuccess(false), 5000);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Endpoint Onboarding</h1>
                    <p className="text-slate-400 mt-1">Register a new screen to the Snowflake system of record.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
                    <ChevronRight size={14} />
                    <span className="text-cyan-400">Onboarding</span>
                </div>
            </div>

            {isSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in zoom-in-95 duration-300">
                    <CheckCircle2 size={24} />
                    <div>
                        <p className="font-semibold">Success!</p>
                        <p className="text-sm opacity-90">Endpoint {formData.endpoint_id} has been queued for sync to Snowflake staging.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
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
                                    name="endpoint_id"
                                    value={formData.endpoint_id}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.endpoint_id ? "border-red-500/50" : "border-slate-800 focus:border-cyan-500/50"} rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="e.g. SN-NYC-001"
                                />
                                {errors.endpoint_id && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.endpoint_id}</p>}
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
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                <Clock size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Operations & Timing</h2>
                        </div>

                        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_24_hour"
                                    name="is_24_hour"
                                    checked={formData.is_24_hour}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50"
                                />
                                <label htmlFor="is_24_hour" className="text-sm font-medium text-slate-200 cursor-pointer select-none">Operates 24 Hours</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_lg_screen"
                                    name="is_lg_screen"
                                    checked={formData.is_lg_screen}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/50"
                                />
                                <label htmlFor="is_lg_screen" className="text-sm font-medium text-slate-200 cursor-pointer select-none text-nowrap">LG Screen (Cortex Enabled)</label>
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${formData.is_24_hour ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Earliest Open Time</label>
                                <input
                                    type="time"
                                    name="venue_hours_open"
                                    disabled={formData.is_24_hour}
                                    value={formData.venue_hours_open}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Latest Close Time</label>
                                <input
                                    type="time"
                                    name="venue_hours_close"
                                    disabled={formData.is_24_hour}
                                    value={formData.venue_hours_close}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Platform Configuration */}
                <div className="space-y-6">
                    <section className="glass p-8 rounded-3xl space-y-6 border-white/5 h-full">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                                <Layers size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Platform Settings</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Screen Type</label>
                                <select
                                    name="screen_type"
                                    value={formData.screen_type}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="inside">Inside (Indoor)</option>
                                    <option value="outside">Outside (Outdoor)</option>
                                </select>
                            </div>

                            <div className="space-y-2 text-xs p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-slate-400 italic">
                                {formData.screen_type === "inside"
                                    ? "Auto-calculated: 5.0 impressions/spot, 500 CPM floor"
                                    : "Auto-calculated: 10.0 impressions/spot, 575+ CPM floor"}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Venue Type ID</label>
                                <input
                                    name="venue_type_id"
                                    value={formData.venue_type_id}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.venue_type_id ? "border-red-500/50" : "border-slate-800"} focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="e.g. 104"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Vistar Venue Group ID</label>
                                <input
                                    name="vistar_venue_group_id"
                                    value={formData.vistar_venue_group_id}
                                    onChange={handleChange}
                                    className={`w-full bg-slate-950/50 border ${errors.vistar_venue_group_id ? "border-red-500/50" : "border-slate-800"} focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all`}
                                    placeholder="e.g. VG-7729"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-3 mb-2 text-slate-300 uppercase text-[10px] font-bold tracking-widest">
                                    Communication
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User size={14} className="text-slate-500" />
                                        <label className="text-sm font-medium text-slate-300">Point of Contact Email</label>
                                    </div>
                                    <input
                                        type="email"
                                        name="poc_email"
                                        value={formData.poc_email}
                                        onChange={handleChange}
                                        className={`w-full bg-slate-950/50 border ${errors.poc_email ? "border-red-500/50" : "border-slate-800"} focus:border-cyan-500/50 rounded-xl p-3 text-white outline-none transition-all`}
                                        placeholder="poc@client.com"
                                    />
                                    {errors.poc_email && <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.poc_email}</p>}
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
                                        Intaking to Snowflake...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                        Submit Endpoint
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
