# ENS Name Normalization Standard

[draft.md](./draft.md)

## Data Files 
* [`chars.json`](./chars.json) &mdash; single-codepoint logic
	* `valid` &mdash; set of valid codepoints: `[cp, ...]`
	* `ignored` &mdash; set of ignored codepoints: `[cp, ...]`
	* `mapped` &mdash; mapping from codepoint to codepoints: `[[cp, [cp, ...]], ...]`
* [`emoji.json`](./emoji.json) &mdash; allowed emoji sequences
* [`tests.json`](./tests.json) &mdash; validation tests

## NPM

```
npm i @adraffy/ensip-norm
```

Data files available as imports:
```Javascript
import {VERSION, CHARS, EMOJI, TESTS} from '@adraffy/ensip-norm';
```