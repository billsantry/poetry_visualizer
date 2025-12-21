const sanitizePrompt = (text) => {
    if (!text) return '';

    // Words that often trigger safety filters, even in poetic context
    const restricted = [
        'death', 'dead', 'die', 'blood', 'kill', 'murder', 'suicide', 'war', 'battle', 'weapon',
        'gun', 'knife', 'attack', 'violence', 'naked', 'explicit', 'divine', 'god', 'religious',
        'demon', 'hell', 'evil', 'terror', 'bomb', 'crash', 'pain', 'suffering', 'explode', 'exploding', 'wreck', 'wrecked'
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
    const baseRawStyle = "Style of David Park, Bay Area Figurative Movement, thick impasto, bold broad brushstrokes, abstract expressionism, rich muted colors, gouache feel";

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

        // RESTRUCTURE: Command DALL-E to visualize the text content primarily
        let prompt = `Visualize this scene described in the text: "${cleanSegment}". Direct visual translations, double meanings, and visual metaphors are encouraged.`;

        // Add style AFTER the content directive
        prompt += ` ${stylePrefix} ${cleanStyle}.`;

        if (!isSpiritual) {
            prompt += ' Style of David Park paintings, Bay Area Figurative Movement, thick gestural brushwork, heavy paint application, no fine details, abstract forms. Tactile artistic quality, artisan hand-crafted technique, visible surface texture, analog film grain, natural imperfections, charcoal and ink lithograph look.';
        }

        // Refined literal instruction
        prompt += ' FOCUS ON THE MEANING. Capture the literal scene OR a clever visual metaphor. Do NOT revert to a generic landscape unless the text explicitly describes a landscape.';

        // Add scenery merely as an environmental hint
        if (analysis.scenery && analysis.scenery !== 'neutral') {
            prompt += ` Environment hint: ${analysis.scenery}.`;
        }

        // Add composition
        if (isFirst) {
            prompt += ' Perspective: Simple wide shot.';
        } else if (isLast) {
            prompt += ' Perspective: Straightforward close-up.';
        } else if (isMid) {
            prompt += ' Perspective: Basic eye-level view.';
        }

        // CRITICAL CONSTRAINTS: No people, no text
        prompt += ' NO people, NO human figures, NO faces, NO text, NO letters, NO typography, NO words in the image.';
        prompt += ' Focus strictly on the specific imagery and metaphors in the text segment. AVOID generic landscapes.';

        // Negative constraints to avoid AI "airbrushed" look
        prompt += ' No digital smoothness, no synthetic textures, no computer-generated look, no airbrushed finish, no hyper-realism, no polish.';

        if (isSpiritual) {
            prompt += ' Soft ethereality, simple light.';
        } else {
            prompt += ' Crude, expressive, unrefined, amateur, authentic outsider art.';
        }

        return {
            segment,
            prompt: prompt.slice(0, 1000), // Slightly increased limit for DALL-E 3
            index
        };
    });

    return prompts;
};
