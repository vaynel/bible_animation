# bible_animation

교회 초등부 3~4학년을 위해 당일 성경 본문을 60~90초 애니메이션으로 만드는 TypeScript PoC입니다.

현재 저장소에는 문서뿐 아니라 다음 실행 코드가 포함됩니다.

- Remotion 기반 1920×1080, 30fps 영상 렌더러
- API 키 없이 실행되는 6장면·64초 샘플 애니메이션
- Gemini 3.1 Flash Image 장면 이미지 생성
- Gemini Omni Flash 이미지 기반 영상 생성
- ElevenLabs 내레이션과 타이밍 자막 생성
- Zod 입력 검증과 단위 테스트

## 바로 실행

```bash
npm install
npm run typecheck
npm test
npm run validate:sample
npm run render:sample
```

결과는 `out/storm.mp4`에 생성됩니다.

실제 AI 자산 생성과 부분 재생성 방법은 [개발 가이드](./docs/DEVELOPMENT.md)를 확인하세요. 전체 기획은 [프로젝트 문서](./docs/README.md), 수동 제작 기준은 [PoC 매뉴얼](./docs/POC_MANUAL.md)에 정리되어 있습니다.
