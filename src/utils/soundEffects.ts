// Sound effects utility for Stickee notes
class SoundEffects {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize audio context on first user interaction
    this.initAudioContext();
  }

  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a unique sound for creating new notes
  playNewNoteSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;

    // Create an exciting, uplifting musical sequence for new notes
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },    // C5
      { freq: 659.25, time: 0.1, duration: 0.15 },  // E5
      { freq: 783.99, time: 0.2, duration: 0.2 },   // G5
      { freq: 1046.50, time: 0.35, duration: 0.25 }, // C6 (higher octave)
      { freq: 1318.51, time: 0.5, duration: 0.3 },   // E6 (sparkle!)
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime + time);
      oscillator.type = freq > 1000 ? 'sine' : 'triangle'; // Higher notes as sine for sparkle

      // Envelope for each note
      gainNode.gain.setValueAtTime(0, currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.3, currentTime + time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + time + duration);

      oscillator.start(currentTime + time);
      oscillator.stop(currentTime + time + duration);
    });

    // Add a subtle reverb-like tail
    const reverbOsc = ctx.createOscillator();
    const reverbGain = ctx.createGain();
    reverbOsc.connect(reverbGain);
    reverbGain.connect(ctx.destination);
    reverbOsc.frequency.setValueAtTime(1567.98, currentTime + 0.6); // G6
    reverbOsc.type = 'sine';
    reverbGain.gain.setValueAtTime(0, currentTime + 0.6);
    reverbGain.gain.linearRampToValueAtTime(0.05, currentTime + 0.61);
    reverbGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.8);
    reverbOsc.start(currentTime + 0.6);
    reverbOsc.stop(currentTime + 0.8);
  }

  // Play a success sound for saving existing notes
  playSaveSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;

    // Create a pleasant, confirming musical sequence
    const notes = [
      { freq: 440.00, time: 0, duration: 0.15 },     // A4
      { freq: 554.37, time: 0.1, duration: 0.15 },   // C#5
      { freq: 659.25, time: 0.2, duration: 0.2 },    // E5
      { freq: 880.00, time: 0.35, duration: 0.25 },   // A5 (one octave up)
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime + time);
      oscillator.type = 'sine';

      // Envelope for each note
      gainNode.gain.setValueAtTime(0, currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.25, currentTime + time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + time + duration);

      oscillator.start(currentTime + time);
      oscillator.stop(currentTime + time + duration);
    });

    // Add a gentle chord at the end
    const chordOsc1 = ctx.createOscillator();
    const chordOsc2 = ctx.createOscillator();
    const chordGain = ctx.createGain();
    
    chordOsc1.connect(chordGain);
    chordOsc2.connect(chordGain);
    chordGain.connect(ctx.destination);
    
    chordOsc1.frequency.setValueAtTime(523.25, currentTime + 0.5); // C5
    chordOsc2.frequency.setValueAtTime(659.25, currentTime + 0.5); // E5
    chordOsc1.type = 'sine';
    chordOsc2.type = 'sine';
    
    chordGain.gain.setValueAtTime(0, currentTime + 0.5);
    chordGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.51);
    chordGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.7);
    
    chordOsc1.start(currentTime + 0.5);
    chordOsc2.start(currentTime + 0.5);
    chordOsc1.stop(currentTime + 0.7);
    chordOsc2.stop(currentTime + 0.7);
  }

  // Play a deletion sound (descending tone)
  playDeleteSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;

    // Create a descending musical sequence for deletion
    const notes = [
      { freq: 880.00, time: 0, duration: 0.15 },     // A5
      { freq: 659.25, time: 0.1, duration: 0.15 },   // E5
      { freq: 523.25, time: 0.2, duration: 0.2 },    // C5
      { freq: 392.00, time: 0.35, duration: 0.2 },    // G4
      { freq: 261.63, time: 0.5, duration: 0.25 },   // C4 (low)
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime + time);
      oscillator.type = freq < 400 ? 'sawtooth' : 'triangle'; // Lower notes with sawtooth for depth

      // Envelope for each note
      gainNode.gain.setValueAtTime(0, currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.2, currentTime + time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + time + duration);

      oscillator.start(currentTime + time);
      oscillator.stop(currentTime + time + duration);
    });

    // Add a fading low rumble at the end
    const rumbleOsc = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumbleOsc.frequency.setValueAtTime(130.81, currentTime + 0.7); // C3
    rumbleOsc.type = 'sine';
    rumbleGain.gain.setValueAtTime(0, currentTime + 0.7);
    rumbleGain.gain.linearRampToValueAtTime(0.08, currentTime + 0.71);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.9);
    rumbleOsc.start(currentTime + 0.7);
    rumbleOsc.stop(currentTime + 0.9);
  }
