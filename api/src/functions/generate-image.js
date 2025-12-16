const { app } = require('@azure/functions');

app.http('generate-image', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { prompt, composition, prevLine } = body;

            // Load secrets from Environment Variables
            const apiKey = process.env.GOOGLE_API_KEY;
            const projectId = process.env.GOOGLE_PROJECT_ID || 'tsgbot';
            const location = process.env.GOOGLE_LOCATION || 'us-central1';
            const modelId = process.env.GOOGLE_MODEL_ID || 'imagen-3.0-generate-001';

            if (!apiKey) {
                return { status: 500, jsonBody: { error: 'Server misconfiguration: GOOGLE_API_KEY missing' } };
            }

            // Construct Vertex Payload
            // Detect spiritual mode via query param
            const url = new URL(request.headers['x-forwarded-host'] ? `https://${request.headers['x-forwarded-host']}${request.originalUrl}` : `http://localhost${request.originalUrl}`);
            const isSpiritual = url.searchParams.get('spiritual') === 'true';
            const contextSection = prevLine ? `Story Context (Previous Line): "${prevLine}".` : "Story Context: Opening scene.";

            // Refined style to discourage text
            const organicStyle = "Straight photography, documentary style. Natural light, unposed, authentic. High resolution, tangible textures. Grounded and realistic.";

            // Add mystical adjectives when spiritual mode is on
            const spiritualStyle = isSpiritual ? " ethereal, luminous, misty, celestial, soft glowing light, subtle aurora, transcendental, dream‑like, spiritual aura, delicate veil of light, other‑worldly atmosphere" : "";

            // Hard constraint at the very start
            const fullPrompt = `ABSOLUTELY NO TEXT. NO WORDS. NO TYPOGRAPHY. A naturalistic photograph of: "${prompt}". ${contextSection} Visual Style: ${organicStyle}${spiritualStyle} Composition: ${composition}. Unsplash photography style.`;

            // v1beta1 API for better parameter support (like negative prompting)
            const apiUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict?key=${apiKey}`;

            const payload = {
                instances: [{ prompt: fullPrompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                    // Supported in v1beta1 for Imagen 2/3
                    negativePrompt: "text, words, letters, typography, watermark, signature, logo, subtitles"
                }
            };

            // Call Vertex AI
            // Node 18+ has native fetch
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                // Pass through the error status (e.g. 429) so frontend can handle retries
                return {
                    status: response.status,
                    jsonBody: { error: errText }
                };
            }

            const data = await response.json();

            // Extract image
            if (data.predictions && data.predictions.length > 0) {
                let base64Img = data.predictions[0].bytesBase64Encoded;
                if (!base64Img && data.predictions[0].mimeType && data.predictions[0].bytesBase64Encoded) {
                    base64Img = data.predictions[0].bytesBase64Encoded;
                }

                if (base64Img) {
                    return {
                        jsonBody: {
                            url: `data:image/png;base64,${base64Img}`
                        }
                    };
                }
            }

            return { status: 500, jsonBody: { error: 'No image data in upstream response' } };

        } catch (error) {
            context.error(error);
            return { status: 500, jsonBody: { error: error.message } };
        }
    }
});
