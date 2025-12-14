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
            // Logic mirrored from frontend
            const contextSection = prevLine ? `Story Context (Previous Line): "${prevLine}".` : "Story Context: Opening scene.";
            const organicStyle = "Straight photography, documentary style. Natural light, unposed, authentic. High resolution, tangible textures. Grounded and realistic.";
            const fullPrompt = `A naturalistic photograph of: "${prompt}". ${contextSection} Visual Style: ${organicStyle} Composition: ${composition}. IMPORTANT: completely text-free.`;

            const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict?key=${apiKey}`;

            const payload = {
                instances: [{ prompt: fullPrompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
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
