/**
 * Deaf Simulator - Simulates hearing loss by degrading text input
 *
 * Levels 1-10:
 * 1-2: Mild - drops some punctuation, occasional word
 * 3-4: Moderate - drops more words, garbles some
 * 5-6: Moderately Severe - significant word loss, more garbling
 * 7-8: Severe - heavy degradation, many words missing or garbled
 * 9-10: Profound - extreme degradation, barely comprehensible
 *
 * Languages: 'en' (English), 'it' (Italian), 'agnostic' (language-agnostic)
 */

export type Language = 'en' | 'it' | 'agnostic';

export interface DeafSimulatorConfig {
  level: number; // 1-10
  language: Language;
}

export class DeafSimulator {
  private level: number;
  private language: Language;

  constructor(config: DeafSimulatorConfig) {
    this.level = Math.max(1, Math.min(10, config.level));
    this.language = config.language;
  }

  /**
   * Simulate hearing loss on input text
   */
  simulate(input: string): { original: string; degraded: string; lossPercentage: number } {
    const words = input.split(/\s+/);
    const degradedWords: string[] = [];
    let droppedCount = 0;

    for (const word of words) {
      const action = this.decideAction(word);

      switch (action) {
        case 'keep':
          degradedWords.push(word);
          break;
        case 'garble':
          degradedWords.push(this.garbleWord(word));
          break;
        case 'partial':
          degradedWords.push(this.partialWord(word));
          break;
        case 'drop':
          droppedCount++;
          // Optionally add placeholder for severe levels
          if (this.level >= 7 && Math.random() < 0.3) {
            degradedWords.push('[...]');
          }
          break;
      }
    }

    const degraded = degradedWords.join(' ').replace(/\s+/g, ' ').trim();
    const lossPercentage = words.length > 0
      ? Math.round((1 - degraded.split(/\s+/).filter(w => w !== '[...]').length / words.length) * 100)
      : 0;

    return {
      original: input,
      degraded,
      lossPercentage: Math.max(0, lossPercentage)
    };
  }

  /**
   * Realistic hearing loss thresholds based on clinical audiological data:
   *
   * Level 1 (Normal, -10 to 15 dB):     ~97% recognition - almost perfect
   * Level 2 (Slight, 16-25 dB):         ~92% recognition - occasional miss
   * Level 3 (Mild low, 26-32 dB):       ~85% recognition - soft sounds missed
   * Level 4 (Mild high, 33-40 dB):      ~78% recognition - consonants harder
   * Level 5 (Moderate low, 41-48 dB):   ~70% recognition - conversation difficult
   * Level 6 (Moderate high, 49-55 dB):  ~60% recognition - needs repetition
   * Level 7 (Mod-Severe, 56-70 dB):     ~45% recognition - significant difficulty
   * Level 8 (Severe low, 71-80 dB):     ~30% recognition - amplification needed
   * Level 9 (Severe high, 81-90 dB):    ~18% recognition - limited understanding
   * Level 10 (Profound, 91+ dB):        ~8% recognition - visual cues essential
   *
   * Sources: ASHA, WHO, clinical audiogram research
   */
  private decideAction(word: string): 'keep' | 'garble' | 'partial' | 'drop' {
    const roll = Math.random() * 100;

    // Recognition rates based on clinical data (percentage of words kept intact)
    const recognitionRates: Record<number, number> = {
      1: 97,   // Normal hearing
      2: 92,   // Slight loss
      3: 85,   // Mild (low)
      4: 78,   // Mild (high)
      5: 70,   // Moderate (low)
      6: 60,   // Moderate (high)
      7: 45,   // Moderately severe
      8: 30,   // Severe (low)
      9: 18,   // Severe (high)
      10: 8,   // Profound
    };

    const keepRate = recognitionRates[this.level] || 70;

    // Important words (longer, capitalized, question words) slightly more likely to be caught
    const isImportant = word.length > 5 || /^[A-Z]/.test(word) || /^(what|who|why|when|where|how|cosa|chi|perché|quando|dove|come)/i.test(word);
    const importanceBonus = isImportant ? 5 : 0;

    // Calculate thresholds
    // Keep: word is understood correctly
    const keepThreshold = Math.min(98, keepRate + importanceBonus);

    // Garble: word is heard but distorted (misheard consonants, etc.)
    // More garbling at moderate levels, less at extreme levels (either perfect or dropped)
    const garbleRate = this.level <= 2 ? 2 : (this.level >= 9 ? 5 : 15);
    const garbleThreshold = keepThreshold + garbleRate;

    // Partial: only part of the word is caught
    const partialRate = this.level <= 2 ? 1 : (this.level >= 9 ? 3 : 10);
    const partialThreshold = garbleThreshold + partialRate;

    // Rest: word is completely missed (dropped)

    if (roll < keepThreshold) return 'keep';
    if (roll < garbleThreshold) return 'garble';
    if (roll < partialThreshold) return 'partial';
    return 'drop';
  }

