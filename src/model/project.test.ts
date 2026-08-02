import {describe, expect, it} from 'vitest';
import sampleProjectJson from '../../public/projects/storm/project.json';
import {
  BibleProjectSchema,
  getDurationInFrames,
  getDurationSeconds,
} from './project';

describe('BibleProjectSchema', () => {
  it('샘플 프로젝트를 검증한다', () => {
    const project = BibleProjectSchema.parse(sampleProjectJson);

    expect(project.scenes).toHaveLength(6);
    expect(getDurationSeconds(project)).toBe(64);
    expect(getDurationInFrames(project)).toBe(1920);
  });

  it('60초보다 짧은 프로젝트를 거부한다', () => {
    const invalidProject = {
      ...sampleProjectJson,
      scenes: sampleProjectJson.scenes.map((scene) => ({
        ...scene,
        durationSeconds: 8,
      })),
    };

    expect(() => BibleProjectSchema.parse(invalidProject)).toThrow(
      '전체 길이는 60~90초여야 합니다.',
    );
  });
});
