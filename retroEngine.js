// retroEngine.js - 8-Bit Procedural Poetry Visualizer

const retroEngine = {
    canvas: null,
    ctx: null,
    width: 320,  // Low internal resolution for pixel look
    height: 200,

    // Aesthetic State
    currentPalette: null,
    entities: [],
    frameCount: 0,
    animationFrameId: null,

    // Hero State
    hero: {
        x: 40,
        y: 160,
        vy: 0,
        groundY: 160,
        isJumping: false,
        actionTimer: 0
    },

    // ... (Palettes kept same) ...

    init() { /* kept same */
        let existingCanvas = document.getElementById('retroCanvas');
        if (!existingCanvas) {
            existingCanvas = document.createElement('canvas');
            existingCanvas.id = 'retroCanvas';
            existingCanvas.width = this.width;
            existingCanvas.height = this.height;
            document.querySelector('.container').prepend(existingCanvas);
        }

        this.canvas = existingCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
    },

    triggerScene(line, sentiment) {
        const dominant = Object.keys(sentiment).reduce((a, b) => sentiment[a] > sentiment[b] ? a : b);
        this.currentPalette = this.palettes[dominant] || this.palettes.peace;

        // Trigger Hero Interaction based on mood
        if (dominant === 'joy') this.heroJump();
        if (dominant === 'anger') this.heroAttack();
        if (dominant === 'sadness') this.heroWalk();
        else this.heroRun();

        // 3. Reset Particles & Enemies
        this.entities = [];
        this.generateParticles(dominant);

        if (!this.animationFrameId) this.animate();
    },

    // ==================
    // Hero Actions
    // ==================
    heroJump() {
        if (!this.hero.isJumping) {
            this.hero.vy = -6; // Jump impulse
            this.hero.isJumping = true;
            try { audioService.playJump(); } catch (e) { }
        }
    },
    heroAttack() {
        this.hero.actionTimer = 20; // 20 frames of "attack"
        try { audioService.playHit(); } catch (e) { }
    },
    heroWalk() {
        // Just visual speed change handled in render
    },
    heroRun() {
        // Reset
    },

    animate() {
        this.update();
        this.render();
        this.frameCount++;
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    },

    update() {
        const h = this.hero;

        // Physics
        h.y += h.vy;
        h.vy += 0.3; // Gravity

        // Ground Collision
        if (h.y > h.groundY) {
            h.y = h.groundY;
            h.vy = 0;
            h.isJumping = false;
        }

        // Action Timer
        if (h.actionTimer > 0) h.actionTimer--;

        // Update Entities (Cleanup)
        this.entities.forEach((e, i) => {
            if (e.x < -20) this.entities.splice(i, 1);
        });
    },

    render() {
        if (!this.currentPalette) return;

        const p = this.currentPalette;
        const ctx = this.ctx;

        // ... (Sky, Sun, Mountains mostly same but refined) ...

        let shakeX = 0; let shakeY = 0;
        if (this.hero.actionTimer > 0) { // Shake on attack
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 4;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // 1. Draw Sky
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, p.sky[0]);
        grad.addColorStop(1, p.sky[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(-10, -10, this.width + 20, this.height + 20);

        // 2. Draw Sun
        ctx.fillStyle = p.accent;
        ctx.fillRect(240, 40, 20, 20);

        // 3. Mounts
        this.drawMountains(p.mountains, 0.5, 80, 0.01);
        this.drawMountains(p.ground, 1.5, 130, 0.02); // Ground raised for platform

        // 4. Hero
        this.drawHero(p);

        // 5. Particles
        this.updateAndDrawParticles();

        ctx.restore();
    },

    drawHero(p) {
        const ctx = this.ctx;
        const h = this.hero;

        ctx.fillStyle = '#FFFFFF'; // White Hero 

        // Simple Body
        ctx.fillRect(Math.floor(h.x), Math.floor(h.y - 12), 8, 12);

        // Head
        ctx.fillStyle = '#FFCCAA'; // Skin tone
        ctx.fillRect(Math.floor(h.x), Math.floor(h.y - 18), 8, 6);

        // Legs (Animation)
        ctx.fillStyle = '#FFFFFF';
        if (Math.floor(this.frameCount / 5) % 2 === 0 || h.isJumping) {
            ctx.fillRect(Math.floor(h.x), Math.floor(h.y), 3, 3); // Left foot
            ctx.fillRect(Math.floor(h.x + 5), Math.floor(h.y - 1), 3, 3); // Right foot up
        } else {
            ctx.fillRect(Math.floor(h.x), Math.floor(h.y - 1), 3, 3);
            ctx.fillRect(Math.floor(h.x + 5), Math.floor(h.y), 3, 3);
        }

        // Action Effect (Sword/Attack)
        if (h.actionTimer > 0) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(Math.floor(h.x + 8), Math.floor(h.y - 10), 12, 4); // Sword
        }
    },

    palettes: {
        joy: {
            sky: ['#5C94FC', '#98C9FC'], // NES Mario Sky
            ground: '#80D010',
            accent: '#F8B800', // Gold
            mountains: '#00A800'
        },
        sadness: {
            sky: ['#8BAC0F', '#306230'], // Gameboy Green
            ground: '#0F380F',
            accent: '#306230',
            mountains: '#0F380F'
        },
        anger: {
            sky: ['#590909', '#000000'], // Virtual Boy style
            ground: '#2D0606',
            accent: '#FF0000',
            mountains: '#420000'
        },
        fear: {
            sky: ['#000000', '#202040'],
            ground: '#101020',
            accent: '#404060',
            mountains: '#080810'
        },
        peace: {
            sky: ['#F8B8F8', '#9494FF'], // Cotton candy
            ground: '#FCD8A8',
            accent: '#FFFFFF',
            mountains: '#E45C10'
        }
    },

    init() {
        // Create canvas if not exists
        let existingCanvas = document.getElementById('retroCanvas');
        if (!existingCanvas) {
            existingCanvas = document.createElement('canvas');
            existingCanvas.id = 'retroCanvas';
            existingCanvas.width = this.width;
            existingCanvas.height = this.height;
            // CSS handles scaling up to viewport
            document.querySelector('.container').prepend(existingCanvas);
        }

        this.canvas = existingCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Critical for 8-bit look
    },

    /**
     * Trigger a new scene based on sentiment
     */
    triggerScene(line, sentiment) {
        // 1. Determine dominant sentiment for palette
        const dominant = Object.keys(sentiment).reduce((a, b) => sentiment[a] > sentiment[b] ? a : b);
        this.currentPalette = this.palettes[dominant] || this.palettes.peace;

        console.log(`👾 8-Bit Scene: ${dominant}`);

        // 2. Generate new Terrain Seed
        this.seed = Math.random();

        // 3. Reset Particles
        this.entities = [];
        this.generateParticles(dominant);

        // 4. Start Animation Loop if not running
        if (!this.animationFrameId) {
            this.animate();
        }
    },

    animate() {
        this.render();
        this.frameCount++;
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    },

    render() {
        if (!this.currentPalette) return;

        const p = this.currentPalette;
        const ctx = this.ctx;

        // Camera Shake (Anger/Fear)
        let shakeX = 0;
        let shakeY = 0;
        if (this.currentPalette === this.palettes.anger || this.currentPalette === this.palettes.fear) {
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 4;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // 1. Draw Sky
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, p.sky[0]);
        grad.addColorStop(1, p.sky[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(-10, -10, this.width + 20, this.height + 20); // Oversize for shake

        // 2. Draw Sun/Moon (Pulsing)
        ctx.fillStyle = p.accent;
        let pulse = Math.sin(this.frameCount * 0.05) * 2;
        let sunY = 40 + Math.sin(this.frameCount * 0.02) * 10;
        ctx.fillRect(240 - pulse / 2, Math.floor(sunY) - pulse / 2, 20 + pulse, 20 + pulse);

        // 3. Draw Parallax Mountains (Faster layers)
        // Layer 1 (Far, Slow)
        this.drawMountains(p.mountains, 0.5, 80, 0.01);
        // Layer 2 (Mid, Medium)
        this.drawMountains(p.ground, 1.5, 120, 0.02);
        // Layer 3 (Close, Fast - Ground)
        this.drawMountains(p.accent, 3.0, 180, 0.05); // Add tint logic? simplified for now

        // 4. Draw Particles
        this.updateAndDrawParticles();

        ctx.restore();
    },

    drawMountains(color, speed, baseY, frequency) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, this.height);

        const scroll = this.frameCount * speed;

        for (let x = 0; x <= this.width; x += 4) {
            // Composite noise for jagged look
            const noise = Math.sin((x + scroll) * frequency) * 20
                + Math.cos((x + scroll * 0.5) * (frequency * 2.5)) * 10;
            const y = baseY + noise;
            ctx.lineTo(x, y);
        }

        ctx.lineTo(this.width, this.height);
        ctx.fill();
    },

    generateParticles(mood) {
        let count = 0;
        let type = 'dust';

        if (mood === 'sadness') { count = 80; type = 'rain'; }
        if (mood === 'joy') { count = 40; type = 'sparkle'; }
        if (mood === 'anger') { count = 60; type = 'ember'; }
        if (mood === 'fear') { count = 30; type = 'ghost'; }
        // Peace: Clouds
        if (mood === 'peace') { count = 10; type = 'cloud'; }

        for (let i = 0; i < count; i++) {
            this.entities.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                type: type,
                speed: Math.random() * 3 + 1 // Faster base speed
            });
        }
    },

    updateAndDrawParticles() {
        const ctx = this.ctx;

        this.entities.forEach(e => {
            ctx.fillStyle = this.currentPalette.accent;

            // Update Logic
            if (e.type === 'rain') {
                e.y += e.speed * 3; // Fast Falling
                e.x -= 1; // Slant
                if (e.y > this.height) { e.y = 0; e.x = Math.random() * this.width; }

                ctx.fillStyle = '#A0D0F0';
                ctx.fillRect(Math.floor(e.x), Math.floor(e.y), 1, 4);
            }
            else if (e.type === 'ember') {
                e.y -= e.speed;
                e.x += (Math.random() - 0.5) * 2; // Jitter
                if (e.y < 0) { e.y = this.height; e.x = Math.random() * this.width; }

                ctx.fillStyle = Math.random() > 0.5 ? '#FF4000' : '#FFD000';
                ctx.fillRect(Math.floor(e.x), Math.floor(e.y), 2, 2);
            }
            else if (e.type === 'cloud') {
                e.x -= e.speed * 0.2; // Slow scroll
                if (e.x < -20) e.x = this.width + 20;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                // Draw simple pixel cloud shape
                ctx.fillRect(Math.floor(e.x), Math.floor(e.y), 10, 4);
                ctx.fillRect(Math.floor(e.x + 2), Math.floor(e.y - 2), 6, 2);
            }
            else if (e.type === 'sparkle') {
                e.y -= e.speed * 0.5;
                if (e.y < 0) e.y = this.height;
                // Twinkle
                if (this.frameCount % 20 < 10) {
                    ctx.fillRect(Math.floor(e.x), Math.floor(e.y), 3, 3);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(Math.floor(e.x + 1), Math.floor(e.y + 1), 1, 1);
                }
            }
            else if (e.type === 'ghost') {
                e.x += Math.sin(this.frameCount * 0.05 + e.y) * 1;
                e.y -= 0.5;
                if (e.y < 0) e.y = this.height;
                ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
                ctx.fillRect(Math.floor(e.x), Math.floor(e.y), 4, 4);
            }
            else {
                // Dust
                e.x += Math.sin(this.frameCount * 0.05) * 0.5;
                e.y += Math.cos(this.frameCount * 0.05) * 0.5;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(Math.floor(e.x), Math.floor(e.y), 1, 1);
            }
        });
    }
};
