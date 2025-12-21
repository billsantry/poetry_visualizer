const OpenAI = require('openai');

module.exports = async function (context, req) {
    // Check if API key is configured (support both standard and VITE_ prefixed env vars)
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        context.log.error('OPENAI_API_KEY is not set');
        context.res = {
            status: 500,
            body: "Server configuration error: API key missing"
        };
        return;
    }

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    try {
        const { prompt, size = '1024x1024', quality = 'standard', model = 'dall-e-3' } = req.body;

        if (!prompt) {
            context.res = {
                status: 400,
                body: "Please pass a prompt in the request body"
            };
            return;
        }

        context.log(`Generating image with ${model}: ${prompt}`);

        const response = await openai.images.generate({
            model,
            prompt,
            n: 1,
            size,
            quality: model === 'dall-e-3' ? quality : undefined,
            response_format: 'url'
        });

        context.res = {
            body: response.data[0]
        };
    } catch (error) {
        context.log.error('Error generating image:', error);
        context.res = {
            status: 500,
            body: `Error generating image: ${error.message}`
        };
    }
}
