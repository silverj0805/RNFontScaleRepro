# 프로젝트 목적

React Native `maxFontSizeMultiplier`가 Android New Architecture(Fabric)에서 제대로 캡을 걸지 못하는 버그의 **최소 재현 repo**를 만들고, `facebook/react-native`에 이슈를 제출하는 것.

이 파일은 이전 세션들의 조사/구현 결과를 압축한 것입니다. **재조사할 필요 없이, 아래 "지금 할 일"부터 이어서 진행하면 됩니다.**

---

## 이슈 요약

`allowFontScaling={true}` + `maxFontSizeMultiplier={1.5}`로 고정해도, Android 디바이스의 실제 시스템 폰트 크기(fontScale)가 크면 클수록 렌더링되는 텍스트/줄높이가 계속 커진다. 캡이 정상 작동한다면 fontScale이 캡값(1.5) 이상인 모든 경우에 동일한 결과가 나와야 하는데 실제로는 그렇지 않다.

## 재현 환경

- `react-native`: **0.87.0** (최초 재현은 0.83.1 — 아래 "버전 업그레이드" 참고) / New Architecture (Fabric) 활성화 / Android
- 1차 실측: Samsung Galaxy S21 (One UI) — 0.83.1 기준
- 2차 실측: Android 에뮬레이터 Pixel 8 Pro API 35 — **Samsung 기기 한정 문제가 아님을 확인** (0.83.1 → 0.87.0 업그레이드 후에도 동일 패턴 재확인)

## 배제한 가설 (검증 완료, 재확인 불필요)

