"use client";

import React, { useState, useEffect } from "react";
import { 
    Loader2, 
    AlertCircle, 
    ChevronRight, 
    ArrowLeft, 
    Edit2,
    Monitor,
    MapPin,
    Clock,
    Layers,
    User as UserIcon,
    Database,
    ShieldCheck,
    Box,
    Mail
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EndpointDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [endpoint, setEndpoint] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEndpoint = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }
                const response = await fetch(`http://localhost:3002/api/endpoints/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setEndpoint(result.data);
                } else {
                    setError(result.error || "Failed to fetch endpoint details");
                }
            } catch (err) {
                setError("Network error or server unavailable");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchEndpoint();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
                <Loader2 size={40} className="animate-spin text-cyan-500" />
                <p className="animate-pulse">Loading endpoint details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
                <AlertCircle size={40} className="text-red-500" />
                <p>{error}</p>
                <Link href="/dashboard/endpoints" className="text-cyan-400 hover:text-cyan-300 font-bold">Back to Browser</Link>
            </div>
        );
    }

    const DetailItem = ({ icon: Icon, label, value, subValue = "", color = "text-cyan-400" }: any) => (
        <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
            <div className={`p-2 rounded-xl bg-slate-900 border border-white/5 ${color}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</p>
                <p className="text-white font-semibold mt-1">{value || "N/A"}</p>
                {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
            </div>
        </div>
    );

    const StatusBadge = ({ label, status }: any) => {
        const colors = {
            active: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
            valid: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
            pending: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
            error: "text-red-400 border-red-500/30 bg-red-500/5",
            invalid: "text-red-400 border-red-500/30 bg-red-500/5"
        };
        const current = colors[status as keyof typeof colors] || "text-slate-400 border-slate-500/30 bg-slate-500/5";
        
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${current}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'valid' || status === 'active' ? 'bg-emerald-400' : status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                {label}: {status}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/dashboard/endpoints')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{endpoint.name}</h1>
                            <span className="text-cyan-400/50 font-mono text-sm">#{endpoint.id}</span>
                        </div>
                        <p className="text-slate-400 mt-1">{endpoint.address}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/endpoints/${id}/edit`}
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg border border-white/5"
                    >
                        <Edit2 size={18} />
                        Edit Details
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-6 rounded-3xl border-white/5 space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Calculated CPM</p>
                    <p className="text-2xl font-bold text-white">${(endpoint.cpmFloorCents / 100).toFixed(2)}</p>
                </div>
                <div className="glass p-6 rounded-3xl border-white/5 space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Impressions</p>
                    <p className="text-2xl font-bold text-white">{endpoint.impressionsPerSpot || "5.0"}</p>
                </div>
                <div className="glass p-6 rounded-3xl border-white/5 space-y-2 text-center flex flex-col items-center justify-center">
                    <StatusBadge label="INTAKE" status={endpoint.validationStatus} />
                </div>
                <div className="glass p-6 rounded-3xl border-white/5 space-y-2 text-center flex flex-col items-center justify-center">
                    <StatusBadge label="VISTAR" status={endpoint.vistarStatus} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                <div className="lg:col-span-2 space-y-8">
                    {/* Location & Infrastructure */}
                    <div className="glass p-8 rounded-3xl border-white/5 shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <MapPin className="text-cyan-400" size={20} />
                            <h2 className="text-xl font-bold text-white">Location & Infrastructure</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem icon={Monitor} label="Screen Placement" value={endpoint.screenType === 'inside' ? "Indoor Placement" : "Outdoor/Facade"} />
                            <DetailItem icon={MapPin} label="Geo Coordinates" value={`${endpoint.latitude}, ${endpoint.longitude}`} subValue="WGS84 Reference" />
                            <DetailItem icon={Clock} label="Operational Hours" value={endpoint.is24Hour ? "24/7 Operation" : `${endpoint.venueHoursOpen} - ${endpoint.venueHoursClose}`} subValue={endpoint.is24Hour ? "Always On" : "Fixed Schedule"} />
                            <DetailItem icon={ShieldCheck} label="Hardware Compliance" value={endpoint.isLgScreen ? "LG Commercial" : "Generic Display"} subValue={endpoint.isLgScreen ? "Cortex Integrated" : "No SSO Sync"} color="text-emerald-400" />
                        </div>
                    </div>

                    {/* Meta & Identity */}
                    <div className="glass p-8 rounded-3xl border-white/5 shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Layers className="text-orange-400" size={20} />
                            <h2 className="text-xl font-bold text-white">Platform Mapping</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem icon={Database} label="System Identifier" value={endpoint.id} subValue="Primary Source ID" color="text-orange-400" />
                            <DetailItem icon={Box} label="Vistar Venue Group" value={endpoint.vistarVenueGroupId} color="text-orange-400" />
                            <DetailItem icon={ShieldCheck} label="Venue Type" value={`Type ID: ${endpoint.venueTypeId}`} color="text-orange-400" />
                            <DetailItem icon={Mail} label="Point of Contact" value={endpoint.pocEmail} color="text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* System Sync Log */}
                    <div className="glass p-8 rounded-3xl border-white/5 shadow-2xl h-fit">
                        <h2 className="text-xl font-bold text-white mb-6">Synchronization Status</h2>
                        <div className="space-y-6">
                            {[
                                { name: "Snowflake Intake", status: endpoint.validationStatus, time: "2m ago" },
                                { name: "Vistar SSP", status: endpoint.vistarStatus, time: "Pending" },
                                { name: "Dropbox Folders", status: endpoint.dropboxStatus, time: "Queueing" },
                                { name: "Hivestack Sync", status: endpoint.hivestackStatus, time: "Waiting" },
                                { name: "Broadsign Feed", status: endpoint.broadsignStatus, time: "Awaiting Validation" }
                            ].map((sync, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${sync.status === 'valid' || sync.status === 'active' ? 'bg-emerald-500' : sync.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{sync.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">{sync.status}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">{sync.time}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Audit Information</p>
                            <p className="text-xs text-slate-400">Created: {new Date(endpoint.createdAt).toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-1">Modified: {new Date(endpoint.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
