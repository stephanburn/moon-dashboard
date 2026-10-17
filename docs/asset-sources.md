# Asset sources and licences

Third-party files shipped with the app, where they come from, and the terms
they are used under. Update this file whenever an asset is added or replaced.

## Moon photograph: `public/moon.jpg`

- **What:** the full-Moon image behind the hero disc (`src/components/MoonDisc.tsx`).
- **Source:** appears to be NASA's "Moon Mosaic", Scientific Visualization
  Studio item 5001, <https://svs.gsfc.nasa.gov/5001>: a mosaic of 1,231 Lunar
  Reconnaissance Orbiter Narrow Angle Camera frames from 2018, offered as a
  1024 × 1024 print JPG. Ours is the same size and looks identical, but the
  file differs (173 KB against NASA's 252 KB), so it was probably re-encoded
  when it was added in June 2026. Not confirmed byte for byte.
- **Credit requested by NASA:** NASA's Scientific Visualization Studio
  (visualizer: Ernie Wright, USRA).
- **Licence:** NASA imagery is generally not subject to US copyright and may
  be used without permission. NASA asks for the credit above, and that its
  logos aren't used to imply endorsement.

## Fonts

- **Cormorant Garamond** (Regular, SemiBold, Italic) in `assets/*.ttf`, used
  only by the Open Graph image (`src/app/opengraph-image.tsx`), since Satori
  can't read the variable font. The page itself loads the same family through
  `next/font/google` (`src/app/layout.tsx`), which self-hosts it at build
  time.
- **Copyright:** 2015 the Cormorant Project Authors
  (<https://github.com/CatharsisFonts/Cormorant>; designer Christian
  Thalmann).
- **Licence:** SIL Open Font License 1.1, which requires the licence to
  travel with the font files: `assets/OFL.txt`, copied unchanged from the
  Cormorant repository.

## The code

No licence. The repository is public on GitHub, so anyone can read the code,
but without a licence the default copyright applies: nobody may reuse,
modify or redistribute it without permission. (`"private": true` in
`package.json` only stops it being published to npm.) Add a `LICENSE` file
if others should be able to reuse it.
