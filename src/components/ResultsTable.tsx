import React from 'react';
import { Text, View } from 'react-native';
import { ALLOW_FONT_SCALING, TAB_LABELS, TEST_KEYS } from '../constants';
import { styles } from '../styles';
import { Result, TestKey } from '../types';

type Props = {
  results: Partial<Record<TestKey, Result>>;
};

// This table is meta-UI describing the tests, not a test subject itself,
// so its text is deliberately not allowed to scale with the device font --
// otherwise its own header would be as susceptible to layout breakage as
// the bug this app demonstrates, defeating the point of a stable summary.
export function ResultsTable({ results }: Props) {
  return (
    <View style={styles.resultsBox}>
      <Text allowFontScaling={false} style={styles.sectionTitle}>
        Results
      </Text>
      <View style={styles.resultsHeaderRow}>
        <Text
          allowFontScaling={false}
          style={[
            styles.resultsCell,
            styles.resultsHeaderCell,
            styles.resultsColTest,
          ]}
        >
          Test
        </Text>
        <Text
          allowFontScaling={false}
          style={[
            styles.resultsCell,
            styles.resultsHeaderCell,
            styles.resultsColAllow,
          ]}
        >
          allowFontScaling
        </Text>
        <Text
          allowFontScaling={false}
          style={[
            styles.resultsCell,
            styles.resultsHeaderCell,
            styles.resultsColHeight,
          ]}
        >
          height
        </Text>
      </View>
      {TEST_KEYS.map(key => {
        const r = results[key];
        return (
          <View key={key} style={styles.resultsRow}>
            <Text
              allowFontScaling={false}
              style={[styles.resultsCell, styles.resultsColTest]}
            >
              {TAB_LABELS[key]}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.resultsCell, styles.resultsColAllow]}
            >
              {ALLOW_FONT_SCALING[key] ? 'true' : 'false'}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.resultsCell, styles.resultsColHeight]}
            >
              {r ? r.height.toFixed(6) : '—'}
            </Text>
          </View>
        );
      })}
      <Text allowFontScaling={false} style={styles.hint}>
        Expected: same height in every row, regardless of fontScale.
      </Text>
    </View>
  );
}
