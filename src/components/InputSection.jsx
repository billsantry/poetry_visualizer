import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const InputSection = ({ onVisualize }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onVisualize(text);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen p-4 w-full max-w-4xl mx-auto"
        >
            <div className="w-full bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
                <div className="flex flex-col items-center mb-16">
                    <h1 className="text-xl md:text-3xl font-normal text-white text-center uppercase tracking-[0.3em] flex items-center gap-4" style={{ fontFamily: "'EB Garamond', serif", fontVariant: "small-caps" }}>
                        <span className="text-white/60 text-2xl">❧</span>
                        Poetry Visualizer
                        <span className="text-white/60 text-2xl">❧</span>
                    </h1>
                    <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent mt-6" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter your poem here..."
                            className="w-full h-64 bg-black/40 rounded-xl p-6 text-lg text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none transition-all duration-300 font-sans leading-relaxed border border-white/5"
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-white/20 font-sans">
                            {text.length} chars
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,1)' }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!text.trim()}
                            className="relative px-6 md:px-16 py-4 bg-white/90 text-black border-2 border-white rounded-sm font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-500 overflow-hidden uppercase tracking-[0.15em] md:tracking-[0.25em] text-sm sm:text-base md:text-2xl hover:bg-white active:scale-[0.98]"
                            style={{ fontFamily: "'EB Garamond', serif" }}
                        >
                            <span className="relative flex items-center justify-center gap-3">
                                Visualize Poem
                                <span className="text-5xl opacity-80 leading-none" style={{ marginTop: '-2px' }}>☞</span>
                            </span>
                        </motion.button>
                    </div>
                </form>
            </div>

            <div className="fixed bottom-6 left-0 right-0 text-center z-50 pointer-events-none">
                <p className="text-black/60 text-base tracking-widest uppercase font-sans font-medium pointer-events-auto inline-block bg-black/5 backdrop-blur-sm py-2 px-4 rounded-full">
                    Created with <a href="https://antigravity.google/" target="_blank" rel="noreferrer" className="hover:text-black/80 transition-colors underline decoration-black/20 underline-offset-4">Google AntiGravity</a> by <a href="https://billsantry.com" target="_blank" rel="noreferrer" className="hover:text-black/80 transition-colors underline decoration-black/20 underline-offset-4">billsantry</a>
                </p>
            </div>
        </motion.div>
    );
};

export default InputSection;
