"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Shield, Zap, Search } from "lucide-react";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Spotlight Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-50">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
                    >
                        <Zap className="w-3 h-3" />
                        <span>v1.0 is now live</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-heading font-bold tracking-tight mb-8"
                    >
                        The Operating System for <br />
                        <span className="text-gradient font-extrabold italic inline-block pr-2">Modern Finance Intelligence</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed px-4 md:px-0"
                    >
                        Orchestrate complex document workflows with autonomous ingestion,
                        predictive risk modeling, and real-time ledger reconciliation.
                        Built for the next generation of CFOs.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/upload"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center group hover:shadow-xl hover:shadow-primary/20 transition-all hover:-translate-y-1"
                        >
                            Start Analyzing Now
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-secondary text-secondary-foreground font-semibold flex items-center justify-center hover:bg-secondary/80 transition-all"
                        >
                            <Play className="mr-2 w-4 h-4 fill-current" />
                            Watch Demo
                        </button>
                    </motion.div>

                    {/* Trusted by / Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="mt-20 pt-10 border-t border-white/5"
                    >
                        <p className="text-sm font-medium text-muted-foreground mb-8">POWERING INNOVATIVE FINANCE TEAMS</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* SVG logos would go here, using text for now to keep it clean */}
                            <span className="text-xl font-bold tracking-tighter">FINTECH.OS</span>
                            <span className="text-xl font-bold tracking-tighter">SECURELY</span>
                            <span className="text-xl font-bold tracking-tighter">DATASTREAM</span>
                            <span className="text-xl font-bold tracking-tighter">QUANTUM</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
