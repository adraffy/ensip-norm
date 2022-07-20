# ENS Name Normalization Standard

[draft.md](./draft.md)

## Data Files 
* [`chars.json`](./chars.json) &mdash; single-codepoint logic
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