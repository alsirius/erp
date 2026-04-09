"use client";

import React, { useState, useEffect } from "react";
import EndpointForm from "@/components/endpoints/EndpointForm";
import { Loader2, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditEndpointPage() {
    const params = useParams();
    const id = params.id as string;
    const [endpoint, setEndpoint] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEndpoint = async () => {
            try {
                const token = localStorage.getItem('authToken');
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-bold"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <EndpointForm initialData={endpoint} isEdit={true} />
        </div>
    );
}
