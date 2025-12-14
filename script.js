// ==========================================
// Poetry Visualizer Controller (DALL-E Version)
// ==========================================

const state = {
    isPlaying: false,
    poemLines: [],
    images: [], // Array of { url, text }
    currentSlideIndex: 0,
};

// Cloud Safety: Ensure config object exists even if config.js is missing
window.config = window.config || {};

// ==========================================
// Main Workflow
// ==========================================


console.log("Script loaded!");

async function startVisualization() {
    console.log("Visualize button clicked!");
    const btnText = document.getElementById('btnText');
    const errorBox = document.getElementById('errorMessage');


    // Reset error
    errorBox.textContent = '';
    errorBox.classList.add('hidden');

    try {
        let apiKeyInput = document.getElementById('apiKey').value.trim();
        const poemInput = document.getElementById('poemInput').value.trim();

        const provider = document.getElementById('aiProvider') ? document.getElementById('aiProvider').value : 'openai';

        let validCredentials = false;

        if (provider === 'openai') {
            // Check config for key if not in input
            if (!apiKeyInput && typeof config !== 'undefined' && config.openaiApiKey) {
                apiKeyInput = config.openaiApiKey;
                console.log("Using API Key from config.js");
            }
            // If still no key, try fetching from Azure Backend...

            if (apiKeyInput) {
                config.openaiApiKey = apiKeyInput;
                validCredentials = true;
            } else {
                showError('Please enter your OpenAI API Key.');
                return;
            }
        } else if (provider === 'google') {
            // GOOGLE: Secrets are managed by the backend
            validCredentials = true;
        }

        if (!poemInput) {
            showError('Please enter a poem first!');
            return;
        }

        // Feedback
        btnText.textContent = "Starting...";
        const vizBtn = document.getElementById('visualizeBtn');
        if (vizBtn) vizBtn.disabled = true;

        // Small delay so user sees "Starting..." acknowledgement
        await new Promise(r => setTimeout(r, 1000));

        // Prepare UI
        document.getElementById('inputPanel').classList.add('hidden');
        document.getElementById('loadingIndicator').classList.remove('hidden');
        document.getElementById('loadingText').textContent = "Analyzing poem and storyboarding scenes...";

        // Parse Poem
        state.poemLines = poemInput.split('\n').filter(line => line.trim().length > 0);
        state.images = [];
        state.currentSlideIndex = 0;

        // Generate Images Stream (Don't await, let it run in background)
        generateStream();

    } catch (error) {
        console.error("Visualization failed:", error);
        showError(error.message);
        stopVisualization();
        btnText.textContent = "Visualize Poem";
    }
}

function showError(msg) {
    const el = document.getElementById('errorMessage');
    el.textContent = "Error: " + msg;
    el.classList.remove('hidden');
}

// Cinematic Composition Rules
const cinematicRules = [
    { composition: "Wide angle view, establishing the landscape, epic scale", motion: "kb-pan-right" },
    { composition: "Extreme close-up on details and texture", motion: "kb-zoom-in" },
    { composition: "Medium view, balanced composition, rule of thirds", motion: "kb-zoom-out" },
    { composition: "Low angle perspective, looking up", motion: "kb-tilt-up" },
    { composition: "High angle perspective, looking down", motion: "kb-tilt-down" },
    { composition: "Dynamic motion blur, fast movement", motion: "kb-pan-left" },
    { composition: "Depth of field focus, immersive perspective", motion: "kb-zoom-in" }
];

// ==========================================
// Generation Logic (Streaming)
// ==========================================

