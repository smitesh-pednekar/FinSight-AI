"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Filter,
    ArrowUpRight,
    Calendar,
    FileText,
    ExternalLink
} from "lucide-react";
import { apiClient, type Alert } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [filter, setFilter] = useState<string>("");

    useEffect(() => {
        loadAlerts();
    }, [filter]);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const data = await apiClient.listAlerts({
                risk_level: filter || undefined,
                is_resolved: false
            });
            setAlerts(data.alerts);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            await apiClient.resolveAlert(id, "Manually reviewed and resolved.");
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (err: any) {
            console.error("Resolution failed:", err);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-red-500/5 blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-heading font-bold mb-3 tracking-tight">Risk Center</h1>
                        <p className="text-lg text-muted-foreground">Monitor and mitigate financial anomalies across all entities.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-secondary/20 border border-white/10 rounded-2xl appearance-none cursor-pointer w-full text-sm font-medium"
                            >
                                <option value="">All Priorities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 text-red-500">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold mb-1">Alert Sync Error</h4>
                            <p className="text-sm opacity-90">{error}</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium">Scanning for risks...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-secondary/10 rounded-3xl p-20 text-center border border-white/5"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-heading font-bold mb-3">All clear!</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            No unhandled risks or anomalies detected in your recent document sets.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-secondary/20 hover:bg-secondary/30 border border-white/5 rounded-3xl p-8 transition-all overflow-hidden relative"
                            >
                                <div className={cn(
                                    "absolute top-0 left-0 w-1 h-full",
                                    alert.risk_level === 'CRITICAL' ? "bg-red-500" :
                                        alert.risk_level === 'HIGH' ? "bg-orange-500" :
                                            "bg-yellow-500"
                                )} />

                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                                                alert.risk_level === 'CRITICAL' ? "bg-red-500 text-white" :
                                                    alert.risk_level === 'HIGH' ? "bg-orange-500 text-white" :
                                                        "bg-yellow-500 text-black"
                                            )}>
                                                {alert.risk_level}
                                            </span>
                                            <h3 className="font-heading font-bold text-xl">{alert.risk_type}</h3>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed mb-6 italic">
                                            "{alert.description}"
                                        </p>
                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <Link
                                                href={`/documents/${alert.document_id}`}
                                                className="flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {alert.document_filename}
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(alert.created_at)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row lg:flex-col items-center gap-3 w-full lg:w-auto">
                                        <button
                                            onClick={() => handleResolve(alert.id)}
                                            className="flex-1 lg:w-40 py-3 bg-secondary/50 hover:bg-white/5 rounded-2xl font-bold text-sm transition-all border border-white/5"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={() => handleResolve(alert.id)}
                                            className="flex-1 lg:w-40 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/10"
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
