# ENSIP-?: ENS Name Normalization Standard 

| **Author**  | Andrew Raffensperger \<raffy@me.com> |
| ----------- | ------------------------------------ |
| **Status**  | Draft                                |
| **Created** | 2022-07-04                           |
| **Updated** | 2022-09-18                           |

## Abstract

This ENSIP standardizes Ethereum Name Service (ENS) name normalization process outlined in [ENSIP-1 § Name Syntax](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#name-syntax).

## Motivation

* Since ENSIP-1 was finalized in 2016, Unicode has [evolved](https://unicode.org/history/publicationdates.html) from version 8.0.0 to 15.0.0 and incorporated many new characters, including complex emoji sequences. 
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
* Unicode version `15.0.0`
* [chars.json](https://github.com/adraffy/ens-normalize.js/tree/main/derive/output/chars.json) and [emoji.json](https://github.com/adraffy/ens-normalize.js/tree/main/derive/output/emoji.json) have all of the necessary data for [Processing](#Processing)
* [nf.json](https://github.com/adraffy/ens-normalize.js/tree/main/derive/output/nf.json) has all the necessary data for [Unicode Normalization Forms](https://unicode.org/reports/tr15/)


### Algorithm
* Input is processed left-to-right on codepoints.
* For user convenience, leading and trailing whitespace should be trimmed before normalization, as all whitespace codepoints are disallowed.
* It is not recommended to remove ignored characters before processing as emoji appearance can change significantly.

1. Repeat [Processing](#Processing) until the input is consumed or a disallowed codepoint is encountered.
1. Convert the output to NFC (Unicode Normalization Form C).
1. For each [label](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#name-syntax) in the output:
	1. `5F (_) LOW LINE` can only occur at the start of the label.
	1. The third and fourth characters cannot both be `2D (-) HYPHEN-MINUS` if the label contains only ASCII (`0x00-0x7F`).
	1. `2019 (’) RIGHT SINGLE QUOTATION MARK` cannot be: the first character, last character, or directly follow another.
	1. When the label is converted to NFD (Unicode Normalization Form D), combining marks cannot be: the first character, directly follow an emoji, or directly follow another combining mark.
1. The output is normalized and ready for [hashing](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#namehash-algorithm).

### Processing

1. Find the longest emoji sequence that matches the remaining input.
	* Valid emoji sequences can be found in [emoji.json](#derivation-of-emojijson)
	* `FE0F` is optional during matching.
1. If an emoji sequence is found:
	* Strip all `FE0F` from the matching emoji sequence and append it to the output.
	* Remove the matched sequence from the input.
1. Otherwise, determine the type of the leading codepoint. 
	* Types can be found in [chars.json](#derivation-of-charsjson)
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

* [Precomputed data file](https://github.com/adraffy/ens-normalize.js/tree/main/derive/output)
	* `"ignored"` → list of codepoints
	* `"valid"` → list of codepoints
	* `"mapped"` → list of codepoint to mapped codepoint(s)
	* `"cm"` → list of [Combining Mark](https://www.unicode.org/Public/15.0.0/ucd/extracted/DerivedGeneralCategory.txt) codepoints that are **valid**.
* [IDNA 2003](https://unicode.org/Public/idna/15.0.0/IdnaMappingTable.txt)
 	* `UseSTD3ASCIIRules = true`
	* `Transitional_Processing = false`
	* `CheckBidi = false`
	* `CheckJoiners = false` (see: [Algorithm](#algorithm), step 3)
	* The following deviations are valid:
		* `DF (ß) LATIN SMALL LETTER SHARP S`
		* `3C2 (ς) GREEK SMALL LETTER FINAL SIGMA`
* All non-ASCII [emoji and extended pictographic](https://www.unicode.org/reports/tr51/#Emoji_Characters) characters are **disallowed**.
* The following are **valid**:
	* `24 ($) DOLLAR SIGN`
	* `5F (_) LOW LINE`
* The following are **disallowed**:
	* `200C (‌) ZERO WIDTH NON-JOINER (ZWNJ)`
	* `200D (‍) ZERO WIDTH JOINER (ZWJ)`
	* `2800 (⠀) BRAILLE PATTERN BLANK`
	* `3002 (。) IDEOGRAPHIC FULL STOP`
	* `FF0E (．) FULLWIDTH FULL STOP`
	* `FF61 (｡) HALFWIDTH IDEOGRAPHIC FULL STOP`
* The following combining marks are **disallowed**:
	* `320 (x̠) COMBINING MINUS SIGN BELOW`
	* `332 (x̲) COMBINING LOW LINE`
	* `333 (x̳) COMBINING DOUBLE LOW LINE`
	* `347 (x͇) COMBINING EQUALS SIGN BELOW`
	* `FE2B (x︫) COMBINING MACRON LEFT HALF BELOW`
	* `FE2C (x︬) COMBINING MACRON RIGHT HALF BELOW`
	* `FE2D (x︭) COMBINING CONJOINING MACRON BELOW`
* The following punctuation are **disallowed**:
	* `2016 (‖) DOUBLE VERTICAL LINE`
	* `2018 (‘) LEFT SINGLE QUOTATION MARK`
	* `201A (‚) SINGLE LOW-9 QUOTATION MARK`
	* `201B (‛) SINGLE HIGH-REVERSED-9 QUOTATION MARK`
	* `201C (“) LEFT DOUBLE QUOTATION MARK`
	* `201D (”) RIGHT DOUBLE QUOTATION MARK`
	* `201E („) DOUBLE LOW-9 QUOTATION MARK`
	* `201F (‟) DOUBLE HIGH-REVERSED-9 QUOTATION MARK`
	* `2020 (†) DAGGER`
	* `2021 (‡) DOUBLE DAGGER`
	* `2023 (‣) TRIANGULAR BULLET`
	* `2030 (‰) PER MILLE SIGN`
	* `2031 (‱) PER TEN THOUSAND SIGN`
	* `2032 (′) PRIME`
	* `2033 (″) DOUBLE PRIME`
	* `2034 (‴) TRIPLE PRIME`
	* `2035 (‵) REVERSED PRIME`
	* `2036 (‶) REVERSED DOUBLE PRIME`
	* `2037 (‷) REVERSED TRIPLE PRIME`
	* `2038 (‸) CARET`
	* `2039 (‹) SINGLE LEFT-POINTING ANGLE QUOTATION MARK`
	* `203A (›) SINGLE RIGHT-POINTING ANGLE QUOTATION MARK`
	* `203D (‽) INTERROBANG`
	* `2040 (⁀) CHARACTER TIE`
	* `2041 (⁁) CARET INSERTION POINT`
	* `2045 (⁅) LEFT SQUARE BRACKET WITH QUILL`
	* `2046 (⁆) RIGHT SQUARE BRACKET WITH QUILL`
	* `204A (⁊) TIRONIAN SIGN ET`
	* `204B (⁋) REVERSED PILCROW SIGN`
	* `204C (⁌) BLACK LEFTWARDS BULLET`
	* `204D (⁍) BLACK RIGHTWARDS BULLET`
	* `204E (⁎) LOW ASTERISK`
	* `204F (⁏) REVERSED SEMICOLON`
	* `2050 (⁐) CLOSE UP`
	* `2051 (⁑) TWO ASTERISKS ALIGNED VERTICALLY`
	* `2052 (⁒) COMMERCIAL MINUS SIGN`
	* `2053 (⁓) SWUNG DASH`
	* `2055 (⁕) FLOWER PUNCTUATION MARK`
	* `2056 (⁖) THREE DOT PUNCTUATION`
	* `2057 (⁗) QUADRUPLE PRIME`
	* `2058 (⁘) FOUR DOT PUNCTUATION`
	* `2059 (⁙) FIVE DOT PUNCTUATION`
	* `205A (⁚) TWO DOT PUNCTUATION`
	* `205B (⁛) FOUR DOT MARK`
	* `205D (⁝) TRICOLON`
	* `205E (⁞) VERTICAL FOUR DOTS`
	* `23DC (⏜) TOP PARENTHESIS`
	* `23DD (⏝) BOTTOM PARENTHESIS`
	* `23DE (⏞) TOP CURLY BRACKET`
	* `23DF (⏟) BOTTOM CURLY BRACKET`
	* `23E0 (⏠) TOP TORTOISE SHELL BRACKET`
	* `23E1 (⏡) BOTTOM TORTOISE SHELL BRACKET`
* The following are **mapped** to `2D (-) HYPHEN-MINUS`:
	* `2010 (‐) HYPHEN`
	* `2011 (‑) NON-BREAKING HYPHEN`
	* `2012 (‒) FIGURE DASH`
	* `2013 (–) EN DASH`
	* `2014 (—) EM DASH`
	* `2015 (―) HORIZONTAL BAR`
	* `2027 (‧) HYPHENATION POINT`
	* `2043 (⁃) HYPHEN BULLET`
	* `207B (⁻) SUPERSCRIPT MINUS`
	* `208B (₋) SUBSCRIPT MINUS`
	* `2212 (−) MINUS SIGN`
	* `23AF (⎯) HORIZONTAL LINE EXTENSION`
	* `23BA (⎺) HORIZONTAL SCAN LINE-1`
	* `23BB (⎻) HORIZONTAL SCAN LINE-3`
	* `23BC (⎼) HORIZONTAL SCAN LINE-7`
	* `23BD (⎽) HORIZONTAL SCAN LINE-9`
	* `23E4 (⏤) STRAIGHTNESS`
	* `FE31 (︱) PRESENTATION FORM FOR VERTICAL EM DASH`
	* `FE32 (︲) PRESENTATION FORM FOR VERTICAL EN DASH`
	* `FE58 (﹘) SMALL EM DASH`
* Some [Extended Arabic Numerals](https://en.wikipedia.org/wiki/Arabic_numerals) are **mapped**:
	* `6F0 (۰)` &rarr; `660 (٠) ARABIC-INDIC DIGIT ZERO`
	* `6F1 (۱)` &rarr; `661 (١) ARABIC-INDIC DIGIT ONE`
	* `6F2 (۲)` &rarr; `662 (٢) ARABIC-INDIC DIGIT TWO`
	* `6F3 (۳)` &rarr; `663 (٣) ARABIC-INDIC DIGIT THREE`
	* `6F7 (۷)` &rarr; `667 (٧) ARABIC-INDIC DIGIT SEVEN`
	* `6F8 (۸)` &rarr; `668 (٨) ARABIC-INDIC DIGIT EIGHT`
	* `6F9 (۹)` &rarr; `669 (٩) ARABIC-INDIC DIGIT NINE`
* `27 (') APOSTROPHE` is **mapped** to `2019 (’) RIGHT SINGLE QUOTATION MARK`
* All characters (valid or mapped) that decompose (NFD) into adjacent codepoints are **disallowed**.

### Derivation of `emoji.json`

* [Precomputed data file](https://github.com/adraffy/ens-normalize.js/tree/main/derive/output)
	* list of codepoint sequences
* All emoji are [fully-qualified](https://www.unicode.org/reports/tr51/#def_fully_qualified_emoji) unless specified.
* [Emoji Sequence Whitelist](#appendix-emoji-sequence-whitelist)
* [Emoji Sequence Blacklist](#appendix-emoji-sequence-blacklist) are **removed**.
* The following [ZWJ Sequences](https://unicode.org/Public/emoji/15.0/emoji-zwj-sequences.txt):
	* `RGI_Emoji_ZWJ_Sequence`
* The following [Emoji Sequences](https://unicode.org/Public/emoji/15.0/emoji-sequences.txt):
	* `Emoji_Keycap_Sequence`
	* `RGI_Emoji_Tag_Sequence`
	* `RGI_Emoji_Modifier_Sequence`
* The following [emoji and extended pictographic](https://unicode.org/Public/15.0.0/ucd/emoji/emoji-data.txt) characters:
	* `Emoji_Presentation` are paired with `FE0F`
		* Except [Regional Indicators](https://www.unicode.org/reports/tr51/#Flags)
 	* All remaining non-ASCII `Emoji`
* The following emoji are mapped by IDNA 2003 and must be **removed**:
	* `2122 (™) TRADE MARK SIGN`
	* `2139 (ℹ) INFORMATION SOURCE`
	* `24C2 (Ⓜ) CIRCLED LATIN CAPITAL LETTER M`
	* `3297 (㊗) CIRCLED IDEOGRAPH CONGRATULATION`
	* `3299 (㊙) CIRCLED IDEOGRAPH SECRET`
	* `1F201 (🈁) SQUARED KATAKANA KOKO`
	* `1F202 (🈂) SQUARED KATAKANA SA`
	* `1F21A (🈚) SQUARED CJK UNIFIED IDEOGRAPH-7121` 
	* `1F22F (🈯) SQUARED CJK UNIFIED IDEOGRAPH-6307`
	* `1F232 (🈲) SQUARED CJK UNIFIED IDEOGRAPH-7981`
	* `1F233 (🈳) SQUARED CJK UNIFIED IDEOGRAPH-7A7A`
	* `1F234 (🈴) SQUARED CJK UNIFIED IDEOGRAPH-5408`
	* `1F235 (🈵) SQUARED CJK UNIFIED IDEOGRAPH-6E80`
	* `1F236 (🈶) SQUARED CJK UNIFIED IDEOGRAPH-6709`
	* `1F237 (🈷) SQUARED CJK UNIFIED IDEOGRAPH-6708`
	* `1F238 (🈸) SQUARED CJK UNIFIED IDEOGRAPH-7533`
	* `1F239 (🈹) SQUARED CJK UNIFIED IDEOGRAPH-5272`
	* `1F23A (🈺) SQUARED CJK UNIFIED IDEOGRAPH-55B6`
	* `1F250 (🉐) CIRCLED IDEOGRAPH ADVANTAGE`
	* `1F251 (🉑) CIRCLED IDEOGRAPH ACCEPT`

## Backwards Compatibility

* 99.5% of names are still valid.
* Only valid emoji sequences are allowed.
* Only valid label separator is `2E (.) FULL STOP`.
* `ZWJ` can **only** appear in emoji sequences.
* `ZWNJ` is disallowed **everywhere**.

## Security Considerations

* Not all normalized names are visually unambiguous.
* Unicode presentation can vary between platforms.
	* Unsupported Emoji ZWJ Sequences are visually indistinguishable from their unjoined forms.
	* Adjacent [Regional Indicators](https://www.unicode.org/reports/tr51/#Flag_Presentation) may combine into a [Flag Sequence](https://www.unicode.org/reports/tr51/#Flags).
* This ENSIP does not address [confusable](https://www.unicode.org/reports/tr39/) characters.
	* Single-script confusables: 
		* `a [61]` and `ɑ [251]`
	* Whole-script confusables: 
		* `ape [61 70 65]` and `аре [430 440 435]`
	* Emoji confusables: 
		* `🚴 [1F6B4]` and `🚴🏻 [1F6B4 1F3FB]`
		* `🇺🇸 [1F1FA 1F1F8]` and `🇺🇲 [1F1FA 1F1F2]` 

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

A list of [validation tests](https://github.com/adraffy/ens-normalize.js/tree/main/validate/tests.json) are provided with the following interpetation:

* Already Normalized: `{name: "a"}` &rarr; `normalize("a") = "a"`
* Need Normalization: `{name: "A", norm: "a"}` &rarr; `normalize("A") = "a"`
* Expect Error: `{name: "@", error: true}` &rarr; `normalize("@") throws`

## Appendix: Emoji Sequence Whitelist

```Javascript
[
	// MEN WRESTLING
	'1F93C 1F3FB 200D 2642 FE0F', // 🤼🏻‍♂
	'1F93C 1F3FC 200D 2642 FE0F', // 🤼🏼‍♂
	'1F93C 1F3FD 200D 2642 FE0F', // 🤼🏽‍♂
	'1F93C 1F3FE 200D 2642 FE0F', // 🤼🏾‍♂
	'1F93C 1F3FF 200D 2642 FE0F', // 🤼🏿‍♂
	// WOMEN WRESTLING
	'1F93C 1F3FB 200D 2640 FE0F', // 🤼🏻‍♀
	'1F93C 1F3FC 200D 2640 FE0F', // 🤼🏼‍♀
	'1F93C 1F3FD 200D 2640 FE0F', // 🤼🏽‍♀
	'1F93C 1F3FE 200D 2640 FE0F', // 🤼🏾‍♀
	'1F93C 1F3FF 200D 2640 FE0F', // 🤼🏿‍♀
	// FAMILY  
	'1F46A 1F3FB', // 👪🏻
	'1F46A 1F3FC', // 👪🏼
	'1F46A 1F3FD', // 👪🏽
	'1F46A 1F3FE', // 👪🏾
	'1F46A 1F3FF', // 👪🏿
	// WOMAN WITH BUNNY EARS 
	'1F46F 1F3FB', // 👯🏻
	'1F46F 1F3FC', // 👯🏼
	'1F46F 1F3FD', // 👯🏽
	'1F46F 1F3FE', // 👯🏾
	'1F46F 1F3FF', // 👯🏿
	// WRESTLERS
	'1F93C 1F3FB', // 🤼🏻
	'1F93C 1F3FC', // 🤼🏼
	'1F93C 1F3FD', // 🤼🏽
	'1F93C 1F3FE', // 🤼🏾
	'1F93C 1F3FF', // 🤼🏿
]
```

## Appendix: Emoji Sequence Blacklist

```Javascript
[
	'203C', // (‼️) double exclamation mark
	'2049', // (⁉️) exclamation question mark
]
```

## Annex: Additional Implementation Notes

### Name Beautification

Follow the normalization algorithm, except when an emoji sequence is matched, output the full emoji sequence—don't strip `FE0F`.

* `normalize("1️⃣") = "1⃣"` &rarr; `beautify("1⃣") = "1️⃣"`

### Normalized Fragments

To test if a `fragment` is contained in a `name`:
1. [Normalize](#algorithm) the `name` and convert to NFD.
1. Only [process](#processing) the `fragment` and convert to NFD.
1. Check for containment.
