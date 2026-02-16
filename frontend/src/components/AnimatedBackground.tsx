"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedBackground = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 -z-20 overflow-hidden bg-[#030303]">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                    maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
                }}
            />

            {/* Moving Beams */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        top: ["-100%", "200%"],
                        left: ["10%", "40%"],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute w-[1px] h-[300px] bg-gradient-to-b from-transparent via-primary/50 to-transparent rotate-[35deg]"
                />
                <motion.div
                    animate={{
                        top: ["-100%", "200%"],
                        left: ["60%", "90%"],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 2,
                    }}
                    className="absolute w-[1px] h-[400px] bg-gradient-to-b from-transparent via-purple-500/30 to-transparent rotate-[35deg]"
                />
                <motion.div
                    animate={{
                        top: ["-100%", "200%"],
                        left: ["30%", "10%"],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 5,
                    }}
                    className="absolute w-[1px] h-[250px] bg-gradient-to-b from-transparent via-blue-400/40 to-transparent rotate-[35deg]"
                />
            </div>

            {/* Aurora / Mesh Gradients */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[130px]"
            />
            <motion.div
                animate={{
                    x: [0, -100, 0],
                    y: [0, 100, 0],
                    scale: [1.2, 1, 1.2],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-600/10 blur-[130px]"
            />
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute bottom-[10%] left-[20%] w-[30%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"
            />

            {/* Interactive Mouse Glow */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                animate={{
                    x: mousePosition.x - 200,
                    y: mousePosition.y - 200,
                }}
                style={{
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, hsla(246, 83%, 60%, 0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    zIndex: -10,
                }}
            />

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};
