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
	if (!norm) norm = name;
	try {
		let result = ens_normalize(name);
		if (error) {	
			console.log({result, ...test});
			throw new Error('expected error');
		} else if (result != norm) {
			console.log({result, ...test});
			throw new Error(`wrong norm`);
		}
	} catch (err) {
		if (!error) {
			console.log(test);
			console.log(err);
			throw new Error('unexpected error');
		}
	}
}