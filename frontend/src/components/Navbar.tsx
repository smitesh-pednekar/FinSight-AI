"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    SignInButton,
    SignUpButton,
    UserButton,
    SignedIn,
    SignedOut
} from "@clerk/nextjs";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled
                    ? "bg-background/80 backdrop-blur-md border-border py-3"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative w-8 h-8 transition-transform duration-300 group-hover:scale-110 translate-x-1">
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

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Features
                        </Link>
                        <Link href="#process" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            How it Works
                        </Link>
                        <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Pricing
                        </Link>

                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25">
                                    Get Started
                                </button>
                            </SignUpButton>
                        </SignedOut>

                        <SignedIn>
                            <Link href="/documents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Archive
                            </Link>
                            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Search
                            </Link>
                            <Link href="/activity" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Activity
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-muted-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b p-6 space-y-6 animate-in slide-in-from-top-5 z-50">
                    <Link
                        href="#features"
                        className="block text-lg font-medium border-b border-white/5 pb-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Features
                    </Link>
                    <Link
                        href="#process"
                        className="block text-lg font-medium border-b border-white/5 pb-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        How it Works
                    </Link>
                    <Link
                        href="#pricing"
                        className="block text-lg font-medium border-b border-white/5 pb-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Pricing
                    </Link>

                    <SignedOut>
                        <div className="space-y-4 pt-4">
                            <SignInButton mode="modal">
                                <button className="block w-full text-center py-3 rounded-xl border border-white/10 font-medium" onClick={() => setMobileMenuOpen(false)}>
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="block w-full text-center py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" onClick={() => setMobileMenuOpen(false)}>
                                    Get Started
                                </button>
                            </SignUpButton>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <div className="space-y-4 pt-4">
                            <Link
                                href="/documents"
                                className="block w-full text-center py-3 rounded-xl bg-secondary font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Secure Archive
                            </Link>
                            <Link
                                href="/search"
                                className="block w-full text-center py-3 rounded-xl bg-secondary font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Semantic Search
                            </Link>
                            <Link
                                href="/activity"
                                className="block w-full text-center py-3 rounded-xl bg-secondary font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Activity Log
                            </Link>
                            <div className="flex justify-center pt-2">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </div>
                    </SignedIn>
                </div>
            )}
        </nav>
    );
}
