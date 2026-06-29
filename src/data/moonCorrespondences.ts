export interface MoonPhaseCorrespondence {
  phaseName: string;
  description: string;
  energy: string;
  magicalWorkings: string[];
  colours: string[];
  crystals: string[];
  herbs: string[];
  esbat: boolean;
  esbatNote?: string;
}

export const MOON_CORRESPONDENCES: Record<string, MoonPhaseCorrespondence> = {
  'New Moon': {
    phaseName: 'New Moon',
    description:
      'The New Moon opens the cycle. The moon sits between us and the sun and shows no lit face, so the sky is dark (strictly, the fully invisible Dark Moon is the day or so just before the first crescent returns). It\'s a low, quiet point, better for rest, reflection, and setting intentions than outward work. Hekate is traditionally honoured at the dark of the moon, at the crossroads and the turn of the cycle.',
    energy: 'New beginnings, intention-setting, seed planting',
    magicalWorkings: ['intention setting', 'new beginnings', 'manifestation', 'divination', 'binding'],
    colours: ['black', 'deep indigo', 'midnight blue', 'silver'],
    crystals: ['labradorite', 'moonstone', 'obsidian', 'black tourmaline'],
    herbs: ['mugwort', 'jasmine', 'myrrh', 'frankincense'],
    esbat: true,
    esbatNote:
      'The New Moon is a quieter observance, given to inner work and intention rather than celebration. Many covens keep this phase introspective and use it to set the tone for the cycle that follows.',
  },

  'Waxing Crescent': {
    phaseName: 'Waxing Crescent',
    description:
      'The first sliver of light returns and the cycle starts to gain momentum. This is a building phase, suited to the first concrete steps on whatever you set at the New Moon. Consistent action matters more here than intensity.',
    energy: 'Growth, hope, momentum, attraction',
    magicalWorkings: ['attraction magic', 'positive affirmations', 'new friendships', 'courage work'],
    colours: ['silver', 'pale yellow', 'soft white', 'light blue'],
    crystals: ['citrine', 'clear quartz', 'selenite', 'aventurine'],
    herbs: ['rosemary', 'chamomile', 'lavender', 'dandelion'],
    esbat: false,
  },

  'First Quarter': {
    phaseName: 'First Quarter',
    description:
      'The moon shows half its face, a midpoint that tends to surface decisions and obstacles. Whatever resistance comes up now is usually worth meeting directly rather than working around. A phase for commitment and deliberate action.',
    energy: 'Action, decision, commitment, overcoming challenges',
    magicalWorkings: ['courage spells', 'overcoming obstacles', 'strength work', 'protection magic'],
    colours: ['golden yellow', 'bright orange', 'warm white', 'fiery red'],
    crystals: ['carnelian', 'tiger\'s eye', 'amber', 'sunstone'],
    herbs: ['ginger', 'basil', 'bay laurel', 'thyme'],
    esbat: false,
  },

  'Waxing Gibbous': {
    phaseName: 'Waxing Gibbous',
    description:
      'The moon is almost full and the cycle\'s work is taking shape. A phase for refinement: notice what\'s working, adjust what isn\'t, and tend the details rather than starting anything new.',
    energy: 'Refinement, patience, trust, adjustment',
    magicalWorkings: ['refinement magic', 'patience work', 'healing', 'prosperity boosting'],
    colours: ['golden', 'warm cream', 'pale gold', 'soft amber'],
    crystals: ['green aventurine', 'malachite', 'pyrite', 'jade'],
    herbs: ['lemon balm', 'peppermint', 'calendula', 'rose'],
    esbat: false,
  },

  'Full Moon': {
    phaseName: 'Full Moon',
    description:
      'The moon is fully lit and the cycle reaches its peak. This is the brightest, highest-energy point, and traditionally the strongest time for workings of most kinds. Emotions and intuition tend to run high. Selene, the moon herself, is honoured at her fullest here.',
    energy: 'Power, culmination, fruition, illumination',
    magicalWorkings: [
      'charging tools and crystals',
      'divination',
      'healing',
      'love magic',
      'psychic work',
      'gratitude rituals',
    ],
    colours: ['white', 'silver', 'pearl', 'moonstone blue'],
    crystals: ['moonstone', 'selenite', 'clear quartz', 'labradorite', 'pearl'],
    herbs: ['jasmine', 'rose', 'mugwort', 'yarrow', 'sandalwood'],
    esbat: true,
    esbatNote:
      'The Full Moon is the main monthly gathering across many Wiccan and pagan traditions. Covens meet to mark the height of the cycle, charge tools and crystals in the moonlight, and carry out their more significant workings.',
  },

  'Waning Gibbous': {
    phaseName: 'Waning Gibbous',
    description:
      'The moon begins to wane and the cycle turns outward. A phase associated with gratitude and giving back: sharing what you\'ve gained, teaching, passing things on.',
    energy: 'Gratitude, sharing, generosity, teaching',
    magicalWorkings: ['gratitude work', 'releasing perfectionism', 'teaching rituals', 'healing others'],
    colours: ['dusty gold', 'warm amber', 'copper', 'warm rust'],
    crystals: ['citrine', 'amber', 'honey calcite', 'tiger\'s eye'],
    herbs: ['frankincense', 'cedar', 'sage', 'clove'],
    esbat: false,
  },

  'Last Quarter': {
    phaseName: 'Last Quarter',
    description:
      'The moon is half-dark again and the emphasis shifts to release. A phase for letting go of habits, patterns, or commitments that have run their course. Work around forgiveness and clearing sits well here.',
    energy: 'Release, forgiveness, letting go, breaking habits',
    magicalWorkings: ['banishing', 'cord-cutting', 'forgiveness work', 'breaking bad habits', 'uncrossing'],
    colours: ['black', 'deep grey', 'deep purple', 'dark midnight blue'],
    crystals: ['obsidian', 'black tourmaline', 'smoky quartz', 'jet'],
    herbs: ['agrimony', 'hyssop', 'sage', 'rue'],
    esbat: false,
  },

  'Waning Crescent': {
    phaseName: 'Waning Crescent',
    description:
      'The final sliver before the dark is the most inward part of the cycle. A phase for rest and winding down, letting the old cycle close before the next begins. Dreams often sharpen here, so keep something to hand to record them.',
    energy: 'Rest, surrender, dreams, dissolution',
    magicalWorkings: ['shadow work', 'dream work', 'deep meditation', 'psychic cleansing', 'banishing'],
    colours: ['deep indigo', 'dark charcoal', 'midnight blue', 'black'],
    crystals: ['amethyst', 'labradorite', 'black moonstone', 'smoky quartz'],
    herbs: ['mugwort', 'valerian', 'wormwood', 'myrrh'],
    esbat: false,
  },
};
