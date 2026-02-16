"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="py-20 bg-background border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-3 mb-6 group">
                            <div className="relative w-8 h-8 translate-x-1">
                                <img
                                    src="/finsight-logo.png"
                                    alt="FinSight AI Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="text-xl font-heading font-bold tracking-tighter">
                                FinSight <span className="text-primary">AI</span>
                            </span>
                        </Link>
                        <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
                            Empowering finance teams with intelligent document processing and real-time risk analysis.
                            Build for the future of fintech.
                        </p>
                        <div className="flex items-center space-x-4">
                            <Link href="#" className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-primary transition-colors">
                                <Github className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#process" className="hover:text-primary transition-colors">How it Works</Link></li>
                            <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/upload" className="hover:text-primary transition-colors">API Docs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground text-center md:text-left">
                    <p>© 2026 FinSight AI. All rights reserved.</p>
                    <p>Designed for the next generation of financial intelligence.</p>
                </div>
            </div>
        </footer>
    );
}
