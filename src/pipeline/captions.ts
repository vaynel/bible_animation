import type {Caption} from '../model/project';

export type ElevenLabsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

const isBoundary = (character: string): boolean =>
  /[\s,.!?。！？、]/u.test(character);

export const alignmentToCaptions = (
  alignment: ElevenLabsAlignment,
  maxCharacters = 18,
): Caption[] => {
  const captions: Caption[] = [];
  let startIndex = 0;

  for (let index = 0; index < alignment.characters.length; index += 1) {
    const character = alignment.characters[index] ?? '';
    const length = index - startIndex + 1;
    const shouldClose =
      length >= maxCharacters ||
      (length >= Math.floor(maxCharacters / 2) && isBoundary(character)) ||
      index === alignment.characters.length - 1;

    if (!shouldClose) {
      continue;
    }

    const text = alignment.characters.slice(startIndex, index + 1).join('').trim();
    const startSeconds =
      alignment.character_start_times_seconds[startIndex] ?? 0;
    const endSeconds =
      alignment.character_end_times_seconds[index] ?? startSeconds + 0.1;

    if (text.length > 0) {
      captions.push({startSeconds, endSeconds, text});
    }
    startIndex = index + 1;
  }

  return captions;
};