// Play a notification/alert sound for issue submission
  playIssueSubmitSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;

    // Create a longer, more elaborate attention-grabbing sequence
    const notes = [
      { freq: 587.33, time: 0, duration: 0.1 },      // D5
      { freq: 698.46, time: 0.05, duration: 0.1 },   // F5
      { freq: 880.00, time: 0.1, duration: 0.15 },    // A5
      { freq: 1046.50, time: 0.2, duration: 0.2 },   // C6 (alert!)
      { freq: 1174.66, time: 0.35, duration: 0.15 },  // D6
      { freq: 1396.91, time: 0.45, duration: 0.2 },   // F6
      { freq: 1567.98, time: 0.6, duration: 0.25 },   // G6
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime + time);
      oscillator.type = freq > 800 ? 'square' : 'triangle'; // Higher notes as square for attention

      // Sharp envelope for alert feel
      gainNode.gain.setValueAtTime(0, currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.2, currentTime + time + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + time + duration);

      oscillator.start(currentTime + time);
      oscillator.stop(currentTime + time + duration);
    });

    // Add a more elaborate confirmation chord at the end
    const chordOsc1 = ctx.createOscillator();
    const chordOsc2 = ctx.createOscillator();
    const chordOsc3 = ctx.createOscillator();
    const chordGain = ctx.createGain();
    
    chordOsc1.connect(chordGain);
    chordOsc2.connect(chordGain);
    chordOsc3.connect(chordGain);
    chordGain.connect(ctx.destination);
    
    chordOsc1.frequency.setValueAtTime(1318.51, currentTime + 0.85); // E6
    chordOsc2.frequency.setValueAtTime(1567.98, currentTime + 0.85); // G6
    chordOsc3.frequency.setValueAtTime(1760.00, currentTime + 0.85); // A6
    chordOsc1.type = 'sine';
    chordOsc2.type = 'sine';
    chordOsc3.type = 'sine';
    
    chordGain.gain.setValueAtTime(0, currentTime + 0.85);
    chordGain.gain.linearRampToValueAtTime(0.12, currentTime + 0.86);
    chordGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.1);
    
    chordOsc1.start(currentTime + 0.85);
    chordOsc2.start(currentTime + 0.85);
    chordOsc3.start(currentTime + 0.85);
    chordOsc1.stop(currentTime + 1.1);
    chordOsc2.stop(currentTime + 1.1);
    chordOsc3.stop(currentTime + 1.1);

    // Add a final sparkle effect
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkleOsc.frequency.setValueAtTime(2093.00, currentTime + 1.0); // C7
    sparkleOsc.type = 'sine';
    sparkleGain.gain.setValueAtTime(0, currentTime + 1.0);
    sparkleGain.gain.linearRampToValueAtTime(0.06, currentTime + 1.01);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.2);
    sparkleOsc.start(currentTime + 1.0);
    sparkleOsc.stop(currentTime + 1.2);
  }

  // Play archive sound (gentle descending melody)
  playArchiveSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;

    // Create a gentle, pleasant descending melody for archiving
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },     // C5
      { freq: 440.00, time: 0.12, duration: 0.15 },   // A4
      { freq: 392.00, time: 0.24, duration: 0.2 },    // G4
      { freq: 349.23, time: 0.36, duration: 0.2 },    // F4
      { freq: 329.63, time: 0.48, duration: 0.25 },   // E4
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime + time);
      oscillator.type = 'sine';

      // Gentle envelope for each note
      gainNode.gain.setValueAtTime(0, currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.2, currentTime + time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + time + duration);

      oscillator.start(currentTime + time);
      oscillator.stop(currentTime + time + duration);
    });

    // Add a soft chord at the end for completion
    const chordOsc1 = ctx.createOscillator();
    const chordOsc2 = ctx.createOscillator();
    const chordGain = ctx.createGain();
    
    chordOsc1.connect(chordGain);
    chordOsc2.connect(chordGain);
    chordGain.connect(ctx.destination);
    
    chordOsc1.frequency.setValueAtTime(261.63, currentTime + 0.7); // C4
    chordOsc2.frequency.setValueAtTime(329.63, currentTime + 0.7); // E4
    chordOsc1.type = 'sine';
    chordOsc2.type = 'sine';
    
    chordGain.gain.setValueAtTime(0, currentTime + 0.7);
    chordGain.gain.linearRampToValueAtTime(0.08, currentTime + 0.71);
    chordGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.9);
    
    chordOsc1.start(currentTime + 0.7);
    chordOsc2.start(currentTime + 0.7);
    chordOsc1.stop(currentTime + 0.9);
    chordOsc2.stop(currentTime + 0.9);
  }

  // Play restore sound (reverse swoosh with uplifting tone)
  playRestoreSound() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const currentTime = ctx.currentTime;

    // Create an uplifting sequence for restore
    const notes = [
      { freq: 440.00, time: 0, duration: 0.1 },      // A4
      { freq: 523.25, time: 0.08, duration: 0.1 },   // C5
      { freq: 659.25, time: 0.16, duration: 0.15 },  // E5
      { freq: 783.99, time: 0.25, duration: 0.2 },   // G5
    ];

    notes.forEach(({ freq, time, duration }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime + time);
      oscillator.type = 'triangle';

      // Envelope for each note
      gainNode.gain.setValueAtTime(0, currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.15, currentTime + time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + time + duration);

      oscillator.start(currentTime + time);
      oscillator.stop(currentTime + time + duration);
    });

    // Add a gentle sweep effect
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    
    sweepOsc.frequency.setValueAtTime(200, currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.4);
    sweepOsc.type = 'sine';
    
    sweepGain.gain.setValueAtTime(0, currentTime);
    sweepGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.4);
    
    sweepOsc.start(currentTime);
    sweepOsc.stop(currentTime + 0.4);
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();
