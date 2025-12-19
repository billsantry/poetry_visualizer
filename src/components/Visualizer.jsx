import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { analyzePoem, createRandom } from '../utils/analyzer';
import { generateImagePrompts } from '../utils/imagePromptGenerator';
import { generateImages } from '../utils/openaiClient';
import ImageSlideshow from './ImageSlideshow';
import Scene from './Scene';
import WorldBuilder from './WorldBuilder';

const Visualizer = ({ poem, onBack, isSpiritual }) => {
    const analysis = useMemo(() => analyzePoem(poem), [poem]);
    const rnd = useMemo(() => createRandom(poem), [poem]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const generateVisualization = async () => {
            setLoading(true);
            setError(null);

            try {
                // Generate prompts from the poem
                const prompts = generateImagePrompts(poem, analysis, isSpiritual);

                // Generate images using DALL-E
                const generatedImages = await generateImages(prompts);

                setImages(generatedImages);
            } catch (err) {
                console.error('Generation error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        generateVisualization();
    }, [poem, analysis, isSpiritual]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-screen bg-black overflow-hidden"
        >
            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
                    <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
                    <p className="text-white text-xl font-serif">Generating your visualization...</p>
                    <p className="text-white/60 text-sm mt-2">This may take 30-60 seconds</p>
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

            {/* Slideshow */}
            {!loading && !error && images.length > 0 && (
                <>
                    {/* 3D Visual Layer (Over Imagery) */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <Scene analysis={analysis} rnd={rnd} isSpiritual={isSpiritual} />
                    </div>

                    <div className="absolute inset-0 z-10">
                        <ImageSlideshow
                            images={images}
                            currentIndex={currentIndex}
                            onIndexChange={setCurrentIndex}
                        />
                    </div>

                    <div className="absolute top-4 left-4 z-50">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Editor
                        </button>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                        <div className="text-center p-8 max-w-2xl w-full">
                            <div className="mb-8 text-xs uppercase tracking-widest text-white/30 bg-black/50 p-2 rounded inline-block backdrop-blur-sm">
                                AI-Generated Visualization | Scene {currentIndex + 1} of {images.length}
                            </div>
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                }}
                                transition={{
                                    y: {
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }
                                }}
                                className="relative"
                            >
                                <motion.div
                                    key={currentIndex}
                                    className="text-2xl md:text-3xl font-serif leading-loose drop-shadow-2xl bg-black/20 p-6 rounded-lg backdrop-blur-sm"
                                >
                                    {(() => {
                                        let charCount = 0;
                                        return images[currentIndex].segment.split(' ').map((word, wordIdx) => {
                                            const wordChars = word.split('');
                                            const result = (
                                                <span key={wordIdx} className="inline-block whitespace-nowrap">
                                                    {wordChars.map((char, charIdx) => {
                                                        const globalIdx = charCount + charIdx;
                                                        return (
                                                            <motion.span
                                                                key={charIdx}
                                                                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    y: [0, -3, 0],
                                                                    scale: [1, 1.05, 1],
                                                                }}
                                                                transition={{
                                                                    opacity: { delay: globalIdx * 0.03, duration: 0.3 },
                                                                    y: {
                                                                        delay: globalIdx * 0.03 + 0.5,
                                                                        duration: 2,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut"
                                                                    }
                                                                }}
                                                                className="inline-block text-white"
                                                            >
                                                                {char}
                                                            </motion.span>
                                                        );
                                                    })}
                                                    <span className="inline-block">&nbsp;</span>
                                                </span>
                                            );
                                            charCount += wordChars.length + 1; // +1 for the space
                                            return result;
                                        });
                                    })()}
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default Visualizer;
