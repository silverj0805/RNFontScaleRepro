# React Native `maxFontSizeMultiplier` Not Working Correctly — Investigation Report

## Background

- To improve accessibility for older users, the app switched `allowFontScaling` app-wide from `false` to `true`.
- `maxFontSizeMultiplier` was introduced to limit UI breakage as font size grows.
- Design team review conclusion:
  - **Android**: even if the device's font-size slider (8 steps, default `0`, range `-2` to `+5`) is set to `+4`/`+5`, layout should only be allowed to react up to what `+3` looks like.
  - **iOS**: no cap — follow the OS setting as-is (allow up to the maximum accessibility size).
- Measured on hardware (Samsung Galaxy S21, One UI, `PixelRatio.getFontScale()`):

  | Device font-size step | 0 (default) | +1   | +3  | +4  | +5  |
  | --------------------- | ----------- | ---- | --- | --- | --- |
  | fontScale             | 1           | 1.15 | 1.5 | 1.7 | 2   |

- Based on the measurements above, `maxFontSizeMultiplier={1.5}` was fixed for Android → **while verifying on a real device, `+4`/`+5` rendered differently than expected.**

## The Issue

Even with `allowFontScaling={true}` and `maxFontSizeMultiplier={1.5}` **fixed**, the final rendered text size (in particular, line height) differs between the device font-size setting `+3` (fontScale 1.5) and `+5` (fontScale 2.0). If the cap worked correctly, `+3` through `+5` should all produce the same result — but in practice, the text keeps getting larger as the raw fontScale increases.

## Reproduction Environment

- `react-native`: **0.83.1**
- Architecture: **New Architecture (Fabric)** enabled
- Platform: **Android**
- Test device: Samsung Galaxy S21 (One UI), device font-size 8-step slider
- Text: includes Hangul (`가나다`, `Aa가나다`)

## Reproduction Steps and Measured Data

### 1st — Minimal Repro

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

| Device font size | fontScale | Measured height |
| ---------------- | --------- | --------------- |
| +3               | 1.5       | 34.844444       |
| +5               | 2.0       | 39.822224       |

→ If the cap worked correctly these two values should match, but there's a **14.3% difference**. Confirmed reproducible via cold start (fully quit and relaunch the app after changing the setting), which rules out the New Architecture "not recalculated after returning from background" family of issues ([#51768](https://github.com/facebook/react-native/issues/51768)).

### 2nd — Automatic vs. Manual `lineHeight` Comparison

Removed line-wrapping as a variable with `numberOfLines={1}`, and compared "automatic (default) lineHeight" against "a fixed lineHeight pre-computed in JS using the capped multiplier."

```tsx
{/* A: automatic (default) lineHeight */}
<Text allowFontScaling maxFontSizeMultiplier={1.5} numberOfLines={1}
      style={{ fontSize: 20 }} onLayout={...} >
  Aa가나다
</Text>

{/* B: lineHeight explicitly fixed to the same value (36) regardless of fontScale */}
<Text allowFontScaling maxFontSizeMultiplier={1.5} numberOfLines={1}
      style={{ fontSize: 20, lineHeight: 20 * 1.5 * 1.2 /* = 36, fixed */ }} onLayout={...} >
  Aa가나다
</Text>
```

|                                         | +3 (fontScale=1.5) | +5 (fontScale=2) | Increase   |
| --------------------------------------- | ------------------ | ---------------- | ---------- |
| A (automatic)                           | 34.844444          | 39.822224        | +14.3%     |
| B (manual, JS value always fixed at 36) | 36.266666          | 43.377773        | **+19.6%** |

→ **In B, even though the exact same `lineHeight` (`36`) was passed regardless of fontScale, the actual rendered result kept changing with the device's raw fontScale.** This rules out the shallow explanation that "the automatic lineHeight calculation just doesn't check the cap" — it confirms the more fundamental problem that **even when a value that has already been computed with the cap applied is passed explicitly, the native layer re-introduces the raw fontScale at some final stage.** (To confirm reproducibility, the same conditions were re-measured and the B values matched to 6 decimal places — not noise.)

### 3rd — Verifying the Workaround (`allowFontScaling=false` + fully manual computation)

