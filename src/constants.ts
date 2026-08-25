import { TestKey } from './types';

export const CAP = 1.5;
export const BASE_FONT_SIZE = 20;
// Ratio derived from the 1st repro's fontScale=1.5 measurement
// (34.844444 / 30), used only by Test 3's manual line height.
export const LINE_HEIGHT_RATIO = 1.1615;

// Short labels keep the tab row to a single line so the results table
// (the important part) starts near the top of the screen.
export const TAB_LABELS: Record<TestKey, string> = {
  test1: 'Test 1',
  test2: 'Test 2',
  test3: 'Test 3',
};

export const TEST_KEYS = Object.keys(TAB_LABELS) as TestKey[];

// Whether each test renders with allowFontScaling true or false --
// shown in the results table instead of fontScale, since fontScale is
// already shown once in the subtitle and is the same for every row.
export const ALLOW_FONT_SCALING: Record<TestKey, boolean> = {
  test1: true,
  test2: true,
  test3: false,
};
