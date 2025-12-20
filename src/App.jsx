import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import InputSection from './components/InputSection';
import Visualizer from './components/Visualizer';
import Scene from './components/Scene';
import { createRandom } from './utils/analyzer';

function App() {
  const [poem, setPoem] = useState('');
  const [mode, setMode] = useState('input'); // 'input' | 'visualizing'

  // Background scene data for landing
  const landingAnalysis = useMemo(() => ({ mood: 'default', tempo: 0.3 }), []);
  const landingRnd = useMemo(() => createRandom('landing-bg'), []);

  const handleVisualize = (text) => {
    setPoem(text);
    setMode('visualizing');
  };

  const handleBack = () => {
    setMode('input');
  };

  return (
    <div className={`relative w-full h-full text-white overflow-hidden transition-colors duration-1000 ${mode === 'input' ? 'arctic-sunrise' : 'bg-black'}`}>
      {/* Background Layer: Subtle Starfield ONLY on landing */}
      {mode === 'input' && (
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <Scene
            analysis={landingAnalysis}
            rnd={landingRnd}
            isLanding={true}
          />
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {mode === 'input' ? (
            <InputSection
              key="input"
              onVisualize={handleVisualize}
            />
          ) : (
            <Visualizer
              key="visualizer"
              poem={poem}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
