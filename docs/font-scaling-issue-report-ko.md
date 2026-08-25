# React Native `maxFontSizeMultiplier` 정상 동작 안 함 — 조사 리포트

## 배경

- 노인층 등 접근성 개선을 위해 앱 전역 `allowFontScaling`을 `false` → `true`로 전환
- 글자 크기가 커짐에 따른 UI 붕괴를 제한하기 위해 `maxFontSizeMultiplier` 도입 검토
- 디자인팀 검수 결론
  - **AOS**: 디바이스 글자 크기 슬라이더(8단계, 기본값 0, 범위 `-2 ~ +5`)에서 `+4`/`+5`를 선택해도 `+3` 수준까지만 레이아웃 영향을 허용
  - **iOS**: 제한 없이 OS 설정 그대로 반영 (접근성 최대 크기까지 허용)
- 실측 (Samsung Galaxy S21, One UI, `PixelRatio.getFontScale()`)

  | 디바이스 글자 크기 단계 | 0 (기본) | +1 | +3 | +4 | +5 |
  |---|---|---|---|---|---|
  | fontScale | 1 | 1.15 | 1.5 | 1.7 | 2 |

- 위 실측값을 근거로 AOS `maxFontSizeMultiplier={1.5}`를 고정 적용 → **실기기 검증 중 `+4`/`+5`에서 기대와 다르게 렌더링되는 문제 발견**

## 이슈 내용

`allowFontScaling={true}`, `maxFontSizeMultiplier={1.5}`로 **고정**해도, 디바이스 글자 크기 설정이 `+3`(fontScale 1.5)일 때와 `+5`(fontScale 2.0)일 때 최종 렌더링되는 텍스트 크기(특히 줄 높이)가 서로 다르게 나타남. 캡이 정상 작동한다면 `+3`~`+5` 구간에서는 모두 동일한 결과가 나와야 하는데, 실제로는 fontScale이 클수록 텍스트가 계속 커짐.

## 재현 환경

- `react-native`: **0.83.1**
- 아키텍처: **New Architecture (Fabric)** 활성화
- 플랫폼: **Android**
- 테스트 기기: Samsung Galaxy S21 (One UI), 디바이스 글자 크기 8단계 슬라이더
- 텍스트: 한글 포함 (`가나다`, `Aa가나다`)

## 재현 방법 및 실측 데이터

### 1차 — 단순 재현

```tsx
<Text
  allowFontScaling={true}
  maxFontSizeMultiplier={1.5}
  style={{ fontSize: 20 }}
  onLayout={e => console.log(fontScale, e.nativeEvent.layout.height)}
>
  가나다
</Text>
```

| 디바이스 글자 크기 | fontScale | 실측 height |
|---|---|---|
| +3 | 1.5 | 34.844444 |
| +5 | 2.0 | 39.822224 |