async function generateStream() {
    const loadingText = document.getElementById('loadingText');
    const progressBar = document.getElementById('progressBarFill');
    const btnText = document.getElementById('btnText');
    const total = state.poemLines.length;

    console.log("Starting streaming generation...");

    const provider = document.getElementById('aiProvider') ? document.getElementById('aiProvider').value : 'openai';

    // Concurrency Controller
    // Limit to 1 for Google/Vertex to respect strict QPS quotas on some keys
    const CONCURRENCY_LIMIT = provider === 'google' ? 1 : 3;

    let nextLineIndex = 0;
    let activeRequests = 0;

    // Helper to process the next available line
    const processNext = async () => {
        if (nextLineIndex >= total) return;

        const index = nextLineIndex++;
        activeRequests++;

        const line = state.poemLines[index];
        const prevLine = index > 0 ? state.poemLines[index - 1] : "";
        const rule = cinematicRules[index % cinematicRules.length];

        const provider = document.getElementById('aiProvider') ? document.getElementById('aiProvider').value : 'openai';

        // UI Feedback for initial load
        if (index < 3) {
            loadingText.textContent = `Storyboarding scene ${index + 1} (${provider === 'google' ? 'Vertex' : 'DALL-E'})...`;
        }

        console.log(`[Manager] Queueing frame ${index + 1}: ${line.substring(0, 20)}...`);

        try {
            let url;
            if (provider === 'google') {
                url = await generateImageVertex(line, prevLine, rule.composition);
            } else {
                url = await generateImageForLine(line, prevLine, rule.composition);
            }

            // Store result
            state.images[index] = {
                url,
                text: line,
                motion: rule.motion,
                index: index
            };

            // PROGRESS UPDATE
            if (progressBar) {
                // Count how many we have
                const completedCount = state.images.filter(x => x).length;
                const percent = (completedCount / total) * 100;
                progressBar.style.width = `${percent}%`;
            }

            // CRITICAL: Start slideshow ASAP (after first image)
            if (index === 0 && !state.isPlaying) {
                console.log("First frame ready. Action!");
                loadingText.textContent = "Starting show...";

                // Brief pause to ensure image is cached/ready
                await new Promise(r => setTimeout(r, 200));

                document.getElementById('loadingIndicator').classList.add('hidden');
                document.getElementById('visualControls').classList.remove('hidden');
                document.getElementById('textOverlay').classList.remove('hidden');
                btnText.textContent = "Visualize Poem";
                startSlideshow();
            }

        } catch (e) {
            console.error(`Frame ${index} failed:`, e);
            // Fallback so the show can go on
            state.images[index] = {
                url: 'https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop',
                text: line,
                motion: "kb-zoom-in",
                index: index
            };
        } finally {
            activeRequests--;
            // Recursively pick up the next task
            processNext();
        }
    };

    // Ignite the workers
    for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
        processNext();
    }
}

async function generateImageForLine(line, prevLine, composition) {
    if (typeof config === 'undefined' || !config.openaiApiKey) throw new Error("Missing API Key");

    // Context-Aware Prompt Engineering
    const contextSection = prevLine ? `Story Context (Previous Line): "${prevLine}".` : "Story Context: Opening scene.";

    // Style: Motion Blur & Kinetic Flow
    // Style: Naturalistic Documentary (User Request)
    const organicStyle = "Straight photography, documentary style. Natural light, unposed, authentic. High resolution, tangible textures. Grounded and realistic.";

    const prompt = `
    A literal, grounded visual interpretation.
    Subject: A naturalistic photograph of: "${line}".
    ${contextSection}
    Visual Style: ${organicStyle}
    Composition: ${composition}.
    IMPORTANT: The image must be completely free of text, letters, words, titles, and typography. The scene is a visual mood piece. No text, no lettering, no words, no symbols, no typographic elements.
    `.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s to allow for retries/queues

    // Quality Mode: Default to DALL-E 3 for best results matching local config
    const model = config.dalleModel || "dall-e-3";
    const size = config.dalleSize || "1024x1024";

    console.log(`Generating with ${model} at ${size}`);

    // Retry Logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    n: 1,
                    size: size,
                    response_format: "url"
                }),
                signal: controller.signal
            });

            // Check for Rate Limit specifically
            if (response.status === 429) {
                console.warn(`Rate limit hit. Retrying... (${attempts + 1}/${maxAttempts})`);
                attempts++;
                await new Promise(r => setTimeout(r, 2000 * attempts)); // Backoff: 2s, 4s...
                continue;
            }

            const data = await response.json();

            if (data.error) {
                // If it's a server error (5xx) or a generic error that might be transient, retry
                if (response.status >= 500 || (response.status !== 400 && response.status !== 401 && response.status !== 403 && response.status !== 404 && response.status !== 429)) {
                    console.warn(`OpenAI API Error (status: ${response.status}). Retrying... (${attempts + 1}/${maxAttempts})`);
                    attempts++;
                    await new Promise(r => setTimeout(r, 2000 * attempts));
                    continue;
                }
                // For other errors (e.g., 400, 401, 403, 404, or specific API errors like safety violations), don't retry
                throw new Error(data.error.message || "OpenAI API Error");
            }

            clearTimeout(timeoutId);
            return data.data[0].url;

        } catch (error) {
            // Only retry if it's NOT a safety violation (which won't pass on retry)
            if (error.message.includes("safety") || error.message.includes("content_policy")) {
                clearTimeout(timeoutId);
                throw error;
            }

            if (attempts === maxAttempts - 1) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error("Request timed out taking too long.");
                }
                throw error;
            }
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    // If loop finishes without returning, it means all attempts failed
    clearTimeout(timeoutId);
    throw new Error("Failed to generate image after multiple attempts.");
}

