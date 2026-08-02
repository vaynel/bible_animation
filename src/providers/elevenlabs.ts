import {writeFile} from 'node:fs/promises';
import type {Caption} from '../model/project';
import {
  alignmentToCaptions,
  type ElevenLabsAlignment,
} from '../pipeline/captions';

type TtsResponse = {
  audio_base64?: string;
  alignment?: ElevenLabsAlignment;
  normalized_alignment?: ElevenLabsAlignment;
};

const requiredEnvironment = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name}가 필요합니다. .env.example을 참고하세요.`);
  }
  return value;
};

export class ElevenLabsVoiceProvider {
  private readonly apiKey = requiredEnvironment('ELEVENLABS_API_KEY');
  private readonly voiceId = requiredEnvironment('ELEVENLABS_VOICE_ID');
  private readonly modelId =
    process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';

  public async generateNarration(
    text: string,
    outputPath: string,
  ): Promise<Caption[]> {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(this.voiceId)}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`ElevenLabs TTS 실패 (${response.status}): ${detail}`);
    }

    const result = (await response.json()) as TtsResponse;
    if (!result.audio_base64) {
      throw new Error('ElevenLabs 응답에 음성 데이터가 없습니다.');
    }

    const alignment = result.normalized_alignment ?? result.alignment;
    if (!alignment) {
      throw new Error('ElevenLabs 응답에 자막 타이밍이 없습니다.');
    }

    await writeFile(outputPath, Buffer.from(result.audio_base64, 'base64'));
    return alignmentToCaptions(alignment);
  }
}