→ 캡이 정상 작동했다면 두 값이 같아야 하나 **14.3% 차이**. 콜드 스타트로 재현 확인(설정 변경 후 앱 완전 종료 → 재실행), New Architecture의 "백그라운드 복귀 시 재계산 안 됨" 계열 이슈([#51768](https://github.com/facebook/react-native/issues/51768))는 배제.

### 2차 — 자동 vs 수동 `lineHeight` 비교

`numberOfLines={1}`로 줄바꿈 변수를 제거하고, "자동(기본) lineHeight"와 "JS에서 미리 캡된 배율로 계산한 고정 lineHeight"를 비교.

```tsx
{/* A: 자동(기본) lineHeight */}
<Text allowFontScaling maxFontSizeMultiplier={1.5} numberOfLines={1}
      style={{ fontSize: 20 }} onLayout={...} >
  Aa가나다
</Text>

{/* B: lineHeight을 fontScale과 무관하게 항상 동일한 값(36)으로 명시 */}
<Text allowFontScaling maxFontSizeMultiplier={1.5} numberOfLines={1}
      style={{ fontSize: 20, lineHeight: 20 * 1.5 * 1.2 /* = 36 고정 */ }} onLayout={...} >
  Aa가나다
</Text>
```

| | +3 (fontScale=1.5) | +5 (fontScale=2) | 증가율 |
|---|---|---|---|
| A (자동) | 34.844444 | 39.822224 | +14.3% |
| B (수동, JS 값 항상 36 고정) | 36.266666 | 43.377773 | **+19.6%** |

→ **B는 JS에서 fontScale과 무관하게 항상 동일한 `lineHeight`(36)를 넘겼음에도, 실제 렌더링 결과는 디바이스의 원본 fontScale에 따라 계속 달라짐.** 즉 "자동 lineHeight 계산이 캡을 안 본다"는 얕은 문제가 아니라, **이미 캡을 반영해 계산한 값을 명시적으로 넘겨도 네이티브가 최종 단계에서 원본 fontScale을 다시 개입시킨다**는 더 근본적인 문제로 확인됨. (재현성 확인을 위해 동일 조건 재측정 결과 B값은 소수점 6자리까지 일치 — 노이즈 아님)

### 3차 — 우회책 검증 (`allowFontScaling=false` + 완전 수동 계산)

```tsx
const cappedScale = Math.min(fontScale, 1.5);
const fontSize = 20 * cappedScale;       // = 30 (양쪽 동일)
const lineHeight = fontSize * 1.1615;    // = 34.845 (양쪽 동일, A의 +3 실측값에서 역산한 비율)

<Text allowFontScaling={false} numberOfLines={1}
      style={{ fontSize, lineHeight }} onLayout={...} >
  Aa가나다
</Text>
```

| | +3 (fontScale=1.5) | +5 (fontScale=2) |
|---|---|---|
| fontSize (계산값) | 30 | 30 |
| lineHeight (계산값) | 34.845 | 34.845 |
| **height (실측)** | **35.200001** | **35.200001** |

→ **완전히 동일.** 계산값과 실측값의 차이(1.02%)는 Android 폰트 렌더링의 자연스러운 패딩 수준으로, 스케일링 누수와는 무관.

## 원인 분석

### 배제한 가설

1. **Fabric이 `maxFontSizeMultiplier`를 아예 무시하는 문제** ([#47499](https://github.com/facebook/react-native/issues/47499), 수정 PR [#47614](https://github.com/facebook/react-native/pull/47614)) — 이 수정은 **0.78부터 포함**되어 있어 0.83.1에는 해당하지 않음. 또한 완전히 무시된 것이라면 +3/+5 차이가 원본 fontScale 비율(2/1.5 ≈ 1.33배)에 가까워야 하는데, 실측 차이(14~20%)는 그보다 작아 "완전 무시"와는 다른 패턴.
2. **New Architecture에서 앱 백그라운드 복귀 시 레이아웃 재계산이 안 되는 문제** ([#51768](https://github.com/facebook/react-native/issues/51768)) — 콜드 스타트로도 재현되어 배제.

### 확인된 원인 (추정)

Android 소스(`TextAttributeProps.getEffectiveFontSize()` / `PixelUtil.toPixelFromSP()`)상 **폰트 크기(fontSize) 자체**는 `min(fontScale, maxFontSizeMultiplier)` 공식으로 정확히 캡이 걸리는 것으로 보임 (3차 검증에서 `fontSize` 계산값이 fontScale과 무관하게 항상 30으로 일정했던 것과 일치).

문제는 **줄 높이(line height/leading) 계산 경로**로 추정됩니다. 2차 검증에서 이미 캡을 반영해 계산한 고정값을 `lineHeight`로 명시해도 결과가 fontScale에 따라 계속 달라진 것으로 볼 때, Android 텍스트 레이아웃(Fabric 텍스트 측정 경로 혹은 `Paint`/`StaticLayout`의 기본 줄 간격 계산)이 `maxFontSizeMultiplier`가 반영된 값이 아니라 **디바이스의 원본 `Configuration.fontScale`/`scaledDensity`를 별도로 참조**해서 줄 높이에 영향을 주는 것으로 보입니다. 다만 정확히 어느 파일/함수인지는 소스 레벨로 100% 확증하지 못했으며, 이는 정황 증거 기반의 추정입니다.

## 해결법 (검증됨)

**Android에 한해 `allowFontScaling={false}` + `fontSize`/`lineHeight`를 JS에서 `Math.min(PixelRatio.getFontScale(), cap)` 기준으로 완전 수동 계산.** `maxFontSizeMultiplier` prop과 자동 lineHeight 계산에 의존하지 않음으로써 네이티브의 원본 fontScale 재개입 경로를 원천 차단.

```tsx
function useScaledText(baseFontSize: number, lineHeightRatio: number) {
  const fontScale = PixelRatio.getFontScale();
  if (Platform.OS === 'ios') {
    // iOS는 leak 근거 없음 + 원래 요구사항(제한 없음)과 부합 → 기존 방식 유지
    return { allowFontScaling: true, fontSize: baseFontSize };
  }
  const cappedScale = Math.min(fontScale, 1.5);
  const fontSize = baseFontSize * cappedScale;
  return { allowFontScaling: false, fontSize, lineHeight: fontSize * lineHeightRatio };
}
```

iOS는 별도 leak 근거가 없고 원래 요구사항(제한 없음)과도 부합하므로 기존 `allowFontScaling=true` 방식을 유지.

## 남은 과제

- `lineHeightRatio`는 폰트/텍스트 크기별로 실측 보정 필요 (현재 값 1.1615는 특정 폰트 + 한글 텍스트 기준)
- 앱이 포그라운드로 켜져 있는 중 시스템 폰트 설정이 바뀌는 경우, 재계산 트리거(예: `AppState` 변화 감지) 필요 여부 점검
- `facebook/react-native` 저장소에 이슈 제보 검토 (별도 파일 `github-issue-maxfontsizemultiplier.md` 참고)
