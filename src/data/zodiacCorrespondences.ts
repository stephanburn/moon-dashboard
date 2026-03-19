export interface ZodiacCorrespondence {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  rulingPlanet: string;
  qualities: string[];
  transitEnergy: string;
  colours: string[];
  crystals: string[];
  herbs: string[];
}

export const ZODIAC_CORRESPONDENCES: Record<string, ZodiacCorrespondence> = {
  Aries: {
    name: 'Aries',
    symbol: '♈',
    element: 'Fire',
    modality: 'Cardinal',
    rulingPlanet: 'Mars',
    qualities: ['bold', 'pioneering', 'impulsive', 'courageous', 'competitive'],
    transitEnergy:
      'The Sun in Aries brings a surge of bold, pioneering energy — the world feels younger, more urgent, and full of possibility. Initiative is rewarded and there is little patience for delay or hesitation. The collective focus turns to action, new beginnings, and the assertion of individual will.',
    colours: ['scarlet', 'bright red', 'orange-gold', 'white'],
    crystals: ['carnelian', 'bloodstone', 'red jasper', 'diamond'],
    herbs: ['ginger', 'nettle', 'peppermint', 'garlic', 'dragon\'s blood'],
  },

  Taurus: {
    name: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    modality: 'Fixed',
    rulingPlanet: 'Venus',
    qualities: ['steadfast', 'sensual', 'patient', 'resourceful', 'determined'],
    transitEnergy:
      'The Sun in Taurus grounds the fiery push of Aries into something tangible and lasting. Beauty, pleasure, and the physical world take on heightened importance — enjoy good food, time in nature, and sensory richness. Steady effort and patience are the keys to progress now, and rushing will not serve you.',
    colours: ['forest green', 'earthy brown', 'rose pink', 'rich cream'],
    crystals: ['rose quartz', 'malachite', 'emerald', 'jade'],
    herbs: ['rose', 'thyme', 'patchouli', 'vervain', 'violet'],
  },

  Gemini: {
    name: 'Gemini',
    symbol: '♊',
    element: 'Air',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    qualities: ['curious', 'adaptable', 'witty', 'communicative', 'restless'],
    transitEnergy:
      'The Sun in Gemini quickens the mind and tongue — conversation, learning, and variety are the pleasures of this season. Ideas come quickly and attention may be scattered; it is a fine time for writing, socialising, and exploring new topics. The world feels more playful and mentally alive.',
    colours: ['bright yellow', 'pale silver', 'light blue', 'white'],
    crystals: ['agate', 'citrine', 'aquamarine', 'tiger\'s eye'],
    herbs: ['lavender', 'dill', 'fennel', 'lemongrass', 'clover'],
  },

  Cancer: {
    name: 'Cancer',
    symbol: '♋',
    element: 'Water',
    modality: 'Cardinal',
    rulingPlanet: 'Moon',
    qualities: ['nurturing', 'intuitive', 'protective', 'emotional', 'home-loving'],
    transitEnergy:
      'The Sun in Cancer draws us inward, to home, family, and emotional roots. Intuition deepens and the need for belonging and comfort becomes strong. It is a beautiful time for kitchen witchery, ancestral work, and tending to the home as sacred space — a season of nurturing and nourishing.',
    colours: ['silver', 'pearl white', 'sea green', 'pale blue'],
    crystals: ['moonstone', 'pearl', 'selenite', 'labradorite'],
    herbs: ['jasmine', 'chamomile', 'lemon balm', 'lily', 'water lily'],
  },

  Leo: {
    name: 'Leo',
    symbol: '♌',
    element: 'Fire',
    modality: 'Fixed',
    rulingPlanet: 'Sun',
    qualities: ['generous', 'confident', 'dramatic', 'creative', 'loyal'],
    transitEnergy:
      'The Sun in Leo blazes with vitality, creativity, and the desire to be seen and celebrated. Self-expression, play, and the warmth of the heart are paramount. Lead with generosity and celebrate the unique gifts you bring to the world — this is a season of radiance, courage, and joyful pride.',
    colours: ['royal gold', 'bright orange', 'royal purple', 'crimson'],
    crystals: ['sunstone', 'amber', 'citrine', 'pyrite', 'carnelian'],
    herbs: ['sunflower', 'cinnamon', 'saffron', 'marigold', 'rosemary'],
  },

  Virgo: {
    name: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    qualities: ['analytical', 'precise', 'helpful', 'discerning', 'health-conscious'],
    transitEnergy:
      'The Sun in Virgo brings a quieter, more thoughtful energy — one of order, refinement, and service. It is a fine time to tend to health, organise the home or workspace, and refine your craft with care. The harvest season calls us to be discerning about what we cultivate and what we must cull.',
    colours: ['navy blue', 'deep grey', 'forest green', 'rich brown'],
    crystals: ['peridot', 'sapphire', 'amazonite', 'moss agate'],
    herbs: ['dill', 'oregano', 'caraway', 'chrysanthemum', 'valerian'],
  },

  Libra: {
    name: 'Libra',
    symbol: '♎',
    element: 'Air',
    modality: 'Cardinal',
    rulingPlanet: 'Venus',
    qualities: ['diplomatic', 'gracious', 'fair-minded', 'social', 'peace-seeking'],
    transitEnergy:
      'The Sun in Libra invites harmony, balance, and beauty into sharp focus. Relationships and partnerships come to the fore — how we relate to others, and how we can find equilibrium within ourselves. Aesthetics and justice are Libra\'s twin callings, and both feel more pressing and meaningful now.',
    colours: ['rose pink', 'pale sky blue', 'soft lavender', 'ivory'],
    crystals: ['rose quartz', 'opal', 'lapis lazuli', 'lepidolite'],
    herbs: ['rose', 'spearmint', 'thyme', 'catnip', 'violet'],
  },

  Scorpio: {
    name: 'Scorpio',
    symbol: '♏',
    element: 'Water',
    modality: 'Fixed',
    rulingPlanet: 'Pluto (traditional: Mars)',
    qualities: ['intense', 'perceptive', 'transformative', 'magnetic', 'deeply feeling'],
    transitEnergy:
      'The Sun in Scorpio descends into the depths, demanding truth, transformation, and a reckoning with the shadow self. The veil between worlds thins and mystery feels close. This is a potent time for depth work, divination, and any magic that touches the themes of death, rebirth, and the unseen.',
    colours: ['deep black', 'dark crimson', 'burgundy', 'deep purple'],
    crystals: ['obsidian', 'garnet', 'labradorite', 'dark tourmaline'],
    herbs: ['mugwort', 'wormwood', 'nettle', 'dragon\'s blood', 'yew'],
  },

  Sagittarius: {
    name: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    modality: 'Mutable',
    rulingPlanet: 'Jupiter',
    qualities: ['adventurous', 'philosophical', 'optimistic', 'freedom-loving', 'visionary'],
    transitEnergy:
      'The Sun in Sagittarius expands horizons — of the mind, the spirit, and the world. Philosophy, travel, and the pursuit of higher meaning feel urgent and joyful. There is an infectious optimism in the air and a call to explore beliefs, cultures, and vast landscapes both inner and outer.',
    colours: ['royal purple', 'deep blue', 'turquoise', 'bright gold'],
    crystals: ['turquoise', 'lapis lazuli', 'topaz', 'amethyst'],
    herbs: ['sage', 'hyssop', 'borage', 'anise', 'clove'],
  },

  Capricorn: {
    name: 'Capricorn',
    symbol: '♑',
    element: 'Earth',
    modality: 'Cardinal',
    rulingPlanet: 'Saturn',
    qualities: ['disciplined', 'ambitious', 'patient', 'pragmatic', 'resilient'],
    transitEnergy:
      'The Sun in Capricorn calls for focused effort, discipline, and the patient building of lasting structures. The depth of winter demands we conserve energy and work methodically toward meaningful goals. Tradition, responsibility, and the wisdom of elders carry special weight in this season.',
    colours: ['charcoal grey', 'forest green', 'black', 'dark earth brown'],
    crystals: ['garnet', 'onyx', 'jet', 'smoky quartz', 'tiger\'s eye'],
    herbs: ['comfrey', 'horsetail', 'shepherd\'s purse', 'bistort', 'thyme'],
  },

  Aquarius: {
    name: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    modality: 'Fixed',
    rulingPlanet: 'Uranus (traditional: Saturn)',
    qualities: ['innovative', 'humanitarian', 'independent', 'visionary', 'unconventional'],
    transitEnergy:
      'The Sun in Aquarius brings an electric, forward-looking energy — idealism, community, and the desire to break from convention are heightened. It is a time to think about humanity\'s larger patterns and your own unique contribution to the collective. Innovation and social magic flourish.',
    colours: ['electric blue', 'silver', 'turquoise', 'violet'],
    crystals: ['aquamarine', 'amethyst', 'blue kyanite', 'clear quartz'],
    herbs: ['lavender', 'peppermint', 'eucalyptus', 'clover', 'violet'],
  },

  Pisces: {
    name: 'Pisces',
    symbol: '♓',
    element: 'Water',
    modality: 'Mutable',
    rulingPlanet: 'Neptune (traditional: Jupiter)',
    qualities: ['empathic', 'imaginative', 'spiritual', 'compassionate', 'deeply intuitive'],
    transitEnergy:
      'The Sun in Pisces moves through the last and most mystical sign of the zodiac, dissolving the boundaries between self and all. Dreams, intuition, spiritual practice, and compassionate service are the gifts of this season. Rest where needed and let the veil between worlds remain thin a while longer.',
    colours: ['sea green', 'soft lavender', 'pale violet', 'aquamarine', 'misty blue'],
    crystals: ['amethyst', 'aquamarine', 'moonstone', 'fluorite', 'chrysocolla'],
    herbs: ['mugwort', 'lotus', 'jasmine', 'seaweed', 'willow'],
  },
};
