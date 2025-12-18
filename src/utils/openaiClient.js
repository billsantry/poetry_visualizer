import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: Only for development! Use backend proxy in production
});

export const generateImages = async (prompts) => {
    const model = import.meta.env.VITE_DALLE_MODEL || 'dall-e-3';
    const quality = import.meta.env.VITE_DALLE_QUALITY || 'standard';
    const size = import.meta.env.VITE_DALLE_SIZE || '1024x1024';

    try {
        const imagePromises = prompts.map(async (promptData) => {
            const response = await openai.images.generate({
                model,
                prompt: promptData.prompt,
                n: 1,
                size,
                quality: model === 'dall-e-3' ? quality : undefined,
                response_format: 'url'
            });

            return {
                url: response.data[0].url,
                segment: promptData.segment,
                index: promptData.index,
                revisedPrompt: response.data[0].revised_prompt
            };
        });

        // Generate images sequentially to avoid rate limits
        const images = [];
        for (const promise of imagePromises) {
            const image = await promise;
            images.push(image);
        }

        return images;
    } catch (error) {
        console.error('Error generating images:', error);
        throw new Error(`Failed to generate images: ${error.message}`);
    }
};