// ==========================================
// Slideshow Logic
// ==========================================

function startSlideshow() {
    state.isPlaying = true;
    playNextSlide();
}

function playNextSlide() {
    if (!state.isPlaying) return;

    // Check if the current slide is ready
    const slideData = state.images[state.currentSlideIndex];

    if (!slideData) {
        // We lack data for this slide. Are we waiting for it, or are we done?
        if (state.currentSlideIndex < state.poemLines.length) {
            console.log(`Buffering frame ${state.currentSlideIndex}... Waiting for DALL-E...`);
            // Show buffering UI
            const loadingInd = document.getElementById('loadingIndicator');
            if (loadingInd) {
                loadingInd.classList.remove('hidden');
                document.getElementById('loadingText').textContent = "Buffering next scene...";
            }

            // Check again in 1s
            setTimeout(() => playNextSlide(), 1000);
            return;
        } else {
            // Truly done. Loop.
            console.log("End of poem. Looping.");
            state.currentSlideIndex = 0;
            // Fall through to play 0
        }
    } else {
        // We have data, ensure buffering UI is hidden
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    // Double check we have data now (if we looped)
    const currentData = state.images[state.currentSlideIndex];
    if (!currentData) {
        // Safety for loop edge case if 0 is missing (?)
        setTimeout(() => playNextSlide(), 500);
        return;
    }

    console.log(`Playing slide ${state.currentSlideIndex}:`, currentData);
    console.log(`Playing slide ${state.currentSlideIndex}:`, currentData);

    const container = document.getElementById('slideshow-container');
    const textElement = document.getElementById('poemText');

    // Create new slide element
    const slide = document.createElement('div');
    slide.className = `slide ${currentData.motion || 'kb-zoom-in'}`; // Apply cinematic motion
    slide.style.backgroundImage = `url(${currentData.url})`;
    slide.style.backgroundSize = 'cover'; // Ensure scaling works for both 512 and 1024

    container.appendChild(slide);

    // Trigger reflow
    void slide.offsetWidth;

    // Activate transition
    slide.classList.add('active');

    // Clear previous text IMMEDIATELY
    textElement.textContent = '';
    textElement.style.opacity = 1; // Keep container visible, words will animate in

    // Retrieve Line
    const line = currentData.text;

    // Render Kinetic Typography (Herb Lubalin Style)
    renderKineticText(line, textElement);


    // Clean up old slides
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 2) {
        container.removeChild(slides[0]);
    }

    // Schedule next slide
    // Duration 4s
    setTimeout(() => {
        state.currentSlideIndex++;
        playNextSlide();
    }, 4000);
}

function stopVisualization() {
    state.isPlaying = false;
    document.getElementById('loadingIndicator').classList.add('hidden'); // Ensure loading screen is gone
    document.getElementById('inputPanel').classList.remove('hidden');
    document.getElementById('textOverlay').classList.add('hidden');
    document.getElementById('visualControls').classList.add('hidden');
    document.getElementById('slideshow-container').innerHTML = ''; // Clear slides
}

