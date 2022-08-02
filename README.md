# ENS Name Normalization Standard

[draft.md](./draft.md)

## Javascript Implementations

* Reference: [@adraffy/ens-norm-ref-impl](https://github.com/adraffy/ens-norm-ref-impl.js)
* Optimized: [@adraffy/ens-normalize](https://github.com/adraffy/ens-normalize.js)

## Data Files 
* [`chars.json`](./chars.json) &mdash; single-codepoint logic
	* `valid` &mdash; set of valid codepoints: `[cp, ...]`
	* `ignored` &mdash; set of ignored codepoints: `[cp, ...]`
	* `mapped` &mdash; mapping from codepoint to codepoints: `[[cp, [cp, ...]], ...]`
* [`emoji.json`](./emoji.json) &mdash; allowed emoji sequences
* [`tests.json`](./tests.json) &mdash; validation tests

Data files available as imports:
```Javascript
import {VERSION, CHARS, EMOJI, TESTS, run_tests} from '@adraffy/ensip-norm'; 
// npm i @adraffy/ensip-norm

// run validation tests
// returns array of errors
let errors = run_tests(name => name.toLowerCase());
```

## Build

* `npm run build` &mdash; bake json files into `index.js`