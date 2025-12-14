const { app } = require('@azure/functions');

// Import all function files to register them
require('./functions/get-config');
require('./functions/generate-image');