```tsx
const cappedScale = Math.min(fontScale, 1.5);
const fontSize = 20 * cappedScale;       // = 30 (identical in both cases)
const lineHeight = fontSize * 1.1615;    // = 34.845 (identical in both cases; ratio back-derived from A's +3 measurement)

<Text allowFontScaling={false} numberOfLines={1}
      style={{ fontSize, lineHeight }} onLayout={...} >
  Aa가나다
</Text>
```

|                       | +3 (fontScale=1.5) | +5 (fontScale=2) |
| --------------------- | ------------------ | ---------------- |
| fontSize (computed)   | 30                 | 30               |
| lineHeight (computed) | 34.845             | 34.845           |
| **height (measured)** | **35.200001**      | **35.200001**    |

→ **Completely identical.** The gap between the computed and measured values (1.02%) is consistent with the natural padding of Android font rendering, and is unrelated to the scaling leak.

## Root Cause Analysis

### Hypotheses Ruled Out

1. **Fabric ignoring `maxFontSizeMultiplier` entirely** ([#47499](https://github.com/facebook/react-native/issues/47499), fixed by PR [#47614](https://github.com/facebook/react-native/pull/47614)) — this fix has been **included since 0.78**, so it does not apply to 0.83.1. Also, if the cap were being ignored entirely, the +3/+5 difference should be close to the raw fontScale ratio (2 / 1.5 ≈ 1.33x), but the measured difference (14–20%) is smaller than that, a different pattern from "ignored entirely."
2. **New Architecture layout not recalculated when the app returns from background** ([#51768](https://github.com/facebook/react-native/issues/51768)) — ruled out, since it reproduces via cold start as well.

### Confirmed Cause (hypothesis)

Based on the Android source (`TextAttributeProps.getEffectiveFontSize()` / `PixelUtil.toPixelFromSP()`), **the font size (`fontSize`) itself** appears to be correctly capped by the `min(fontScale, maxFontSizeMultiplier)` formula (consistent with the 3rd verification, where the computed `fontSize` stayed fixed at 30 regardless of fontScale).

The problem is believed to be in the **line height / leading calculation path**. Since the 2nd verification showed the result kept changing with fontScale even when an already-capped fixed value was explicitly passed as `lineHeight`, it appears that Android's text layout (either Fabric's text measurement path, or the default line-spacing calculation in `Paint`/`StaticLayout`) separately references the device's raw `Configuration.fontScale`/`scaledDensity` — rather than the value that has `maxFontSizeMultiplier` applied — when determining line height. However, the exact file/function has not been confirmed with 100% certainty at the source level; this remains a hypothesis based on circumstantial evidence.

## Solution (Verified)

**On Android only, fully compute `fontSize`/`lineHeight` manually in JS with `allowFontScaling={false}`, based on `Math.min(PixelRatio.getFontScale(), cap)`.** By not relying on the `maxFontSizeMultiplier` prop or the automatic lineHeight calculation, this blocks the native re-introduction of the raw fontScale at the source.

```tsx
function useScaledText(baseFontSize: number, lineHeightRatio: number) {
  const fontScale = PixelRatio.getFontScale();
  if (Platform.OS === 'ios') {
    // No evidence of a leak on iOS, and this matches the original requirement (no cap) -> keep the existing approach
    return { allowFontScaling: true, fontSize: baseFontSize };
  }
  const cappedScale = Math.min(fontScale, 1.5);
  const fontSize = baseFontSize * cappedScale;
  return {
    allowFontScaling: false,
    fontSize,
    lineHeight: fontSize * lineHeightRatio,
  };
}
```

iOS has no separate evidence of a leak, and it also matches the original requirement (no cap), so it keeps the existing `allowFontScaling=true` approach.

## Remaining Work

- `lineHeightRatio` needs to be empirically re-tuned per font/text size (the current value, 1.1615, is based on a specific font plus Hangul text).
- Investigate whether a recalculation trigger (e.g., detecting `AppState` changes) is needed for cases where the system font setting changes while the app is in the foreground.
- Consider reporting the issue to the `facebook/react-native` repository (see the separate file `github-issue-maxfontsizemultiplier.md`).
