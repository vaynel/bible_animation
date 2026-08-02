import {describe, expect, it} from 'vitest';
import {alignmentToCaptions} from './captions';

describe('alignmentToCaptions', () => {
  it('문자 타이밍을 읽기 쉬운 자막 단위로 묶는다', () => {
    const characters = [...'예수님이 바람을 잠잠하게 하셨어요.'];
    const captions = alignmentToCaptions(
      {
        characters,
        character_start_times_seconds: characters.map((_, index) => index * 0.1),
        character_end_times_seconds: characters.map(
          (_, index) => (index + 1) * 0.1,
        ),
      },
      10,
    );

    expect(captions.length).toBeGreaterThan(1);
    expect(
      captions
        .map((caption) => caption.text)
        .join('')
        .replace(/\s/gu, ''),
    ).toBe('예수님이바람을잠잠하게하셨어요.');
    expect(captions[0]?.startSeconds).toBe(0);
  });
});
