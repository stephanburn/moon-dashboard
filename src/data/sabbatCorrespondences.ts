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
    dateDescription: 'Astronomical — the Vernal Equinox (approximately 20–21 March)',
    mythology:
      'At Ostara, day and night stand in perfect balance before the light overcomes the dark. The goddess of spring and dawn, Eostre — from whom Easter borrows its name and imagery — bestows her blessings on a world awakening with wildflowers and birdsong. The hare and the egg, symbols of fertility and new life, are sacred to this sabbat, and the young sun god dances with increasing vigour across the lengthening days.',
    themes: ['balance', 'renewal', 'fertility', 'growth', 'planting intentions'],
    colours: ['pastel green', 'soft yellow', 'lavender', 'light blue', 'blush pink'],
    crystals: ['rose quartz', 'amazonite', 'green aventurine', 'aquamarine'],
    herbs: ['daffodil', 'jasmine', 'violet', 'rose', 'primrose'],
    foods: ['decorated eggs', 'spring greens', 'honey', 'hot cross buns', 'fresh flowers'],
    ritualFocus:
      'Decorate eggs with symbols of your intentions and plant seeds — literally or symbolically. Perform a spring cleaning ritual with citrus and rosemary to clear stagnant energy. Walk barefoot on the earth and give thanks for the balance that makes all life possible.',
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
    subtitle: 'The Peak of the Sun',
    dateDescription: 'Astronomical — the Summer Solstice (approximately 20–21 June)',
    mythology:
      'Litha is the longest day, the apex of the solar year, when the Sun God reaches the height of his power before beginning the slow decline toward darkness. In many traditions, this is the battle between the Oak King and the Holly King — with the Holly King now victorious, ruling the waning half of the year. The land hums with the fullness of summer and the faeries are said to walk openly in the long golden light.',
    themes: ['solar power', 'abundance', 'fulfilment', 'strength', 'fire', 'the peak'],
    colours: ['gold', 'bright yellow', 'orange', 'white', 'vibrant green'],
    crystals: ['sunstone', 'citrine', 'amber', 'carnelian', 'tiger\'s eye'],
    herbs: ['St John\'s wort', 'lavender', 'chamomile', 'elder flower', 'oak', 'rose'],
    foods: ['summer fruits', 'strawberries', 'honey mead', 'garden salads', 'fire-cooked foods'],
    ritualFocus:
      'Rise for the dawn and greet the sun at its peak. Create a sun wheel or spiral of herbs and flowers as an offering. Gather medicinal herbs at midday when their potency is greatest, and dry them for the year\'s magical work. Give gratitude for all that has grown and flourished this season.',
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
    subtitle: 'The Second Harvest',
    dateDescription: 'Astronomical — the Autumnal Equinox (approximately 22–23 September)',
    mythology:
      'Mabon honours the balance point of autumn, when light and dark again stand equal before the darkness prevails. The name comes from the Welsh deity Mabon ap Modron — "the great son of the great mother" — a god of youth held in the otherworld, echoing the myth of Persephone descending into the underworld. The harvest is gathered and stored; the world prepares for its descent into the long dark.',
    themes: ['balance', 'second harvest', 'gratitude', 'preparation', 'letting go', 'the ancestors'],
    colours: ['deep red', 'burnt orange', 'harvest gold', 'brown', 'russet'],
    crystals: ['smoky quartz', 'amber', 'carnelian', 'jasper', 'peridot'],
    herbs: ['apple', 'blackberry', 'hazel', 'ivy', 'myrrh', 'sage'],
    foods: ['apples', 'root vegetables', 'squash', 'red wine', 'nuts', 'late harvest fruit'],
    ritualFocus:
      'Create an altar with the fruits and colours of the harvest. Make a warming drink — cider or spiced wine — as a shared offering. Reflect on what you are grateful for and what you are ready to release as the world turns inward. Walk in the autumn landscape and honour the beautiful melancholy of the turning year.',
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
    subtitle: 'The Return of the Light',
    dateDescription: 'Astronomical — the Winter Solstice (approximately 21–22 December)',
    mythology:
      'Yule is the longest night and the turning point of the solar year — from this night, the sun is reborn and the days grow longer again. The Holly King, who has ruled since Litha, is overcome by the Oak King, who carries the promise of returning warmth. The old tradition of the Yule log — a great piece of oak or ash burned through the longest night — symbolises the enduring spark of life even in the deepest dark.',
    themes: ['rebirth', 'the returning light', 'hope', 'endurance', 'family', 'the wheel turning'],
    colours: ['deep red', 'forest green', 'bright gold', 'silver', 'white', 'midnight blue'],
    crystals: ['clear quartz', 'bloodstone', 'ruby', 'garnet', 'emerald'],
    herbs: ['holly', 'ivy', 'mistletoe', 'pine', 'fir', 'frankincense', 'myrrh'],
    foods: ['mulled wine', 'roasted meats', 'gingerbread', 'dried fruits', 'nuts', 'wassail'],
    ritualFocus:
      'Burn a Yule log or sit vigil with candles through the longest night, keeping the flame alive as a symbol of the sun\'s return. Decorate with evergreens and light every candle in your home. At dawn, go outside to greet the newborn sun and welcome the returning light with gratitude, joy, and the warmth of gathered loved ones.',
  },
};
