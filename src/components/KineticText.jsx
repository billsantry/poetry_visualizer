import React from 'react';
import { motion } from 'framer-motion';

const KineticText = ({ text, analysis }) => {
    const lines = text.split('\n');

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1 * (2 - analysis.tempo), // Slower tempo = slower stagger
                delayChildren: 0.5
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
        show: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-white text-xl md:text-2xl font-serif leading-loose drop-shadow-lg"
        >
            {lines.map((line, i) => (
                <motion.div key={i} variants={item} className="mb-4">
                    {line || '\u00A0'}
                </motion.div>
            ))}
        </motion.div>
    );
};

export default KineticText;
