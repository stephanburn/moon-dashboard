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
      'The New Moon marks the beginning of the lunar cycle, a time of darkness and potential. Seeds planted now carry the full force of the moon\'s growing light behind them. Rest, reflect, and set clear intentions for the cycle ahead.',
    energy: 'New beginnings, intention-setting, seed planting',
    magicalWorkings: ['intention setting', 'new beginnings', 'manifestation', 'divination', 'binding'],
    colours: ['black', 'deep indigo', 'midnight blue', 'silver'],
    crystals: ['labradorite', 'moonstone', 'obsidian', 'black tourmaline'],
    herbs: ['mugwort', 'jasmine', 'myrrh', 'frankincense'],
    esbat: true,
    esbatNote:
      'The New Moon esbat is a time of inner work, shadow integration, and planting seeds of intention. Many covens work quietly and introspectively at this phase, setting the tone for the entire cycle.',
  },

  'Waxing Crescent': {
    phaseName: 'Waxing Crescent',
    description:
      'As the thin silver crescent grows, so too does momentum. This phase carries the energy of hope and forward movement — a gentle push to begin and to believe. Nurture your intentions with consistent action and hold faith in the process.',
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
      'The half-illuminated moon represents a point of decision and necessary action. Challenges that arise now are part of growth — meet them with determination and will. This is a time to push forward, commit to your path, and act with clarity.',
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
      'The nearly-full moon calls you to refine and adjust your approach. Intentions set at the New Moon are taking shape — observe what is working and gently course-correct what is not. Trust the unfolding process and tend your work with patience.',
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
      'The Full Moon illuminates all things, bringing culmination, power, and clarity. Emotions run high and intuition is at its peak. This is the height of the lunar cycle — when magical workings carry their greatest potency and the Goddess shines at her fullest.',
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
      'The Full Moon is the primary esbat celebration, observed across Wiccan and pagan traditions. Covens gather to honour the Goddess in her Mother aspect, charge tools and crystals in moonlight, and work high magic in her silvered light.',
  },

  'Waning Gibbous': {
    phaseName: 'Waning Gibbous',
    description:
      'As the moon begins to retreat, this phase calls for gratitude and the generous sharing of what you have gained. The energy of giving back flows strongly now — share your gifts, teach what you know, and extend your abundance outward.',
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
      'The half-dark moon is an invitation to deep release. What no longer serves your highest good must now be let go — habits, relationships, thought patterns, or anything that holds you back. Forgiveness is a powerful working at this time.',
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
      'The last sliver of moon before darkness is the most introspective phase of the cycle. Rest, surrender, and allow the old cycle to fully dissolve before the new one begins. Dreams are vivid and prophetic now — record them faithfully.',
    energy: 'Rest, surrender, dreams, dissolution',
    magicalWorkings: ['shadow work', 'dream work', 'deep meditation', 'psychic cleansing', 'banishing'],
    colours: ['deep indigo', 'dark charcoal', 'midnight blue', 'black'],
    crystals: ['amethyst', 'labradorite', 'black moonstone', 'smoky quartz'],
    herbs: ['mugwort', 'valerian', 'wormwood', 'myrrh'],
    esbat: false,
  },
};
