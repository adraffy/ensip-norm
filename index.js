import {readFile} from 'node:fs/promises';

async function read(path) {
	return JSON.parse(await readFile(new URL(path, import.meta.url)));
}

export const CHARS = await read('./chars.json');
export const EMOJI = await read('./emoji.json');
export const TESTS = await read('./tests.json');
export const {version: VERSION} = await read('./package.json');