
import React from "react";
import { motion } from "framer-motion";

interface ScrollRevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
}

export const ScrollReveal = ({ children, width = "fit-content", className = "" }: ScrollRevealProps & { className?: string }) => {
    return (
        <div style={{ position: "relative", width }} className={className}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 75 },
                    visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 0.5, delay: 0.25 }}
                viewport={{ once: true }}
                className="h-full"
            >
                {children}
            </motion.div>
        </div>
    );
};
