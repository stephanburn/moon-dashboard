export interface SabbatCorrespondence {
  name: string;
  alternateNames: string[];
  subtitle: string;
  dateDescription: string;
  mythology: string;
  themes: string[];
  colours: string[];
  crystals: string[];
  herbs: string[];
  foods: string[];
  ritualFocus: string;
}

export const SABBAT_CORRESPONDENCES: Record<string, SabbatCorrespondence> = {
  Imbolc: {
    name: 'Imbolc',
    alternateNames: ['Candlemas', 'Brigid\'s Day', 'Oimelc'],
    subtitle: 'The Festival of Returning Light',
    dateDescription: 'Fixed — 1st February',
    mythology:
      'Imbolc marks the first stirrings of spring hidden beneath the frozen earth, sacred to the goddess Brigid — patroness of hearth, healing, poetry, and craft. In Irish tradition, Brigid visits each home on the eve of the festival, blessing the hearth and those who dwell within. The ewes coming into milk give the old name Oimelc, meaning "ewe\'s milk", signalling that the land is quietly quickening once more.',
    themes: ['returning light', 'purification', 'creative inspiration', 'new beginnings', 'healing'],
    colours: ['white', 'silver', 'pale yellow', 'light green'],
    crystals: ['amethyst', 'moonstone', 'clear quartz', 'bloodstone'],
    herbs: ['blackberry', 'willow', 'rowan', 'angelica', 'lavender'],
    foods: ['dairy', 'oat bread', 'seeds', 'honey', 'warm milk'],
    ritualFocus:
      'Light candles throughout your space to welcome the returning light. Create a Brigid\'s cross for protection and hang it above your hearth or door. Write your creative intentions for the season ahead and dedicate a new magical tool or creative project in Brigid\'s name.',
  },

  Ostara: {
    name: 'Ostara',
    alternateNames: ['Spring Equinox', 'Vernal Equinox', 'Eostre'],
    subtitle: 'The Spring Equinox',
    dateDescription: 'Astronomical — the Vernal Equinox (approximately 20–21 March in the Northern Hemisphere)',
    mythology:
      'At the spring equinox, day and night are held in brief, precise balance before the light begins to prevail. It is one of only two moments in the year when the sun rises exactly due east and sets exactly due west — a hinge in the turning of the seasons that has been marked by cultures across the world. Monuments align to it; festivals gather around it; the natural world makes it unmistakably felt. The name Ostara comes from a Germanic goddess of spring and dawn; Easter draws on the same root, along with its symbols of eggs and hares. Across traditions, this is a time of awakening, renewal, and the first genuine warmth returning to the world.',
    themes: ['balance', 'renewal', 'awakening', 'growth', 'new beginnings'],
    colours: ['pastel green', 'soft yellow', 'lavender', 'light blue', 'blush pink'],
    crystals: ['rose quartz', 'amazonite', 'green aventurine', 'aquamarine'],
    herbs: ['daffodil', 'jasmine', 'violet', 'rose', 'primrose'],
    foods: ['decorated eggs', 'spring greens', 'honey', 'hot cross buns', 'fresh herbs'],
    ritualFocus:
      'Go outside and notice the particular quality of spring light — longer, warmer, more insistent each day. Plant seeds, literally or as intentions for the months ahead. Clear out what no longer belongs in your space and welcome the season of opening. Eggs, traditionally decorated at this time, are a simple and ancient way to hold a wish.',
  },

  Beltane: {
    name: 'Beltane',
    alternateNames: ['May Day', 'Calan Mai', 'Walpurgis Night'],
    subtitle: 'The Great Fire Festival',
    dateDescription: 'Fixed — 1st May (some traditions: when hawthorn blooms)',
    mythology:
      'Beltane is one of the great fire festivals, celebrating the full flowering of spring and the sacred marriage of the god and goddess. Ancient Celts would drive their cattle between twin bonfires to purify them before summer grazing. The maypole, a symbol of the World Tree and the joyful union of earth and sky, is danced around in a spiral of fertility magic. This is the night the veil is thin and the Fae are most active in the world.',
    themes: ['fertility', 'passion', 'sacred union', 'fire magic', 'vitality', 'the Fae'],
    colours: ['bright green', 'gold', 'scarlet', 'pure white', 'deep rose'],
    crystals: ['emerald', 'malachite', 'carnelian', 'rose quartz', 'garnet'],
    herbs: ['hawthorn', 'rowan', 'elder', 'rose', 'nettle', 'mint'],
    foods: ['oatcakes', 'fresh berries', 'honey mead', 'spring cheeses', 'dairy'],
    ritualFocus:
      'Light a bonfire or candles and leap the flame symbolically for purification and luck in the year ahead. Weave a flower crown or make a May bush decorated with coloured ribbons. Honour the sacred union of earth and sky, and celebrate your own aliveness with dancing, feasting, and uninhibited joy.',
  },

  Litha: {
    name: 'Litha',
    alternateNames: ['Summer Solstice', 'Midsummer', 'Alban Hefin'],
    subtitle: 'The Summer Solstice',
    dateDescription: 'Astronomical — the Summer Solstice (approximately 20–21 June in the Northern Hemisphere)',
    mythology:
      'The summer solstice is the longest day of the year — the sun reaches its highest arc in the sky and seems to hang there, reluctant to descend. From this point, the days begin to shorten, almost imperceptibly at first. Ancient monuments across the world were built to frame this precise solar alignment: Stonehenge, Newgrange, and dozens of others suggest how deeply human beings have always felt the significance of the turning. In cultures across the Northern Hemisphere, midsummer bonfires have been lit on hilltops for millennia — celebrations of light at its fullest, before the long return to dark. The name Litha is an old English term for the summer months; midsummer festivities persist today in Scandinavia, the British Isles, and beyond.',
    themes: ['abundance', 'fulfilment', 'vitality', 'gratitude', 'the turning point'],
    colours: ['gold', 'bright yellow', 'orange', 'white', 'vibrant green'],
    crystals: ['sunstone', 'citrine', 'amber', 'carnelian', 'tiger\'s eye'],
    herbs: ['St John\'s wort', 'lavender', 'chamomile', 'elder flower', 'oak', 'rose'],
    foods: ['summer fruits', 'strawberries', 'honey mead', 'garden salads', 'fire-cooked foods'],
    ritualFocus:
      'Rise early and watch the dawn — on the solstice the sun rises at its most northerly point, and the quality of the light is unique. Spend time outdoors at the height of the day. Gather herbs and flowers that are at their peak and dry them for later use. In the evening, light a fire or candles and sit with gratitude for what has grown and flourished this season — knowing the wheel is already beginning to turn.',
  },

  Lughnasadh: {
    name: 'Lughnasadh',
    alternateNames: ['Lammas', 'Lughnasad', 'First Harvest'],
    subtitle: 'The First Harvest',
    dateDescription: 'Fixed — 1st August',
    mythology:
      'Lughnasadh is named for the Irish god Lugh, who instituted this harvest festival in honour of his foster mother Tailtiu, who died clearing the plains of Ireland for cultivation. The first grain is cut and the first loaves baked — an act of both celebration and sacrifice, for the grain that dies becomes the bread that sustains life. The great Tailteann Games were held in Lugh\'s honour, and the hillsides rang with contest and feasting.',
    themes: ['first harvest', 'sacrifice', 'skill and craft', 'gratitude', 'community', 'abundance'],
    colours: ['harvest gold', 'deep orange', 'rich red', 'warm brown', 'wheat yellow'],
    crystals: ['citrine', 'carnelian', 'tiger\'s eye', 'lodestone', 'yellow jasper'],
    herbs: ['wheat', 'heather', 'sunflower', 'oat', 'blackberry', 'corn'],
    foods: ['fresh-baked bread', 'corn', 'blackberries', 'harvest ales', 'apple pies', 'grain dishes'],
    ritualFocus:
      'Bake bread with intention, kneading your wishes and gratitude into the dough. Make a corn dolly or wheat weaving to honour the spirit of the grain. Reflect on what you have worked hard for this year and give genuine thanks — and consider what must be released as the harvest is cut back.',
  },

  Mabon: {
    name: 'Mabon',
    alternateNames: ['Autumn Equinox', 'Second Harvest', 'Alban Elfed'],
    subtitle: 'The Autumn Equinox',
    dateDescription: 'Astronomical — the Autumnal Equinox (approximately 22–23 September in the Northern Hemisphere)',
    mythology:
      'The autumn equinox is the second balance point of the year — once again, day and night stand briefly equal before the darkness begins to take the lead. The light has a particular golden quality at this time, slant and warm, even as it shortens. The natural world is completing its cycle: the harvest is gathered, leaves begin to turn, and there is a bittersweet edge to the air that is unlike any other season. The name Mabon, used in some modern traditions, comes from a Welsh mythological figure — the Great Son of the Great Mother — whose story echoes broader themes of descent and return. Cultures across the world have marked the autumn balance point with harvest festivals, thanksgiving, and a turning inward toward reflection.',
    themes: ['balance', 'gratitude', 'completion', 'preparation', 'letting go', 'turning inward'],
    colours: ['deep red', 'burnt orange', 'harvest gold', 'brown', 'russet'],
    crystals: ['smoky quartz', 'amber', 'carnelian', 'jasper', 'peridot'],
    herbs: ['apple', 'blackberry', 'hazel', 'ivy', 'myrrh', 'sage'],
    foods: ['apples', 'root vegetables', 'squash', 'cider', 'nuts', 'late harvest fruit'],
    ritualFocus:
      'Walk in the autumn landscape and let the season speak for itself — the quality of this light is fleeting and worth attention. Gather the last of the harvest from your garden or the hedgerows. Make a warming drink and sit with genuine gratitude for what has come to fruition this year. Reflect on what is ready to be released as the world turns inward, and make space for the quieter months ahead.',
  },

  Samhain: {
    name: 'Samhain',
    alternateNames: ['Halloween', 'All Hallows\' Eve', 'Oíche Shamhna'],
    subtitle: 'The Witches\' New Year',
    dateDescription: 'Fixed — 31st October (some traditions: first Full Moon of Scorpio)',
    mythology:
      'Samhain is the most sacred night in the Celtic calendar — the eve when the veil between the living and the dead dissolves entirely and the ancestors walk among us once more. The Celtic new year begins in darkness, as all things in the old tradition begin in their opposite: night before day, winter before summer. Honoured dead are welcomed at a silent supper, and those who cross the threshold are met with respect and recognition.',
    themes: ['the ancestors', 'death and rebirth', 'the thinning veil', 'divination', 'the new year', 'shadow work'],
    colours: ['black', 'deep orange', 'dark purple', 'blood crimson', 'silver'],
    crystals: ['obsidian', 'black tourmaline', 'labradorite', 'garnet', 'onyx'],
    herbs: ['mugwort', 'wormwood', 'rosemary', 'bay', 'blackthorn', 'apple'],
    foods: ['apples', 'pomegranate', 'root vegetables', 'soul cakes', 'bone broth', 'red wine'],
    ritualFocus:
      'Set a place at your table for the beloved dead and light a candle in the window to guide their way home. Scry by candlelight or dark mirror to receive messages from the other side. Write the names of those who have passed on slips of paper and burn them as an offering of remembrance, love, and release.',
  },

  Yule: {
    name: 'Yule',
    alternateNames: ['Winter Solstice', 'Midwinter', 'Alban Arthan'],
    subtitle: 'The Winter Solstice',
    dateDescription: 'Astronomical — the Winter Solstice (approximately 21–22 December in the Northern Hemisphere)',
    mythology:
      'The winter solstice is the longest night of the year — after which, almost imperceptibly at first, the sun begins to return. It has been observed across human history as the great turning point: a moment of darkness that contains within it the promise of returning light. Stonehenge was oriented to the winter solstice sunset. Roman Saturnalia, the Norse Yule, the Persian Yalda night, and eventually Christmas all cluster around this point on the wheel, each expressing in its own way the deep human need to mark the dark and welcome the return of warmth. The name Yule comes from Old Norse traditions of feasting and fire-keeping through the longest dark. Burning a great log through the night — oak or ash — kept the flame alive as a symbol of the enduring sun.',
    themes: ['endurance', 'the returning light', 'hope', 'rest', 'gathering', 'renewal'],
    colours: ['deep red', 'forest green', 'bright gold', 'silver', 'white', 'midnight blue'],
    crystals: ['clear quartz', 'bloodstone', 'ruby', 'garnet', 'emerald'],
    herbs: ['holly', 'ivy', 'mistletoe', 'pine', 'fir', 'frankincense', 'myrrh'],
    foods: ['mulled wine', 'roasted foods', 'gingerbread', 'dried fruits', 'nuts', 'wassail'],
    ritualFocus:
      'Sit with candles through the longest night — not as ritual obligation, but as quiet company with the dark. Decorate with evergreens, which hold their green through winter as a reminder that life persists. At dawn, go outside and greet the returning sun. Gather with people you love, eat well, and rest deeply. The wheel turns whether we mark it or not; marking it makes the turning felt.',
  },
};
