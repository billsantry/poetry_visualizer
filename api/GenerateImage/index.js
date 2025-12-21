const OpenAI = require('openai');
const { GoogleAuth } = require('google-auth-library');

module.exports = async function (context, req) {
    const { prompt, size = '1024x1024', quality = 'standard', model = 'dall-e-3' } = req.body;

    if (!prompt) {
        context.res = {
            status: 400,
            body: "Please pass a prompt in the request body"
        };
        return;
    }

    // 1. Try OpenAI (DALL-E)
    try {
        const result = await generateDallE(prompt, size, quality, model, context);
        context.res = { body: result };
        return;
    } catch (openaiError) {
        context.log.warn(`OpenAI generation failed: ${openaiError.message}. Attempting fallback to Vertex AI...`);

        // 2. Fallback to Google Vertex AI (Imagen)
        try {
            const result = await generateImagen(prompt, context);
            context.res = { body: result };
            return;
        } catch (vertexError) {
            context.log.error(`Vertex AI fallback also failed: ${vertexError.message}`);
            // Return original error to helpful debugging, or a composite error
            context.res = {
                status: 500,
                body: `Generation failed. OpenAI: ${openaiError.message}. Vertex AI: ${vertexError.message}`
            };
        }
    }
};

async function generateDallE(prompt, size, quality, model, context) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API Key not configured");

    const openai = new OpenAI({ apiKey });

    context.log(`Generating image with OpenAI (${model}): ${prompt}`);

    const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size,
        quality: model === 'dall-e-3' ? quality : undefined,
        response_format: 'url'
    });

    return response.data[0]; // { url, revised_prompt }
}

async function generateImagen(prompt, context) {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    if (!projectId) throw new Error("GOOGLE_PROJECT_ID not configured");

    // Initialize Google Auth
    // Expects GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON) 
    // OR default credentials available in environment.
    // If running in Azure with just env vars, user might need to supply credentials in a custom way,
    // but standard GoogleAuth checks strictly.
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Model: Imagen 3 (or 2). Using 'imagegeneration@006' (Imagen 2) for stability, or 'imagen-3.0-generate-001'
    const modelId = 'imagegeneration@006';
    const location = 'us-central1';
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

    context.log(`Generating image with Vertex AI (${modelId}): ${prompt}`);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            instances: [
                { prompt: prompt }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1" // equivalent to 1024x1024
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Vertex returns a base64 encoded image string, not a URL.
    // DALL-E returns a URL. The frontend expects a 'url'.
    // We can return a data URI.
    const base64Image = data.predictions[0].bytesBase64Encoded;
    if (!base64Image) {
        throw new Error("No image data returned from Vertex");
    }

    return {
        url: `data:image/png;base64,${base64Image}`,
        revised_prompt: prompt // Imagen doesn't usually return a revised prompt
    };
}
