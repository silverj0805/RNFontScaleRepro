import React from 'react';
import { Text, View } from 'react-native';
import { BASE_FONT_SIZE, CAP } from '../constants';
import { styles } from '../styles';
import { TestProps } from '../types';

/**
 * Test 2 — explicit, pre-capped lineHeight that is numerically
 * identical regardless of device fontScale (always BASE_FONT_SIZE * CAP * 1.2).
 * Isolates whether the leak is only in the *default* lineHeight calc.
 */
export function Test2({ onLayout }: TestProps) {
  const lineHeight = BASE_FONT_SIZE * CAP * 1.2; // = 36, fixed regardless of fontScale
  return (
    <View>
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
        ABC
      </Text>
      <Text style={styles.testDescription}>
        *allowFontScaling{'{true}'} + maxFontSizeMultiplier={'{'}
        {CAP}
        {'}'}, numberOfLines={'{1}'}, lineHeight fixed to {lineHeight}{' '}
        regardless of fontScale
      </Text>
    </View>
  );
}
