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

    // Determine ONE consistent artistic style - forcing "Bob Dylan / Big Pink" aesthetic
    let consistentStyle = '';
    // Base style that applies to all non-spiritual directives to capture that specific look
    const baseRawStyle = "naive outsider art, raw loose brushwork, flat perspective, gouache on paper texture, muted earthy palette";

    switch (analysis.mood) {
        case 'dark':
            consistentStyle = `${baseRawStyle}, moody shadows, somber tones, rough expressionist strokes`;
            break;
        case 'romantic':
            consistentStyle = `${baseRawStyle}, soft but messy, warm washed-out colors, sentimental folk art`;
            break;
        case 'nature':
            consistentStyle = `${baseRawStyle}, rustic landscape, organic forms, unrefined details`;
            break;
        case 'energetic':
            consistentStyle = `${baseRawStyle}, chaotic brushstrokes, vivid raw colors, dynamic and crudes`;
            break;
        case 'melancholy':
            consistentStyle = `${baseRawStyle}, sparse composition, blue-grey washes, lonely atmosphere`;
            break;
        default:
            consistentStyle = `${baseRawStyle}, simple composition, unpretentious execution`;
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

        let stylePrefix = isSpiritual ? 'A beautiful' : 'A raw, hand-painted';
        let prompt = `${stylePrefix} ${cleanStyle} depicting: ${cleanSegment}.`;

        if (!isSpiritual) {
            prompt += ' Style of Bob Dylan paintings, album cover art style (Music from Big Pink), naive folk art, visible rough brushstrokes, unpolished finish, heavy impasto, messy authentic texture.';
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
        prompt += ' NO people, NO human figures, NO faces, NO text, NO letters, NO typography, NO words in the image.';
        prompt += ' Focus strictly on the subjects and metaphors mentioned in the segment. AVOID generic landscapes unless specified.';

        // Negative constraints to avoid AI "airbrushed" look
        prompt += ' No digital smoothness, no synthetic textures, no computer-generated look, no airbrushed finish, no hyper-realism, no polish.';

        if (isSpiritual) {
            prompt += ' Soft ethereality, simple light.';
        } else {
            prompt += ' Crude, expressive, unrefined, authentic outsider art.';
        }

        return {
            segment,
            prompt: prompt.slice(0, 800), // Ensure it stays within token limits
            index
        };
    });

    return prompts;
};
