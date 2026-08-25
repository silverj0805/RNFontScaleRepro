import React from 'react';
import { Text, View } from 'react-native';
import { BASE_FONT_SIZE, CAP } from '../constants';
import { styles } from '../styles';
import { TestProps } from '../types';

/**
 * Test 1 — minimal repro.
 * allowFontScaling + maxFontSizeMultiplier, fully automatic lineHeight.
 */
export function Test1({ onLayout }: TestProps) {
  return (
    <View>
      <Text
        allowFontScaling={true}
        maxFontSizeMultiplier={CAP}
        style={[styles.sampleText, styles.bgTest1]}
        onLayout={onLayout}
      >
        ABC
      </Text>
      <Text style={styles.testDescription}>
        *allowFontScaling{'{true}'} + maxFontSizeMultiplier={'{'}
        {CAP}
        {'}'}, fontSize:{BASE_FONT_SIZE}, automatic lineHeight
      </Text>
    </View>
  );
}
