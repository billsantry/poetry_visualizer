import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import InputSection from './components/InputSection';
import Visualizer from './components/Visualizer';

function App() {
  const [poem, setPoem] = useState('');
  const [mode, setMode] = useState('input'); // 'input' | 'visualizing'
  const [isSpiritual, setIsSpiritual] = useState(false);

  const handleVisualize = (text) => {
    setPoem(text);
    setMode('visualizing');
  };

  const handleBack = () => {
    setMode('input');
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === 'input' ? (
          <InputSection 
            key="input" 
            onVisualize={handleVisualize} 
            isSpiritual={isSpiritual}
            setIsSpiritual={setIsSpiritual}
          />
        ) : (
          <Visualizer 
            key="visualizer" 
            poem={poem} 
            isSpiritual={isSpiritual}
            onBack={handleBack} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
