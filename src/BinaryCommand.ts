export type BinaryCommandName = 'fseListen' | 'fseSet' | 'fseUpdate' | 'fseUpdateIncludeMe';

export const binaryCommandNames = new Map<number, BinaryCommandName>([
    [128, 'fseListen'],
    [129, 'fseSet'],
    [130, 'fseUpdate'],
    [131, 'fseUpdateIncludeMe']
    
]);

export const binaryCommandNumbers = new Map<BinaryCommandName, number>([
    ['fseListen', 128],
    ['fseSet', 129],
    ['fseUpdate', 130],
    ['fseUpdateIncludeMe', 131]
]);