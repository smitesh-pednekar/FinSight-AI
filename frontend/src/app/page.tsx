"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BentoGrid } from "@/components/BentoGrid";
import { Process } from "@/components/Process";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { motion, useScroll, useSpring } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Marquee } from "@/components/Marquee";

export default function HomePage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="relative min-h-screen selection:bg-primary/20">
            <AnimatedBackground />
            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
                style={{ scaleX }}
            />

            <Navbar />

            <main>
                <Hero />

                <Marquee
                    items={["FINTECH.OS", "SECURELY", "DATASTREAM", "QUANTUM", "VENTURE.AI", "LIQUIDITY", "BLOCKCHAIN.FINANCE", "ASSET.CORE"]}
                    speed={25}
                />

                <BentoGrid />
                <Process />

                {/* Visual Intermission */}
                <section id="features" className="py-24 relative overflow-hidden bg-transparent">
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                    <div className="absolute inset-0 hero-glow opacity-30" />
                    <div className="max-w-7xl mx-auto px-4 relative text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-2xl md:text-5xl font-heading font-medium tracking-tight mb-8 md:mb-12 max-w-4xl mx-auto leading-tight px-2">
                                "The automation FinSight AI provides has reduced our document <br className="hidden md:block" />
                                processing time by over <span className="text-primary font-bold">85% in the first month</span>."
                            </h2>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 p-0.5 shadow-xl shadow-primary/20">
                                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center font-bold text-primary text-xl">
                                        SJ
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-xl">Sarah Jenkins</div>
                                    <div className="text-base text-muted-foreground">CTO, Global Finance Corp</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <Pricing />

                {/* FAQ Section */}
                <section id="process" className="py-24 bg-transparent relative border-y border-white/5">
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-heading font-bold mb-4 text-gradient">Frequently Asked Questions</h2>
                            <p className="text-muted-foreground">Everything you need to know about the platform.</p>
                        </div>
                        <div className="space-y-6">
                            {[
                                { q: "How secure is my financial data?", a: "We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your documents are processed in isolated environments with strict access controls." },
                                { q: "Which document formats are supported?", a: "We support PDF, PNG, JPG, and CSV. Our AI is specially trained on complex financial layouts like multi-page balance sheets and unconventional P&L statements." },
                                { q: "Can I integrate with my existing ERP?", a: "Yes, our Pro and Enterprise plans include full REST API access and pre-built connectors for SAP, Oracle Netsuite, and Microsoft Dynamics." },
                                { q: "What is the accuracy rate of data extraction?", a: "FinSight AI achieves over 99.2% accuracy on standard financial documents. For low-quality scans, our system flags low-confidence fields for human review." }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 md:p-8 rounded-3xl bg-secondary/10 border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <h3 className="text-lg md:text-xl font-heading font-bold mb-3">{item.q}</h3>
                                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{item.a}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 -z-10" />
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-7xl font-heading font-bold mb-6 md:mb-8 tracking-tighter leading-tight">
                                Ready to transform your <br className="hidden md:block" />
                                <span className="text-gradient">financial workflow?</span>
                            </h2>
                            <p className="text-lg md:text-xl text-muted-foreground mb-10 md:mb-12 leading-relaxed max-w-2xl mx-auto px-4">
                                Join over 500+ innovative teams using FinSight AI to scale their document operations and eliminate manual entry.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <a
                                    href="/upload"
                                    className="px-10 py-5 rounded-full bg-primary text-primary-foreground font-bold hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1 block w-full sm:w-auto text-lg"
                                >
                                    Get Started for Free
                                </a>
                                <a
                                    href="#"
                                    className="px-10 py-5 rounded-full bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all block w-full sm:w-auto text-lg"
                                >
                                    Schedule a Demo
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
