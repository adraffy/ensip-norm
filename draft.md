# ENSIP-?: ENS Name Normalization Standard 

| **Author**  | Andrew Raffensperger \<raffy@me.com> |
| ----------- | ------------------------------------ |
| **Status**  | Draft                                |
| **Created** | 2022-07-04                           |
| **Updated** | 2023-02-26                           |

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
	1. Using names which normalize differently between algorithms. 
	1. Using names which render differently between platforms.
	1. Substitution of confusable (look-alike) characters.
	1. Mixing incompatible scripts.

## Specification

### Versioning
* Unicode version `15.0.0`
* [spec.json](https://github.com/adraffy/ens-normalize.js/tree/20230221-stable/derive/output/spec.json) contains all necessary data for normalization.
* [nf.json](https://github.com/adraffy/ens-normalize.js/tree/20230221-stable/derive/output/nf.json) contains all necessary data for [Unicode Normalization Forms](https://unicode.org/reports/tr15/) NFC and NFD.

### Algorithm

* Normalization is the process of canonicalizing a name before for hashing.
* It is idempotent: applying normalization multiple times produces the same result.
* For user convenience, leading and trailing whitespace should be trimmed before normalization, as all whitespace codepoints are disallowed.  However, internal characters should remain unmodified.
* No string transformations (like casefolding) should be applied.

1. Split the name into [labels](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#name-syntax).
1. [Normalize](#normalize) each label.
1. Join the labels together into a name again. 
1. The result is normalized and ready for [hashing](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens#namehash-algorithm).

### Normalize

1. [Tokenize](#tokenize) — transform the label into **Text** and **Emoji** tokens.
	* If there are no tokens, the label cannot be normalized.
1. Apply NFC to each **Text** token.
1. Strip `FE0F` from each **Emoji** token.
1. [Validate](#validate) — check if the tokens are valid and obtain the **label type**.
	* The **label type** and **Restricted** state may be presented to user for additonal security.
1. Concatenate the tokens together.
	* Return the normalized label.

### Tokenize

Given a string, convert to codepoints, and produce a list of **Text** and **Emoji** tokens, each with payload of codepoints.

1. Allocate an empty codepoint buffer.
1. Find the longest emoji sequence that matches the remaining input.
	* `FE0F` is optional from the input during matching.
	* Example: `Emoji[A FE0F B]` matches `[A B]` and `[A FE0F B]` but not `[A FE0F FE0F B]`
1. If an emoji sequence is found:
	* If the buffer is nonempty, emit a **Text** token, and clear the buffer.
	* Emit an **Emoji** token with the fully-qualified matching sequence.
	* Remove the matched sequence from the input.
1. Otherwise:
	1. Remove the leading codepoint from the input.
	1. Determine the codepoint type:
		* If **valid**, append the codepoint to the buffer.
			* This set can be precomputed from the union of characters in all groups and their NFD decompositions.
		* If **mapped**, append the corresponding mapped codepoint(s) to the buffer.
		* If **ignored**, do nothing.
		* Otherwise, the label cannot be normalized.
1. Repeat until all the input is consumed.
1. If the buffer is nonempty, emit a final **Text** token.

### Validate

Given a list of **Emoji** and **Text** tokens, determine if the composition is valid and return the label type.

1. If only **Emoji** tokens:
	* Return `"Emoji"`
1. If a single **Text** token and every characters is ASCII (`00..7F`):
	* `5F (_) LOW LINE` can only occur at the start.
		* Must match `/^_*[^_]*$/`
	* The 3rd and 4th characters must not both be `2D (-) HYPHEN-MINUS`.
		* Must not match `/^..--/`
	* Return `"ASCII"`
		* The label is free of **Fenced** and **Combining Mark** characters, and not confusable.
1. Concatenate all the tokens together.
	* `5F (_) LOW LINE` can only occur at the start.
		* Must match `/^_*[^_]$/u`
	* The first and last characters cannot be **Fenced**.
	* **Fenced** characters cannot be contiguous.
1. The first characters of every **Text** token must not be a **Combining Mark**.
1. Concatenate the **Text** tokens together.
1. Find the first **Group** that contain every text character:
	* If no group is found, the label cannot be normalized.
1. If the group is not **CM Whitelisted**:
	* Apply NFD to the concatenated text characters.
	* For every contiguous sequence of **NSM** characters:
		* Each character must be unique.
		* Number of characters cannot exceed **Maximum NSM** (`4`).
1. [Wholes](#wholes) — check if text characters form a confusable.
1. The label is valid.
	* Return the name of the group.

### Wholes

A label is whole-script confusable if a similarly-looking valid label can be constructed using one alternative character from a different group.

1. Allocate an empty character buffer.
1. Start with the set of all groups.
1. For each unique character:
	* If the character is **Confused** (a member of a **Whole Confusable**):
		* Retain groups with **Whole Confusable** characters excluding the **Confusable Extent** of the matching **Confused**.
			* The **Confusable Extent** is the fully-connected graph formed from groups of the same confusable and different confusables of the same group.
			* This mapping from **Confused** to **Confusable Extent** can be precomputed.
			* Example: `"o"` **Whole Confusable** 
				1. `6F (o) LATIN SMALL LETTER O` → *Latin*, *Han*, *Japanese*, and *Korean*
				1. `3007 (〇) IDEOGRAPHIC NUMBER ZERO` → *Han*, *Japanese*, *Korean*, and *Bopomofo*
				1. **Confusable Extent** is [`6F`, `3007`] ⊗ [*Latin*, *Han*, *Japanese*, *Korean*, *Bopomofo*]
		* If no groups remain, the label is not confusable.
		* Example: `"тӕ" [442 4D5]`
			1. `"т"` → `442 (т) CYRILLIC SMALL LETTER TE` and `3C4 (τ) GREEK SMALL LETTER TAU`
				* **ALL** ∩ [*Latin*, *Greek*] → [*Latin*, *Greek*]
			1. `"ӕ"` → `E6 (æ) LATIN SMALL LETTER AE` and `4D5 (ӕ) CYRILLIC SMALL LIGATURE A IE`
				* [*Latin*, *Greek*] ∩ [*Latin*, *Cyrillic*] → [*Latin*]
	* If the character is **Unique**, the label is not confusable.
		* This set can be precomputed from characters that appear in exactly one group and are not **Confused**.
	* Otherwise:
		* Append the character to the buffer.
1. If any **Confused** character was found:
	* Assert none of the remaining groups contain any buffered characters.
1. The label is not confusable.

## Description of `spec.json`

* <a name="group">**Groups**</a> (`"groups"`) — groups of characters that can constitute a label
	* `"name"` — ASCII name of the group (or abbreviation if **Restricted**).
		* Example: *Latin*, *Japanese*, *Egyp*
	* **Restricted** (`"restricted"`) — **`true`** if [Excluded](https://www.unicode.org/reports/tr31#Table_Candidate_Characters_for_Exclusion_from_Identifiers) or [Limited-Use](https://www.unicode.org/reports/tr31/#Table_Limited_Use_Scripts) script
		* Example: *Latin* → **`false`**, *Egyp* → **`true`** 
	* `"primary"` — subset of characters that define the group
		* Example: `"a"` → *Latin*, `"あ"` → *Japanese*, `"𓀀"` → *Egyp*
	* `"secondary"` — subset of characters included with the group
		* Example: `"0"` → *Common* but mixable with *Latin*
	* **CM Whitelisted** (`"cm"`) — (optional) set of allowed compound sequences in NFC
		* Example: `[[BaseCP, CM, ...], ...]`
		* There are currently no compound sequences: **`true`** if `[]` otherwise **`false`**.
* <a name="ignored">**Ignored**</a> (`"ignored"`) — characters that are ignored during normalization
	* Example: `34F () COMBINING GRAPHEME JOINER`
* <a name="mapped">**Mapped**</a> (`"mapped"`) — characters that are mapped to a sequence of **valid** characters
	* Example: `41 (A) LATIN CAPITAL LETTER A` → `[61 (a) LATIN SMALL LETTER A]`
	* Example: `2165 (Ⅵ) ROMAN NUMERAL SIX` → `[76 (v) LATIN SMALL LETTER V, 69 (i) LATIN SMALL LETTER I]`
* <a name="wholes">**Whole Confusable**</a> (`"wholes"`) — groups of characters that look similar
	* `"valid"` — set of confusable characters that are allowed
		* Example: `34 (4) DIGIT FOUR`
	* **Confused** (`"confused"`) — set of confusable characters that not allowed
		* Example: `13CE (Ꮞ) CHEROKEE LETTER SE`
* <a name="fenced">**Fenced**</a> (`"fenced"`) — set of characters that cannot be first, last, or contiguous
	* Example: `2044 (⁄) FRACTION SLASH`
* <a name="emoji">**Emoji**</a> (`"emoji"`) — allowed emoji sequences
	* Example: `[1F468 200D 1F4BB] (👨‍💻) man technologist`
* <a name="nsm">**Non-spacing Marks / NSM**</a> (`"nsm"`) — valid subset of **Combining Marks** with general category (`"Mn"` or `"Me"`)
* <a name="nsm_max">**Maximum NSM**</a> (`"nsm_max"`) — maximum sequence length of unique **NSM**
* <a name="cm">**Combining Marks / CM**</a> (`"cm"`) — characters that are [Combining Marks](https://www.unicode.org/Public/15.0.0/ucd/extracted/DerivedGeneralCategory)
* <a name="escape">**Should Escape**</a> (`"escape"`) — characters that [shouldn't be printed](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/chars-escape.js)
* <a name="">**NFC Check**</a> (`"nfc_check"`) — valid characters that [may require NFC](https://unicode.org/reports/tr15/#NFC_QC_Optimization)

## Derivation

* [IDNA 2003](https://unicode.org/Public/idna/15.0.0/IdnaMappingTable.txt)
 	* `UseSTD3ASCIIRules` is **`true`**
	* `VerifyDnsLength` is **`false`**
	* `Transitional_Processing` is **`false`**
	* The following deviations are **valid**:
		* `DF (ß) LATIN SMALL LETTER SHARP S`
		* `3C2 (ς) GREEK SMALL LETTER FINAL SIGMA`
	* `CheckHyphens` is **`false`** ([WhatWG URL Spec § 3.3](https://url.spec.whatwg.org/#idna))
	* `CheckBidi` is **`false`**
	* ContextJ: `CheckJoiners` is **`false`**
	* ContextO: 
		* `ZWNJ` is disallowed **everywhere**.
		* `ZWJ` can **only** appear in emoji sequences.
		* `B7 (·) MIDDLE DOT` is **disallowed**.
		* `375 (͵) GREEK LOWER NUMERAL SIGN` is **disallowed**.
		* `0x5F3 (׳) HEBREW PUNCTUATION GERESH` and `5F4 (״) HEBREW PUNCTUATION GERSHAYIM` are *Greek*.
		* `30FB (・) KATAKANA MIDDLE DOT` is **Fenced** and *Han*, *Japanese*, *Korean*, and *Bopomofo*. 
		* Some [Extended Arabic Numerals](https://en.wikipedia.org/wiki/Arabic_numerals) are **mapped**:
			* `6F0 (۰)` → `660 (٠) ARABIC-INDIC DIGIT ZERO`
			* `6F1 (۱)` → `661 (١) ARABIC-INDIC DIGIT ONE`
			* `6F2 (۲)` → `662 (٢) ARABIC-INDIC DIGIT TWO`
			* `6F3 (۳)` → `663 (٣) ARABIC-INDIC DIGIT THREE`
			* `6F7 (۷)` → `667 (٧) ARABIC-INDIC DIGIT SEVEN`
			* `6F8 (۸)` → `668 (٨) ARABIC-INDIC DIGIT EIGHT`
			* `6F9 (۹)` → `669 (٩) ARABIC-INDIC DIGIT NINE`
* [Punycode](https://datatracker.ietf.org/doc/html/rfc3492) is not decoded.
* The following ASCII characters are **valid**:
	* `24 ($) DOLLAR SIGN`
	* `5F (_) LOW LINE`
* Only label separator is `2E (.) FULL STOP`
	* No character maps to a sequence with this character.
	* This simplifies unnormalized name detection in unstructured text.
	* The following alternatives are **disallowed**:
		* `3002 (。) IDEOGRAPHIC FULL STOP`
		* `FF0E (．) FULLWIDTH FULL STOP`
		* `FF61 (｡) HALFWIDTH IDEOGRAPHIC FULL STOP`
* Many characters are **disallowed** for [various reasons](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/chars-disallow.js):
	* Nearly all punctuation are **disallowed**.
	* Nearly all vocalization annotations are **disallowed**.
	* All parentheses and brackets are **disallowed**.
	* Obsolete, deprecated, and archaic characters are **disallowed**.
	* Combining, modifying, reversed, flipped, turned, and partial variations are **disallowed**. 
	* When multiple weights of the same character exist, the variant closest to **heavy** is selected and the rest **disallowed**.
		* This occasionally selects single-character emoji.
	* Many visually confusable characters are **disallowed**.
	* Many estoteric characters are **disallowed**.
* Many hyphen-like characters are **mapped** to `2D (-) HYPHEN-MINUS`:
	* `2010 (‐) HYPHEN`
	* `2011 (‑) NON-BREAKING HYPHEN`
	* `2012 (‒) FIGURE DASH`
	* `2013 (–) EN DASH`
	* `2014 (—) EM DASH`
	* `2015 (―) HORIZONTAL BAR`
	* `2043 (⁃) HYPHEN BULLET`
	* `2212 (−) MINUS SIGN`
	* `23AF (⎯) HORIZONTAL LINE EXTENSION`
	* `23E4 (⏤) STRAIGHTNESS`
	* `FE58 (﹘) SMALL EM DASH`
	* `2E3A (⸺) TWO-EM DASH` → `"--"`
	* `2E3B (⸻) THREE-EM DASH` → `"---"`
* Characters are assigned to **Groups** according to [Unicode Script_Extensions](https://www.unicode.org/reports/tr24/#Script_Extensions_Def).
* **Groups** may contain [multiple scripts](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/scripts.js):
	* Only *Latin*, *Greek*, *Cyrillic*, *Han*, *Japanese*, and *Korean* have access to *Common* characters.
	* *Latin*, *Greek*, *Cyrillic*, *Han*, *Japanese*, *Korean*, and *Bopomofo* only permit specific **Combining Mark** sequences.
	* *Han*, *Japanese*, and *Korean*  have access to `a-z`.
	* **Restricted** groups are always single-script.
* **Groups** with multiple scripts are inspired from [Unicode augmented script sets](https://www.unicode.org/reports/tr39/#Mixed_Script_Detection).
* *Braille*, *Linear A*, *Linear B*, and *Signwriting* scripts are **disallowed**.
* `27 (') APOSTROPHE` is **mapped** to `2019 (’) RIGHT SINGLE QUOTATION MARK` for convenience.
* Ethereum symbol (`39E (Ξ) GREEK CAPITAL LETTER XI`) is casefolded and usable by all groups with access to *Common*.
* Emoji sequences:
	* All sequences are [fully-qualified](https://www.unicode.org/reports/tr51/#def_fully_qualified_emoji).
	* Digits (`0-9`) are [not emoji](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L28).
	* Emoji [mapped to non-emoji by IDNA](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L4) cannot be used as emoji.
	* Emoji [disallowed by IDNA](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L46) and have default text-presentation are **disabled**:
		* `203C (‼️) double exclamation mark`
		* `2049 (⁉️) exclamation question mark `
	* Remaining `Emoji` characters are marked as **disallowed** (for text processing).
	* All `RGI_Emoji_ZWJ_Sequence` are **enabled**.
	* All `Emoji_Keycap_Sequence` are **enabled**.
	* All `RGI_Emoji_Tag_Sequence` are **enabled**.
	* All `RGI_Emoji_Modifier_Sequence` are **enabled**.
	* All `RGI_Emoji_Flag_Sequence` are **enabled**.
	* `Basic_Emoji` of the form `[X FE0F]` are **enabled**.
	* `Emoji` with default emoji-presentation are **enabled** as `[X FE0F]`.
	* Remaining single-character `Emoji` are **enabled** as `[X FE0F]` (explicit emoji-styling).
	* All singular [Skin-color Modifiers](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L64) are **disabled**.
	* All singular [Regional Indicators](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L74) are **disabled**.
	* [Blacklisted emoji](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L110) are **disabled**.
	* [Whitelisted emoji](https://github.com/adraffy/ens-normalize.js/blob/20230221-stable/derive/rules/emoji.js#L116) are **enabled**.

## Backwards Compatibility

* 99% of names are still valid.
* Preserves as much IDNA and WhatWG URL compatibility as possible.
* Only valid emoji sequences are allowed.

## Security Considerations

* Unicode presentation may vary between applications and devices.
	* Unicode is text and ultimately subject to font-styling.
	* Unsupported characters (`�`) may appear unremarkable.
	* Unsupported emoji sequences with ZWJ may present indistinguishable from those without ZWJ.
* Names composed of labels of different bidi properties may appear differently depending on context.
	* Normalization does not enforce single-directional names.
	* Names may be composed of labels of different bidi however valid labels are never bidi.
* Not all normalized names are visually unambiguous.
* This ENSIP only addresses **single-character** [confusables](https://www.unicode.org/reports/tr39/):
	* There exist confusable **multi-character** sequences:
		* `"ஶ்ரீ" [BB6 BCD BB0 BC0]`
		* `"ஸ்ரீ" [BB8 BCD BB0 BC0]`
	* There exist confusable **emoji** sequences: 
		* `🚴 [1F6B4]` and `🚴🏻 [1F6B4 1F3FB]`
		* `🇺🇸 [1F1FA 1F1F8]` and `🇺🇲 [1F1FA 1F1F2]` 
		* `♥ [2665] BLACK HEART SUIT` and `❤ [2764] HEAVY BLACK HEART`
		
## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## Appendix: Reference Specifications

* [ENSIP-1: ENS](https://docs.ens.domains/ens-improvement-proposals/ensip-1-ens)
* [UAX-15: Normalization Forms](https://unicode.org/reports/tr15/)
* [UAX-24: Script Property](https://www.unicode.org/reports/tr24/)
* [UAX-31: Identifier and Pattern Syntax](https://www.unicode.org/reports/tr31/)
* [UTS-39: Security Mechanisms](https://www.unicode.org/reports/tr39/)
* [UTS-46: IDNA Compatibility Processing](https://unicode.org/reports/tr46/)
* [UTS-51: Emoji](https://www.unicode.org/reports/tr51)
* [RFC-3492: Punycode](https://datatracker.ietf.org/doc/html/rfc3492)
* [RFC-5891: IDNA: Protocol](https://datatracker.ietf.org/doc/html/rfc5891) 
* [RFC-5892: The Unicode Code Points and IDNA](https://datatracker.ietf.org/doc/html/rfc5892)
* [Unicode CLDR](https://github.com/unicode-org/cldr)
* [WHATWG URL: IDNA](https://url.spec.whatwg.org/#idna)

## Appendix: Validation Tests

A list of [validation tests](https://github.com/adraffy/ens-normalize.js/tree/20230221-stable/validate/tests.json) are provided with the following interpetation:

* Already Normalized: `{name: "a"}` → `normalize("a") = "a"`
* Need Normalization: `{name: "A", norm: "a"}` → `normalize("A") = "a"`
* Expect Error: `{name: "@", error: true}` → `normalize("@") throws`

## Annex: Beautification

Follow the [algorithm](#algorithm), except:

* Do not strip `FE0F` from **Emoji** tokens.
* Replace `3BE (ξ) GREEK SMALL LETTER XI` with `39E (Ξ) GREEK CAPITAL LETTER XI` if the label isn't *Greek*.
* Example: `normalize("‐Ξ1️⃣") [2010 39E 31 FE0F 20E3]` is `"-ξ1⃣" [2D 3BE 31 20E3]`
* Example: `beautify("-ξ1⃣") [2D 3BE 31 20E3]"` is `"-Ξ1️⃣" [2D 39E 31 FE0F 20E3]`
