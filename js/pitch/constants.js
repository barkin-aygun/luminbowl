export const GRID_COLS = 15;
export const GRID_ROWS = 26;

export const RED_POSITIONS = [
  [6,13],[8,13],[10,13],
  [5,10],[8,10],[11,10],
  [3,7],[8,7],[13,7],
  [5,4],[11,4]
];

export const BLUE_POSITIONS = [
  [6,14],[8,14],[10,14],
  [5,17],[8,17],[11,17],
  [3,20],[8,20],[13,20],
  [5,23],[11,23]
];

export const LAYOUT_VERSION = 2; // increment when grid dimensions/orientation change

export const OUTLINE_COLORS = ['white', 'red', 'blue', 'green', 'purple', 'black'];

// Distance marker mappings: row -> displayed number (for left col=1 and right col=15)
export const LEFT_COL_TOP = { 2: 1, 4: 3, 6: 5, 8: 7, 10: 9, 12: 11 };
export const LEFT_COL_BOTTOM = { 14: 12, 16: 10, 18: 8, 20: 6, 22: 4, 24: 2 };
export const RIGHT_COL_TOP = { 3: 2, 5: 4, 7: 6, 9: 8, 11: 10, 13: 12 };
export const RIGHT_COL_BOTTOM = { 15: 11, 17: 9, 19: 7, 21: 5, 23: 3, 25: 1 };

// Canvas rendering colors
export const COLORS = {
  fieldOdd: '#2e8b57',
  fieldEven: '#258050',
  endLeftOdd: '#c41e3a',
  endLeftEven: '#a01729',
  endRightOdd: '#0066cc',
  endRightEven: '#0052a3',
  teamRed: '#e03030',
  teamBlue: '#2060e0',
};
