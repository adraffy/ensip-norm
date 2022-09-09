import {VERSION, CHARS, EMOJI, TESTS, run_tests} from './index.js';

console.log({
	VERSION,
	CHARS: Object.fromEntries(Object.entries(CHARS).map(([k, v]) => [k, v.length])),
	EMOJI: EMOJI.length,
	TESTS: TESTS.length
});

run_tests(x => x.toLowerCase()); 