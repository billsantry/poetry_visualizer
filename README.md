# Poetry Visualizer ❧

> A cinematic, AI-powered experience that transforms text into a living gallery of "David Park" style paintings.

![Project Status](https://img.shields.io/badge/status-live-success)
![Style](https://img.shields.io/badge/artistic_style-David_Park_%2F_Bay_Area_Figurative-orange)
![AI Model](https://img.shields.io/badge/AI-DALL--E_3-blueviolet)

<p align="center">
  <img src="assets/demo.gif" alt="Poetry Visualizer Demo" width="100%" style="border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
  <br>
  <em>(Add your demo recording here as assets/demo.gif)</em>
</p>

## ✨ About The Project

Poetry Visualizer is a mood-driven application that takes any poem or lyrical snippet and transforms it into a synchronized audiovisual journey. 

Unlike standard AI image generators that default to glossy, hyper-realistic output, this engine has been specifically tuned to emulate the **Bay Area Figurative Movement**—specifically the thick impasto, abstract figures, and moody palette of **David Park**.

### Key Features

*   **🎨 Curated Artistic Direction**: A custom prompt engineering pipeline forces DALL-E 3 to ignore its default "digital art" bias and produce raw, textured, museum-quality painterly images.
*   **🧠 Context-Aware Analysis**: The app analyzes your poem's mood (Melancholy, Energetic, Dark, Romantic) to subtly shift the color palette and composition of the generated art.
*   **🎥 Ken Burns Animation**: Text is dynamically overlaid with a slow, cinematic zoom effect, keeping the viewer immersed in the rhythm of the words.
*   **🛡️ Smart Safety**: Built-in sanitization ensures that even intense poetic imagery (like "exploding heads" or "wrecks") is visualized metaphorically rather than triggering content filters.
*   **⚡ Smart Buffering**: The slideshow engine pre-fetches imagery to ensure a seamless "no-black-screen" playback experience.

## 🛠️ Tech Stack

*   **Frontend**: React + Vite
*   **AI**: OpenAI DALL-E 3 (via Proxy)
*   **Motion**: Framer Motion
*   **Styling**: Tailwind CSS + Custom CSS Modules
*   **Deployment**: Azure Static Web Apps

## 🚀 Getting Started

1.  **Clone the repo**
    ```sh
    git clone https://github.com/billsantry/poetry_visualizer.git
    ```
2.  **Install dependencies**
    ```sh
    npm install
    ```
3.  **Set up Environment**
    Create a `.env.local` file with your OpenAI key:
    ```env
    VITE_OPENAI_API_KEY=sk-your-key-here
    VITE_DALLE_MODEL=dall-e-3
    ```
4.  **Run Locally**
    ```sh
    npm run dev
    ```

## 🎨 The "David Park" Aesthetic

One of the hardest challenges in AI art is preventing "Text Hallucinations" (where the AI writes the prompt words onto the image). 

We solved this by pivoting specifically to the **David Park / Bay Area Figurative** style. This art movement is characterized by:
*   Thick, gestural brushstrokes (Impasto)
*   Abstracted human figures with no defined facial features
*   Rich, earthy, and moody color fields

This style naturally discourages the model from attempting fine typography or photorealism, resulting in a consistent, "human-made" feel.

## 🤝 Credits

*   **Creator**: [billsantry](https://billsantry.com)
*   **Powered By**: [Google AntiGravity](https://antigravity.google/)

---
<p align="center">
  <small>Made with ❤️ and 🤖</small>
</p>