// ==========================================
// Event Listeners
// ==========================================
// ==========================================
// Event Listeners
// ==========================================
// ==========================================
// Kinetic Typography Engine
// ==========================================
function renderKineticText(text, container) {
    const words = text.split(' ');

    // Total duration available (approx 3.5s before fade out, leaving margin)
    // We want all words to appear within ~2-2.5 seconds max
    const delayPerWord = Math.min(300, 2000 / words.length);

    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.textContent = word + '\u00A0'; // Add non-breaking space
        span.className = 'kinetic-word';

        // Consistent Bold Type (User Request)
        const weights = [700, 800];
        const sizes = ['1.2em', '1.4em', '1.6em'];

        // Deterministic pseudo-random based on word content (so it looks same if replayed)
        const seed = word.length + index;
        const weight = weights[seed % weights.length];
        const size = sizes[seed % sizes.length];

        span.style.fontWeight = weight;
        span.style.fontSize = size;

        // Timing Strategy:
        // We have 4000ms per slide.
        // We want the text to finish building around the 3000ms mark (right before fade out).
        // So we distribute the start times across 0 to 2500ms.
        const maxDuration = 2500;
        const staggeredDelay = Math.min(400, maxDuration / words.length);
        span.style.animationDelay = `${index * staggeredDelay}ms`;

        // Occasional "tight fit" logic (negative margin)
        if (seed % 3 === 0) {
            span.style.letterSpacing = '-0.08em';
        }

        container.appendChild(span);
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const apiKeyInput = document.getElementById('apiKey');
        const inputGroup = apiKeyInput ? apiKeyInput.closest('.input-group') : null;

        // 1. Check Config.js (Local Dev)
        if (typeof config !== 'undefined' && config.openaiApiKey && config.openaiApiKey.length > 0) {
            if (inputGroup) inputGroup.classList.add('hidden');
            console.log("Using local config.js key");
        }

        // 2. Check Azure Backend (Cloud Prod)
        // We do this on load so we can hide the input box if the user set it in Portal
        try {
            const res = await fetch('/api/get-config');
            if (res.ok) {
                const data = await res.json();
                if (data.openaiApiKey) {
                    console.log("Azure Cloud Key detected!");

                    // Hide the input box
                    if (inputGroup) {
                        inputGroup.classList.add('hidden');
                    }

                    // Store it globally for startVisualization
                    window.config = window.config || {};
                    window.config.openaiApiKey = data.openaiApiKey;
                    // Also ensure model is DALL-E 3
                    window.config.dalleModel = window.config.dalleModel || "dall-e-3";
                }
            }
        } catch (err) {
            console.log("Checking cloud config..." + err.message);
        }

    } catch (e) {
        console.warn("Config loading issue:", e);
    }

    const vizBtn = document.getElementById('visualizeBtn');
    const stopBtn = document.getElementById('stopBtn');
    const providerSelect = document.getElementById('aiProvider');

    if (providerSelect) {
        providerSelect.addEventListener('change', (e) => {
            if (e.target.value === 'google') {
                document.getElementById('openai-config').classList.add('hidden');
                document.getElementById('google-config').classList.remove('hidden');
            } else {
                document.getElementById('openai-config').classList.remove('hidden');
                document.getElementById('google-config').classList.add('hidden');
            }
        });
    }

    if (vizBtn) vizBtn.addEventListener('click', startVisualization);
    if (stopBtn) stopBtn.addEventListener('click', stopVisualization);
});

// ==========================================
// Google Vertex AI Logic (Nano Banana)
// ==========================================
// ==========================================
// Google Vertex AI Logic (Nano Banana)
// ==========================================
// ==========================================
// Google Vertex AI Logic (Server-Side Proxy)
// ==========================================
async function generateImageVertex(line, prevLine, composition) {
    // We strictly use the backend proxy now to protect secrets.
    // The backend reads env vars: GOOGLE_API_KEY, GOOGLE_PROJECT_ID, etc.

    const url = '/api/generate-image';

    const payload = {
        prompt: line,
        prevLine: prevLine,
        composition: composition
    };

    // Retry Logic for 429s (handled by backend status codes)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                console.warn(`[Backend] Quota exceeded. Retrying... (${attempts + 1}/${maxAttempts})`);
                attempts++;
                // Exponential backoff
                await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempts)));
                continue;
            }

            if (!response.ok) {
                const errText = await response.text();
                console.error("Backend Error:", errText);
                throw new Error(`Server Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            if (data.url) {
                return data.url;
            }
            throw new Error("No URL in server response");

        } catch (error) {
            console.error(error);
            if (attempts === maxAttempts - 1) throw error;
            attempts++;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

// Global Error Handler
window.onerror = function (msg, url, line, col, error) {
    const errorBox = document.getElementById('errorMessage');
    if (errorBox) {
        errorBox.textContent = `System Error: ${msg}`;
        errorBox.classList.remove('hidden');
    }
    // Attempt recovery
    document.getElementById('inputPanel').classList.remove('hidden');
    document.getElementById('loadingIndicator').classList.add('hidden');
    return false;
};

