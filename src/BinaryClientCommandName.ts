export type BinaryClientCommandName = 'fseData' | 'fseSet' | 'fseUpdate';

export const binaryClientCommandNames = new Map<number, BinaryClientCommandName>([
    [12, 'fseData'],
    [13, 'fseSet'],
    [14, 'fseUpdate']
]);

export const binaryClientCommandNumbers = new Map<BinaryClientCommandName, number>([
    ['fseData', 12],
    ['fseSet', 13],
    ['fseUpdate', 14]
]);