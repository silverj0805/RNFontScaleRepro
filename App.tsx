/**
 * maxFontSizeMultiplier repro app
 *
 * Reproduces: on Android with the New Architecture (Fabric) enabled,
 * `maxFontSizeMultiplier` caps `fontSize` correctly but the rendered
 * line height / layout height keeps growing with the device's raw
 * system font scale, even when a value that is already capped in JS
 * is passed explicitly.
 *
 * How to use:
 *  1. Set the device's system font size so PixelRatio.getFontScale()
 *     reports a value >= the cap used below (1.5), e.g. 1.5 or 2.0.
 *  2. Force-quit and relaunch the app (cold start).
 *  3. Tap through Test 1 / Test 2 / Test 3 below. Each tab's onLayout
 *     result is recorded in the results table at the top.
 *  4. Repeat at a different device font scale and compare the table.
 *     Expected: with the cap in place, results should be IDENTICAL
 *     across font scales. Actual: Test 1 and Test 2 keep changing;
 *     only Test 3 (allowFontScaling=false + manual math) stays fixed.
 *
 * @format
 */

import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const CAP = 1.5;
const BASE_FONT_SIZE = 20;
// Ratio derived from the 1st repro's fontScale=1.5 measurement
// (34.844444 / 30), used only by Test 3's manual line height.
const LINE_HEIGHT_RATIO = 1.1615;

type TestKey = 'test1' | 'test2' | 'test3';

type Result = {
  fontScale: number;
  height: number;
};

const TAB_LABELS: Record<TestKey, string> = {
  test1: '1차: 자동 lineHeight',
  test2: '2차: 수동 lineHeight (36 고정)',
  test3: '3차: allowFontScaling=false 우회책',
};

