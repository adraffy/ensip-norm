# ENS Name Normalization Standard

[Current Standard (Draft)](./draft.md)

## Implementations

### Javascript 
* Reference: [@adraffy/ens-norm-ref-impl](https://github.com/adraffy/ens-norm-ref-impl.js)
* Optimized: [@adraffy/ens-normalize](https://github.com/adraffy/ens-normalize.js)

### Solidity
* Experimental: [@adraffy/ens-norm-research](https://github.com/adraffy/ens-norm-research)

## Data Files 
* [`chars.json`](./chars.json) — single-codepoint logic
	* `valid` — list of valid codepoints
	* `mapped` — list of codepoint to mapped codepoint(s): `[cp, [cp, ...]`
	* `ignored` — list of ignored codepoints
	* `cm` — list of combining mark codepoints (subset of valid)
* [`emoji.json`](./emoji.json) — fully-qualified emoji sequences
* [`tests.json`](./tests.json) — validation tests

Data files available as imports:
```Javascript
import {VERSION, CHARS, EMOJI, TESTS, run_tests} from '@adraffy/ensip-norm'; 
// npm i @adraffy/ensip-norm

// run validation tests
// returns array of errors
let errors = run_tests(name => name.toLowerCase()); // just for example
```

## Build

* `npm run build` — compile data files into `index.js`
