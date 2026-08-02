import {readFile, writeFile} from 'node:fs/promises';
import {extname} from 'node:path';
import {GoogleGenAI} from '@google/genai';

const requireApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 필요합니다. .env.example을 참고하세요.');
  }
  return apiKey;
};

const getMimeType = (path: string): string => {
  const extension = extname(path).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }
  if (extension === '.webp') {
    return 'image/webp';
  }
  return 'image/png';
};

export class GoogleMediaProvider {
  private readonly client: GoogleGenAI;
  private readonly imageModel: string;
  private readonly videoModel: string;

  public constructor() {
    this.client = new GoogleGenAI({apiKey: requireApiKey()});
    this.imageModel =
      process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image';
    this.videoModel =
      process.env.GEMINI_VIDEO_MODEL ?? 'gemini-omni-flash-preview';
  }

  public async generateImage(prompt: string, outputPath: string): Promise<void> {
    const interaction = await this.client.interactions.create({
      model: this.imageModel,
      input: prompt,
      response_format: {
        type: 'image',
        mime_type: 'image/png',
        aspect_ratio: '16:9',
        image_size: '2K',
      },
    });
    const data = interaction.output_image?.data;

    if (!data) {
      throw new Error('Google 이미지 응답에 이미지 데이터가 없습니다.');
    }

    await writeFile(outputPath, Buffer.from(data, 'base64'));
  }

  public async generateVideo(
    prompt: string,
    outputPath: string,
    referenceImagePath?: string,
  ): Promise<void> {
    const imageInput = referenceImagePath
      ? [
          {
            type: 'image' as const,
            data: (await readFile(referenceImagePath)).toString('base64'),
            mime_type: getMimeType(referenceImagePath),
          },
          {type: 'text' as const, text: prompt},
        ]
      : prompt;

    const interaction = await this.client.interactions.create({
      model: this.videoModel,
      input: imageInput,
      response_format: {type: 'video', aspect_ratio: '16:9'},
      ...(referenceImagePath
        ? {
            generationConfig: {
              videoConfig: {task: 'image_to_video' as const},
            },
          }
        : {}),
    });
    const data = interaction.output_video?.data;

    if (!data) {
      throw new Error('Google 영상 응답에 영상 데이터가 없습니다.');
    }

    await writeFile(outputPath, Buffer.from(data, 'base64'));
  }
}
