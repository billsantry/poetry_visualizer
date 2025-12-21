import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageSlideshow = ({ images, currentIndex, onIndexChange, onComplete }) => {
    // Safety check: Ensure current image exists (is generated) before rendering
    const currentImage = images[currentIndex];

    useEffect(() => {
        // If image isn't ready yet, pause the timer (don't advance)
        if (!images[currentIndex]) return;

        const currentSegment = images[currentIndex].segment;
        // Total animation entry time: last char delay (0.03s * length) + transition duration (0.3s)
        const entryAnimationMs = (currentSegment.length * 30) + 300;
        const dwellTimeMs = 7000;
        const totalDuration = entryAnimationMs + dwellTimeMs;

        const timer = setTimeout(() => {
            const nextIndex = currentIndex + 1;
            // Only advance if we haven't reached the "end" of the PLANNED images
            // We don't check images.length here because it might be sparse/growing
            // Instead, we rely on the parent (Visualizer) to manage when "finished" happens
            // But for safety, let's assume if nextIndex exists in the array, we go.
            // If it doesn't exist yet, we might want to wait?
            // Actually, simplest logic: Try to advance. If parent updates index and image isn't there,
            // the next render will hit the "Loading" state below.

            // However, we need to know if we are TRULY done. 
            // The Visualizer component knows the total count (prompts.length).
            // But here we only simply check if we can move forward.

            // Better logic: Only advance if the NEXT image is also ready? 
            // No, standard buffering is: Show current, if next isn't ready when time is up, show loader.

            // Check if we are at the last POSSIBLE image (based on array length known so far)
            // Ideally we'd know totalImagesExpected. 
            // For now, let's just trigger the change. The next render handles the waiting.

            if (nextIndex < images.length) {
                onIndexChange(nextIndex);
            } else {
                if (onComplete) onComplete();
            }
        }, totalDuration);

        return () => clearTimeout(timer);
    }, [currentIndex, images, onIndexChange, onComplete, currentImage]);

    // Render Loading/Buffering state if image is missing
    if (!currentImage) {
        return (
            <div className="relative w-full h-screen flex flex-col items-center justify-center bg-black">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                <p className="text-white/40 text-sm tracking-widest uppercase font-serif">Buffering Next Scene...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <AnimatePresence mode="popLayout">
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
