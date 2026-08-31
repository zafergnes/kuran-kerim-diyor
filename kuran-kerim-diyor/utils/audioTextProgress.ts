const ARABIC_MARK = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/;

/**
 * Keeps Arabic vowel/recitation marks attached to their base letter so audio
 * progress advances by visible letters instead of isolated Unicode marks.
 */
export const splitArabicGraphemes = (text: string): string[] => {
    const graphemes: string[] = [];

    for (const character of Array.from(text)) {
        if (ARABIC_MARK.test(character) && graphemes.length > 0) {
            graphemes[graphemes.length - 1] += character;
        } else {
            graphemes.push(character);
        }
    }

    return graphemes;
};

export const getHighlightedLetterCount = (text: string, progress: number): number => {
    const letters = splitArabicGraphemes(text).filter((character) => character.trim().length > 0);
    const normalizedProgress = Math.min(1, Math.max(0, progress));
    return Math.floor(letters.length * normalizedProgress);
};

export const splitWordAtHighlightedLetter = (
    word: string,
    highlightedLetterCount: number,
): { highlighted: string; remaining: string } => {
    const graphemes = splitArabicGraphemes(word);
    let visibleLetterIndex = 0;
    let splitIndex = 0;

    for (const grapheme of graphemes) {
        if (grapheme.trim().length > 0) {
            if (visibleLetterIndex >= highlightedLetterCount) break;
            visibleLetterIndex += 1;
        }
        splitIndex += 1;
    }

    return {
        highlighted: graphemes.slice(0, splitIndex).join(''),
        remaining: graphemes.slice(splitIndex).join(''),
    };
};
