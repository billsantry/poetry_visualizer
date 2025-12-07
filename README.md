# Celestial Nadir - AI Poetry Visualizer

**Celestial Nadir** is an immersive, AI-powered poetry visualizer that brings words to life. It analyzes the text of a poem and generates a synchronized distinct cinematic slideshow using OpenAI's DALL-E, set to a moody, organic "motion blur" aesthetic.

## Features

-   **AI-Generated Imagery**: Uses OpenAI's **DALL-E 3** to create unique, context-aware visuals for each line of your poem.
-   **Cinematic "Motion Blur" Aesthetic**: prompts are engineered to produce images with strong kinetic energy, long exposure effects, and a dreamlike flow, avoiding the static "digital art" look.
-   **Intelligent Pacing**: The visualizer attempts to sync the slideshow pacing with the rhythm of the text reading.
-   **Ken Burns Effect**: Slides are animated with smooth pans and zooms to create a feeling of constant motion.
-   **Deep Space Atmosphere**: The UI features a subtle, animated deep-space background with aurora effects.
-   **Configurable**: Easily swap between DALL-E models or adjust image quality settings.

## Getting Started

### Prerequisites

-   A modern web browser (Chrome, Firefox, Safari, Edge).
-   An **OpenAI API Key** with access to DALL-E 3.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/billsantry/celestial-nadir.git
    cd celestial-nadir
    ```

2.  **Configuration (Optional):**
    You can save your API key locally to avoid entering it every time.
    *   Rename `config.js.example` to `config.js`.
    *   Open `config.js` and paste your OpenAI API Key:
        ```javascript
        const config = {
            openaiApiKey: 'sk-your-actual-api-key-here',
            // ... other settings
        };
        ```
    *   *Note: Your API key is stored ONLY in your local browser/file. It is never sent to any third-party server besides OpenAI.*

### Running the App

Because this project uses ES Modules, you cannot simply open `index.html` directly from your file system. You must run a local web server.

**Using Python (Pre-installed on macOS/Linux):**
```bash
# In the project directory
python3 -m http.server 8000
```

Then open your browser and go to:
**[http://localhost:8000](http://localhost:8000)**

## Usage

1.  **Enter Poem**: Paste your poem into the text box.
2.  **Visual Style**: The current default style is set to "Motion Blur & Kinetic Flow" (Long exposure, ethereal, abstract).
3.  **Visualize**: Click the "Visualize Poem" button.
4.  **Enjoy**: The app will generate images in the background and start the slideshow automatically once the first slide is ready.

## Customization

You can tweak the generation settings in `config.js`:

-   **`dalleModel`**: `'dall-e-3'` (High Quality) or `'dall-e-2'` (Faster, Lower Cost).
-   **`dalleSize`**: `'1024x1024'` or `'512x512'`.

To change the **Visual Style** (prompt engineering), edit `script.js` and modify the `organicStyle` variable.

## Credits

Created by [billsantry](https://github.com/billsantry) using Google Antigravity.
