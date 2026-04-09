"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Eye,
    MoreVertical,
    Plus,
    Monitor,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EndpointsBrowserPage() {
    const router = useRouter();
    const [endpoints, setEndpoints] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState({ key: "updated_at", direction: "desc" });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const fetchEndpoints = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error("No auth token found, redirecting to login");
                router.push('/login');
                return;
            }
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sort: JSON.stringify({ [sortConfig.key]: sortConfig.direction }),
            });

            if (searchTerm) {
                queryParams.append("filters", JSON.stringify({ name: { "$like": searchTerm } }));
            } else if (statusFilter !== "all") {
                queryParams.append("filters", JSON.stringify({ validationStatus: statusFilter }));
            }

            const response = await fetch(`http://localhost:3002/api/endpoints?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setEndpoints(result.data);
                setPagination(prev => ({ ...prev, ...result.pagination }));
            }
        } catch (error) {
            console.error("Failed to fetch endpoints", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEndpoints();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, sortConfig, pagination.page]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Endpoint Browser</h1>
                    <p className="text-slate-400 mt-1">Manage and monitor all Smartify endpoints.</p>
                </div>
                <Link
                    href="/dashboard/onboarding"
                    className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                    <Plus size={20} />
                    Onboard New
                </Link>
            </div>

            <div className="glass border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                {/* Filters/Search Header */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                            <Filter size={16} className="text-slate-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent text-sm text-slate-300 focus:outline-none appearance-none cursor-pointer pr-4"
                            >
                                <option value="all">All Statuses</option>
                                <option value="valid">Valid</option>
                                <option value="pending">Pending</option>
                                <option value="invalid">Invalid</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <th className="px-6 py-4">
                                    <button onClick={() => handleSort("id")} className="flex items-center gap-2 hover:text-white transition-colors">
                                        Endpoint ID <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="px-6 py-4">
                                    <button onClick={() => handleSort("name")} className="flex items-center gap-2 hover:text-white transition-colors">
                                        Name & Address <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-center">Type</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">
                                    <button onClick={() => handleSort("updated_at")} className="flex items-center gap-2 hover:text-white transition-colors">
                                        Last Updated <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : endpoints.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                            <Monitor size={48} className="opacity-20" />
                                            <p>No endpoints found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                endpoints.map((endpoint) => (
                                    <tr key={endpoint.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-cyan-400 font-mono text-sm">{endpoint.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{endpoint.name}</span>
                                                <span className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{endpoint.address || "No address provided"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold ${endpoint.screen_type === 'inside'
                                                    ? "border-blue-500/30 text-blue-400 bg-blue-500/5"
                                                    : "border-orange-500/30 text-orange-400 bg-orange-500/5"
                                                }`}>
                                                {endpoint.screen_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                {endpoint.validationStatus === 'valid' ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                ) : endpoint.validationStatus === 'invalid' ? (
                                                    <AlertCircle size={18} className="text-red-500" />
                                                ) : (
                                                    <Loader2 size={18} className="text-yellow-500 animate-spin" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(endpoint.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/endpoints/${endpoint.id}`}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/endpoints/${endpoint.id}/edit`}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-white">{pagination.total}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
