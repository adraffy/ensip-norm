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

export interface TestError extends Test {
    type: string,
    result: string
}

export function run_tests(fn: (name: string) => string, test?: Test[]): TestError[];