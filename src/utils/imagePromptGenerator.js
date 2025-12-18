export const generateImagePrompts = (poem, analysis, isSpiritual = false) => {
    const lines = poem.split('\n').filter(line => line.trim());

    // Split poem into 3-5 segments based on stanzas or lines
    let segments = [];

    if (lines.length <= 4) {
        // Short poem: use each line as a segment
        segments = lines.map(line => line.trim());
    } else if (lines.length <= 12) {
        // Medium poem: group into 3-4 segments
        const chunkSize = Math.ceil(lines.length / 3);
        for (let i = 0; i < lines.length; i += chunkSize) {
            segments.push(lines.slice(i, i + chunkSize).join(' '));
        }
    } else {
        // Long poem: sample 5 key moments
        const step = Math.floor(lines.length / 5);
        for (let i = 0; i < 5; i++) {
            const start = i * step;
            const end = Math.min(start + step, lines.length);
            segments.push(lines.slice(start, end).join(' '));
        }
    }

    // Determine ONE consistent artistic style for all images based on mood
    let consistentStyle = '';
    switch (analysis.mood) {
        case 'dark':
            consistentStyle = 'moody atmospheric oil painting with dramatic shadows and dark rich colors';
            break;
        case 'romantic':
            consistentStyle = 'soft romantic watercolor painting with warm gentle tones and dreamy atmosphere';
            break;
        case 'nature':
            consistentStyle = 'impressionist landscape painting with vibrant natural colors and loose brushwork';
            break;
        case 'energetic':
            consistentStyle = 'bold expressive abstract painting with dynamic colors and energetic brushstrokes';
            break;
        case 'melancholy':
            consistentStyle = 'contemplative painting with muted blue-grey tones and atmospheric perspective';
            break;
        default:
            consistentStyle = 'serene artistic landscape painting with soft colors';
    }

    if (isSpiritual) {
        consistentStyle = `Thomas Kinkade style, painter of light, radiant ethereal glow, hyper-saturated luminous colors, cozy cottage aesthetic, lush detailed nature, divine atmosphere`;
    }

    // Generate prompts for each segment with CONSISTENT style
    const prompts = segments.map((segment, index) => {
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;
        const isMid = !isFirst && !isLast;

        // Build the prompt with consistent style
        let prompt = `A beautiful ${consistentStyle} depicting: ${segment}.`;

        // Add scenery context if available
        if (analysis.scenery && analysis.scenery !== 'neutral') {
            prompt += ` Scene: ${analysis.scenery}.`;
        }

        // Add weather if relevant
        if (analysis.weather && analysis.weather !== 'clear') {
            prompt += ` Weather: ${analysis.weather}.`;
        }

        // Add VARIED composition and camera angles for visual interest
        if (isFirst) {
            prompt += ' WIDE SHOT: Expansive establishing view, panoramic perspective, distant viewpoint showing the full environment.';
        } else if (isLast) {
            prompt += ' DRAMATIC CLOSE-UP: Intimate detail shot, tight framing, macro perspective with shallow depth of field, final emotional emphasis.';
        } else if (index === 1 && segments.length > 2) {
            prompt += ' MEDIUM SHOT: Mid-range perspective, balanced composition, natural eye-level viewpoint.';
        } else if (isMid) {
            // Alternate between different angles for variety
            const angles = [
                'LOW ANGLE: Looking upward, dramatic perspective from below, towering composition.',
                'HIGH ANGLE: Bird\'s eye view, looking down, sweeping overhead perspective.',
                'DUTCH ANGLE: Slightly tilted horizon, dynamic diagonal composition, artistic tilt.'
            ];
            prompt += ` ${angles[index % angles.length]}`;
        }

        // CRITICAL CONSTRAINTS: No people, no text
        prompt += ' NO people, NO human figures, NO faces, NO text, NO letters, NO typography, NO words in the image.';
        prompt += ' Pure landscape or abstract composition only.';
        if (isSpiritual) {
            prompt += ' Add shimmering particles, ethereal wisps of light, and a sense of infinite cosmic space.';
        }
        prompt += ' Highly detailed, professional artistic quality, painterly technique.';

        return {
            segment,
            prompt,
            index
        };
    });

    return prompts;
};
