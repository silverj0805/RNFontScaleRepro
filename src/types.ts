import { LayoutChangeEvent } from 'react-native';

export type TestKey = 'test1' | 'test2' | 'test3';

export type Result = {
  fontScale: number;
  height: number;
};

export type TestProps = {
  onLayout: (e: LayoutChangeEvent) => void;
};
