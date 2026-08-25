# 프로젝트 목적

React Native `maxFontSizeMultiplier`가 Android New Architecture(Fabric)에서 제대로 캡을 걸지 못하는 버그의 **최소 재현 repo**를 만들고, `facebook/react-native`에 이슈를 제출하는 것.

이 파일은 이전 세션들의 조사/구현 결과를 압축한 것입니다. **재조사할 필요 없이, 아래 "지금 할 일"부터 이어서 진행하면 됩니다.**

---

## 이슈 요약

`allowFontScaling={true}` + `maxFontSizeMultiplier={1.5}`로 고정해도, Android 디바이스의 실제 시스템 폰트 크기(fontScale)가 크면 클수록 렌더링되는 텍스트/줄높이가 계속 커진다. 캡이 정상 작동한다면 fontScale이 캡값(1.5) 이상인 모든 경우에 동일한 결과가 나와야 하는데 실제로는 그렇지 않다.

## 재현 환경

- `react-native`: 0.83.1 / New Architecture (Fabric) 활성화 / Android
- 1차 실측: Samsung Galaxy S21 (One UI)
- 2차 실측(이번 세션, 아래 참고): Android 에뮬레이터 Pixel 8 Pro API 35 — **Samsung 기기 한정 문제가 아님을 확인**

## 배제한 가설 (검증 완료, 재확인 불필요)

1. Fabric이 `maxFontSizeMultiplier`를 완전히 무시하는 문제(#47499, PR #47614로 수정) → 0.78부터 수정 포함, 0.83.1엔 해당 없음.
2. New Architecture 백그라운드 복귀 시 재계산 안 되는 문제(#51768) → 콜드 스타트로도 재현되어 배제.

## 확인된 원인 (추정)

- `fontSize` 자체는 `min(fontScale, maxFontSizeMultiplier)` 공식으로 정확히 캡됨.
- **줄 높이(line height) 계산 경로가 문제로 추정됨.** JS에서 fontScale과 무관하게 항상 동일한 고정값을 `lineHeight`로 명시해도, 실제 렌더링 결과는 디바이스의 원본(캡 안 된) fontScale에 따라 계속 달라짐.

## 검증된 우회책

Android에 한해 `allowFontScaling={false}` + `fontSize`/`lineHeight`를 JS에서 `Math.min(PixelRatio.getFontScale(), cap)` 기준으로 완전 수동 계산. `App.tsx`의 "3차" 탭이 이 구현.

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
5. ✅ 이슈 본문 Additional Context에 에뮬레이터 검증 결과 추가. (`docs/github-issue-maxfontsizemultiplier.md` 와 `~/Downloads/github-issue-maxfontsizemultiplier.md` 둘 다 동기화됨)

## 지금 할 일 (TODO)

1. **GitHub에 repro repo 푸시** — 아직 원격(remote)이 연결되어 있지 않음. 사용자 GitHub 계정/대상 저장소 이름 확인 필요 (공개 저장소 생성 + 푸시는 outward-facing 작업이라 진행 전 확인받음).
2. **푸시 후 repo URL을 이슈 본문 Additional Context의 `<TODO: fill in repo URL after pushing>` 자리에 채워넣기.**
3. **실제 기기 최종 검증** — 가능하면 Galaxy S21 물리 기기에서 이 저장소의 `App.tsx`를 다시 돌려서, 이전 세션에서 기록한 실측값(34.844444 / 39.822224 등)과 일치하는지 최종 확인. (에뮬레이터 검증은 완료했지만 물리 기기 재확인은 아직.)
4. **이슈 본문 최종 검토 후 `facebook/react-native`에 제출.** (이슈 제출은 outward-facing 작업이라 진행 전 확인받음)

## 하지 않아도 되는 것

- 원인 재조사 (이미 충분히 좁혀짐, 위 "확인된 원인" 참고)
- `maxFontSizeMultiplier`/`allowFontScaling` 동작 자체에 대한 재검증
- `App.tsx` 재구성 (이미 완성, 탭 3개 + 결과 테이블 구조 그대로 사용)
