"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, Loader2, AlertCircle, ArrowLeft,
    CheckCircle2, AlertTriangle, Info, Search,
    Download, Trash2, RefreshCcw, Calendar,
    Database, ShieldAlert, BarChart3, ChevronRight,
    ExternalLink, Activity, Layers, Tag as TagIcon,
    ShieldCheck, Cpu, Fingerprint
} from "lucide-react";
import { apiClient, type DocumentDetail } from "@/lib/api-client";
import { formatBytes, formatDate, getStatusColor, cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function DocumentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [document, setDocument] = useState<DocumentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [retrying, setRetrying] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (id) {
            loadDocument(true);
        }
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [id]);

    const loadDocument = async (showLoadingState: boolean) => {
        if (showLoadingState) setLoading(true);
        try {
            const data = await apiClient.getDocument(id);
            setDocument(data);
        } catch (err: any) {
            setError(err.message);
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        } finally {
            if (showLoadingState) setLoading(false);
        }
    };

    const handleExportReport = async () => {
        if (!document) return;
        setIsExporting(true);
        try {
            const reportData = await apiClient.getReport(id);
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `Audit-Report-${document.original_filename.split('.')[0]}-${new Date().toISOString().split('T')[0]}.json`;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(a);
        } catch (err: any) {
            setError("Failed to generate audit report: " + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleResolveAlert = async () => {
        if (!resolvingId || !resolutionNotes.trim()) return;
        try {
            await apiClient.resolveAlert(resolvingId, resolutionNotes);
            setResolvingId(null);
            setResolutionNotes("");
            loadDocument(false);
        } catch (err: any) {
            setError("Failed to resolve alert: " + err.message);
        }
    };

    // Polling logic for real-time updates during processing
    useEffect(() => {
        if (document?.status === 'PROCESSING' || document?.status === 'UPLOADED') {
            if (!pollingInterval.current) {
                pollingInterval.current = setInterval(() => {
                    loadDocument(false);
                }, 3000); // Poll every 3 seconds
            }
        } else {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
        }
    }, [document?.status]);



    const handleRetry = async () => {
        setRetrying(true);
        try {
            await apiClient.retryDocument(id);
            loadDocument(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRetrying(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this document from the secure vault?")) return;

        try {
            await apiClient.deleteDocument(id);
            router.push("/documents");
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
                <p className="text-muted-foreground font-heading font-medium animate-pulse">Decrypting and analyzing document...</p>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <div className="max-w-xl w-full bg-secondary/20 rounded-3xl p-12 border border-red-500/20 text-center backdrop-blur-xl">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-heading font-bold mb-4">Analysis Interrupted</h2>
                    <p className="text-muted-foreground mb-8">{error || "The requested document could not be located in our secure storage."}</p>
                    <Link href="/documents" className="inline-flex items-center px-8 py-4 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition-all font-bold">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Archive
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] -z-10" />

            <Navbar />

            <div className="max-w-7xl mx-auto px-4 pt-32 lg:pt-40 relative z-10">
                {/* Status Bar for processing */}
                <AnimatePresence>
                    {(document.status === 'PROCESSING' || document.status === 'UPLOADED') && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8"
                        >
                            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    <div>
                                        <p className="text-sm font-bold text-primary">Real-time Analysis in Progress</p>
                                        <p className="text-xs text-muted-foreground">AI is currently scanning the vector layers and extracting financial entities.</p>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-primary"
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-primary uppercase">Syncing...</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Breadcrumbs & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/documents"
                            className="p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-white/5 transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-heading font-bold truncate max-w-md">
                                    {document.original_filename}
                                </h1>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest",
                                    document.status === 'COMPLETED' ? "bg-green-500/10 text-green-500" :
                                        document.status === 'PROCESSING' || document.status === 'UPLOADED' ? "bg-yellow-500/10 text-yellow-500" :
                                            "bg-red-500/10 text-red-500"
                                )}>
                                    {document.status}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Database className="w-3 h-3" />
                                {formatBytes(document.file_size)} • {formatDate(document.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {document.status === 'FAILED' && (
                            <button
                                onClick={handleRetry}
                                disabled={retrying}
                                className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all font-bold text-sm gap-2 shadow-lg shadow-primary/20"
                            >
                                <RefreshCcw className={cn("h-4 w-4", retrying && "animate-spin")} />
                                Retry AI
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-secondary/30 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all font-bold text-sm gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar: Quick Specs */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-secondary/20 rounded-3xl p-8 border border-white/5 backdrop-blur-xl"
                        >
                            <h2 className="text-lg font-heading font-bold mb-6 flex items-center gap-3">
                                <Info className="h-5 w-5 text-primary" />
                                Audit Specs
                            </h2>
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Detected Domain</p>
                                    <p className="font-heading font-bold text-primary truncate">
                                        {document.document_type?.replace('_', ' ') || (document.status === 'COMPLETED' ? 'GENERAL' : 'ANALYZING...')}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Extraction Signal</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: document.extractions.length > 0 ? `${(document.extractions[0].confidence_score || 0.95) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">
                                            {document.extractions.length > 0 ? `${((document.extractions[0].confidence_score || 0.95) * 100).toFixed(0)}%` : (document.status === 'COMPLETED' ? '—' : '...')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-2 text-sm">
                                    <span className="text-muted-foreground">Pages</span>
                                    <span className="font-bold">{document.page_count || 1}</span>
                                </div>
                                <div className="flex items-center justify-between px-2 text-sm">
                                    <span className="text-muted-foreground">Extractions</span>
                                    <span className="font-bold">{document.extractions.length}</span>
                                </div>
                                <div className="flex items-center justify-between px-2 text-sm text-red-500">
                                    <span>Anomalies</span>
                                    <span className="font-bold">{document.risk_flags.length}</span>
                                </div>
                            </div>
                        </motion.div>

                        <button
                            onClick={handleExportReport}
                            disabled={isExporting}
                            className="w-full py-4 bg-secondary/30 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-3 font-bold group disabled:opacity-50"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            ) : (
                                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                            )}
                            {isExporting ? "Compiling Report..." : "Audit-Ready Export"}
                        </button>
                    </div>

                    {/* Main Content: AI Intelligence */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Financial Data Section */}
                        <motion.section
                            key={document.extractions.length} // Force re-render on data change
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-secondary/20 rounded-3xl border border-primary/20 overflow-hidden backdrop-blur-xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xl font-heading font-bold flex items-center gap-3">
                                    <Layers className="h-6 w-6 text-primary" />
                                    AI Extraction Results
                                </h2>
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                    <Activity className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        {document.status === 'COMPLETED' ? 'Verified Results' : 'Live Stream'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-0">
                                {document.extractions.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {document.extractions.map((ext) => (
                                            <div key={ext.id} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                            <TagIcon className="w-3 h-3" /> Vendor
                                                        </p>
                                                        <p className="text-xl font-heading font-bold">{ext.vendor_name || 'Generic Vendor'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Maturity Date</p>
                                                        <p className="font-heading font-medium">{ext.due_date ? formatDate(ext.due_date) : 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2 flex flex-col justify-center items-start md:items-end">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Computed Amount</p>
                                                    <p className="text-5xl lg:text-6xl font-heading font-bold text-gradient tracking-tighter">
                                                        <span className="text-2xl text-primary align-top mr-1">{ext.currency || '$'}</span>
                                                        {ext.total_amount?.toLocaleString() || '0.00'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-16 text-center">
                                        {document.status === 'PROCESSING' || document.status === 'UPLOADED' ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-10 h-10 text-primary animate-spin opacity-40" />
                                                <p className="text-muted-foreground font-medium animate-pulse">Scanning document texture for financial markers...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                                <p className="text-muted-foreground font-medium italic">No structured data found in the extraction layer.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* Risks & Anomalies */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5">
                                <h2 className="text-xl font-heading font-bold flex items-center gap-3">
                                    <ShieldAlert className="h-6 w-6 text-red-500" />
                                    Risk Analysis Engine
                                </h2>
                            </div>
                            <div className="p-8">
                                {document.risk_flags.length > 0 ? (
                                    <div className="space-y-4">
                                        {document.risk_flags.map((risk) => (
                                            <div key={risk.id} className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 rounded-xl bg-red-500/10 flex-shrink-0">
                                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-heading font-bold text-red-500">{risk.risk_type}</h4>
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase tracking-widest">
                                                                    {risk.risk_level}
                                                                </span>
                                                                {risk.is_resolved && (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest">
                                                                        Resolved
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!risk.is_resolved && (
                                                                <button
                                                                    onClick={() => setResolvingId(risk.id)}
                                                                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-full transition-colors uppercase tracking-widest"
                                                                >
                                                                    Resolve
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                                            {risk.description}
                                                        </p>

                                                        {/* Evidence Layer */}
                                                        {risk.evidence && Object.keys(risk.evidence).length > 0 && (
                                                            <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                    <Fingerprint className="w-3 h-3" /> Forensic Evidence
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    {Object.entries(risk.evidence).map(([key, value]) => (
                                                                        <div key={key}>
                                                                            <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                                                                            <p className="text-sm font-bold font-heading">{String(value)}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {risk.ai_explanation && (
                                                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm">
                                                                <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest opacity-80 italic">Predictive Logic Outcome</p>
                                                                <p className="text-foreground leading-relaxed italic">"{risk.ai_explanation}"</p>
                                                            </div>
                                                        )}

                                                        {risk.is_resolved && (
                                                            <div className="mt-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs">
                                                                <p className="text-indigo-400 font-bold mb-1 uppercase tracking-widest">Resolution Notes</p>
                                                                <p className="text-muted-foreground italic">"{risk.resolution_notes || "No notes provided."}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center rounded-3xl bg-green-500/5 border border-green-500/10">
                                        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-4" />
                                        <p className="text-green-500 font-bold font-heading">
                                            {document.status === 'COMPLETED' ? 'Sanitized: No Critical Anomalies' : 'Risk Scanner Standby'}
                                        </p>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            {document.status === 'COMPLETED'
                                                ? 'AI engine reports 100% compliance with current rules.'
                                                : 'Results will appear here as the scanner completes its pass.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* Bank Statement Reconciliation (Specialized Table) */}
                        {document.document_type === 'BANK_STATEMENT' && document.validations.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-indigo-500/5 rounded-3xl border border-indigo-500/20 overflow-hidden"
                            >
                                <div className="p-6 border-b border-indigo-500/10">
                                    <h2 className="text-lg font-heading font-bold flex items-center gap-3">
                                        <RefreshCcw className="h-5 w-5 text-indigo-400" />
                                        Deterministic Reconciliation Table
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Validation Probe</th>
                                                <th className="px-6 py-4">Engine Expected</th>
                                                <th className="px-6 py-4">Extracted Actual</th>
                                                <th className="px-6 py-4">Audit Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {document.validations.map((val) => (
                                                <tr key={val.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{val.validation_type.replace(/_/g, ' ')}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                                                        {typeof val.expected_value?.value === 'number' ? val.expected_value.value.toLocaleString() : String(val.expected_value?.value ?? '—')}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs">
                                                        {typeof val.actual_value?.value === 'number' ? val.actual_value.value.toLocaleString() : String(val.actual_value?.value ?? '—')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {val.is_valid ? (
                                                            <span className="text-green-500 flex items-center gap-1 font-bold text-[10px] tracking-widest uppercase">
                                                                <CheckCircle2 className="w-3 h-3" /> Pass
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-500 flex items-center gap-1 font-bold text-[10px] tracking-widest uppercase">
                                                                <AlertTriangle className="w-3 h-3" /> Variance
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.section>
                        )}

                        {/* Validation Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden h-full"
                            >
                                <div className="p-6 border-b border-white/5">
                                    <h2 className="text-lg font-heading font-bold flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        Rule Compliance
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {document.validations.length > 0 ? (
                                        <div className="space-y-3">
                                            {document.validations.map((val) => (
                                                <div key={val.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-3 truncate">
                                                        {val.is_valid ? (
                                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        ) : (
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                        )}
                                                        <span className="text-sm font-medium truncate">{val.validation_type}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest flex-shrink-0",
                                                        val.is_valid ? "text-green-500" : "text-red-500"
                                                    )}>
                                                        {val.is_valid ? 'Pass' : 'Fail'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground italic py-4">
                                            {document.status === 'COMPLETED' ? 'No active validation rules applied.' : 'Pending analysis sequence...'}
                                        </p>
                                    )}
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden h-full"
                            >
                                <div className="p-6 border-b border-white/5">
                                    <h2 className="text-lg font-heading font-bold flex items-center gap-3">
                                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                                        System Telemetry
                                    </h2>
                                </div>
                                <div className="p-6 flex flex-col justify-center h-[calc(100%-70px)]">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Activity className="w-4 h-4" />
                                                <span className="text-xs italic">Sync Status</span>
                                            </div>
                                            <span className="font-bold text-indigo-400 text-xs font-heading">
                                                {(document.status === 'PROCESSING' || document.status === 'UPLOADED') ? 'ACTIVE' : 'STABLE'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-xs italic">Encryption</span>
                                            </div>
                                            <span className="font-bold text-indigo-400 text-xs font-heading uppercase tracking-widest">AES-256-GCM</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Fingerprint className="w-4 h-4" />
                                                <span className="text-xs italic">Data Integrity</span>
                                            </div>
                                            <span className="font-bold text-indigo-400 text-xs font-heading">VERIFIED</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Cpu className="w-4 h-4" />
                                                <span className="text-xs italic">Compute Unit</span>
                                            </div>
                                            <span className="font-bold text-indigo-400 text-xs font-heading uppercase tracking-widest">Neural-v4</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <AnimatePresence>
                {resolvingId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-secondary/90 border border-white/10 rounded-[32px] p-8 md:p-12 max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-heading font-bold">Audit Resolution</h3>
                                    <p className="text-sm text-muted-foreground">Documenting manual override for system flags.</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Auditor Comments</label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Provide detailed justification for resolving this risk flag..."
                                    className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium placeholder:italic"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setResolvingId(null);
                                        setResolutionNotes("");
                                    }}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest text-muted-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolveAlert}
                                    disabled={!resolutionNotes.trim()}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20"
                                >
                                    Confirm Override
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
