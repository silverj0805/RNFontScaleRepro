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
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ResultsTable } from './components/ResultsTable';
import { TabBar } from './components/TabBar';
import { Test1 } from './components/Test1';
import { Test2 } from './components/Test2';
import { Test3 } from './components/Test3';
import { CAP } from './constants';
import { styles } from './styles';
import { Result, TestKey } from './types';

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
          <Text style={styles.subtitle}>
            fontScale{' '}
            <Text style={styles.subtitleValue}>{fontScale.toFixed(4)}</Text>
            {'  ·  '}cap {CAP}
          </Text>

          <TabBar activeTab={activeTab} onSelect={setActiveTab} />
          <ResultsTable results={results} />

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

export default App;