function App() {
  const fontScale = PixelRatio.getFontScale();
  const [activeTab, setActiveTab] = useState<TestKey>('test1');
  const [results, setResults] = useState<Partial<Record<TestKey, Result>>>({});

  const recordResult = useCallback(
    (key: TestKey) => (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height;
      console.log(`[${key}] fontScale=${fontScale} height=${height}`);
      setResults(prev => ({ ...prev, [key]: { fontScale, height } }));
    },
    [fontScale],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>maxFontSizeMultiplier repro</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              PixelRatio.getFontScale():{' '}
              <Text style={styles.infoValue}>{fontScale.toFixed(4)}</Text>
            </Text>
            <Text style={styles.infoLabel}>
              Cap (maxFontSizeMultiplier): {CAP}
            </Text>
          </View>

          <View style={styles.tabRow}>
            {(Object.keys(TAB_LABELS) as TestKey[]).map(key => (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                style={[
                  styles.tabButton,
                  activeTab === key && styles.tabButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === key && styles.tabButtonTextActive,
                  ]}
                >
                  {TAB_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.resultsBox}>
            <Text style={styles.sectionTitle}>
              결과 (탭 전환할 때마다 기록됨)
            </Text>
            <View style={styles.resultsHeaderRow}>
              <Text style={[styles.resultsCell, styles.resultsHeaderCell]}>
                테스트
              </Text>
              <Text style={[styles.resultsCell, styles.resultsHeaderCell]}>
                fontScale
              </Text>
              <Text style={[styles.resultsCell, styles.resultsHeaderCell]}>
                height
              </Text>
            </View>
            {(Object.keys(TAB_LABELS) as TestKey[]).map(key => {
              const r = results[key];
              return (
                <View key={key} style={styles.resultsRow}>
                  <Text style={styles.resultsCell}>{TAB_LABELS[key]}</Text>
                  <Text style={styles.resultsCell}>
                    {r ? r.fontScale.toFixed(2) : '—'}
                  </Text>
                  <Text style={styles.resultsCell}>
                    {r ? r.height.toFixed(6) : '—'}
                  </Text>
                </View>
              );
            })}
            <Text style={styles.hint}>
              기대값: 캡이 정상 동작하면 fontScale이 달라져도(예: 1.5 vs 2.0)
              동일한 height가 나와야 합니다.
            </Text>
          </View>

          <View style={styles.testArea}>
            {activeTab === 'test1' && (
              <Test1 onLayout={recordResult('test1')} />
            )}
            {activeTab === 'test2' && (
              <Test2 onLayout={recordResult('test2')} />
            )}
            {activeTab === 'test3' && (
              <Test3 fontScale={fontScale} onLayout={recordResult('test3')} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

type TestProps = {
  onLayout: (e: LayoutChangeEvent) => void;
};

/**
 * Test 1 — minimal repro.
 * allowFontScaling + maxFontSizeMultiplier, fully automatic lineHeight.
 */
function Test1({ onLayout }: TestProps) {
  return (
    <View style={styles.testCard}>
      <Text style={styles.testDescription}>
        allowFontScaling{'{true}'} + maxFontSizeMultiplier={'{'}
        {CAP}
        {'}'}, fontSize:{BASE_FONT_SIZE}, 자동 lineHeight
      </Text>
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={CAP}
        style={[styles.sampleText, styles.bgTest1]}
        onLayout={onLayout}
      >
        가나다
      </Text>
    </View>
  );
}

/**
 * Test 2 — explicit, pre-capped lineHeight that is numerically
 * identical regardless of device fontScale (always BASE_FONT_SIZE * CAP * 1.2).
 * Isolates whether the leak is only in the *default* lineHeight calc.
 */
function Test2({ onLayout }: TestProps) {
  const lineHeight = BASE_FONT_SIZE * CAP * 1.2; // = 36, fixed regardless of fontScale
  return (
    <View style={styles.testCard}>
      <Text style={styles.testDescription}>
        allowFontScaling{'{true}'} + maxFontSizeMultiplier={'{'}
        {CAP}
        {'}'}, numberOfLines={'{1}'}, lineHeight을 fontScale과 무관하게 항상{' '}
        {lineHeight} 고정
      </Text>
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={CAP}
        numberOfLines={1}
        style={[
          styles.sampleText,
          styles.bgTest2,
          { fontSize: BASE_FONT_SIZE, lineHeight },
        ]}
        onLayout={onLayout}
      >
        Aa가나다
      </Text>
    </View>
  );
}

/**
 * Test 3 — confirmed workaround.
 * allowFontScaling={false}; fontSize/lineHeight computed manually in JS
 * from Math.min(fontScale, CAP), so both are numerically identical
 * across device font scales >= CAP.
 */
function Test3({ onLayout, fontScale }: TestProps & { fontScale: number }) {
  const cappedScale = Math.min(fontScale, CAP);
  const fontSize = BASE_FONT_SIZE * cappedScale;
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  return (
    <View style={styles.testCard}>
      <Text style={styles.testDescription}>
        allowFontScaling={'{false}'}, numberOfLines={'{1}'}, fontSize/lineHeight
        을 Math.min(fontScale, {CAP})로 JS에서 완전 수동 계산 (fontSize=
        {fontSize.toFixed(2)}, lineHeight={lineHeight.toFixed(3)})
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.sampleText, styles.bgTest3, { fontSize, lineHeight }]}
        onLayout={onLayout}
      >
        Aa가나다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: '#e0e0e0',
    marginRight: 6,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#2f6fed',
  },
  tabButtonText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#222',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  resultsBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    paddingBottom: 4,
    marginBottom: 4,
  },
  resultsHeaderCell: {
    fontWeight: '700',
  },
  resultsRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  resultsCell: {
    flex: 1,
    fontSize: 12,
  },
  hint: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  testArea: {
    marginTop: 4,
  },
  testCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  testDescription: {
    fontSize: 12,
    color: '#444',
    marginBottom: 12,
  },
  sampleText: {
    fontSize: BASE_FONT_SIZE,
    alignSelf: 'flex-start',
  },
  bgTest1: {
    backgroundColor: '#ffe08a',
  },
  bgTest2: {
    backgroundColor: '#a8e6a1',
  },
  bgTest3: {
    backgroundColor: '#a1c9e6',
  },
});

export default App;
