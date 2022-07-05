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
* [UTS-46](https://unicode.org/reports/tr46/) is insufficient to normalize emoji sequences. Correct emoji parsing is only possible with [UTS-51](https://www.unicode.org/reports/tr51/).
* Validation tests are needed to ensure implementation compliance.
* The success of ENS has encouraged spoofing (registering a visually similar names with exotic characters) via the following techniques:
	1. Insertion of zero-width characters
	1. Using names which normalize differently between available algorithms 
	1. Using names which render differently between platforms
	1. Replacement of look-alike (confusable) characters

## Specification

* Normalization is the process of converting an name into a canonical form.
* It is idempotent:  applying normalization multiple times produces the same result.
* Input is processed on codepoints, left-to-right.
* All whitespace codepoints are disallowed.  For user convenience, leading and trailing whitespace should be trimmed before normalization.
* Repeat [Processing](#Processing) until the input is consumed or an error occurs.
* Apply [NFC (Unicode Normalization Form C)](https://unicode.org/reports/tr15/) to the output.
	* Warning: language-level NFC functions, like [`String.normalize()`](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize), may produce inconsistent results on different platforms.
* The output is normalized.

### Processing

1. Find the longest emoji sequence that matches the remaining input.
	* Valid emoji sequences can be found in `emoji.json`.  
	* Any `FE0F` is optional during matching.
2. If an emoji sequence is found:
	* Strip all `FE0F` from the matched sequence and append it to the output.
	* Remove the matched sequence from the input.
	* Go to step 1
3. Determine the type of the leading codepoint.
	* Types can be found in `chars.json`
4. If `valid`:
	* Remove the codepoint from the input
	* Append the codepoint to the output
	* Go to step 1
5. If `mapped`:
	* Remove the codepoint from the input
	* Append the mapped codepoints to the output
	* Go to step 1
6. If `ignored`:
	* Remove the codepoint from the input
	* Go to step 1
7. The codepoint is disallowed.

## Backwards Compatibility

* 99.8% of names are still valid.
* Only valid emoji sequences are allowed.
* Only valid label separator is `002E (.) FULL STOP`.
* ZWJ can only appear in emoji sequences.
* ZWNJ is disallowed.

## Security Considerations

Not all normalized names should be valid ENS names.

This ENSIP only standardizes the process of normalization.  It does not address look-alike (confusable) characters.  For example, `ape [430 440 435]` vs `аре [61 70 65]` are both valid but visually indistinguishable. 

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## Appendix: Reference Specifications

* [ENSIP-1: ENS](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens)
* [UTS-46: IDNA Compatibility Processing](https://unicode.org/reports/tr46/)
* [UTS-51: Emoji](https://www.unicode.org/reports/tr51)
* [RFC-5891: IDNA: Protocol](https://datatracker.ietf.org/doc/html/rfc5891) 
* [RFC-5892: The Unicode Code Points and IDNA](https://datatracker.ietf.org/doc/html/rfc5892)
* [UAX-15: Normalization Forms](https://unicode.org/reports/tr15/)

## Appendix: Unicode Data Sources

* [IdnaMappingTable.txt](https://unicode.org/Public/idna/14.0.0/IdnaMappingTable.txt)
* [emoji-sequences.txt](https://unicode.org/Public/emoji/14.0/emoji-sequences.txt)
* [emoji-zwj-sequences.txt](https://unicode.org/Public/emoji/14.0/emoji-zwj-sequences.txt)
* [emoji-variation-sequences.txt](https://unicode.org/Public/14.0.0/ucd/emoji/emoji-variation-sequences.txt)
* [emoji-data.txt](https://unicode.org/Public/14.0.0/ucd/emoji/emoji-data.txt)

## Appendix: Validation Tests

A list of [validation tests](./validation-tests.json) are provided with the following interpetation:

* Already Normalized: `{name: "a"}` &rarr; `norm(a) = a`
* Need Normalization: `{name: "A", norm: "a"}` &rarr; `norm(A) = a`
* Expect Error: `{name: "@", error: true}`
