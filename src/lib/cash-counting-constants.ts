export const CASH_DENOMINATIONS = [
  { key: 'bills_100', label: '$100', faceValue: 100, type: 'bill' },
  { key: 'bills_50', label: '$50', faceValue: 50, type: 'bill' },
  { key: 'bills_20', label: '$20', faceValue: 20, type: 'bill' },
  { key: 'bills_10', label: '$10', faceValue: 10, type: 'bill' },
  { key: 'bills_5', label: '$5', faceValue: 5, type: 'bill' },
  { key: 'bills_2', label: '$2', faceValue: 2, type: 'bill' },
  { key: 'bills_1', label: '$1', faceValue: 1, type: 'bill' },
  { key: 'coins_25', label: '25¢', faceValue: 0.25, type: 'coin' },
  { key: 'coins_10', label: '10¢', faceValue: 0.10, type: 'coin' },
  { key: 'coins_5', label: '5¢', faceValue: 0.05, type: 'coin' },
] as const;

export type DenominationKey = typeof CASH_DENOMINATIONS[number]['key'];
