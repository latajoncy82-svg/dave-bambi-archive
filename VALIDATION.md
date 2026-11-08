# Validation report

Checked on 8 November 2026 against the packaged database and its static browser interface.

| Check | Result |
| --- | ---: |
| Character records | 420 |
| Source-backed character records | 420 |
| Characters missing a description | 0 |
| Characters missing a portrait reference | 0 |
| Distinct portrait files | 420 |
| Broken portrait references in Chromium | 0 |
| Duplicate IDs | 0 |
| Duplicate case-insensitive display names | 0 |
| Mod assignments without cited roster or cast evidence | 0 |
| Standalone fan OCs | 145 |
| Browser console errors | 0 |

## Characters per mod

Counts overlap because profiles can document appearances in multiple mods. Filter counts include documented cast, historical appearances, and crossovers. Archived-only assignments appear in profiles. Popcorn's count refers to the documented cast of that project.

| Mod | Filter matches | Archived-only assignments |
| --- | ---: | ---: |
| Original Dave & Bambi | 16 | 3 |
| Golden Apple Edition | 12 | 9 |
| Strident Crisis | 34 | 42 |
| Hortas Edition | 31 | 5 |
| Nullified | 8 | 2 |
| Dimensional Deep-End | 11 | 0 |
| Popcorn Edition | 12 | 0 |
| Omelette Edition | 9 | 1 |
| Manny Edition | 18 | 46 |
| Exospheric Corruption | 13 | 3 |
| Universal Collision | 12 | 31 |
| Divinity Edition | 16 | 5 |
| Bambisona Mayhem | 11 | 17 |
| Bambi’s Hellscape | 5 | 3 |
| Quartz Edition | 5 | 0 |
| Other Fan Mods, distinct characters | 40 | — |

## Checks executed

- Parsed the shipped JSON and checked required fields, IDs, display names, image URL structure, mod evidence, reciprocal form links, score arithmetic, and parity with the offline JavaScript snapshot.
- Matched portraits to named character sections or credited cast sprites. Decoded all 420 selected files with Pillow, checked for exact duplicate cropped pixels, and reviewed contact sheets. Checked the portrait replacements separately.
- Opened the site in Chromium 151.0.7922.34. Tested 13 mod directory options on desktop and mobile, all seven type options, Golden Apple plus Alternate Forms, and name, alias, partial-name, mod, clear, and no-results search cases.
- Tested all six sorts, nine character profiles, a deep link, keyboard dismissal, and the source notes dialog.
- Rendered the grid at 1440 × 1024 and 390 × 844. Checked the mobile viewport for horizontal overflow and opened a profile by touch.
- Browsed all 420 result cards and waited for each portrait to load. Inspected the browser console.
- Opened `dist/index.html` from disk with external requests blocked. Checked the grid, search, a profile, and the image fallback.

## Evidence and coverage

Source-backed means a character page or a named roster or cast section supports the record. Community pages can change. The audit checked attribution and image availability at delivery time. It did not independently confirm every fanon claim with its creator.

Artwork remained on its source hosts because the selected files lacked confirmed redistribution permission for this package. The ZIP contains the full interface and offline data. Portraits need internet access.

- cdn.comic.studio · 12 portraits
- static.wikia.nocookie.net · 408 portraits
