
// Utility to export the visualization as a client-side recorded video
// Specs: 1080x1920 (Portrait), 3.5s per slide, MP4/WebM

export const exportVideo = async (images) => {
    // 1. Setup Canvas (Portrait 9:16)
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Load Fonts specifically for Canvas
    await document.fonts.ready;

    // 2. Preload Images with CORS
    const loadedAssets = await Promise.all(images.map(async (imgData) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Critical for captureStream
            img.onload = () => resolve({ img, segment: imgData.segment || '' });
            img.onerror = () => {
                console.warn('Failed to load image for video:', imgData.url);
                resolve({ img: null, segment: imgData.segment || '' }); // fallback
            };
            img.src = imgData.url;
        });
    }));

    // 3. Recorder Setup
    const stream = canvas.captureStream(30); // 30 FPS

    // Determine MIME type
    let mimeType = 'video/webm;codecs=vp9';
    if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    const finished = new Promise((resolve, reject) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `poetry_visualization_${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
        };
        recorder.onerror = reject;
    });

    recorder.start();

    // 4. Animation Loop
    const fps = 30;
    const durationPerSlideMs = 3500;
    const framesPerSlide = Math.floor((durationPerSlideMs / 1000) * fps);
    const totalSlides = loadedAssets.length;

    // Helper to wrap text
    const drawCenteredText = (text, alpha) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'white';
        ctx.font = 'normal 60px "EB Garamond"'; // Matches ~text-5xl
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Manual wrapping
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const width = ctx.measureText(currentLine + " " + words[i]).width;
            if (width < width * 0.8) { // Safety margin
                currentLine += " " + words[i];
            } else if (width > 900) { // Max width 900px
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine += " " + words[i];
            }
        }
        lines.push(currentLine);

        // Draw lines
        const lineHeight = 80;
        const totalHeight = lines.length * lineHeight;
        let startY = (height / 2) - (totalHeight / 2);

        // Add shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        lines.forEach((line, idx) => {
            ctx.fillText(line, width / 2, startY + (idx * lineHeight));
        });

        ctx.restore();
    };

    // Render loop
    for (let i = 0; i < totalSlides; i++) {
        const asset = loadedAssets[i];

        for (let frame = 0; frame < framesPerSlide; frame++) {
            // Clear
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);

            if (asset.img) {
                // Ken Burns Scale: 1.0 -> 1.15
                const progress = frame / framesPerSlide;
                const scale = 1.0 + (progress * 0.15);

                ctx.save();
                // Center zoom
                ctx.translate(width / 2, height / 2);
                ctx.scale(scale, scale);
                ctx.translate(-width / 2, -height / 2);

                // Draw Image Cover (Center Crop)
                const imgRatio = asset.img.width / asset.img.height;
                const canvasRatio = width / height;
                let renderParams;

                if (imgRatio > canvasRatio) {
                    // Image wider than canvas: crop sides
                    const drawW = height * imgRatio;
                    const offsetX = (width - drawW) / 2;
                    renderParams = [offsetX, 0, drawW, height];
                } else {
                    // Image taller: crop top/bottom (unlikely for DALL-E) or fit
                    const drawH = width / imgRatio;
                    const offsetY = (height - drawH) / 2;
                    renderParams = [0, offsetY, width, drawH];
                }

                ctx.filter = 'brightness(0.7)'; // Match visualizer dimming
                ctx.drawImage(asset.img, ...renderParams);
                ctx.restore();
            }

            // Draw Text (Fade In)
            // Visualizer staggers words, we just fade in the line cleanly
            // Fade in over first 0.8s (approx 24 frames)
            let alpha = 1;
            if (frame < 24) {
                alpha = frame / 24;
            }
            if (asset.segment) {
                drawCenteredText(asset.segment, alpha);
            }

            // Wait for next frame interval (30fps = ~33ms)
            // We MUST wait real-time duration because captureStream records in real-time.
            await new Promise(r => setTimeout(r, 1000 / fps));
        }
    }

    recorder.stop();
    await finished;
};
