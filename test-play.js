import {VERSION, CHARS, EMOJI, TESTS} from './index.js';

console.log({
	VERSION,
	CHARS: Object.fromEntries(Object.entries(CHARS).map(([k, v]) => [k, v.length])),
	EMOJI: EMOJI.length,
	TESTS: TESTS.length
});