  private garbleWord(word: string): string {
    if (word.length <= 2) return word;

    const chars = word.split('');
    const numChanges = Math.ceil(word.length * (this.level / 20));

    for (let i = 0; i < numChanges; i++) {
      if (chars.length === 0) break;
      const pos = Math.floor(Math.random() * chars.length);
      const action = Math.random();
      const currentChar = chars[pos];

      if (currentChar === undefined) continue;

      if (action < 0.4) {
        // Replace with similar sounding letter
        chars[pos] = this.getSimilarChar(currentChar);
      } else if (action < 0.7) {
        // Swap with neighbor
        if (pos < chars.length - 1) {
          const nextChar = chars[pos + 1];
          if (currentChar !== undefined && nextChar !== undefined) {
            chars[pos] = nextChar;
            chars[pos + 1] = currentChar;
          }
        }
      } else {
        // Remove character
        chars.splice(pos, 1);
      }
    }

    return chars.join('');
  }

  private partialWord(word: string): string {
    if (word.length <= 3) return word[0] + '...';

    const keepRatio = 1 - (this.level / 15);
    const keepLength = Math.max(1, Math.floor(word.length * keepRatio));

    // Sometimes keep beginning, sometimes end
    if (Math.random() < 0.6) {
      return word.slice(0, keepLength) + '...';
    } else {
      return '...' + word.slice(-keepLength);
    }
  }

  private getSimilarChar(char: string): string {
    const similarChars = this.getSimilarCharsMap();

    const lower = char.toLowerCase();
    const replacements = similarChars[lower];

    if (!replacements || replacements.length === 0) return char;

    const replacement = replacements[Math.floor(Math.random() * replacements.length)];
    if (!replacement) return char;

    return char === char.toUpperCase() ? replacement.toUpperCase() : replacement;
  }

  private getSimilarCharsMap(): Record<string, string[]> {
    // Language-agnostic: pure phonetic confusion patterns
    const agnosticMap: Record<string, string[]> = {
      'a': ['e', 'o'],
      'e': ['i', 'a'],
      'i': ['e', 'y'],
      'o': ['u', 'a'],
      'u': ['o', 'a'],
      'b': ['p', 'd'],
      'c': ['k', 's'],
      'd': ['t', 'b'],
      'f': ['v', 's'],
      'g': ['k', 'j'],
      'h': ['', 'f'],
      'j': ['g', 'y'],
      'k': ['c', 'g'],
      'l': ['r', 'n'],
      'm': ['n', 'b'],
      'n': ['m', 'l'],
      'p': ['b', 't'],
      'q': ['k', 'g'],
      'r': ['l', 'w'],
      's': ['z', 'c'],
      't': ['d', 'p'],
      'v': ['f', 'b'],
      'w': ['v', 'u'],
      'x': ['s', 'z'],
      'y': ['i', 'j'],
      'z': ['s', 'j'],
    };

    // English-specific phonetic confusions
    const englishMap: Record<string, string[]> = {
      'a': ['e', 'u', 'o'],
      'e': ['i', 'a', 'u'],
      'i': ['e', 'y', 'u'],
      'o': ['u', 'a', 'oo'],
      'u': ['o', 'a', 'oo'],
      'b': ['p', 'd', 'v'],
      'c': ['k', 's', 'g'],
      'd': ['t', 'b', 'g'],
      'f': ['v', 'th', 's'],
      'g': ['k', 'j', 'd'],
      'h': ['', 'f', 'ch'],
      'j': ['g', 'ch', 'y'],
      'k': ['c', 'g', 'q'],
      'l': ['r', 'w', 'n'],
      'm': ['n', 'b', 'w'],
      'n': ['m', 'ng', 'l'],
      'p': ['b', 't', 'f'],
      'q': ['k', 'g', 'c'],
      'r': ['l', 'w', 'y'],
      's': ['z', 'sh', 'th'],
      't': ['d', 'th', 'p'],
      'v': ['f', 'b', 'w'],
      'w': ['v', 'r', 'u'],
      'x': ['s', 'z', 'ks'],
      'y': ['i', 'j', 'e'],
      'z': ['s', 'th', 'j'],
    };

    // Italian-specific phonetic confusions
    const italianMap: Record<string, string[]> = {
      'a': ['e', 'o'],
      'e': ['i', 'a'],
      'i': ['e', 'u'],
      'o': ['u', 'a'],
      'u': ['o', 'i'],
      'b': ['p', 'v'],
      'c': ['g', 'ch', 'k'],
      'd': ['t', 'b'],
      'f': ['v', 's'],
      'g': ['c', 'gh', 'j'],
      'h': [''],  // H is silent in Italian
      'l': ['r', 'gl'],
      'm': ['n', 'mm'],
      'n': ['m', 'gn', 'nn'],
      'p': ['b', 'pp'],
      'q': ['c', 'k'],
      'r': ['l', 'rr'],
      's': ['z', 'ss', 'sc'],
      't': ['d', 'tt'],
      'v': ['f', 'b'],
      'z': ['s', 'zz', 'ts'],
      // Italian double consonants
      'cc': ['c', 'gg'],
      'gg': ['g', 'cc'],
      'ss': ['s', 'zz'],
      'zz': ['z', 'ss'],
      'tt': ['t', 'dd'],
      'dd': ['d', 'tt'],
      'pp': ['p', 'bb'],
      'bb': ['b', 'pp'],
      'rr': ['r', 'll'],
      'll': ['l', 'rr'],
      'mm': ['m', 'nn'],
      'nn': ['n', 'mm'],
      // Italian digraphs
      'gl': ['l', 'gli'],
      'gn': ['n', 'gni'],
      'sc': ['s', 'c'],
      'ch': ['c', 'k'],
      'gh': ['g', 'c'],
    };

    switch (this.language) {
      case 'en':
        return englishMap;
      case 'it':
        return italianMap;
      case 'agnostic':
      default:
        return agnosticMap;
    }
  }

