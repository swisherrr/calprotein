"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  duration?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < words.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(words.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50); // Faster typing speed

      return () => clearTimeout(timeout);
    } else {
      // Typing is complete, hide cursor after a short delay
      const hideCursorTimeout = setTimeout(() => {
        setIsTypingComplete(true);
      }, 1000); // Wait 1 second after typing completes

      return () => clearTimeout(hideCursorTimeout);
    }
  }, [currentIndex, words]);

  // Blinking cursor effect - only when typing is not complete
  useEffect(() => {
    if (isTypingComplete) return;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 600); // Slightly slower cursor blink for smoother appearance

    return () => clearInterval(cursorInterval);
  }, [isTypingComplete]);

  return (
    <div className={cn("font-mono", className)}>
      <div className="mt-4">
        <div className="dark:text-white text-black text-2xl leading-snug tracking-wide">
          {displayedText}
          {!isTypingComplete && (
            <motion.span
              animate={{ opacity: showCursor ? 1 : 0 }}
              transition={{ duration: 0.1 }}
              className="inline-block"
            >
              |
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}; 