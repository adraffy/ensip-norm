import {readFile} from 'node:fs/promises';

async function read(path) {
	return JSON.parse(await readFile(new URL(path, import.meta.url)));
}

export const CHARS = await read('./chars.json');
export const EMOJI = await read('./emoji.json');
export const TESTS = await read('./tests.json');
export const {version: VERSION} = await read('./package.json');

export function run_tests(fn, tests) {
	if (!tests) tests = TESTS;
	let errors = [];
	for (let test of tests) {
		let {name, norm, error} = test;
		if (typeof norm !== 'string') norm = name;
		try {
			let result = fn(name);
			if (error) {	
				errors.push({fail: 'expected error', result, ...test});
			} else if (result != norm) {
				errors.push({fail: 'wrong norm', result, ...test});
			}
		} catch (err) {
			if (!error) {
				errors.push({fail: 'unexpected error', result: err.message, ...test});
			}
		}
	}
	return errors;
}