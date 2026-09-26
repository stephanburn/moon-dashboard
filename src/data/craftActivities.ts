// Daily craft activities: small things to do to keep your hand in. Filled in
// and chosen by lib/craft.ts. Every filled text must stay within 130
// characters (craft.test.ts checks every placeholder value).
//
// Placeholders: {sabbat}, {phase}, {weekday}, {planet}, {element}, {moonwater}.
// `when` limits an activity to days it fits; `weight` makes it come up more
// often than the default of 1.

export type CraftCondition = 'moonwater' | 'sabbat-today' | 'no-sabbat-today';

export interface CraftActivity {
  id: string;
  text: string;
  when?: CraftCondition;
  weight?: number;
}

export const CRAFT_ACTIVITIES: CraftActivity[] = [
  { id: 'tarot', text: 'Draw a tarot/oracle card if you have them. Read up on it, study the art, spend some time with it.' },
  { id: 'rune', text: 'Pull a rune if you have them. Read up on it, study it, spend some time with it.' },
  { id: 'crystal', text: 'Choose a crystal if you have them. Read up on it, study it, spend some time with it.' },
  { id: 'herb', text: 'Choose a herb or plant, either from your stores, kitchen, or outside. Read up on it, study it, spend some time with it.' },
  { id: 'book-chapter', text: 'Read one chapter of a book about the craft.' },
  { id: 'deity', text: 'Choose a deity, spirit, or ancestor you are spiritually drawn to. Read up on them, study them, consider making an offering.' },
  { id: 'circle', text: 'Practice cleansing, grounding, casting a circle, and closing a circle. Nothing else.' },
  { id: 'cleanse-home', text: 'Cleanse the main space in your home.' },
  { id: 'altar', text: 'If you have an altar, refresh it. Cleanse it, examine each piece and its placement. Does anything need changing?' },
  { id: 'book-of-shadows', text: "If you did an activity yesterday, write about it in your Book of Shadows. If you don't have one, start!" },
  { id: 'journal', text: 'Pick a journalling prompt and write!' },
  { id: 'next-sabbat', when: 'no-sabbat-today', text: 'The next sabbat is {sabbat}. Research it, even a little, so you know more about it than you did before.' },
  { id: 'sabbat-today', when: 'sabbat-today', text: 'Today is {sabbat}. Research it, even a little, so you know more about it than you did before.' },
  { id: 'next-phase', text: 'The next moon phase is the {phase}. Research it, even a little, so you know more about it than you did before.' },
  { id: 'candle-whisper', text: 'Candle Whisper Spell: Light a small candle. Whisper a single word into the wax that reflects your need while lighting it.' },
  { id: 'walk', text: 'Take a short walk in your local area with no distractions. As you walk, simply observe. No devices.' },
  { id: 'charm', text: 'Using what you have (string, paper, herbs, a button, a crystal, etc.), craft a small portable charm for protection.' },
  { id: 'element', text: 'Throughout the day, look for ways the element of {element} shows up around you, physically, symbolically, emotionally.' },
  { id: 'micro-spell', text: 'Choose a single herb, plant, or crystal, design and perform a micro-spell using only that item and your intention.' },
  { id: 'colour', text: 'Choose a single colour. Read up on it, study the correspondences, learn something new.' },
  { id: 'moonwater', when: 'moonwater', weight: 3, text: '{moonwater}, make moonwater.' },
  { id: 'day-ruler', text: 'Today is {weekday}, ruled by {planet}. Read up on its correspondences and find one small way to work with it today.' },
  { id: 'sigil', text: "Make a sigil. Write a short intention, cross out any repeated letters, then combine what's left into a single symbol." },
  { id: 'stir-drink', text: 'Stir some intention into your drink. Stir clockwise to draw something in, or anticlockwise to let something go.' },
  { id: 'bibliomancy', text: 'Practise bibliomancy. Hold a question in mind, open any book at random, and read the first line your eye lands on.' },
  { id: 'charge-clothing', text: "Choose something you're wearing today and charge it with one quality you want to carry, such as courage or calm." },
  { id: 'wash', text: 'Wash your hands or face slowly and with intention. As the water drains away, imagine it taking what you no longer need.' },
  { id: 'ground', text: 'Ground for three minutes by putting your feet flat on the floor and box breathing.' },
  { id: 'song', text: 'Pick one song that matches how you want to feel today. Listen to it all the way through with your eyes closed, doing nothing else.' },
  { id: 'bedtime-symbol', text: 'Before bed, trace a protective symbol over your bed or doorway with your finger, and ask for a restful night.' },
  { id: 'land-offering', text: 'Leave a small, earth-friendly offering outside for the land spirits: fresh water, birdseed, or picking up a bit of litter.' },
];

export const CRAFT_ELEMENTS = ['Earth', 'Fire', 'Water', 'Air', 'Spirit'] as const;

// Traditional planetary rulers of the weekdays, Sunday first (getUTCDay order).
export const DAY_RULERS = [
  { weekday: 'Sunday', planet: 'the Sun' },
  { weekday: 'Monday', planet: 'the Moon' },
  { weekday: 'Tuesday', planet: 'Mars' },
  { weekday: 'Wednesday', planet: 'Mercury' },
  { weekday: 'Thursday', planet: 'Jupiter' },
  { weekday: 'Friday', planet: 'Venus' },
  { weekday: 'Saturday', planet: 'Saturn' },
] as const;
