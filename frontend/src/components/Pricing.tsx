"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Seed",
        price: "$0",
        description: "Fundamental extraction for solo practitioners",
        features: ["100 documents/mo", "Basic AI synthesis", "Email support", "Audit logs"],
        notIncluded: ["Conversational AI", "ERP Connectors", "Risk engine"],
        buttonText: "Start for free",
        href: "/upload",
        popular: false
    },
    {
        name: "Growth",
        price: "$149",
        description: "Full intelligence suite for emerging teams",
        features: ["Unlimited processing", "Predictive risk engine", "Conversational Audit", "NetSuite/SAP sync", "Priority 1 support"],
        notIncluded: [],
        buttonText: "Scale Now",
        href: "/upload",
        popular: true
    },
    {
        name: "Quantum",
        price: "Custom",
        description: "Maximum compliance for global firms",
        features: ["Dedicated LLM instance", "On-premise deployment", "Air-gapped security", "24/7 Strategic Pod", "Custom AI training"],
        notIncluded: [],
        buttonText: "Contact Sales",
        href: "#",
        popular: false
    }
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-background relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 px-4 md:px-0">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
                        Simple, transparent <br />
                        <span className="text-primary italic">pricing for every team.</span>
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                        Choose the plan that fits your needs. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn(
                                "relative p-8 rounded-3xl border transition-all duration-300",
                                plan.popular
                                    ? "bg-secondary/40 border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10"
                                    : "bg-secondary/20 border-white/5 hover:border-white/10"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                                </div>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground line-through opacity-50">
                                        <X className="w-5 h-5" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={plan.href}
                                className={cn(
                                    "block w-full text-center py-4 rounded-xl font-bold transition-all",
                                    plan.popular
                                        ? "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
                                        : "bg-white/5 text-foreground hover:bg-white/10 border border-white/10"
                                )}
                            >
                                {plan.buttonText}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
