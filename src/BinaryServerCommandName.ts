export type BinaryServerCommandNumber = 12 | 13 | 14 | 15 | 16 | 17;

export type BinaryServerCommandName = 'fseListen' | 'fseUnlisten' | 'fseSet' | 'fseSetIncludeMe' | 'fseUpdate' | 'fseUpdateIncludeMe';

export const BinaryServerCommandNames = new Map<BinaryServerCommandNumber, BinaryServerCommandName>([
    [12, 'fseListen'],
    [13, 'fseUnlisten'],
    [14, 'fseSet'],
    [15, 'fseSetIncludeMe'],
    [16, 'fseUpdate'],
    [17, 'fseUpdateIncludeMe']

]);

export const BinaryServerCommandNumbers = new Map<BinaryServerCommandName, BinaryServerCommandNumber>([
    ['fseListen', 12],
    ['fseUnlisten', 13],
    ['fseSet', 14],
    ['fseSetIncludeMe', 15],
    ['fseUpdate', 16],
    ['fseUpdateIncludeMe', 17]
]);