export type BinaryClientCommandName = 'fseData' | 'fseUpdate';

export const binaryClientCommandNames = new Map<number, BinaryClientCommandName>([
    [12, 'fseData'],
    [13, 'fseUpdate']
]);

export const binaryClientCommandNumbers = new Map<BinaryClientCommandName, number>([
    ['fseData', 12],
    ['fseUpdate', 13]
]);