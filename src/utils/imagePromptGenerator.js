const sanitizePrompt = (text) => {
    if (!text) return '';

    // Words that often trigger safety filters, even in poetic context
    const restricted = [
        'death', 'dead', 'die', 'blood', 'kill', 'murder', 'suicide', 'war', 'battle', 'weapon',
        'gun', 'knife', 'attack', 'violence', 'naked', 'explicit', 'divine', 'god', 'religious',
        'demon', 'hell', 'evil', 'terror', 'bomb', 'crash', 'pain', 'suffering'
    ];

    let sanitized = text.toLowerCase();
    restricted.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        sanitized = sanitized.replace(regex, 'atmospheric');
    });

    return sanitized;
};

export const generateImagePrompts = (poem, analysis, isSpiritual = false) => {
    const lines = poem.split('\n').filter(line => line.trim());

    // Generate one segment per line for a true one-to-one visualization
    const segments = lines.map(line => line.trim());

    // Determine ONE consistent artistic style
    let consistentStyle = '';
    switch (analysis.mood) {
        case 'dark':
            consistentStyle = 'moody atmospheric oil painting with shadows and rich colors';
            break;
        case 'romantic':
            consistentStyle = 'soft romantic watercolor painting with warm tones and dreamy atmosphere';
            break;
        case 'nature':
            consistentStyle = 'impressionist landscape painting with natural colors and loose brushwork';
            break;
        case 'energetic':
            consistentStyle = 'bold expressive abstract painting with dynamic colors and brushstrokes';
            break;
        case 'melancholy':
            consistentStyle = 'contemplative painting with muted blue-grey tones and atmospheric perspective';
            break;
        default:
            consistentStyle = 'serene artistic landscape painting with soft colors';
    }

    if (isSpiritual) {
        consistentStyle = `painter of light style, radiant ethereal glow, luminous colors, cottage aesthetic, lush detailed nature, ethereal atmosphere`;
    }

    // Generate prompts for each segment
    const prompts = segments.map((segment, index) => {
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;
        const isMid = !isFirst && !isLast;

        // Use sanitized segment to avoid safety filters
        const cleanSegment = sanitizePrompt(segment);
        const cleanStyle = sanitizePrompt(consistentStyle);

        let stylePrefix = isSpiritual ? 'A beautiful' : 'An organic, hand-crafted';
        let prompt = `${stylePrefix} ${cleanStyle} depicting: ${cleanSegment}.`;

        if (!isSpiritual) {
            prompt += ' Amateur painterly style, visible thick brushstrokes, naive art quality, tactile surface, authentic folk art feel.';
        }

        // Add scenery
        if (analysis.scenery && analysis.scenery !== 'neutral') {
            prompt += ` Scene: ${analysis.scenery}.`;
        }

        // Add composition
        if (isFirst) {
            prompt += ' Simple wide perspective.';
        } else if (isLast) {
            prompt += ' Straightforward close shot.';
        } else if (isMid) {
            prompt += ' Basic eye-level view.';
        }

        // CRITICAL CONSTRAINTS: No people, no text
        prompt += ' Pure nature, NO people, NO characters, NO text, NO words.';

        if (isSpiritual) {
            prompt += ' Soft ethereality, simple light.';
        }

        prompt += ' Naive aesthetic, unpolished amateur painting style.';

        return {
            segment,
            prompt: prompt.slice(0, 800), // Ensure it stays within token limits
            index
        };
    });

    return prompts;
};
