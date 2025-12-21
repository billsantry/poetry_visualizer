export const generateImages = async (prompts) => {
    const model = import.meta.env.VITE_DALLE_MODEL || 'dall-e-3';
    const quality = import.meta.env.VITE_DALLE_QUALITY || 'standard';
    const size = import.meta.env.VITE_DALLE_SIZE || '1024x1024';

    try {
        // Create an array of functions that return promises, to allow for sequential execution control if needed
        // However, to match previous behavior (which was actually parallel despite the comment), we will map to promises.
        // But to be safe with rate limits on the server (Azure Functions might scale, but OpenAI rate limits per key apply),
        // let's actually implement TRUE sequential execution here, as the comment in the original code suggested was the intent.

        const images = [];
        for (const promptData of prompts) {
            console.log(`Generating image with ${model}:`, promptData.prompt);

            const response = await fetch('/api/GenerateImage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: promptData.prompt,
                    model,
                    quality,
                    size
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                // If it's a rate limit (429), strictly we should back off, but throwing error is the baseline behavior
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            images.push({
                url: data.url,
                segment: promptData.segment,
                index: promptData.index,
                revisedPrompt: data.revised_prompt
            });
        }

        return images;
    } catch (error) {
        console.error('Error generating images:', error);
        throw new Error(`Failed to generate images: ${error.message}`);
    }
};
