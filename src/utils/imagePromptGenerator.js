const sanitizePrompt = (text) => {
    if (!text) return '';

    // Words that often trigger safety filters, even in poetic context
    const restricted = [
        'death', 'dead', 'die', 'killed', 'killing', 'suicide', 'murder', 'gore',
        'blood', 'bleeding', 'wounded', 'injury', 'hurt', 'pain', 'suffering',
        'war', 'battle', 'weapon', 'gun', 'knife', 'bomb', 'blast', 'explosion',
        'attack', 'violence', 'violent', 'fight', 'fighting', 'beaten',
        'naked', 'nude', 'sexual', 'sex', 'intimate', 'sensual', 'erotic', 'breasts', 'nipple', 'genitals',
        'drug', 'cocaine', 'heroin', 'abuse', 'addict',
        'demon', 'devil', 'hell', 'satan', 'cult', 'ritual', 'evil',
        'terror', 'horror', 'nightmare', 'frightening', 'scary',
        'explicit', 'nsfw', 'graphic', 'disturbing',
        'hate', 'racist', 'slur', 'offensive'
    ];

    let sanitized = text.toLowerCase();

    // 1. General Safety Replacement
    // Replace whole words only to avoid replacing inside other words (e.g., "gun" in "shogun") - though shoguns are cool, we want to be safe.
    restricted.forEach(word => {
        // Match word boundary to avoid false positives (e.g. 'hell' in 'shell')
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        sanitized = sanitized.replace(regex, 'abstract form');
    });

    // 2. Specific "soft" replacements to help visualization without triggering filters
    // "Cannon" -> "Iron sphere" (avoids weapon filter)
    sanitized = sanitized.replace(/\bcannon\b/gi, 'heavy iron');
    sanitized = sanitized.replace(/\bcannons\b/gi, 'heavy iron shapes');

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
        // Determine perspective based on content, not just index
        // Default to close-ups to prevent generic landscapes
        let perspective = 'Intimate close-up of a specific object.';
        if (analysis.scenery && analysis.scenery !== 'neutral' && (segment.includes('sky') || segment.includes('world') || segment.includes('field'))) {
            perspective = 'Wide compositional view.';
        } else if (isMid) {
            perspective = 'Eye-level focused subject.';
        }

        // RESTRUCTURED PROMPT
        let prompt = `Subject: "${cleanSegment}". Perspective: ${perspective}`;

        // STYLE: Refined back to David Park - Thick paint, bold forms, but not "sloppy"
        prompt += ` Style: Bay Area Figurative Movement, Thick Impasto Oil Painting, Bold broad brushstrokes, Rich saturated colors, Gouache texture.`;

        // INSTRUCTION: Force objects over landscapes (KEEPING THIS AS IT WORKED)
        prompt += ' INSTRUCTION: Interpret the text as a tangible SYMBOL or OBJECT. If the text mentions "bills", show papers. If "factory", show a wall or gear. Do NOT draw a generic landscape or "atmospheric" scene. Draw the THING named in the text.';

        // Reference specific painterly styles (Removed Dubuffet/Sloppy)
        if (!isSpiritual) {
            prompt += ' Aesthetic: Style of David Park and Richard Diebenkorn. Heavy paint application, visible brush texture, flattened perspective, strong geometric forms. No fine details.';
        }

        // Add scenery ONLY if it's a specific place, otherwise suppress environment
        if (analysis.scenery && analysis.scenery !== 'neutral') {
            prompt += ` Setting: ${analysis.scenery}.`;
        } else {
            prompt += ' Setting: simple flat color backgrounds or abstract interior.';
        }

        // CRITICAL CONSTRAINTS
        prompt += ' CRITICAL: NO photorealism. NO text/typography. NO digital gloss. The image must look like a physical oil painting.';

        if (isSpiritual) {
            prompt += ' Mood: Ethereal and soft.';
        } else {
            prompt += ' Mood: Moody, contemplative, textured.';
        }

        return {
            segment,
            prompt: prompt.slice(0, 1000),
            index
        };
    });

    return prompts;
};