1. Fabric이 `maxFontSizeMultiplier`를 완전히 무시하는 문제(#47499, PR #47614로 수정) → 0.78부터 수정 포함, 0.83.1엔 해당 없음.
2. New Architecture 백그라운드 복귀 시 재계산 안 되는 문제(#51768) → 콜드 스타트로도 재현되어 배제.

## 확인된 원인 (추정)

- `fontSize` 자체는 `min(fontScale, maxFontSizeMultiplier)` 공식으로 정확히 캡됨.
- **줄 높이(line height) 계산 경로가 문제로 추정됨.** JS에서 fontScale과 무관하게 항상 동일한 고정값을 `lineHeight`로 명시해도, 실제 렌더링 결과는 디바이스의 원본(캡 안 된) fontScale에 따라 계속 달라짐.

## 검증된 우회책

Android에 한해 `allowFontScaling={false}` + `fontSize`/`lineHeight`를 JS에서 `Math.min(PixelRatio.getFontScale(), cap)` 기준으로 완전 수동 계산. `App.tsx`의 "Test 3" 탭이 이 구현. (탭 라벨은 영문 "Test 1/2/3"으로 변경됨 — App.tsx/README는 전부 영어로 전환됨)

## 참고 첨부 파일 (`docs/`)

- `docs/font-scaling-issue-report-ko.md` — 전체 조사 리포트 (배경/원인/해결법 상세, 한국어)
- `docs/github-issue-maxfontsizemultiplier.md` — GitHub 이슈 본문 (영문, 제출 직전 상태 — 아래 TODO 참고)

---

## 진행 상황 (이번 세션에서 완료)

1. ✅ **로컬 repro 프로젝트 완성** — 이 저장소(`RNFontScaleRepro`, RN 0.83.1, New Architecture 활성화)가 이미 정확한 버전으로 스캐폴딩되어 있어 Snack 대신 이걸 그대로 사용. Expo Snack보다 버전 정합성이 확실해서 우선 채택.
2. ✅ **`App.tsx` 통합 완료** — 1차/2차/3차 테스트를 탭으로 전환 가능한 화면 하나로 통합. 상단에 `PixelRatio.getFontScale()`과 각 탭의 `onLayout` 측정값이 누적되는 결과 테이블 표시(콘솔 없이 UI만으로 확인 가능). `npx tsc`, `eslint`, `jest` 모두 통과.
3. ✅ **`npx react-native info` 실행 완료** — 결과를 `docs/github-issue-maxfontsizemultiplier.md`의 Environment 섹션에 채워넣음. `newArchEnabled: true` (Android/iOS 둘 다) 확인.
4. ✅ **에뮬레이터(Pixel 8 Pro, API 35)로 1차 자체 검증 완료** — `adb shell settings put system font_scale <1.5|2.0>` + force-stop/cold start로 재현:

   | Test | fontScale=1.5 | fontScale=2.0 |
   |---|---|---|
   | 1 (자동 lineHeight) | 38.000000 | 43.666748 |
   | 2 (수동 고정 lineHeight=36) | 36.000000 | 43.333374 |
   | 3 (우회책) | 35.000000 | 35.000000 |

   → 물리 기기(Galaxy S21)와 동일한 패턴 재현. Test 3만 고정, Test 1/2는 fontScale에 따라 계속 증가. **Samsung/One UI 한정 문제가 아님을 추가로 확인.**

   (참고: 위 표는 샘플 텍스트가 `가나다`였던 시점의 측정값. 이후 App.tsx 리팩토링(`src/`로 이동, 타이틀 텍스트 제거)과 샘플 텍스트를 `ABC`로 변경하면서 재측정한 최신 값은 README.md의 "Screenshots" 섹션 참고 — fontScale 1.5: 35.0/36.0/35.0, fontScale 2.0: 40.33/43.33/35.0. 패턴(Test 3만 고정)은 동일하게 유지됨.)
5. ✅ 이슈 본문 Additional Context에 에뮬레이터 검증 결과 추가. (`docs/github-issue-maxfontsizemultiplier.md` 와 `~/Downloads/github-issue-maxfontsizemultiplier.md` 둘 다 동기화됨 — 이 파일의 예시 수치는 가나다 기준 최초 측정값으로 유지)

## 지금 할 일 (TODO)

1. ✅ **GitHub에 repro repo 푸시 완료** — https://github.com/silverj0805/RNFontScaleRepro (main 브랜치에 전체 작업 포함).
2. ✅ **이슈 본문 Additional Context에 repo URL 채워넣기 완료.**
3. ⏭️ **실제 기기(Galaxy S21) 재검증은 사용자 판단으로 스킵** — 에뮬레이터(Pixel 8 Pro API 35) 검증 결과로 충분하다고 확인함.
4. ✅ **이슈 제출 완료** — `facebook/react-native`에 제출함. 이후 **"Type: Unsupported Version"** 라벨이 붙음 (당시 0.83.1은 지원 종료 버전 — RN 지원 정책은 최신 + 이전 2개 마이너까지만 지원).
5. ✅ **RN 버전 업그레이드 완료 (0.83.1 → 0.87.0, 이 세션)**:
   - `npx @react-native-community/cli@latest init` 로 0.87.0 스캐폴딩을 임시 디렉토리에 새로 생성 후, `android/`·`ios/`(네이티브 프로젝트) 전체와 `package.json`/`jest.config.js`/`Gemfile` 등 설정 파일을 교체.
   - `src/`, `index.js`(단, import 경로는 `./src/App` 유지), `docs/`, `README.md`는 그대로 보존.
   - `yarn install` 재설치, iOS는 `bundle exec pod install`까지 완료 (New Arch 양쪽 플랫폼 모두 `newArchEnabled: true` 확인).
   - 에뮬레이터(Pixel 8 Pro API 35)에서 실제 빌드·설치 후 fontScale 1.5/2.0 재측정 → **0.83.1과 완전히 동일한 수치로 버그 재현 확인** (Test1: 35.0→40.33, Test2: 36.0→43.33, Test3: 35.0 고정). 즉 업그레이드로 버그가 고쳐지지 않았음.
   - `docs/github-issue-maxfontsizemultiplier.md`의 Environment(버전/CLI info)와 Additional Context(0.87.0 재검증 결과)를 갱신, `~/Downloads` 사본도 동기화.
6. ⏭️ **이미 올라간 GitHub 이슈 자체(본문 수정 또는 댓글)를 새 버전 정보로 업데이트할지는 아직 결정 안 됨** — outward-facing 작업이라 사용자 확인 필요. `gh` CLI 인증 여부도 재확인 필요.

## 하지 않아도 되는 것

- 원인 재조사 (이미 충분히 좁혀짐, 위 "확인된 원인" 참고)
- `maxFontSizeMultiplier`/`allowFontScaling` 동작 자체에 대한 재검증
- `App.tsx` 재구성 (이미 완성, 탭 3개 + 결과 테이블 구조 그대로 사용)
- 물리 기기 재검증 (사용자가 스킵하기로 결정함)
