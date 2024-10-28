export type BinaryServerCommandName = 'fseListen' | 'fseUnlisten' | 'fseSet' | 'fseSetIncludeMe' | 'fseUpdate' | 'fseUpdateIncludeMe';

export const binaryServerCommandNames = new Map<number, BinaryServerCommandName>([
    [12, 'fseListen'],
    [13, 'fseUnlisten'],
    [14, 'fseSet'],
    [15, 'fseSetIncludeMe'],
    [16, 'fseUpdate'],
    [17, 'fseUpdateIncludeMe']

]);

export const binaryServerCommandNumbers = new Map<BinaryServerCommandName, number>([
    ['fseListen', 12],
    ['fseUnlisten', 13],
    ['fseSet', 14],
    ['fseSetIncludeMe', 15],
    ['fseUpdate', 16],
    ['fseUpdateIncludeMe', 17]
]);