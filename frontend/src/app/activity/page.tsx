"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Loader2,
    FileText,
    CheckCircle2,
    AlertCircle,
    User,
    Calendar,
    ArrowUpRight,
    Clock,
    Filter
} from "lucide-react";
import { apiClient, type AuditLog } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function ActivityPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await apiClient.listAuditLogs({ page, page_size: 20 });
            setLogs(data.logs);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to load audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes("UPLOAD")) return <FileText className="w-4 h-4 text-blue-500" />;
        if (action.includes("PROCESS_COMPLETE")) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (action.includes("RESOLVE")) return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
        if (action.includes("DELETE")) return <AlertCircle className="w-4 h-4 text-red-500" />;
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-5xl mx-auto px-4 pt-32 lg:pt-48 pb-20 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <Activity className="w-3 h-3" />
                            System Telemetry
                        </motion.div>
                        <h1 className="text-4xl font-heading font-bold tracking-tight mb-3">Audit Trail</h1>
                        <p className="text-lg text-muted-foreground">Real-time recording of all secure financial operations.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium italic">Retrieving telemetry logs...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {logs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-secondary/10 hover:bg-secondary/20 border border-white/5 rounded-3xl p-6 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/5 rounded border border-primary/10">
                                                        {log.action.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(log.created_at)}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-foreground mb-1">{log.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        System User
                                                    </span>
                                                    {log.document_id && (
                                                        <Link
                                                            href={`/documents/${log.document_id}`}
                                                            className="flex items-center gap-1 text-primary hover:underline"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            View Document
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {log.changes && (
                                            <div className="hidden md:block">
                                                <div className="bg-black/40 rounded-xl p-3 border border-white/5 max-w-[200px] truncate">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Context</p>
                                                    <p className="text-[10px] text-muted-foreground truncate italic">
                                                        {JSON.stringify(log.changes)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Pagination */}
                        {total > 20 && (
                            <div className="mt-12 flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-3 border border-white/10 rounded-2xl hover:bg-secondary/50 disabled:opacity-20 transition-all font-bold text-sm"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-bold font-heading">
                                    Page <span className="text-primary">{page}</span> of {Math.ceil(total / 20)}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= Math.ceil(total / 20)}
                                    className="p-3 border border-white/10 rounded-2xl hover:bg-secondary/50 disabled:opacity-20 transition-all font-bold text-sm"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
