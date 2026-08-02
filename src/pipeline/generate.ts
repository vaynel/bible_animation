import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, relative, resolve, sep} from 'node:path';
import {BibleProjectSchema, type BibleProject} from '../model/project';
import {ElevenLabsVoiceProvider} from '../providers/elevenlabs';
import {GoogleMediaProvider} from '../providers/google';
import {buildImagePrompt, buildVideoPrompt} from './prompts';

export type AssetType = 'image' | 'video' | 'voice';

type GenerateOptions = {
  project: BibleProject;
  assets: Set<AssetType>;
  sceneId?: string;
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const toPublicPath = (absolutePath: string): string =>
  relative(resolve('public'), absolutePath).split(sep).join('/');

export const preparePrompts = async (
  project: BibleProject,
): Promise<string> => {
  const outputRoot = resolve('work', project.id);
  const promptRoot = join(outputRoot, 'prompts');
  await mkdir(promptRoot, {recursive: true});

  for (const scene of project.scenes) {
    await writeFile(
      join(promptRoot, `${scene.id}-image.txt`),
      `${buildImagePrompt(project, scene)}\n`,
      'utf8',
    );
    await writeFile(
      join(promptRoot, `${scene.id}-video.txt`),
      `${buildVideoPrompt(project, scene)}\n`,
      'utf8',
    );
  }

  await writeFile(
    join(outputRoot, 'project.snapshot.json'),
    `${JSON.stringify(project, null, 2)}\n`,
    'utf8',
  );
  return outputRoot;
};

export const generateAssets = async ({
  project,
  assets,
  sceneId,
}: GenerateOptions): Promise<string> => {
  const outputRoot = resolve('public', 'generated', project.id);
  const scenesRoot = join(outputRoot, 'scenes');
  const audioRoot = join(outputRoot, 'audio');
  await mkdir(scenesRoot, {recursive: true});
  await mkdir(audioRoot, {recursive: true});

  const google =
    assets.has('image') || assets.has('video')
      ? new GoogleMediaProvider()
      : undefined;
  const elevenLabs = assets.has('voice')
    ? new ElevenLabsVoiceProvider()
    : undefined;
  const selectedScenes = sceneId
    ? project.scenes.filter((scene) => scene.id === sceneId)
    : project.scenes;

  if (selectedScenes.length === 0) {
    throw new Error(`장면을 찾을 수 없습니다: ${sceneId}`);
  }

  const outputPath = join(outputRoot, 'render-project.json');
  const renderedProject: BibleProject = structuredClone(project);

  if (await pathExists(outputPath)) {
    const previousProject = BibleProjectSchema.parse(
      JSON.parse(await readFile(outputPath, 'utf8')),
    );
    for (const targetScene of renderedProject.scenes) {
      const previousScene = previousProject.scenes.find(
        (candidate) => candidate.id === targetScene.id,
      );
      if (previousScene?.media) {
        targetScene.media = previousScene.media;
      }
      if (previousScene?.captions) {
        targetScene.captions = previousScene.captions;
      }
    }
  }

  for (const scene of selectedScenes) {
    const targetScene = renderedProject.scenes.find(
      (candidate) => candidate.id === scene.id,
    );
    if (!targetScene) {
      throw new Error(`렌더 프로젝트에서 장면을 찾을 수 없습니다: ${scene.id}`);
    }
    targetScene.media ??= {};

    const imagePath = join(scenesRoot, `${scene.id}.png`);
    const videoPath = join(scenesRoot, `${scene.id}.mp4`);
    const audioPath = join(audioRoot, `${scene.id}.mp3`);

    if (assets.has('image')) {
      await google?.generateImage(buildImagePrompt(project, scene), imagePath);
      targetScene.media.image = toPublicPath(imagePath);
    } else if (await pathExists(imagePath)) {
      targetScene.media.image = toPublicPath(imagePath);
    }

    if (assets.has('video')) {
      const referenceImage = (await pathExists(imagePath)) ? imagePath : undefined;
      await google?.generateVideo(
        buildVideoPrompt(project, scene),
        videoPath,
        referenceImage,
      );
      targetScene.media.video = toPublicPath(videoPath);
    } else if (await pathExists(videoPath)) {
      targetScene.media.video = toPublicPath(videoPath);
    }

    if (assets.has('voice')) {
      const captions = await elevenLabs?.generateNarration(
        scene.narration,
        audioPath,
      );
      if (!captions) {
        throw new Error('음성 공급자가 자막 타이밍을 반환하지 않았습니다.');
      }
      targetScene.captions = captions;
      targetScene.media.audio = toPublicPath(audioPath);
    } else if (await pathExists(audioPath)) {
      targetScene.media.audio = toPublicPath(audioPath);
    }
  }

  await writeFile(outputPath, `${JSON.stringify(renderedProject, null, 2)}\n`);
  return outputPath;
};

export const readProjectFile = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8')) as unknown;
