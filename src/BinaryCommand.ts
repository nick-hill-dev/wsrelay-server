export type BinaryCommandName = 'loadBinaryData' | 'saveBinaryData';

export const binaryCommandNames = new Map<number, BinaryCommandName>([
    [128, 'loadBinaryData'],
    [129, 'saveBinaryData']
]);

export const binaryCommandNumbers = new Map<BinaryCommandName, number>([
    ['loadBinaryData', 128],
    ['saveBinaryData', 129]
]);