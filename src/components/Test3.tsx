import React from 'react';
import { Text, View } from 'react-native';
import { BASE_FONT_SIZE, CAP, LINE_HEIGHT_RATIO } from '../constants';
import { styles } from '../styles';
import { TestProps } from '../types';

/**
 * Test 3 — confirmed workaround.
 * allowFontScaling={false}; fontSize/lineHeight computed manually in JS
 * from Math.min(fontScale, CAP), so both are numerically identical
 * across device font scales >= CAP.
 */
export function Test3({
  onLayout,
  fontScale,
}: TestProps & { fontScale: number }) {
  const cappedScale = Math.min(fontScale, CAP);
  const fontSize = BASE_FONT_SIZE * cappedScale;
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  return (
    <View>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.sampleText, styles.bgTest3, { fontSize, lineHeight }]}
        onLayout={onLayout}
      >
        ABC
      </Text>
      <Text style={styles.testDescription}>
        *allowFontScaling={'{false}'}, numberOfLines={'{1}'},
        fontSize/lineHeight computed manually from Math.min(fontScale, {CAP}) in
        JS (fontSize=
        {fontSize.toFixed(2)}, lineHeight={lineHeight.toFixed(3)})
      </Text>
    </View>
  );
}
