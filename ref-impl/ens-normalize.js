import {readFile} from 'node:fs/promises';

// create lookup tables
let {valid, mapped, ignored} = JSON.parse(await readFile(new URL('../chars.json', import.meta.url)));
valid = new Set(valid);
ignored = new Set(ignored);
mapped = Object.fromEntries(mapped);

// create simple trie 
let emoji_root = {};
for (let emoji of JSON.parse(await readFile(new URL('../emoji.json', import.meta.url)))) {
	let node = emoji_root;
	for (let cp of emoji) {
		if (cp === 0xFE0F) {
			node.__fe0f = true;
			continue;
		}		
		let next = node[cp];
		if (!next) node[cp] = next = {};
		node = next;
	}
	node.__valid = emoji;
}

// given codepoints (backwards)
// find longest emoji match
// allow optional FE0F
// returns the full sequence
function consume_emoji(cps) {
	let emoji;
	let node = emoji_root;
	let pos = cps.length;
	let fe0f;
	while (pos) {
		let cp = cps[--pos];
		if (cp == 0xFE0F) {
			if (!fe0f) break; // we didn't expect FE0F
			fe0f = false; // clear flag
			continue;
		}
		node = node[cp];
		if (!node) break;
		fe0f = node.__fe0f;
		if (node.__valid) { // this is a valid emoji (so far)
			emoji = node.__valid;
			if (fe0f && pos > 0 && cps[pos - 1] == 0xFE0F) { // eat FE0F too
				fe0f = false;
				pos--;
			}
			cps.length = pos; // remove it from input
		}
	}
	return emoji;
}

export function ens_normalize(name, beautify = false) {
	let input = [...name].map(s => s.codePointAt(0)).reverse(); // flip so we can pop
	let output = [];
	while (input.length) {		
		let emoji = consume_emoji(input);
		if (emoji) {
			output.push(...(beautify ? emoji : emoji.filter(cp => cp != 0xFE0F)));
			continue;
		}
		let cp = input.pop();
		if (valid.has(cp)) {
			output.push(cp);
			continue;
		} 
		if (ignored.has(cp)) {
			continue;
		}
		let cps = mapped[cp];
		if (cps) {
			output.push(...cps);
			continue;
		}
		throw new Error(`Disallowed codepoint: ${cp.toString(16)}`);
	}
	return String.fromCodePoint(...output).normalize('NFC');
}