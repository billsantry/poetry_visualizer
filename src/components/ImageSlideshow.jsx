import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageSlideshow = ({ images, currentIndex, onIndexChange }) => {
    useEffect(() => {
        // Auto-advance every 5 seconds
        const interval = setInterval(() => {
            onIndexChange((currentIndex + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, images.length, onIndexChange]);

    const currentImage = images[currentIndex];

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
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
