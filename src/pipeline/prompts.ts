import type {BibleProject, BibleScene} from '../model/project';

const renderList = (items: string[]): string => items.join(', ');

const sharedPrompt = (project: BibleProject, scene: BibleScene): string => `
대상: ${project.audience}
성경 본문 범위: ${scene.sourceVerses.join(', ')}
전체 화풍: ${project.visualStyle}
장소: ${scene.location}
등장인물: ${renderList(scene.characters)}
핵심 행동: ${scene.visualAction}
카메라: ${scene.camera}

성경 사건의 의미와 순서를 바꾸지 않는다.
따뜻하고 친근한 아동용 스토리북 애니메이션으로 표현한다.
고대 근동의 의상과 배경을 유지한다.
화면 속 문자, 자막, 로고를 생성하지 않는다.
금지 요소: ${renderList(scene.forbiddenElements)}
안전 지침: ${scene.safetyNotes}
`.trim();

export const buildImagePrompt = (
  project: BibleProject,
  scene: BibleScene,
): string => `
16:9 장면 시작 프레임을 생성한다.
${sharedPrompt(project, scene)}
인물의 얼굴, 머리 모양, 의상 색상과 전체 화풍이 다음 장면에서도 유지되도록 명확하고 단순한 구도로 만든다.
`.trim();

export const buildVideoPrompt = (
  project: BibleProject,
  scene: BibleScene,
): string => `
승인된 시작 이미지의 인물 외형, 의상, 색상과 화풍을 그대로 유지해 짧은 영상을 만든다.
${sharedPrompt(project, scene)}
주요 행동은 하나만 천천히 자연스럽게 수행한다.
새로운 인물이나 물건을 추가하지 않는다.
얼굴과 손을 변형하지 않는다.
영상 자체에 말소리나 음악을 넣지 않는다.
목표 길이: ${Math.min(scene.durationSeconds, 10)}초
`.trim();
