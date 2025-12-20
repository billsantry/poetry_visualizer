import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageSlideshow = ({ images, currentIndex, onIndexChange, onComplete }) => {
    useEffect(() => {
        const currentSegment = images[currentIndex].segment;
        // Total animation entry time: last char delay (0.03s * length) + transition duration (0.3s)
        const entryAnimationMs = (currentSegment.length * 30) + 300;
        const dwellTimeMs = 7000;
        const totalDuration = entryAnimationMs + dwellTimeMs;

        const timer = setTimeout(() => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < images.length) {
                onIndexChange(nextIndex);
            } else {
                if (onComplete) onComplete();
            }
        }, totalDuration);

        return () => clearTimeout(timer);
    }, [currentIndex, images, onIndexChange, onComplete]);

    const currentImage = images[currentIndex];

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <AnimatePresence>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.0 }}
                    animate={{ opacity: 1, scale: 1.15 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        opacity: { duration: 2, ease: "easeInOut" },
                        scale: { duration: 12, ease: "linear" }
                    }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${currentImage.url})`,
                            filter: 'brightness(0.7)'
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Progress indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => onIndexChange(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/40'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageSlideshow;
