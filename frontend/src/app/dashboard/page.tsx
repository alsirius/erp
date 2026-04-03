"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    Monitor,
    MapPin,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    TrendingUp,
    Activity,
    PlusCircle,
    LogOut,
    User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/services/apiClient";
import { getInitials, formatDate } from "@/utils";

export default function DashboardPage() {
    const { user, logout, loading } = useAuth();
    const [recentEndpoints, setRecentEndpoints] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        const fetchRecent = async () => {
            setIsFetching(true);
            try {
                const response = await apiClient.get<any[]>("/snowflake/recent");
                if (response.success && response.data) {
                    setRecentEndpoints(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch recent endpoints:", error);
            } finally {
                setIsFetching(false);
            }
        };

        if (user) {
            fetchRecent();
        }
    }, [user]);

    const stats = [
        { name: "Total Endpoints", value: "1,284", icon: Monitor, color: "text-blue-400", trend: "+12%" },
        { name: "Pending Sync", value: "24", icon: Clock, color: "text-yellow-400", trend: "-5%" },
        { name: "Onboarded Today", value: "7", icon: PlusCircle, color: "text-emerald-400", trend: "+20%" },
        { name: "Synced Clients", value: "98%", icon: CheckCircle2, color: "text-cyan-400", trend: "0%" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-400 mt-2 text-lg">Welcome back, {user.firstName}. Weekly overview of operations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/onboarding"
                        className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                    >
                        <PlusCircle size={20} />
                        New Onboarding
                    </Link>
                    <button
                        onClick={() => logout()}
                        className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-900 border border-white/5 ${stat.trend.startsWith("+") ? "text-emerald-400" : stat.trend === "0%" ? "text-slate-500" : "text-red-400"}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">{stat.name}</h3>
                        <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 glass border-white/5 p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Activity className="text-cyan-400" />
                            <h2 className="text-xl font-bold text-white">Recent Snowflake Activity</h2>
                        </div>
                        <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300">View All</button>
                    </div>

                    <div className="space-y-6">
                        {isFetching ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                            </div>
                        ) : recentEndpoints.length > 0 ? (
                            recentEndpoints.map((endpoint, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5">
                                            <Monitor size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold flex items-center gap-2">
                                                {endpoint.NAME || endpoint.ENDPOINT_ID}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${endpoint.VALIDATION_STATUS === 'Valid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                    {endpoint.VALIDATION_STATUS || 'Pending'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <MapPin size={10} /> {endpoint.ADDRESS || 'Unknown Location'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{endpoint.CREATED_AT ? new Date(endpoint.CREATED_AT).toLocaleDateString() : 'Just now'}</p>
                                        <ArrowUpRight size={16} className="text-slate-600 group-hover:text-cyan-400 mt-1 ml-auto" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            [1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group opacity-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5">
                                            <Monitor size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold flex items-center gap-2">
                                                SN-NYC-1{i}2
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">Valid</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <MapPin size={10} /> Starbucks Times Square
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">2 hours ago</p>
                                        <ArrowUpRight size={16} className="text-slate-600 group-hover:text-cyan-400 mt-1 ml-auto" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="glass border-white/5 p-8 rounded-3xl">
                    <h2 className="text-xl font-bold text-white mb-8">System Connectivity</h2>
                    <div className="space-y-8">
                        {[
                            { name: "Snowflake Driver", status: "Connected", value: 100 },
                            { name: "Siriux Backend", status: "Active", value: 98 },
                            { name: "Vistar API", status: "Active", value: 98 },
                            { name: "Dropbox Client", status: "Authenticating", value: 45 },
                        ].map((sys, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300 font-medium">{sys.name}</span>
                                    <span className={`text-[10px] uppercase font-bold tracking-tight ${sys.status === "Connected" || sys.status === "Active" ? "text-emerald-400" : "text-yellow-400"}`}>
                                        {sys.status}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${sys.value > 90 ? "bg-emerald-500" : sys.value > 0 ? "bg-cyan-500" : "bg-slate-700"}`}
                                        style={{ width: `${sys.value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-start gap-3">
                        <TrendingUp className="text-orange-400 mt-1 shrink-0" size={18} />
                        <p className="text-xs text-orange-200 leading-relaxed italic">
                            The Dropbox API token will expire in 12 days. Please update credentials in System Settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
