# ENSIP-?: ENS Name Normalization Standard 

| **Author**  | Andrew Raffensperger \<raffy@me.com> |
| ----------- | ------------------------------------ |
| **Status**  | Draft                                |
| **Created** | 2022-07-04                           |
| **Updated** | 2022-09-08                           |

## Abstract

This ENSIP standardizes Ethereum Name Service (ENS) name normalization process outlined in [ENSIP-1 § Name Syntax](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#name-syntax).

## Motivation

* Since ENSIP-1 was finalized in 2016, Unicode has [evolved](https://unicode.org/history/publicationdates.html) from version 8.0.0 to 14.0.0 and incorporated many new characters, including complex emoji sequences. 
* ENSIP-1 does not state the version of Unicode.
* ENSIP-1 implies but does not state an explicit flavor of IDNA processing. 
* [UTS-46](https://unicode.org/reports/tr46/) is insufficient to normalize emoji sequences. Correct emoji processing is only possible with [UTS-51](https://www.unicode.org/reports/tr51/).
* Validation tests are needed to ensure implementation compliance.
* The success of ENS has encouraged spoofing via the following techniques:
	1. Insertion of zero-width characters.
	1. Using names which normalize differently between available algorithms. 
	1. Using names which render differently between platforms.
	1. Replacement of look-alike (confusable) characters.

## Specification

Normalization is the process of canonicalizing a name before for hashing.  It is idempotent: applying normalization multiple times produces the same result.

### Versioning
* `chars.json` and `emoji.json` contain all of the necessary codepoint information for [Processing](#Processing).
* [Unicode Normalization Forms](https://unicode.org/reports/tr15/) should use Unicode version `14.0.0` for correct results.

### Algorithm
* Input is processed left-to-right on codepoints.
* For user convenience, leading and trailing whitespace should be trimmed before normalization, as all whitespace codepoints are disallowed.
* Repeat [Processing](#Processing) until the input is consumed or a disallowed codepoint is encountered.
* Convert the output to NFC (Unicode Normalization Form C).
* For each [label](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#name-syntax) in the output:
	* `5F (_) Underscore` can only occur at the start of the label.
	* The third and fourth characters cannot both be `2D (-) Hyphen` if the label contains only ASCII (`0x00-0x7F`).
	* When the label is converted to NFD (Unicode Normalization Form D), combining marks (see: `"cm"` in `chars.json`) cannot be: the first character, directly follow an emoji, or directly follow another combining mark.
* The output is normalized and ready for [hashing](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#namehash-algorithm).

### Processing

1. Find the longest emoji sequence that matches the remaining input.
	* Valid emoji sequences can be found in `emoji.json`
	* `FE0F` is optional during matching.
1. If an emoji sequence is found:
	* Strip all `FE0F` from the matching emoji sequence and append it to the output.
	* Remove the matched sequence from the input.
1. Otherwise, determine the type of the leading codepoint. 
	* Types can be found in `chars.json`
1. If **valid**:
	* Remove the codepoint from the input.
	* Append the codepoint to the output.
1. If **ignored**:
	* Remove the codepoint from the input.
1. If **mapped**:
	* Remove the codepoint from the input.
	* Append the mapped codepoint(s) to the output.
1. Otherwise, the codepoint is **disallowed**.

### Derivation of `chars.json`

* [IDNA 2003](https://unicode.org/Public/idna/14.0.0/IdnaMappingTable.txt) with `UseSTD3ASCIIRules = true` and `Transitional_Processing = false`.
	* `"ignored"` → list of codepoints
	* `"valid"` → list of codepoints
	* `"mapped"` → list of codepoint to mapped codepoint(s)
* [Combining Marks](https://www.unicode.org/Public/14.0.0/ucd/extracted/DerivedGeneralCategory.txt) (`General_Category = Mark`) that are **valid**.
	* `"cm"` → list of codepoints
* All single-codepoint emoji from `emoji.json` are **removed**.
* The following are **valid**:
	* `24 ($) Dollar Sign` 
	* `5F (_) Underscore`
* The following are **disallowed**:
	* `3002 (。) Ideographic Full Stop`
	* `FF0E (．) Fullwidth Full Stop`
	* `FF61 (｡) Halfwidth Ideographic Full Stop`
	* `200C (‌) Zero Width Non-Joiner (ZWNJ)`
	* `200D (‍) Zero Width joiner (ZWJ)`
	* `2800 (⠀) Braille Pattern Blank`
* The following combining marks are **disallowed**:
	* `320 (x̠) Combining Minus Sign Below`
	* `332 (x̲) Combining Low Line`
	* `333 (x̳) Combining Double Low Line`
	* `347 (x͇) Combining Equals Sign Below`
	* `FE2B (x︫) Combining Macron Left Half Below`
	* `FE2C (x︬) Combining Macron Right Half Below`
	* `FE2D (x︭) Combining Conjoining Macron Below`
* The following are **mapped** to `2D (-) Hyphen`:
	* `2010 (‐) Hyphen`
	* `2011 (‑) Non-Breaking Hyphen`
	* `2012 (‒) Figure Dash`
	* `2013 (–) En Dash`
	* `2014 (—) Em Dash`
	* `2015 (—) Horizontal Bar`
	* `207B (⁻) Superscript Minus`
	* `208B (₋) Subscript Minus`
	* `2212 (−) Minus Sign`
	* `23AF (⎯) Horizontal Line Extension`
	* `23BA (⎺) Horizontal Scan Line-1`
	* `23BB (⎻) Horizontal Scan Line-2`
	* `23BC (⎼) Horizontal Scan Line-3`
	* `23BD (⎽) Horizontal Scan Line-4`
	* `23E4 (⏤) Straightness`
	* `FE31 (︱) Vertical Em Dash`
	* `FE32 (︲) Vertical En Dash`
	* `FE58 (﹘) Small Em Dash`
* Some [Arabic Numerals](https://en.wikipedia.org/wiki/Arabic_numerals) are **mapped**:
	* `6F0 (۰)` &rarr; `660 (٠)`
	* `6F1 (۱)` &rarr; `661 (١)`
	* `6F2 (۲)` &rarr; `662 (٢)`
	* `6F3 (۳)` &rarr; `663 (٣)`
	* `6F7 (۷)` &rarr; `667 (٧)`
	* `6F8 (۸)` &rarr; `668 (٨)`
	* `6F9 (۹)` &rarr; `669 (٩)`

### Derivation of `emoji.json`

* All emoji are [fully-qualified](https://www.unicode.org/reports/tr51/#def_fully_qualified_emoji) unless specified.
* [Emoji Sequence Whitelist](#appendix-emoji-sequence-whitelist)
* The following [ZWJ Sequences](https://unicode.org/Public/emoji/14.0/emoji-zwj-sequences.txt):
	* `RGI_Emoji_ZWJ_Sequence`
* The following [Emoji Sequences](https://unicode.org/Public/emoji/14.0/emoji-sequences.txt):
	* `Emoji_Keycap_Sequence`
	* `RGI_Emoji_Tag_Sequence`
	* `RGI_Emoji_Modifier_Sequence`
* The following single-codepoint [Emoji](https://unicode.org/Public/14.0.0/ucd/emoji/emoji-data.txt):
 	* Default text-presentation and [Regional Indicators](https://www.unicode.org/reports/tr51/#Flags)
	* Default [emoji-presentation](https://www.unicode.org/reports/tr51/#Presentation_Style) are paired with `FE0F`
* The following emoji are mapped by IDNA 2003 and must be **removed**:
	* `2122 (™) Trade Mark`
	* `2139 (ℹ️) Information`
	* `24C2 (Ⓜ️) Circled M`
	* `3297 (㊗️) Japanese "Congratulations" Button`
	* `3299 (㊙️) Japanese "Secret" Button`
	* `1F201 (🈁) Japanese "Here" Button`
	* `1F202 (🈂️) Japanese "Service Charge" Button`
	* `1F21A (🈚) Japanese "Free of Charge" Button`
	* `1F22F (🈯) Japanese "Reserved" Button`
	* `1F232 (🈲) Japanese "Prohibited" Button`
	* `1F233 (🈳) Japanese "Vacancy" Button`
	* `1F234 (🈴) Japanese "Passing Grade" Button`
	* `1F235 (🈵) Japanese "No Vacancy" Button`
	* `1F236 (🈶) Japanese "Not Free of Charge" Button`
	* `1F237 (🈷) Japanese "Monthly Amount" Button`
	* `1F238 (🈸) Japanese "Application" Button`
	* `1F239 (🈹) Japanese "Discount" Button`
	* `1F23A (🈺) Japanese "Open for Business" Button`
	* `1F250 (🉐) Japanese "Bargain" Button`
	* `1F251 (🉑) Japanese "Acceptable" Button`
* The following emoji are **removed** (and **disallowed** from `chars.json`)
	* `203C (‼️) Double Exclamation Mark`
	* `2049 (⁉️) Exclamation Question Mark`

## Backwards Compatibility

* 99.5% of names are still valid.
* Only valid emoji sequences are allowed.
* Only valid label separator is `2E (.) FULL STOP`.
* `ZWJ` can **only** appear in emoji sequences.
* `ZWNJ` is disallowed **everywhere**.

## Security Considerations

* Not all normalized names are visually unambiguous.
* Unicode presentation can varies between platforms.
	* Unsupported Emoji ZWJ Sequences are visually indistinguishable from their unjoined forms.
	* Adjacent [Regional Indicators](https://www.unicode.org/reports/tr51/#Flag_Presentation) may combine into a [Flag Sequence](https://www.unicode.org/reports/tr51/#Flags).
* This ENSIP does not address [confusable](https://www.unicode.org/reports/tr39/) characters.
	* Single-script confusables:
		* eg. `a [61]` and `ɑ [251]`
	* Whole-script confusables:
		* eg. `ape [61 70 65]` and `аре [430 440 435]`
	* Emoji confusables: 
		* eg. `🚴🏻 [1F6B4 1F3FB]` and `🚴🏼 [1F6B4 1F3FC]` 

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

## Appendix: Emoji Sequence Whitelist

```Javascript
[
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

## Annex: Additional Implementation Notes

### Name Beautification

Follow the normalization algorithm, except when an emoji sequence is matched, output the full emoji sequence—don't strip `FE0F`.
* eg. `normalize("1️⃣") = "1⃣"` &rarr; `beautify("1⃣") = "1️⃣"`

### Normalized Fragments

To test if a `fragment` is contained in a `name`:
1. [Normalize](#algorithm) the `name` and convert to NFD.
1. Only [process](#processing) the `fragment` and convert to NFD.
1. Check for containment.