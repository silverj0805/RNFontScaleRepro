import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TAB_LABELS, TEST_KEYS } from '../constants';
import { styles } from '../styles';
import { TestKey } from '../types';

type Props = {
  activeTab: TestKey;
  onSelect: (key: TestKey) => void;
};

export function TabBar({ activeTab, onSelect }: Props) {
  return (
    <View style={styles.tabRow}>
      {TEST_KEYS.map(key => (
        <TouchableOpacity
          key={key}
          onPress={() => onSelect(key)}
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
  );
}
