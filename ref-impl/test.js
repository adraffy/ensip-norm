import {ens_normalize} from './ens-normalize.js';
import {readFile} from 'node:fs/promises';

// trivial
console.log(ens_normalize('VITALIK.ETH'));

// confusing
console.log(ens_normalize('ape') == ens_normalize('аре'));

// beautify
console.log(ens_normalize('1️⃣'));
console.log(ens_normalize(ens_normalize('1️⃣'), true));

// check validation tests
for (let test of JSON.parse(await readFile(new URL('../tests.json', import.meta.url)))) {
	let {name, norm, error} = test;
	if (typeof norm !== 'string') norm = name;
	try {
		let result = ens_normalize(name);
		if (error) {	
			console.log({fail: 'expected error', result, ...test});
		} else if (result != norm) {
			console.log({fail: 'wrong norm', result, ...test});
		}
	} catch (err) {
		if (!error) {
			console.log({fail: 'unexpected error', result: err.toString(), ...test});
		}
	}
}