module.exports = async function (context, req) {
    // This key is set in the Azure Portal > App Settings
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        context.res = {
            status: 500,
            body: { error: "API Key not configured in Azure Portal" }
        };
        return;
    }

    context.res = {
        // Return JSON with the key
        body: { openaiApiKey: apiKey }
    };
};
