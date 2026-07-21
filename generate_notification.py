import wave
import struct
import math
import os

def generate_premium_chime(filename):
    sample_rate = 44100
    duration_ms = 800 # 0.8 seconds (approx 1 sec max)
    num_samples = int(sample_rate * (duration_ms / 1000.0))
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    wav_file = wave.open(filename, 'w')
    wav_file.setnchannels(1) 
    wav_file.setsampwidth(2) 
    wav_file.setframerate(sample_rate)
    
    # Modern Android descending chime: E6 -> C6 with rich harmonics
    notes = [
        {'freq': 1318.51, 'delay': 0.0},    # E6
        {'freq': 1046.50, 'delay': 0.15}    # C6
    ]
    
    for i in range(num_samples):
        t = i / sample_rate
        val = 0
        
        for note in notes:
            if t < note['delay']:
                continue
            
            phase_t = t - note['delay']
            
            # Fast attack (20ms), exponential decay (alpha=10)
            attack_time = 0.02
            if phase_t < attack_time:
                envelope = (phase_t / attack_time)
            else:
                envelope = math.exp(-12.0 * (phase_t - attack_time))
            
            # Fundamental + 1st overtone for "marimba/glass" feel
            f = note['freq']
            wave_val = (math.sin(2 * math.pi * f * phase_t) * 0.7 +
                        math.sin(2 * math.pi * f * 2.1 * phase_t) * 0.3)
                        
            val += wave_val * envelope
                
        # Normalize and volume
        val *= 0.4
        
        sample_val = int(val * 32767.0)
        sample_val = max(-32768, min(32767, sample_val))
        wav_file.writeframes(struct.pack('<h', sample_val))
        
    wav_file.close()
    print("Premium chime generated!")

if __name__ == '__main__':
    generate_premium_chime('/Users/babukumar/Desktop/FocusFlow/assets/audio/notification.wav')
