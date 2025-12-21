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
    let apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API Key not configured");

    // Clean potential whitespace
    apiKey = apiKey.trim();

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

    // Check for API Key (Simple string)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.poetry_visualizer_backup;

    // Check for Service Account (JSON file path or content normally handled by GoogleAuth)
    // We assume if specific env vars are missing, we try the API key path.

    let accessToken = null;
    let useApiKey = false;

    // Initialize Google Auth only if we don't have a simple key or if we want to prefer Service Account
    // But since the user specifically wants to use the Key, let's prioritize that if the Auth library fails or isn't set up.

    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        accessToken = token.token;
    } catch (e) {
        context.log.warn("Could not load default Google Service Account credentials. Trying API Key...");
        if (!apiKey) throw new Error("No Google Credentials (JSON or API Key) found.");
        useApiKey = true;
    }

    if (!projectId && !useApiKey) throw new Error("GOOGLE_PROJECT_ID not configured");

    // Model: Imagen 2
    const modelId = 'imagegeneration@006';
    const location = 'us-central1';

    // Construct URL
    // If using API Key, the docs suggest we might access via publishers/google/models directly OR projects
    // But for "predict", it usually needs a project. 
    // If projectId is missing but we have a key, we might be stuck, but let's assume the user put a project ID in.
    // If NO project ID, we can try the "publishers/google/models" path from the user's snippet?
    // The snippet: v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent
    // Let's try to adapt that for Imagen.

    let endpoint;
    if (useApiKey && !projectId) {
        // Try the project-less endpoint pattern for API keys (experimental for Imagen)
        endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${modelId}:predict?key=${apiKey}`;
    } else {
        // Standard Vertex Endpoint
        endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
        if (useApiKey) {
            endpoint += `?key=${apiKey}`;
        }
    }

    context.log(`Generating image with Vertex AI (${modelId}) via ${useApiKey ? 'API Key' : 'OAuth'}...`);

    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
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

    if (!data.predictions || !data.predictions[0]) {
        throw new Error("No predictions returned from Vertex.");
    }

    const base64Image = data.predictions[0].bytesBase64Encoded;
    if (!base64Image) {
        throw new Error("No image data returned from Vertex");
    }

    return {
        url: `data:image/png;base64,${base64Image}`,
        revised_prompt: prompt
    };
}
```
