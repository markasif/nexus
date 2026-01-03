
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterEffectProps {
    words: string[];
    className?: string;
    cursorClassName?: string;
}

export const TypewriterEffect = ({
    words,
    className,
    cursorClassName,
}: TypewriterEffectProps) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = words[currentWordIndex];

        const typeSpeed = isDeleting ? 50 : 100;
        const deleteSpeed = 50;
        const pauseTime = 2000;

        const handleTyping = () => {
            if (!isDeleting) {
                // Typing
                if (currentText.length < word.length) {
                    setCurrentText(word.slice(0, currentText.length + 1));
                } else {
                    // Finished typing word, wait then delete
                    setTimeout(() => setIsDeleting(true), pauseTime);
                    return;
                }
            } else {
                // Deleting
                if (currentText.length > 0) {
                    setCurrentText(currentText.slice(0, -1));
                } else {
                    // Finished deleting, move to next word
                    setIsDeleting(false);
                    setCurrentWordIndex((prev) => (prev + 1) % words.length);
                    return;
                }
            }
        };

        const timer = setTimeout(handleTyping, isDeleting ? deleteSpeed : typeSpeed);
        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words]);

    return (
        <div className={className}>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
            >
                {currentText}
            </motion.span>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className={`inline-block w-[2px] h-[1em] bg-blue-500 ml-1 align-middle ${cursorClassName}`}
            />
        </div>
    );
};
