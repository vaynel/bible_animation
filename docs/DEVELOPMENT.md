# PoC 실행 및 개발 가이드

이 문서는 `docs/POC_MANUAL.md`의 제작 절차를 실제 코드로 실행하는 방법을 설명한다. 기본 샘플은 마가복음 4장 35~41절의 사건을 6개 장면, 64초로 구성한다.

## 1. 준비 사항

- Node.js 20.12 이상
- npm
- 실제 AI 자산 생성 시 Google AI Studio API 키
- 실제 음성 생성 시 ElevenLabs API 키와 Voice ID
- 최종 파일 상세 검사 시 FFmpeg·ffprobe

## 2. 설치와 기본 검증

```bash
npm install
npm run typecheck
npm test
npm run validate:sample
```

샘플 프로젝트는 `public/projects/storm/project.json`이다. 저장소에는 특정 성경 번역본 전문을 포함하지 않고, 본문 범위와 PoC용 요약 대본만 기록한다.

## 3. API 키 없이 샘플 실행

미리보기 화면을 연다.

```bash
npm run dev
```

MP4를 렌더링한다.

```bash
npm run render:sample
```

결과 파일은 `out/storm.mp4`에 생성된다. AI 자산이 없을 때는 Remotion이 움직이는 호수, 나무배, 물결, 자막을 직접 구성하므로 전체 타임라인을 먼저 검증할 수 있다.

## 4. 장면 프롬프트 확인

```bash
npm run prepare:sample
```

다음 파일이 생성된다.

```text
work/storm/
├── project.snapshot.json
└── prompts/
    ├── scene-01-image.txt
    ├── scene-01-video.txt
    └── ...
```

영상 생성 전에 담당 교사가 프로젝트 JSON과 프롬프트의 본문 근거, 사건 순서, 어린이 적합성을 승인한다.

## 5. 실제 AI 이미지·영상·음성 생성

환경 파일을 준비한다.

```bash
cp .env.example .env
```

`.env`에 다음 값을 입력한다.

```dotenv
GEMINI_API_KEY=Google_API_Key
ELEVENLABS_API_KEY=ElevenLabs_API_Key
ELEVENLABS_VOICE_ID=Voice_ID
```

전체 자산을 순서대로 생성한다.

```bash
npm run generate:sample
```

한 장면만 재생성할 수 있다.

```bash
node --import tsx src/cli.ts generate \
  --project public/projects/storm/project.json \
  --assets image,video,voice \
  --scene scene-03
```

자산 종류도 선택할 수 있다.

```bash
node --import tsx src/cli.ts generate \
  --project public/projects/storm/project.json \
  --assets voice
```

생성 결과는 `public/generated/storm/`에 저장되며 Git에는 포함되지 않는다. `render-project.json`에는 실제 이미지·영상·음성 경로와 ElevenLabs 타이밍 자막이 기록된다.

## 6. 생성 자산으로 최종 렌더링

```bash
npm run render:generated
```

결과 파일은 `out/storm-generated.mp4`이다. 장면 영상은 음소거하고 승인된 ElevenLabs 내레이션만 합성한다. 영상 생성에 실패해 이미지까지만 있는 장면은 이미지에 느린 카메라 이동을 적용한다.

## 7. 프로젝트 JSON 규칙

`src/model/project.ts`의 Zod 스키마가 다음 규칙을 검사한다.

- 대상은 초등부 3~4학년
- 장면은 6개
- 전체 길이는 60~90초
- 출력은 1920×1080, 30fps
- 모든 장면에 근거 절 `sourceVerses`가 존재
- `creative` 대사 유형은 허용하지 않음
- 장면별 안전 지침과 금지 요소가 존재

새 본문은 샘플 JSON을 복사해 내용을 바꾼 후 먼저 검증한다.

```bash
node --import tsx src/cli.ts validate --project public/projects/new-story/project.json
```

## 8. 현재 PoC 범위

구현된 기능:

- Zod 기반 입력·본문 근거·길이 검증
- 장면별 이미지·영상 프롬프트 생성
- Gemini 3.1 Flash Image의 16:9 2K 장면 이미지 생성
- Gemini Omni Flash의 이미지 기반 장면 영상 생성
- ElevenLabs의 한국어 내레이션과 문자 타이밍 자막 생성
- AI 자산 유무에 따른 Remotion 렌더링 대체 처리
- 6개 장면 연결, 자막, 근거 절, 마무리 질문, MP4 출력
- 한 장면 또는 한 자산 종류만 선택하는 부분 재생성

첫 PoC에서 제외한 기능:

- 교사용 Next.js 승인 화면
- NestJS API와 데이터베이스
- n8n·Temporal 장시간 워크플로
- Runway 대체 공급자
- LLM의 원문 대본 자동 작성과 독립 교차 검증

제외 기능은 첫 결과물의 성경 정확성·영상 품질 기준이 확정된 뒤 추가한다.
