import wave
import struct
import math
import os

def create_wav(filename, duration_ms, freqs, decay_rate=0.0, volume=0.5, type='sine', arpeggio_delay_ms=0):
    sample_rate = 44100
    num_samples = int(sample_rate * (duration_ms / 1000.0))
    
    # Create wave file
    wav_file = wave.open(filename, 'w')
    wav_file.setnchannels(1) # mono
    wav_file.setsampwidth(2) # 2 bytes per sample (16 bit)
    wav_file.setframerate(sample_rate)
    
    for i in range(num_samples):
        t = i / sample_rate
        val = 0
        
        # Envelope: Exponential decay
        envelope = math.exp(-decay_rate * t) if decay_rate > 0 else 1.0
        
        for idx, freq in enumerate(freqs):
            delay_sec = (idx * arpeggio_delay_ms) / 1000.0
            if t < delay_sec:
                continue
                
            phase_t = t - delay_sec
            
            if type == 'sine':
                val += math.sin(2 * math.pi * freq * phase_t)
            elif type == 'square':
                val += 1 if math.sin(2 * math.pi * freq * phase_t) > 0 else -1
            elif type == 'triangle':
                val += 2 * abs(2 * (phase_t * freq - math.floor(phase_t * freq + 0.5))) - 1
                
        # Average the values to avoid clipping
        if len(freqs) > 0:
            val /= len(freqs)
            
        val *= envelope * volume
        
        # Clamp to 16 bit int range
        sample_val = int(val * 32767.0)
        sample_val = max(-32768, min(32767, sample_val))
        
        # Write binary data
        wav_file.writeframes(struct.pack('<h', sample_val))
        
    wav_file.close()

if __name__ == '__main__':
    os.makedirs('assets/audio', exist_ok=True)
    
    # 1. start.wav: Soft click / tap. (100ms, sharp decay)
    create_wav('assets/audio/start.wav', duration_ms=150, freqs=[800], decay_rate=60.0, volume=0.3, type='sine')
    
    # 2. break.wav: Soft success chime. Focus -> Break (300ms, gentle decay, C5 and E5)
    create_wav('assets/audio/break.wav', duration_ms=400, freqs=[523.25, 659.25], decay_rate=15.0, volume=0.2, type='sine', arpeggio_delay_ms=30)
    
    # 3. cycle.wav: Next cycle. Break -> Focus (250ms, single note, G4)
    create_wav('assets/audio/cycle.wav', duration_ms=300, freqs=[392.00], decay_rate=15.0, volume=0.2, type='sine')
    
    # 4. completed.wav: Final session complete. (500ms, major arpeggio, C4, E4, G4, C5)
    create_wav('assets/audio/completed.wav', duration_ms=600, freqs=[261.63, 329.63, 392.00, 523.25], decay_rate=10.0, volume=0.2, type='sine', arpeggio_delay_ms=40)
    
    print("Audio files generated.")
