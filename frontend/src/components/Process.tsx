"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, FileText, CheckCircle, Zap } from "lucide-react";

const steps = [
    {
        title: "Secure Infiltration",
        description: "Zero-trust ingestion of fragmented financial data through encrypted gateways.",
        icon: <Upload className="w-8 h-8" />,
    },
    {
        title: "Neural Synthesis",
        description: "Proprietary AI engines reconstruct documents into structured, queryable data lakes.",
        icon: <Cpu className="w-8 h-8" />,
    },
    {
        title: "Audit Validation",
        description: "Automated verification against IFRS/GAAP standards with full traceability.",
        icon: <FileText className="w-8 h-8" />,
    },
    {
        title: "Strategic Resolution",
        description: "Export high-fidelity reports and direct-to-ledger entries for final reconciliation.",
        icon: <CheckCircle className="w-8 h-8" />,
    }
];

export function Process() {
    return (
        <section id="process" className="py-24 bg-background relative border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                            Sophisticated logic <br />
                            <span className="text-primary italic">simplified for you.</span>
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                            We've spent years refining our algorithms so you can get accurate financial
                            intelligence in seconds, not hours.
                        </p>

                        <div className="space-y-8">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-heading font-bold mb-1">{step.title}</h3>
                                        <p className="text-muted-foreground">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent p-1">
                            <div className="w-full h-full rounded-3xl bg-secondary/30 backdrop-blur-3xl overflow-hidden border border-white/10 flex items-center justify-center">
                                {/* Visual representation of the process (simplified) */}
                                <div className="relative w-full h-full p-8 flex flex-col items-center justify-center gap-6">
                                    <div className="w-full h-12 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                                    <div className="w-3/4 h-12 bg-white/5 rounded-xl border border-white/5 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-full h-12 bg-primary/20 rounded-xl border border-primary/20 flex items-center px-4">
                                        <div className="w-2 h-2 rounded-full bg-primary mr-3 animate-ping" />
                                        <span className="text-sm font-medium">Extracting Net Income...</span>
                                    </div>
                                    <div className="w-1/2 h-12 bg-white/5 rounded-xl border border-white/5 animate-pulse" style={{ animationDelay: '0.4s' }} />

                                    {/* Abstract AI circle */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-primary/30 flex items-center justify-center">
                                        <div className="w-32 h-32 rounded-full border-2 border-primary/50 border-dashed animate-spin-slow" />
                                        <Cpu className="absolute w-12 h-12 text-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative floating cards */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 p-4 glass rounded-2xl border border-white/10 shadow-2xl"
                        >
                            <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accuracy</div>
                            <div className="text-xl font-heading font-bold">99.8%</div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-6 -left-6 p-4 glass rounded-2xl border border-white/10 shadow-2xl"
                        >
                            <Zap className="w-6 h-6 text-yellow-500 mb-2" />
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Speed</div>
                            <div className="text-xl font-heading font-bold">0.4s/pg</div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
