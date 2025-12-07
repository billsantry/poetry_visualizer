// audioService.js - Retro Chiptune Synthesizer

const audioService = {
    ctx: null,
    masterGain: null,
    isPlaying: false,
    tempo: 120,
    nextNoteTime: 0,
    timerID: null,
    currentMood: 'peace',

    // Musical Scales (MIDI note numbers, relative to root)
    scales: {
        joy: [0, 4, 7, 12, 16], // Major Arp
        sadness: [0, 3, 7, 12, 15], // Minor Arp
        anger: [0, 1, 4, 6, 7], // Phrygian/Diminished feel
        fear: [0, 6, 12, 13, 18], // Tritones
        peace: [0, 2, 4, 7, 9] // Pentatonic
    },

    rootNote: 60, // C4

    // Initialize Audio Context
    async init() {
        if (this.ctx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        await this.ctx.resume();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Low volume for safety
        this.masterGain.connect(this.ctx.destination);
    },

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime;
        this.scheduler();
    },

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    },

    setMood(sentiment) {
        // Find dominant mood
        const mood = Object.keys(sentiment).reduce((a, b) => sentiment[a] > sentiment[b] ? a : b);
        this.currentMood = mood;

        // Adjust Tempo
        if (mood === 'anger') this.tempo = 240;
        else if (mood === 'joy') this.tempo = 160;
        else if (mood === 'sadness') this.tempo = 90;
        else if (mood === 'fear') this.tempo = 100;
        else this.tempo = 120; // Peace

        console.log(`🎵 Mood set to: ${mood}, Tempo: ${this.tempo}`);
    },

    // ==========================================
    // Sound Generators
    // ==========================================

    playNote(midiNote, length, type = 'square') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(this.midiToFreq(midiNote), this.ctx.currentTime);

        // Envelope
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + length);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + length);
    },

    playNoise(length) {
        const bufferSize = this.ctx.sampleRate * length;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + length);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    },

    // ==========================================
    // Scheduler (The "Tracker")
    // ==========================================
    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playPattern();
            this.scheduleNextNote();
        }
        if (this.isPlaying) {
            this.timerID = setTimeout(() => this.scheduler(), 25);
        }
    },

    scheduleNextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat * 0.25; // 16th notes
    },

    playPattern() {
        const scale = this.scales[this.currentMood] || this.scales.peace;

        // Randomly pick a note from the scale
        const noteIndex = Math.floor(Math.random() * scale.length);
        const note = this.rootNote + scale[noteIndex];

        // 50% chance to play melody
        if (Math.random() > 0.4) {
            this.playNote(note + (Math.random() > 0.8 ? 12 : 0), 0.1, 'square');
        }

        // Bass (on beat)
        const time = this.ctx.currentTime;
        // Simple modulo trick for beats since we don't strictly track bars here
        if (Math.floor(time * 4) % 4 === 0) {
            this.playNote(this.rootNote - 12, 0.2, 'triangle');
        }

        // Percussion (Noise)
        if (Math.random() > 0.9) {
            this.playNoise(0.05);
        }
    },

    midiToFreq(m) {
        return 440 * Math.pow(2, (m - 69) / 12);
    },

    // ==========================================
    // Sound Effects
    // ==========================================
    playJump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    playCollect() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
        osc.frequency.setValueAtTime(1500, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    playHit() {
        this.playNoise(0.2);
    }
};
