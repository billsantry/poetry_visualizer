const { app } = require('@azure/functions');

app.http('get-config', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return {
            jsonBody: {
                openaiApiKey: process.env.OPENAI_API_KEY
            }
        };
    }
});
