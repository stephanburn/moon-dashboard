// The conventions behind the dates shown, kept apart from the astronomy they
// sit on. Static text, so it is safe to render on the server.

const POINTS = [
  'All astronomy is computed on your device with astronomy-engine, and checked against published almanac values.',
  'New Moon and Full Moon name the moon for about a day and a half either side of the exact peak, and the quarters for about a day either side. The timeline gives the exact moment of each peak.',
  "Hekate's Deipnon is kept on the calendar day before the astronomical new moon, in your timezone.",
  'Imbolc, Beltane, Lughnasadh and Samhain are kept on fixed calendar dates, not on the astronomical midpoints between solstices and equinoxes.',
  'The equinox and solstice sabbats fall on the calendar day of the astronomical moment in your timezone, so the date can differ from one part of the world to another.',
  'Signs are tropical and geocentric: measured along the ecliptic from the March equinox, as seen from the centre of the Earth. They are not sidereal signs or the constellations.',
  "The Wheel of the Year follows your timezone's hemisphere unless you choose one in a sabbat's panel.",
  "The moon is drawn the way round it appears from your timezone's hemisphere. It is symbolic, not a picture of your exact sky.",
];

export default function HowDatesAreCalculated() {
  return (
    <details className="group text-xs text-text-tertiary">
      <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-fit mx-auto underline hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 focus-visible:rounded">
        How dates are calculated
      </summary>
      <ul className="mt-3 mb-1 max-w-md mx-auto space-y-2 text-left text-text-secondary leading-relaxed list-disc pl-5">
        {POINTS.map(point => <li key={point}>{point}</li>)}
      </ul>
    </details>
  );
}
