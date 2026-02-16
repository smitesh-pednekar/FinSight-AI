"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search as SearchIcon,
    Loader2,
    FileText,
    ChevronRight,
    ArrowUpRight,
    MessageSquare,
    Zap
} from "lucide-react";
import { apiClient, type SearchResult } from "@/lib/api-client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const data = await apiClient.search({ query });
            setResults(data.results);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-5xl mx-auto px-4 pt-32 lg:pt-48 pb-20 relative z-10">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6"
                    >
                        <Zap className="w-3 h-3" />
                        Semantic Search Engine
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-6xl font-heading font-bold mb-6 tracking-tight"
                    >
                        Ask your <span className="text-gradient">data anything.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        Search across all your financial documents using natural language.
                        Our AI understands context, not just keywords.
                    </motion.p>
                </div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handleSearch}
                    className="relative max-w-3xl mx-auto mb-16"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <SearchIcon className="ml-6 w-6 h-6 text-muted-foreground" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. 'What was the total net income in Q3 from all bank statements?'"
                                className="w-full bg-transparent px-6 py-6 text-lg focus:outline-none placeholder:text-muted-foreground/50"
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="mr-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                            </button>
                        </div>
                    </div>
                </motion.form>

                <AnimatePresence>
                    {searched && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                <h3 className="text-xl font-heading font-bold flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    AI-Retrieved Insights
                                </h3>
                                <p className="text-sm text-muted-foreground">Found {results.length} relevant fragments</p>
                            </div>

                            {loading ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-muted-foreground font-medium italic">Scanning vector database...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {results.map((result, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="group bg-secondary/10 hover:bg-secondary/20 border border-white/5 rounded-3xl p-8 transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/documents/${result.document_id}`}>
                                                    <ArrowUpRight className="w-5 h-5 text-primary" />
                                                </Link>
                                            </div>

                                            <div className="flex items-start gap-6">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                        <span>{result.document_filename}</span>
                                                        <span>•</span>
                                                        <span className="text-primary">{result.document_type}</span>
                                                        {result.page_number && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Page {result.page_number}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <p className="text-foreground leading-relaxed italic text-lg mb-4">
                                                        "{result.chunk_text}"
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary/50"
                                                                style={{ width: `${result.similarity_score * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                            Match Confidence: {(result.similarity_score * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-secondary/5 rounded-3xl border border-dashed border-white/10">
                                    <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <p className="text-muted-foreground italic">We couldn't find any direct matches in the archive.</p>
                                    <p className="text-sm text-muted-foreground/60 mt-2">Try rephrasing your question or uploading more documents.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}
