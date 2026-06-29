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
    dateDescription: 'Fixed: 1st February',
    mythology:
      'Imbolc is one of the four Gaelic seasonal festivals and falls around 1 February, midway between the winter solstice and the spring equinox rather than on an astronomical point. It marks the first stirrings of spring beneath the frozen ground and is associated with Brigid, who survives both as an Irish goddess and, later, as a Christian saint of hearth, healing, poetry, and smithcraft. In Irish and Scottish folk custom Brigid travels the land on the eve of the festival, blessing homes and hearths. One old name, Oimelc, is glossed as "ewe\'s milk", tying the date to the lambing season and the land beginning to quicken again.',
    themes: ['returning light', 'purification', 'creative inspiration', 'new beginnings', 'healing'],
    colours: ['white', 'silver', 'pale yellow', 'light green'],
    crystals: ['amethyst', 'moonstone', 'clear quartz', 'bloodstone'],
    herbs: ['blackberry', 'willow', 'rowan', 'angelica', 'lavender'],
    foods: ['dairy', 'oat bread', 'seeds', 'honey', 'warm milk'],
    ritualFocus:
      'Light candles through your space to mark the returning light. Make a Brigid\'s cross to hang above a door or hearth, as people have long done for protection. Set out your creative intentions for the season ahead, and dedicate a new tool or project in her name if you work with her.',
  },

  Ostara: {
    name: 'Ostara',
    alternateNames: ['Spring Equinox', 'Vernal Equinox', 'Eostre'],
    subtitle: 'The Spring Equinox',
    dateDescription: 'Astronomical: the Vernal Equinox (approximately 20–21 March in the Northern Hemisphere)',
    mythology:
      'Ostara is the spring equinox, a genuine astronomical event when day and night fall briefly into near-equal balance before the light starts to win out. It is one of only two points in the year when the sun rises due east and sets due west, and cultures across the world have built monuments to it and gathered around it. The name Ostara, however, is a modern label for the sabbat. It was popularised in twentieth-century paganism and borrowed from Eostre, a spring goddess mentioned only once in the historical record, by Bede in the eighth century, and later expanded by Jacob Grimm into a reconstructed "Ostara". The familiar claims tying her to eggs and hares are modern folklore rather than established fact.',
    themes: ['balance', 'renewal', 'awakening', 'growth', 'new beginnings'],
    colours: ['pastel green', 'soft yellow', 'lavender', 'light blue', 'blush pink'],
    crystals: ['rose quartz', 'amazonite', 'green aventurine', 'aquamarine'],
    herbs: ['daffodil', 'jasmine', 'violet', 'rose', 'primrose'],
    foods: ['decorated eggs', 'spring greens', 'honey', 'hot cross buns', 'fresh herbs'],
    ritualFocus:
      'Go outside and notice the particular quality of spring light, longer and warmer by the day. Plant seeds, literally or as intentions for the months ahead. Clear out what no longer belongs in your space and let the season of opening in. Decorating eggs is a simple way to hold a wish for the season.',
  },

  Beltane: {
    name: 'Beltane',
    alternateNames: ['May Day', 'Calan Mai', 'Walpurgis Night'],
    subtitle: 'The Great Fire Festival',
    dateDescription: 'Fixed: 1st May (some traditions: when hawthorn blooms)',
    mythology:
      'Beltane is the second of the Gaelic fire festivals, falling around 1 May, midway between the spring equinox and the summer solstice rather than on an astronomical marker. It celebrates the full arrival of spring. The best-attested old custom is the driving of cattle between two fires before they went to summer pasture, recorded as a protective and purifying rite. May Eve also carries a long folklore association with heightened fairy activity. The maypole, often tied to Beltane today, is a later English and Germanic custom rather than an ancient Celtic one, and the "sacred marriage" framing belongs to modern Wicca rather than the older festival.',
    themes: ['fertility', 'passion', 'sacred union', 'fire magic', 'vitality', 'the Fae'],
    colours: ['bright green', 'gold', 'scarlet', 'pure white', 'deep rose'],
    crystals: ['emerald', 'malachite', 'carnelian', 'rose quartz', 'garnet'],
    herbs: ['hawthorn', 'rowan', 'elder', 'rose', 'nettle', 'mint'],
    foods: ['oatcakes', 'fresh berries', 'honey mead', 'spring cheeses', 'dairy'],
    ritualFocus:
      'Light a fire or candles and leap the flame, even symbolically, for luck and a clean start to the warmer half of the year. Weave a flower crown or dress a May bush with coloured ribbons. Mark your own aliveness however suits you, with dancing, feasting, and good company.',
  },

  Litha: {
    name: 'Litha',
    alternateNames: ['Summer Solstice', 'Midsummer', 'Alban Hefin'],
    subtitle: 'The Summer Solstice',
    dateDescription: 'Astronomical: the Summer Solstice (approximately 20–21 June in the Northern Hemisphere)',
    mythology:
      'Litha is the summer solstice, the longest day of the year, when the sun reaches its highest arc and seems to hang there before the days slowly begin to shorten again. This is a real astronomical turning point, and people have marked it for a very long time. Stonehenge frames the solstice sunrise along its main axis, and midsummer bonfires have been lit on hilltops across the Northern Hemisphere for millennia. The name Litha is a modern label for the sabbat, taken from an Old English term Bede recorded for the midsummer months. Midsummer festivities still run today across Scandinavia, the British Isles, and beyond.',
    themes: ['abundance', 'fulfilment', 'vitality', 'gratitude', 'the turning point'],
    colours: ['gold', 'bright yellow', 'orange', 'white', 'vibrant green'],
    crystals: ['sunstone', 'citrine', 'amber', 'carnelian', 'tiger\'s eye'],
    herbs: ['St John\'s wort', 'lavender', 'chamomile', 'elder flower', 'oak', 'rose'],
    foods: ['summer fruits', 'strawberries', 'honey mead', 'garden salads', 'fire-cooked foods'],
    ritualFocus:
      'Rise early and watch the dawn. At the solstice the sun rises at its most northerly point and the light has a particular quality. Spend time outdoors at the height of the day. Gather herbs and flowers at their peak and dry them for later use. In the evening, light a fire or candles and sit with what has grown and flourished this season, knowing the wheel is already turning.',
  },

  Lughnasadh: {
    name: 'Lughnasadh',
    alternateNames: ['Lammas', 'Lughnasad', 'First Harvest'],
    subtitle: 'The First Harvest',
    dateDescription: 'Fixed: 1st August',
    mythology:
      'Lughnasadh is the last of the Gaelic fire festivals, falling around 1 August, midway between the summer solstice and the autumn equinox rather than on an astronomical point. It is named for the Irish god Lugh, who according to tradition founded it as funeral games for his foster-mother Tailtiu, said to have died clearing the plains of Ireland for farming. It marks the start of the harvest, when the first grain is cut and the first loaves baked. In England the same first-harvest festival is Lammas, from the Old English hlafmæsse, or "loaf-mass", and the two names are often used interchangeably for this sabbat today.',
    themes: ['first harvest', 'sacrifice', 'skill and craft', 'gratitude', 'community', 'abundance'],
    colours: ['harvest gold', 'deep orange', 'rich red', 'warm brown', 'wheat yellow'],
    crystals: ['citrine', 'carnelian', 'tiger\'s eye', 'lodestone', 'yellow jasper'],
    herbs: ['wheat', 'heather', 'sunflower', 'oat', 'blackberry', 'corn'],
    foods: ['fresh-baked bread', 'corn', 'blackberries', 'harvest ales', 'apple pies', 'grain dishes'],
    ritualFocus:
      'Bake bread and work your gratitude or intentions into the dough. Make a corn dolly or wheat weaving to mark the spirit of the grain. Reflect on what you have worked for this year, give honest thanks, and consider what needs cutting back now the harvest has begun.',
  },

  Mabon: {
    name: 'Mabon',
    alternateNames: ['Autumn Equinox', 'Second Harvest', 'Alban Elfed'],
    subtitle: 'The Autumn Equinox',
    dateDescription: 'Astronomical: the Autumnal Equinox (approximately 22–23 September in the Northern Hemisphere)',
    mythology:
      'Mabon is the autumn equinox, the second of the year\'s two balance points, when day and night stand briefly equal before the dark takes the lead. This is a real astronomical event, and harvest festivals and thanksgivings cluster around it across many cultures. The name Mabon, though, is a modern invention. It was coined in 1970 by Aidan Kelly, borrowing a figure from Welsh myth, Mabon ap Modron, who has no traditional connection to the equinox at all. The older reality is simpler: a gathered harvest, turning leaves, and a slant golden light that belongs to no other time of year.',
    themes: ['balance', 'gratitude', 'completion', 'preparation', 'letting go', 'turning inward'],
    colours: ['deep red', 'burnt orange', 'harvest gold', 'brown', 'russet'],
    crystals: ['smoky quartz', 'amber', 'carnelian', 'jasper', 'peridot'],
    herbs: ['apple', 'blackberry', 'hazel', 'ivy', 'myrrh', 'sage'],
    foods: ['apples', 'root vegetables', 'squash', 'cider', 'nuts', 'late harvest fruit'],
    ritualFocus:
      'Walk in the autumn landscape and let the season speak for itself; this light is fleeting and worth the attention. Gather the last of the harvest from your garden or the hedgerows. Make something warm to drink and sit with what has come to fruition this year. Notice what is ready to be let go as the world turns inward, and make a little space for the quieter months ahead.',
  },

  Samhain: {
    name: 'Samhain',
    alternateNames: ['Halloween', 'All Hallows\' Eve', 'Oíche Shamhna'],
    subtitle: 'The Witches\' New Year',
    dateDescription: 'Fixed: 31st October (some traditions: first Full Moon of Scorpio)',
    mythology:
      'Samhain is the first and arguably most important of the Gaelic fire festivals, falling around 1 November, midway between the autumn equinox and the winter solstice rather than on an astronomical point. It is well attested in early Irish literature, where the boundary between the ordinary world and the Otherworld is unusually open and a great many mythological events are set. It is commonly described as the start of the Celtic year, beginning, in the old pattern, in darkness: night before day, winter before summer. The honoured dead are welcomed back and met with respect rather than fear.',
    themes: ['the ancestors', 'death and rebirth', 'the thinning veil', 'divination', 'the new year', 'shadow work'],
    colours: ['black', 'deep orange', 'dark purple', 'blood crimson', 'silver'],
    crystals: ['obsidian', 'black tourmaline', 'labradorite', 'garnet', 'onyx'],
    herbs: ['mugwort', 'wormwood', 'rosemary', 'bay', 'blackthorn', 'apple'],
    foods: ['apples', 'pomegranate', 'root vegetables', 'soul cakes', 'bone broth', 'red wine'],
    ritualFocus:
      'Set a place at your table for the beloved dead and light a candle in a window to guide them home. Scry by candlelight or a dark mirror if that is part of your practice. Write the names of those who have passed and burn the slips as an offering of remembrance and release.',
  },

  Yule: {
    name: 'Yule',
    alternateNames: ['Winter Solstice', 'Midwinter', 'Alban Arthan'],
    subtitle: 'The Winter Solstice',
    dateDescription: 'Astronomical: the Winter Solstice (approximately 21–22 December in the Northern Hemisphere)',
    mythology:
      'Yule is the winter solstice, the longest night of the year, after which the sun slowly begins to return. It is the clearest astronomical turning point of all, a low moment of darkness that carries the promise of growing light, and it has been marked across human history. Newgrange in Ireland is built so that the rising sun floods its inner chamber on the solstice morning, and Stonehenge is oriented to the solstice sunset. Roman Saturnalia, the Norse Yule, the Persian Yalda, and later Christmas all gather around this point. The name Yule is itself old, from the Norse and Germanic midwinter feasting that ran through the longest dark, when a great log of oak or ash was burned through the night to keep the flame, and the sun, alive.',
    themes: ['endurance', 'the returning light', 'hope', 'rest', 'gathering', 'renewal'],
    colours: ['deep red', 'forest green', 'bright gold', 'silver', 'white', 'midnight blue'],
    crystals: ['clear quartz', 'bloodstone', 'ruby', 'garnet', 'emerald'],
    herbs: ['holly', 'ivy', 'mistletoe', 'pine', 'fir', 'frankincense', 'myrrh'],
    foods: ['mulled wine', 'roasted foods', 'gingerbread', 'dried fruits', 'nuts', 'wassail'],
    ritualFocus:
      'Sit with candles through the longest night, not as obligation but as quiet company with the dark. Decorate with evergreens, which keep their colour through winter as a reminder that life carries on. At dawn, go out and greet the returning sun. Gather with people you love, eat well, and rest deeply. The wheel turns whether we mark it or not; marking it makes the turning felt.',
  },
};
