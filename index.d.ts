export const CHARS: {
    valid: number[],
    ignored: number[],
    mapped: [number, number[]][]
};
export const EMOJI: number[][];
export interface Test {
    name: string,
    norm?: string,
    comment?: string,
    error?: boolean
}
export const TESTS: Test[];