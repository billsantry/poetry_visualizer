import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun } from 'lucide-react';

const InputSection = ({ onVisualize, isSpiritual, setIsSpiritual }) => {
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
            <div className="w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8 text-center font-serif">
                    Poetry Visualizer
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter your poem here..."
                            className="w-full h-64 bg-black/20 rounded-xl p-6 text-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all duration-300 font-serif leading-relaxed"
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-white/30">
                            {text.length} chars
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-black/30 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSpiritual ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'}`}>
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Thomas Kinkade Mode</h3>
                                <p className="text-xs text-white/40 text-pretty">Painter of light & cosmic glow</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSpiritual(!isSpiritual)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isSpiritual ? 'bg-purple-600' : 'bg-gray-700'}`}
                        >
                            <span
                                className={`${isSpiritual ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!text.trim()}
                        className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Visualize Poem
                        </span>
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};

export default InputSection;
