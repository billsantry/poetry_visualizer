export const analyzePoem = (text) => {
    const lowerText = text.toLowerCase();

    // Mood keywords
    const moods = {
        dark: ['dark', 'night', 'shadow', 'death', 'gloom', 'black', 'fear', 'cold', 'void', 'deep'],
        romantic: ['love', 'heart', 'kiss', 'rose', 'passion', 'soul', 'forever', 'sweet', 'lovely'],
        nature: ['tree', 'flower', 'sky', 'river', 'mountain', 'sun', 'rain', 'wind', 'green', 'woods'],
        energetic: ['fire', 'burn', 'run', 'fast', 'power', 'storm', 'lightning', 'wild'],
        melancholy: ['tear', 'sad', 'cry', 'lost', 'alone', 'grey', 'pain', 'memory', 'sleep']
    };

    // Scenery keywords
    const sceneries = {
        forest: ['tree', 'woods', 'forest', 'leaf', 'green', 'pine', 'branch'],
        ocean: ['sea', 'ocean', 'wave', 'water', 'blue', 'tide', 'beach', 'sand'],
        space: ['star', 'moon', 'planet', 'space', 'galaxy', 'void', 'sky', 'night'],
        desert: ['sand', 'desert', 'hot', 'sun', 'dry', 'dune', 'dust'],
        snow: ['snow', 'ice', 'cold', 'white', 'winter', 'frost', 'freeze']
    };

    // Weather keywords
    const weathers = {
        rain: ['rain', 'storm', 'wet', 'pour', 'drop'],
        snow: ['snow', 'ice', 'white', 'flake'],
        clear: ['sun', 'clear', 'bright', 'blue', 'star']
    };

    const calculateScore = (categories) => {
        let scores = {};
        let maxScore = 0;
        let dominant = 'neutral'; // Default

        Object.keys(categories).forEach(category => {
            scores[category] = 0;
            categories[category].forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const count = (lowerText.match(regex) || []).length;
                scores[category] += count;
            });
            if (scores[category] > maxScore) {
                maxScore = scores[category];
                dominant = category;
            }
        });
        return { scores, dominant };
    };

    const moodResult = calculateScore(moods);
    const sceneryResult = calculateScore(sceneries);
    const weatherResult = calculateScore(weathers);

    // Default scenery if none detected
    if (sceneryResult.dominant === 'neutral') {
        if (moodResult.dominant === 'dark') sceneryResult.dominant = 'forest';
        else if (moodResult.dominant === 'nature') sceneryResult.dominant = 'forest';
        else sceneryResult.dominant = 'space'; // Fallback
    }

    // Calculate tempo
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length;
    const punctuationCount = (text.match(/[.,;!?]/g) || []).length;

    let tempo = 0.5;
    if (avgWordLength < 4) tempo += 0.2;
    if (avgWordLength > 6) tempo -= 0.2;
    if (punctuationCount / words.length > 0.2) tempo -= 0.2;
    tempo = Math.max(0.1, Math.min(1.0, tempo));

    return {
        mood: moodResult.dominant,
        scenery: sceneryResult.dominant,
        weather: weatherResult.dominant,
        tempo,
        lineCount: text.split('\n').length,
        wordCount: words.length
    };
};
// Simple seeded random generator for stable visuals
export const createRandom = (seedString) => {
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
        seed = ((seed << 5) - seed) + seedString.charCodeAt(i);
        seed |= 0;
    }

    return () => {
        seed = (seed + 0x9E3779B9) | 0;
        let t = seed ^ (seed >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        t = t ^ (t >>> 15);
        return (t >>> 0) / 4294967296;
    };
};
