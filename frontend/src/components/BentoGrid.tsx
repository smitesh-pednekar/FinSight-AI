"use client";

import { motion } from "framer-motion";
import {
    Shield,
    Search,
    FileText,
    Zap,
    LineChart,
    Lock,
    Eye,
    RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
    {
        title: "Precision Ingestion Engine",
        description: "Zero-manual entry for complex financial stacks. Extract hundreds of metrics from multi-page PDFs with 99.9% OCR accuracy.",
        icon: <Zap className="w-6 h-6 text-indigo-400" />,
        className: "md:col-span-2",
        bg: "bg-indigo-500/20"
    },
    {
        title: "Conversational Audit",
        description: "Ask complex questions like 'What was our OpEx variance in Q3?' and get instant answers across thousands of documents.",
        icon: <Search className="w-6 h-6 text-blue-400" />,
        className: "md:col-span-1",
        bg: "bg-blue-500/20"
    },
    {
        title: "Proactive Risk Mitigation",
        description: "Autonomous fraud detection. Flag policy violations and duplicate invoices before they reach the general ledger.",
        icon: <Shield className="w-6 h-6 text-rose-400" />,
        className: "md:col-span-1",
        bg: "bg-rose-500/20"
    },
    {
        title: "Consolidated Intelligence",
        description: "Board-level visualizations with real-time reconciliation. Unified visibility across all entities and global currencies.",
        icon: <LineChart className="w-6 h-6 text-emerald-400" />,
        className: "md:col-span-2",
        bg: "bg-emerald-500/20"
    },
    {
        title: "Bank-Grade Security",
        description: "Security without compromise. Dedicated data silos and SOC2-ready infrastructure for sensitive financial data.",
        icon: <Lock className="w-6 h-6 text-amber-400" />,
        className: "md:col-span-1",
        bg: "bg-amber-500/20"
    },
    {
        title: "Enterprise Ecosystem",
        description: "Seamless integration with SAP, Oracle, and NetSuite. Native connectors to keep your financial pipeline synchronized.",
        icon: <RefreshCw className="w-6 h-6 text-purple-400" />,
        className: "md:col-span-1",
        bg: "bg-purple-500/20"
    }
];

export function BentoGrid() {
    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 px-4 md:px-0">
                    <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
                        Everything you need to <br />
                        <span className="text-primary italic">master your finance operations</span>
                    </h2>
                    <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                        Powerful tools designed for speed, accuracy, and reliability.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={cn(
                                "group relative p-8 rounded-3xl border border-white/5 overflow-hidden transition-all",
                                feature.className,
                                "bg-secondary/30 hover:bg-secondary/50"
                            )}
                        >
                            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 transition-opacity opacity-0 group-hover:opacity-40", feature.bg)} />
                            <div className="mb-4 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-heading font-bold mb-2 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
