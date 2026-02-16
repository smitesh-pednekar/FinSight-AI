"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Loader2,
    AlertCircle,
    Upload,
    Search,
    Filter,
    ChevronRight,
    Calendar,
    Database,
    Tag,
    ArrowUpRight
} from "lucide-react";
import { apiClient, type Document } from "@/lib/api-client";
import { formatBytes, formatDate, getStatusColor, cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [filter, setFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadDocuments();
    }, [filter, page]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await apiClient.listDocuments({
                page,
                page_size: 20,
                status: filter || undefined,
            });
            setDocuments(data.documents);
            setTotal(data.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-heading font-bold mb-3 tracking-tight">Archive</h1>
                        <p className="text-lg text-muted-foreground">Manage and analyze your processed financial data.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-secondary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer w-full text-sm font-medium"
                            >
                                <option value="">All Statuses</option>
                                <option value="UPLOADED">Uploaded</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>
                        <Link
                            href="/upload"
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all text-sm whitespace-nowrap"
                        >
                            <Upload className="w-4 h-4" />
                            New Document
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 text-red-500">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold mb-1">Retrieval Error</h4>
                            <p className="text-sm opacity-90">{error}</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium">Accessing secure archives...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-secondary/10 rounded-3xl p-20 text-center border border-white/5"
                    >
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-heading font-bold mb-3">No documents found</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Start by uploading your first financial document to see the AI in action.
                        </p>
                        <Link href="/upload" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:shadow-xl transition-all">
                            <Upload className="w-5 h-5" />
                            Upload Now
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map((doc, index) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    href={`/documents/${doc.id}`}
                                    className="group block bg-secondary/20 hover:bg-secondary/30 border border-white/5 hover:border-primary/30 rounded-3xl p-6 transition-all h-full relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight className="w-5 h-5 text-primary" />
                                    </div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <h3 className="font-heading font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                                                {doc.original_filename}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                    doc.status === 'COMPLETED' ? "bg-green-500/10 text-green-500" :
                                                        doc.status === 'PROCESSING' ? "bg-yellow-500/10 text-yellow-500" :
                                                            "bg-red-500/10 text-red-500"
                                                )}>
                                                    {doc.status}
                                                </span>
                                                {doc.document_type && doc.document_type !== 'UNKNOWN' && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-secondary/50 text-muted-foreground font-bold uppercase tracking-wider">
                                                        {doc.document_type.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Database className="w-4 h-4" />
                                            <span>{formatBytes(doc.file_size)}</span>
                                            {doc.page_count && <span>• {doc.page_count} pages</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(doc.created_at)}</span>
                                        </div>
                                    </div>

                                    {doc.error_message && (
                                        <div className="mt-4 p-3 bg-red-500/10 rounded-xl text-xs text-red-500 leading-tight">
                                            {doc.error_message}
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {documents.length > 0 && total > 20 && (
                    <div className="mt-12 flex justify-center items-center gap-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-3 border border-white/10 rounded-2xl hover:bg-secondary/50 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <span className="text-sm font-bold font-heading">
                            Page <span className="text-primary">{page}</span> of {Math.ceil(total / 20)}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= Math.ceil(total / 20)}
                            className="p-3 border border-white/10 rounded-2xl hover:bg-secondary/50 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
