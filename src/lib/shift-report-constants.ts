export const STORE_LOCATIONS = ['Store 1', 'Store 2', 'Store 3'] as const;

export const SHIFT_TYPES = ['7-3', '3-11', '11-7'] as const;

export type ShiftType = (typeof SHIFT_TYPES)[number];

export const VALUE_STOCK_ROWS = [
  { label: '$2', sortOrder: 1 },
  { label: '$3', sortOrder: 2 },
  { label: '$4', sortOrder: 3 },
  { label: '$5', sortOrder: 4 },
  { label: '$10', sortOrder: 5 },
  { label: '$20', sortOrder: 6 },
  { label: '$30', sortOrder: 7 },
  { label: '$50', sortOrder: 8 },
] as const;

export const DRAWER_STOCK_ROWS = [
  { drawer: 1, contents: 'DUMAURIER' },
  { drawer: 2, contents: 'BELMONT' },
  { drawer: 3, contents: 'NEXT' },
  { drawer: 4, contents: 'PALLMALL' },
  { drawer: 5, contents: 'CANADIAN CLASSIC' },
  { drawer: 6, contents: 'JOHN PLAYERS' },
  { drawer: 7, contents: 'PHILIP MORRIS' },
  { drawer: 8, contents: 'VICEROY / MATINEE / VOGUE' },
  { drawer: 9, contents: 'PLAYERS' },
  { drawer: 10, contents: 'EXPORT A / MCDONALD / MALBORO' },
  { drawer: 11, contents: 'JPP PLUS' },
  { drawer: 12, contents: 'B&H / DUNHILL / ROOFTOP' },
  { drawer: 13, contents: 'ROTHMANS / NO.7 / ACCORD' },
  { drawer: 14, contents: 'LD' },
] as const;

export function getPreviousShift(currentShift: ShiftType): { shiftType: ShiftType; dateOffset: number } {
  switch (currentShift) {
    case '7-3':
      return { shiftType: '11-7', dateOffset: 0 };
    case '3-11':
      return { shiftType: '7-3', dateOffset: 0 };
    case '11-7':
      return { shiftType: '3-11', dateOffset: 0 };
  }
}
