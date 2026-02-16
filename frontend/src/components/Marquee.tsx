"use client";

import { motion } from "framer-motion";

export const Marquee = ({
    items,
    direction = "left",
    speed = 20
}: {
    items: string[],
    direction?: "left" | "right",
    speed?: number
}) => {
    return (
        <div className="relative flex overflow-x-hidden border-y border-white/5 py-8 bg-black/20 backdrop-blur-sm">
            <motion.div
                animate={{
                    x: direction === "left" ? [0, -1500] : [-1500, 0],
                }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="flex whitespace-nowrap gap-8 md:gap-16 items-center"
            >
                {/* Internal duplication for seamless loop */}
                {[...items, ...items, ...items, ...items, ...items].map((item, i) => (
                    <span
                        key={i}
                        className="text-xl md:text-3xl font-heading font-bold tracking-tighter text-muted-foreground/30 hover:text-primary/50 transition-colors cursor-default select-none uppercase"
                    >
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};
