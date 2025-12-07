// ==========================================
// Poetry Visualizer Controller (DALL-E Version)
// ==========================================

const state = {
    isPlaying: false,
    poemLines: [],
    images: [], // Array of { url, text }
    currentSlideIndex: 0,
};

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

        // Check config for key if not in input
        if (!apiKeyInput && typeof config !== 'undefined' && config.openaiApiKey) {
            apiKeyInput = config.openaiApiKey;
            console.log("Using API Key from config.js");
        }

        // If still no key, try fetching from Azure Backend (Portal Settings)
        if (!apiKeyInput) {
            try {
                const res = await fetch('/api/get-config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.openaiApiKey) {
                        apiKeyInput = data.openaiApiKey;
                        console.log("Using API Key from Azure Portal (Backend)");
                    }
                }
            } catch (err) {
                console.log("No backend config available, skipping.");
            }
        }

        if (!apiKeyInput) {
            showError('Please enter your OpenAI API Key (or set it in Azure Portal Configuration).');
            return;
        }
        config.openaiApiKey = apiKeyInput;

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
        document.getElementById('loadingText').textContent = "Analyzing poem and dreaming up visuals...";

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

async function generateStream() {
    const loadingText = document.getElementById('loadingText');
    const progressBar = document.getElementById('progressBarFill');
    const total = state.poemLines.length;
    const btnText = document.getElementById('btnText');

    console.log("Starting generation stream...");

    for (let i = 0; i < total; i++) {
        const line = state.poemLines[i];
        const prevLine = i > 0 ? state.poemLines[i - 1] : "";

        // Cycle through composition rules
        const rule = cinematicRules[i % cinematicRules.length];

        if (state.images.length === 0) {
            loadingText.textContent = `Directing scene ${i + 1} of ${total}...\n"${line.substring(0, 30)}..."\n[${rule.composition}]`;
        }

        try {
            const imageUrl = await generateImageForLine(line, prevLine, rule.composition);
            state.images.push({
                url: imageUrl,
                text: line,
                motion: rule.motion
            });

            // Update Progress Bar
            if (progressBar) {
                const percent = ((i + 1) / total) * 100;
                progressBar.style.width = `${percent}%`;
            }

            // Start slideshow IMMEDIATELY after first frame is ready
            if (i === 0) {
                console.log("First frame ready. Starting action.");
                document.getElementById('loadingIndicator').classList.add('hidden');
                document.getElementById('visualControls').classList.remove('hidden');
                document.getElementById('textOverlay').classList.remove('hidden');
                btnText.textContent = "Visualize Poem";
                startSlideshow();
            }

        } catch (e) {
            console.error(`Failed to generate image for line "${line}":`, e);
            if (i === 0) {
                showError(e.message);
                stopVisualization();
                return; // Stop stream if first fails
            }

            // Fallback for others
            state.images.push({
                url: 'https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop',
                text: line,
                motion: "kb-zoom-in"
            });
        }
    }
    // Complete progress
    if (progressBar) progressBar.style.width = '100%';
}

async function generateImageForLine(line, prevLine, composition) {
    if (typeof config === 'undefined' || !config.openaiApiKey) throw new Error("Missing API Key");

    // Context-Aware Prompt Engineering
    const contextSection = prevLine ? `Story Context (Previous Line): "${prevLine}".` : "Story Context: Opening scene.";

    // Style: Motion Blur & Kinetic Flow
    const organicStyle = "Long exposure photography, strong motion blur, sweeping light trails, kinetic energy. Ethereal, dreamlike, flowing atmosphere. Abstract but cinematic.";

    const prompt = `
    A simple, low-complexity visual interpretation.
    Subject: A visually abstract interpretation of: "${line}".
    ${contextSection}
    Visual Style: ${organicStyle}
    Composition: ${composition}.
    IMPORTANT: The image must be completely free of text, letters, words, titles, and typography. The scene is a visual mood piece.
    `.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s to allow for retries/queues

    // Speed Mode: DALL-E 2, 512x512 (via config)
    const model = config.dalleModel || "dall-e-2";
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

    // Check if we are at the end of the KNOWN images
    if (state.currentSlideIndex >= state.images.length) {

        // Buffering Check: Do we expect more images?
        if (state.images.length < state.poemLines.length) {
            console.log("Buffering... Waiting for DALL-E...");
            // Show buffering UI? (Optional, staying on current image is usually fine/cinematic)
            setTimeout(() => playNextSlide(), 1000); // Check again in 1s
            return;
        } else {
            // Truly done. Loop or stop.
            state.currentSlideIndex = 0; // Loop
        }
    }

    const currentData = state.images[state.currentSlideIndex];
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

    // Update Text
    textElement.textContent = currentData.text;
    textElement.style.opacity = 0;
    setTimeout(() => textElement.style.opacity = 1, 1000);

    // Fade out text before next slide
    setTimeout(() => {
        textElement.style.opacity = 0;
    }, 9000);

    // Clean up old slides
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 2) {
        container.removeChild(slides[0]);
    }

    // Schedule next slide
    // Duration 10s
    setTimeout(() => {
        state.currentSlideIndex++;
        playNextSlide();
    }, 3000);
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
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Safe check for config
        if (typeof config !== 'undefined' && config.openaiApiKey && config.openaiApiKey.length > 0) {
            const apiKeyInput = document.getElementById('apiKey');
            const inputGroup = apiKeyInput ? apiKeyInput.closest('.input-group') : null;
            if (inputGroup) {
                inputGroup.classList.add('hidden');
            }
            console.log("API Key found in config.js. Hiding input field.");
        }
    } catch (e) {
        console.warn("Config loading issue or config not defined:", e);
    }

    const vizBtn = document.getElementById('visualizeBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (vizBtn) vizBtn.addEventListener('click', startVisualization);
    if (stopBtn) stopBtn.addEventListener('click', stopVisualization);
});

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

