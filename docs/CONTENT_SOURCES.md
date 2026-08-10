# Quran Content Sources and Attribution Record

Verified on 10 August 2026. This record documents provenance; it is not a substitute for legal advice or territory-specific rights review.

## Embedded text and translations

The repository history shows the initial corpus was generated from AlQuran Cloud editions. The current translation payload was later populated from version 1 of `fawazahmed0/quran-api`.

Every local translation string was compared with its named upstream edition. Each edition matched **6,236 of 6,236 verses exactly**:

| Language | Upstream edition | Credited translator/source |
| --- | --- | --- |
| Turkish | `tur-diyanetisleri` | Diyanet İşleri |
| English | `eng-ummmuhammad` | Umm Muhammad / Saheeh International |
| German | `deu-asfbubenheimand` | A. S. F. Bubenheim and N. Elyas |
| French | `fra-muhammadhamidul` | Muhammad Hamidullah |
| Spanish | `spa-abdulqadermouhe` | Abdul Qader Mouheddine and Sirhan Ali Sanchez |

The distribution repository publishes an Unlicense file. Its edition metadata identifies the original translators and upstream sources. AlQuran Cloud's current terms state that republished translations should retain translator attribution. The app exposes these credits at `/sources` in all six supported interface languages.

## Arabic text

The embedded Uthmani text originated from the AlQuran Cloud `quran-uthmani` edition. AlQuran Cloud attributes Arabic text curation to sources including Tanzil.net and Quran Academy and asks reproductions to preserve diacritics and orthography. The app displays AI output separately from Quran text so generated material cannot be mistaken for scripture.

The optional Diyanet orthography is stored separately as `arabicDiyanet`; it is not used to overwrite the Uthmani field.

## Recitation audio

Audio is streamed rather than bundled from `cdn.islamic.network` at the published 64 kbps endpoints. The selectable reciters are Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly and Abdul Basit Abdus Samad.

AlQuran Cloud's current terms permit free personal and educational streaming and state that copyright remains with reciters or their estates. The app must re-check the current terms and obtain any additional permission before becoming a paid product or bundling audio offline.

## Release controls

- Preserve the `/sources` page and translator names in every release.
- Do not alter embedded Quran text mechanically without a verse-by-verse integrity check.
- Re-check upstream terms before monetization or changing audio delivery.
- Keep a dated copy or screenshot of applicable upstream terms with release records.
- Escalate any correction request involving Quran text or translation to human review; never let AI modify the corpus automatically.

References:

- https://alquran.cloud/terms-and-conditions
- https://github.com/fawazahmed0/quran-api
- https://github.com/fawazahmed0/quran-api/blob/1/LICENSE
- https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions.json
