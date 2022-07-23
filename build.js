import {readFile, writeFile} from 'node:fs/promises';

async function read(path) {
	return JSON.parse(await readFile(new URL(path, import.meta.url)));
}

let map = {
    VERSION: (await read('./package.json')).version,
    CHARS: await read('./chars.json'),
    EMOJI: await read('./emoji.json'),
    TESTS: await read('./tests.json'),
};


let out_file = new URL('index.js', import.meta.url);
writeFile(out_file, [
    `// built: ${new Date().toJSON()}`,
    ...Object.entries(map).map(([k, v]) =>  `export const ${k} = ${JSON.stringify(v)};`)
].join('\n'));
console.log(`Created: ${out_file.pathname}`);

