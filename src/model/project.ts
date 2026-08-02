import {z} from 'zod';

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const CaptionSchema = z
  .object({
    startSeconds: z.number().min(0),
    endSeconds: z.number().positive(),
    text: z.string().trim().min(1),
  })
  .refine((caption) => caption.endSeconds > caption.startSeconds, {
    message: '자막 종료 시간은 시작 시간보다 커야 합니다.',
  });

export const SceneMediaSchema = z.object({
  image: z.string().min(1).optional(),
  video: z.string().min(1).optional(),
  audio: z.string().min(1).optional(),
});

export const SceneSchema = z.object({
  id: z.string().regex(/^scene-[0-9]{2}$/),
  title: z.string().trim().min(1),
  durationSeconds: z.number().int().min(3).max(15),
  sourceVerses: z.array(z.string().trim().min(1)).min(1),
  claimType: z.enum(['direct_quote', 'paraphrase', 'narrator_explanation']),
  narration: z.string().trim().min(1),
  characters: z.array(z.string().trim().min(1)),
  location: z.string().trim().min(1),
  visualAction: z.string().trim().min(1),
  camera: z.string().trim().min(1),
  safetyNotes: z.string().trim().min(1),
  forbiddenElements: z.array(z.string().trim().min(1)).min(1),
  motif: z.enum(['shore', 'boat', 'storm', 'sleep', 'calm', 'wonder']),
  palette: z.tuple([HexColorSchema, HexColorSchema, HexColorSchema]),
  captions: z.array(CaptionSchema).optional(),
  media: SceneMediaSchema.optional(),
});

export const BibleProjectSchema = z
  .object({
    version: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().trim().min(1),
    audience: z.literal('초등부 3~4학년'),
    passage: z.object({
      reference: z.string().trim().min(1),
      translation: z.string().trim().min(1),
      note: z.string().trim().min(1),
    }),
    lesson: z.object({
      theme: z.string().trim().min(1),
      closingQuestion: z.string().trim().min(1),
    }),
    visualStyle: z.string().trim().min(1),
    fps: z.literal(30),
    width: z.literal(1920),
    height: z.literal(1080),
    scenes: z.array(SceneSchema).length(6),
  })
  .superRefine((project, context) => {
    const duration = project.scenes.reduce(
      (sum, scene) => sum + scene.durationSeconds,
      0,
    );

    if (duration < 60 || duration > 90) {
      context.addIssue({
        code: 'custom',
        message: `전체 길이는 60~90초여야 합니다. 현재 ${duration}초입니다.`,
        path: ['scenes'],
      });
    }

    const ids = new Set(project.scenes.map((scene) => scene.id));
    if (ids.size !== project.scenes.length) {
      context.addIssue({
        code: 'custom',
        message: '장면 ID는 중복될 수 없습니다.',
        path: ['scenes'],
      });
    }
  });

export type Caption = z.infer<typeof CaptionSchema>;
export type BibleScene = z.infer<typeof SceneSchema>;
export type BibleProject = z.infer<typeof BibleProjectSchema>;

export const getDurationSeconds = (project: BibleProject): number =>
  project.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

export const getDurationInFrames = (project: BibleProject): number =>
  getDurationSeconds(project) * project.fps;
