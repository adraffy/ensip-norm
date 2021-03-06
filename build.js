import {readFile, writeFile} from 'node:fs/promises';

async function read(path) {
	return JSON.parse(await readFile(new URL(path, import.meta.url)));
}

const TESTS = await read('./tests.json');

let map = {
	VERSION: (await read('./package.json')).version,
	CHARS: await read('./chars.json'),
	EMOJI: await read('./emoji.json'),
	TESTS
};

function run_tests(fn, tests = TESTS) {
	let errors = [];
	for (let test of tests) {
		let {name, norm, error} = test;
		if (typeof norm !== 'string') norm = name;
		try {
			let result = fn(name);
			if (error) {	
				errors.push({type: 'expected error', result, ...test});
			} else if (result != norm) {
				errors.push({type: 'wrong norm', result, ...test});
			}
		} catch (err) {
			if (!error) {
				errors.push({type: 'unexpected error', result: err.message, ...test});
			}
		}
	}
	return errors;
}


let out_file = new URL('index.js', import.meta.url);
writeFile(out_file, [
	`// built: ${new Date().toJSON()}`,
	...Object.entries(map).map(([k, v]) =>  `export const ${k} = ${JSON.stringify(v)};`),
	`export ${run_tests}`,
].join('\n'));
console.log(`Created: ${out_file.pathname}`);