import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { analyzePoem, createRandom } from '../utils/analyzer';
import { generateImagePrompts } from '../utils/imagePromptGenerator';
import { generateImages } from '../utils/openaiClient';
import ImageSlideshow from './ImageSlideshow';
import Scene from './Scene';
import WorldBuilder from './WorldBuilder';

const Visualizer = ({ poem, onBack }) => {
    const analysis = useMemo(() => analyzePoem(poem), [poem]);
    const rnd = useMemo(() => createRandom(poem), [poem]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const generateVisualization = async () => {
            setLoading(true);
            setError(null);

            try {
                // Generate prompts from the poem
                const prompts = generateImagePrompts(poem, analysis, false);

                // Clear any existing images
                setImages([]);

                // Generate images incrementally to start visualization faster
                // Generate images in parallel to save time
                const imagePromises = prompts.map(async (promptData, i) => {
                    try {
                        const [generatedImage] = await generateImages([promptData]);

                        setImages(prev => {
                            const newImages = [...prev];
                            newImages[i] = generatedImage;
                            return newImages;
                        });

                        // Once the first image is ready, start the visualization
                        if (i === 0) {
                            setLoading(false);
                        }

                        return generatedImage;
                    } catch (imageErr) {
                        console.error(`Failed to generate image for segment ${i}:`, imageErr);
                        if (i === 0) throw imageErr;
                        return null;
                    }
                });

                await Promise.all(imagePromises);
            } catch (err) {
                console.error('Generation error:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        generateVisualization();
    }, [poem, analysis]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-screen bg-black overflow-hidden"
        >
            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-[#0a0a10]">
                    <div className="w-16 h-[1px] bg-white/20 mb-8 animate-pulse" />
                    <p className="text-white text-2xl mb-2 font-normal" style={{ fontFamily: "'EB Garamond', serif", letterSpacing: '0.05em' }}>
                        Preparing the Visualization
                    </p>
                    <p className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: "'EB Garamond', serif" }}>
                        Please wait a moment
                    </p>
                    <div className="w-16 h-[1px] bg-white/20 mt-8 animate-pulse" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
                        <h2 className="text-red-400 text-xl font-bold mb-2">Generation Failed</h2>
                        <p className="text-white/80 text-sm mb-4">{error}</p>
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            )}

            {/* Finale / Gallery View */}
            {isFinished && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 bg-[#050510] overflow-y-auto"
                >
                    <div className="relative min-h-screen p-12 md:p-24 flex flex-col items-center">
                        {/* Background ambience */}
                        <div
                            className="fixed inset-0 opacity-20 pointer-events-none bg-cover bg-center blur-3xl"
                            style={{ backgroundImage: `url(${images[images.length - 1]?.url})` }}
                        />

                        <div className="relative z-10 w-full max-w-6xl">
                            <div className="text-center mb-16">
                                <h2 className="text-white/60 text-lg uppercase tracking-[0.4em] mb-4" style={{ fontFamily: "'EB Garamond', serif" }}>
                                    — The Collection —
                                </h2>
                                <h1 className="text-4xl md:text-5xl text-white font-normal" style={{ fontFamily: "'EB Garamond', serif", fontVariant: "small-caps" }}>
                                    Finis
                                </h1>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                                {/* Left Col: Full Poem */}
                                <div className="space-y-8 text-center md:text-left">
                                    {images.map((img, idx) => (
                                        <motion.p
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="text-2xl md:text-3xl text-white/90 leading-relaxed font-normal"
                                            style={{ fontFamily: "'EB Garamond', serif" }}
                                        >
                                            {img.segment}
                                        </motion.p>
                                    ))}
                                </div>

                                {/* Right Col: Image Gallery */}
                                <div className="grid grid-cols-2 gap-4">
                                    {images.map((img, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 + idx * 0.1 }}
                                            className="aspect-square rounded-sm overflow-hidden border border-white/10 shadow-2xl relative group cursor-pointer"
                                            onClick={() => {
                                                setIsFinished(false);
                                                setCurrentIndex(idx);
                                            }}
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-24 flex justify-center gap-8">
                                <button
                                    onClick={() => {
                                        setIsFinished(false);
                                        setCurrentIndex(0);
                                    }}
                                    className="px-8 py-3 bg-white text-black font-semibold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
                                    style={{ fontFamily: "'EB Garamond', serif" }}
                                >
                                    Replay Visualization
                                </button>
                                <button
                                    onClick={onBack}
                                    className="px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-sm hover:bg-white/10 transition-colors"
                                    style={{ fontFamily: "'EB Garamond', serif" }}
                                >
                                    Create New
                                </button>
                            </div>

                            <div className="fixed bottom-6 left-0 right-0 text-center z-50 pointer-events-none">
                                <p className="text-white/50 text-base tracking-widest uppercase font-sans font-medium pointer-events-auto inline-block">
                                    Created with <a href="https://antigravity.google/" target="_blank" rel="noreferrer" className="hover:text-white/80 transition-colors underline decoration-white/20 underline-offset-4">Google AntiGravity</a> by <a href="https://billsantry.com" target="_blank" rel="noreferrer" className="hover:text-white/80 transition-colors underline decoration-white/20 underline-offset-4">billsantry</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Slideshow */}
            {!loading && !error && !isFinished && images.length > 0 && (
                <>
                    {/* 3D Visual Layer (Over Imagery) */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <Scene analysis={analysis} rnd={rnd} />
                    </div>

                    <div className="absolute inset-0 z-10">
                        <ImageSlideshow
                            images={images}
                            currentIndex={currentIndex}
                            onIndexChange={setCurrentIndex}
                            onComplete={() => setIsFinished(true)}
                        />
                    </div>

                    <div className="absolute top-4 left-4 z-50">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-sm text-white hover:bg-white/10 transition-all duration-300 group"
                            style={{ fontFamily: "'EB Garamond', serif", letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '1.05rem' }}
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to Editor
                        </button>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                        <div className="text-center p-8 max-w-2xl w-full">
                            <motion.div
                                className="relative"
                                animate={{ y: [0, -5, 0] }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-6xl font-normal leading-relaxed text-white"
                                    style={{
                                        fontFamily: "'EB Garamond', serif",
                                        letterSpacing: '0.05em',
                                        textShadow: '0 2px 15px rgba(0,0,0,0.6)'
                                    }}
                                >
                                    {images[currentIndex].segment.split(' ').map((word, wordIdx) => (
                                        <motion.span
                                            key={`${currentIndex}-${wordIdx}`}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                delay: wordIdx * 0.15,
                                                duration: 0.5,
                                                ease: "easeOut"
                                            }}
                                            className="inline-block mr-[0.3em]"
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>

                    {/* SVG Filter for Painterly Effect */}
                    <svg className="hidden">
                        <defs>
                            <filter id="painterly-filter">
                                <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                                <feGaussianBlur stdDeviation="0.6" />
                            </filter>
                        </defs>
                    </svg>
                </>
            )}
        </motion.div>
    );
};

export default Visualizer;
