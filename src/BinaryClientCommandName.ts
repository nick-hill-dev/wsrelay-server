export type BinaryClientCommandNumber = 12 | 13 | 14;

export type BinaryClientCommandName = 'fseData' | 'fseSet' | 'fseUpdate';

export const BinaryClientCommandNames = new Map<BinaryClientCommandNumber, BinaryClientCommandName>([
    [12, 'fseData'],
    [13, 'fseSet'],
    [14, 'fseUpdate']
]);

export const BinaryClientCommandNumbers = new Map<BinaryClientCommandName, BinaryClientCommandNumber>([
    ['fseData', 12],
    ['fseSet', 13],
    ['fseUpdate', 14]
]);