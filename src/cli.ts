import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadEnvFile} from 'node:process';
import {
  BibleProjectSchema,
  getDurationInFrames,
  getDurationSeconds,
} from './model/project';
import {
  generateAssets,
  preparePrompts,
  readProjectFile,
  type AssetType,
} from './pipeline/generate';

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const getOption = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const parseAssets = (value: string | undefined): Set<AssetType> => {
  const allowed = new Set<AssetType>(['image', 'video', 'voice']);
  const requested = (value ?? 'image,video,voice')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const asset of requested) {
    if (!allowed.has(asset as AssetType)) {
      throw new Error(`지원하지 않는 자산 유형입니다: ${asset}`);
    }
  }
  return new Set(requested as AssetType[]);
};

const main = async (): Promise<void> => {
  const command = process.argv[2];
  const projectOption = getOption('--project');
  if (!command || !projectOption) {
    throw new Error(
      '사용법: npx tsx src/cli.ts <validate|prepare|generate> --project <project.json>',
    );
  }

  const projectFile = resolve(projectOption);
  const project = BibleProjectSchema.parse(await readProjectFile(projectFile));

  if (command === 'validate') {
    console.log(
      JSON.stringify(
        {
          valid: true,
          projectId: project.id,
          scenes: project.scenes.length,
          durationSeconds: getDurationSeconds(project),
          durationInFrames: getDurationInFrames(project),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'prepare') {
    const output = await preparePrompts(project);
    console.log(`프롬프트를 준비했습니다: ${output}`);
    return;
  }

  if (command === 'generate') {
    const output = await generateAssets({
      project,
      assets: parseAssets(getOption('--assets')),
      sceneId: getOption('--scene'),
    });
    console.log(`생성 자산 프로젝트를 준비했습니다: ${output}`);
    return;
  }

  throw new Error(`지원하지 않는 명령입니다: ${command}`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
