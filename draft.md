# ENSIP-?: ENS Name Normalization Standard 

| **Author**  | Andrew Raffensperger \<raffy@me.com> |
| ----------- | ------------------------------------ |
| **Status**  | Draft                                |
| **Created** | 2022-07-04                           |

## Abstract

This ENSIP standardizes Ethereum Name Service (ENS) name normalization process outlined in [ENSIP-1 § Name Syntax](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#name-syntax).

## Motivation

* Since ENSIP-1 was finalized in 2016, Unicode has [evolved](https://unicode.org/history/publicationdates.html) from version 8.0.0 to 14.0.0 and incorporated many new characters, including complex emoji sequences. 
* ENSIP-1 does not state the version of Unicode.
* ENSIP-1 implies but does not state an explicit flavor of IDNA processing. 
* [UTS-46](https://unicode.org/reports/tr46/) is insufficient to normalize emoji sequences. Correct emoji processing is only possible with [UTS-51](https://www.unicode.org/reports/tr51/).
* Validation tests are needed to ensure implementation compliance.
* The success of ENS has encouraged spoofing via the following techniques:
	1. Insertion of zero-width characters
	1. Using names which normalize differently between available algorithms 
	1. Using names which render differently between platforms
	1. Replacement of look-alike (confusable) characters

## Specification

Normalization is the process of canonicalizing a name before for hashing.  It is idempotent: applying normalization multiple times produces the same result.  

`emoji.json` and `valid.json` contain all of the necessary codepoint transformations.  NFC (Unicode Normalization Form C) has been stable since [Unicode 4.1](https://unicode.org/reports/tr15/#Stability_of_Normalized_Forms).

### Algorithm
* Input is processed left-to-right on codepoints.
* For user convenience, leading and trailing whitespace should be trimmed before normalization as all whitespace codepoints are disallowed.
* Repeat [Processing](#Processing) until the input is consumed or a disallowed codepoint is encountered.
* Apply [NFC](https://unicode.org/reports/tr15/) to the output.
	* Warning: language-level NFC functions, like [`String.normalize()`](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize), may produce inconsistent results on different platforms.
* The output is normalized and ready for hashing.

### Processing

1. Find the longest emoji sequence that matches the remaining input.
	* Valid emoji sequences can be found in `emoji.json`.  
	* Any `FE0F` is optional during matching.
1. If an emoji sequence is found:
	* Strip all `FE0F` from the matching emoji sequence and append it to the output.
	* Remove the matched sequence from the input.
	* Go to step 1
1. Determine the type of the leading codepoint.
	* Types can be found in `chars.json`
1. If `valid`:
	* Remove the codepoint from the input
	* Append the codepoint to the output
	* Go to step 1
1. If `ignored`:
	* Remove the codepoint from the input
	* Go to step 1
1. If `mapped`:
	* Remove the codepoint from the input
	* Append the mapped codepoints to the output
	* Go to step 1
1. The codepoint is disallowed.

### Derivation of `chars.json`

* [IDNA 2003](https://unicode.org/Public/idna/14.0.0/IdnaMappingTable.txt) with `UseSTD3ASCIIRules = true` and `Transitional_Processing = false`.
* `24 ($) Dollar Sign` and `5F (_) Underscore` are valid.
* The following are disallowed:
	* `3002 (。) Ideographic Full Stop`
	* `FF0E (．) Fullwidth Full Stop`
	* `FF61 (｡) Halfwidth Ideographic Full Stop`
	* `200C (‌) Zero Width Non-Joiner (ZWNJ)`
	* `200D (‍) Zero Width joiner (ZWJ)`
	* `2800 (⠀) Braille Pattern Blank`
* `2013 (–) En Dash`, `2014 (—) Em Dash`, and `2212 (−) Minus Sign` are mapped to `2D (-) Hyphen`.
* Some [Arabic Numerals](https://en.wikipedia.org/wiki/Arabic_numerals) are mapped:
	* `6F0 (۰)` &rarr; `660 (٠)`
	* `6F1 (۱)` &rarr; `661 (١)`
	* `6F2 (۲)` &rarr; `662 (٢)`
	* `6F3 (۳)` &rarr; `663 (٣)`
	* `6F7 (۷)` &rarr; `667 (٧)`
	* `6F8 (۸)` &rarr; `668 (٨)`
	* `6F9 (۹)` &rarr; `669 (٩)`
* All single-codepoint Emoji with default emoji presentation are disallowed.

### Derivation of `emoji.json`

* [Emoji Sequence Whitelist](#appendix-emoji-sequence-whitelist)
* All [RGI ZWJ sequences](https://unicode.org/Public/emoji/14.0/emoji-zwj-sequences.txt)
* All [single-codepoint Emoji](https://unicode.org/Public/14.0.0/ucd/emoji/emoji-data.txt) with [default emoji presentation](https://www.unicode.org/reports/tr51/#Presentation_Style). 
* All single-codepoint emoji with default text presentation are not included.

## Backwards Compatibility

* 99.8% of names are still valid.
* Only valid emoji sequences are allowed.
* Only valid label separator is `2E (.) FULL STOP`.
* `ZWJ` can only appear in emoji sequences.
* `ZWNJ` is disallowed.

## Security Considerations

* Not all normalized names should be accepted ENS names.
* This ENSIP only standardizes the process of normalization.  It does not address look-alike (confusable) characters.  
* Example: `ape [61 70 65]` and `аре [430 440 435]` are both valid but visually indistinguishable. 

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).


## Appendix: Reference Specifications

* [ENSIP-1: ENS](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens)
* [UTS-46: IDNA Compatibility Processing](https://unicode.org/reports/tr46/)
* [UTS-51: Emoji](https://www.unicode.org/reports/tr51)
* [RFC-5891: IDNA: Protocol](https://datatracker.ietf.org/doc/html/rfc5891) 
* [RFC-5892: The Unicode Code Points and IDNA](https://datatracker.ietf.org/doc/html/rfc5892)
* [UAX-15: Normalization Forms](https://unicode.org/reports/tr15/)

## Appendix: Validation Tests

A list of [validation tests](./tests.json) are provided with the following interpetation:

* Already Normalized: `{name: "a"}` &rarr; `normalize("a") = "a"`
* Need Normalization: `{name: "A", norm: "a"}` &rarr; `normalize("A") = "a"`
* Expect Error: `{name: "@", error: true}` &rarr; `normalize("@") throws`

## Appendix: Beautification

* Follow the normalization algorithm, except:
	* When an emoji sequence is matched, output the full matching emoji sequence (don't strip `FE0F`).
* Example: `normalize("1️⃣") = "1⃣"` &rarr; `beautify("1⃣") = "1️⃣"`

## Appendix: Emoji Sequence Whitelist

```Javascript
[
	// tag sequences
	'1F3F4 E0067 E0062 E0065 E006E E0067 E007F', // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
	'1F3F4 E0067 E0062 E0073 E0063 E0074 E007F', // 🏴󠁧󠁢󠁳󠁣󠁴󠁿
	'1F3F4 E0067 E0062 E0077 E006C E0073 E007F', // 🏴󠁧󠁢󠁷󠁬󠁳󠁿

	// men wrestling
	'1F93C 1F3FB 200D 2642 FE0F', // 🤼🏻‍♂
	'1F93C 1F3FC 200D 2642 FE0F', // 🤼🏼‍♂
	'1F93C 1F3FD 200D 2642 FE0F', // 🤼🏽‍♂
	'1F93C 1F3FE 200D 2642 FE0F', // 🤼🏾‍♂
	'1F93C 1F3FF 200D 2642 FE0F', // 🤼🏿‍♂

	// women wrestling
	'1F93C 1F3FB 200D 2640 FE0F', // 🤼🏻‍♀
	'1F93C 1F3FC 200D 2640 FE0F', // 🤼🏼‍♀
	'1F93C 1F3FD 200D 2640 FE0F', // 🤼🏽‍♀
	'1F93C 1F3FE 200D 2640 FE0F', // 🤼🏾‍♀
	'1F93C 1F3FF 200D 2640 FE0F', // 🤼🏿‍♀
]
```