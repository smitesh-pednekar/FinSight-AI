"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatBytes, cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError("");
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const document = await apiClient.uploadDocument(file);
            setSuccess(true);
            setTimeout(() => {
                router.push(`/documents/${document.id}`);
            }, 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-4xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Overview
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-heading font-bold mb-3 tracking-tight">Upload Documents</h1>
                    <p className="text-lg text-muted-foreground">Securely process invoices, bank statements, and reports.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            className={cn(
                                "border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 relative",
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-white/10 bg-secondary/20 hover:border-white/20 hover:bg-secondary/30"
                            )}
                        >
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                <Upload className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-heading font-bold mb-4">
                                Drag and drop your file here
                            </h3>
                            <p className="text-muted-foreground mb-8 text-lg">
                                Support for PDF, PNG, JPG, and DOCX (up to 50MB)
                            </p>
                            <label className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
                                Browse Locally
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="file-details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-secondary/30 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-heading font-bold mb-1 truncate max-w-md">{file.name}</h3>
                                        <p className="text-muted-foreground">{formatBytes(file.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={uploading}
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-500"
                                >
                                    <AlertCircle className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold">Upload Failed</h4>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start space-x-3 text-green-500"
                                >
                                    <CheckCircle className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold">Successfully Uploaded!</h4>
                                        <p className="text-sm">Initiating AI analysis and risk engine...</p>
                                    </div>
                                </motion.div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={uploading || success}
                                className="w-full py-5 bg-primary text-primary-foreground rounded-full font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-3"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : success ? (
                                    "Redirecting..."
                                ) : (
                                    "Confirm and Analyze"
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-secondary/10 border border-white/5">
                        <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            Data Ingestion
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Our proprietary OCR engine extracts text and structure with spatial awareness,
                            preserving the context of tables and line items.
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-secondary/10 border border-white/5">
                        <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            AI Validation
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Automatically run over 50+ financial consistency checks to ensure the data
                            provided is mathematically sound and compliant.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