  getLevel(): number {
    return this.level;
  }

  getLanguage(): Language {
    return this.language;
  }

  /**
   * Returns clinical description based on ASHA/WHO classifications
   */
  getLevelDescription(): string {
    // Detailed descriptions matching clinical audiological terms
    const descriptions = {
      en: {
        normal: 'Normal hearing (~97%)',
        slight: 'Slight loss (~92%)',
        mildLow: 'Mild loss (~85%)',
        mildHigh: 'Mild loss (~78%)',
        moderateLow: 'Moderate loss (~70%)',
        moderateHigh: 'Moderate loss (~60%)',
        moderatelySevere: 'Moderately severe (~45%)',
        severeLow: 'Severe loss (~30%)',
        severeHigh: 'Severe loss (~18%)',
        profound: 'Profound loss (~8%)',
      },
      it: {
        normal: 'Udito normale (~97%)',
        slight: 'Perdita lieve (~92%)',
        mildLow: 'Perdita lieve (~85%)',
        mildHigh: 'Perdita lieve (~78%)',
        moderateLow: 'Perdita moderata (~70%)',
        moderateHigh: 'Perdita moderata (~60%)',
        moderatelySevere: 'Moderatamente grave (~45%)',
        severeLow: 'Perdita grave (~30%)',
        severeHigh: 'Perdita grave (~18%)',
        profound: 'Perdita profonda (~8%)',
      },
      agnostic: {
        normal: 'Normal / Normale (~97%)',
        slight: 'Slight / Lieve (~92%)',
        mildLow: 'Mild / Lieve (~85%)',
        mildHigh: 'Mild / Lieve (~78%)',
        moderateLow: 'Moderate / Moderata (~70%)',
        moderateHigh: 'Moderate / Moderata (~60%)',
        moderatelySevere: 'Mod-Severe / Mod-Grave (~45%)',
        severeLow: 'Severe / Grave (~30%)',
        severeHigh: 'Severe / Grave (~18%)',
        profound: 'Profound / Profonda (~8%)',
      },
    };

    const lang = descriptions[this.language];

    // Map each level to its specific description
    const levelMap: Record<number, keyof typeof lang> = {
      1: 'normal',
      2: 'slight',
      3: 'mildLow',
      4: 'mildHigh',
      5: 'moderateLow',
      6: 'moderateHigh',
      7: 'moderatelySevere',
      8: 'severeLow',
      9: 'severeHigh',
      10: 'profound',
    };

    return lang[levelMap[this.level] || 'moderateLow'];
  }

  getLanguageLabel(): string {
    const labels = {
      en: 'English',
      it: 'Italiano',
      agnostic: 'Language Agnostic',
    };
    return labels[this.language];
  }
}
