/* Ten short passages for each community, about that community's own history.
 *
 * They are in English because English is the source: you translate a passage
 * about your own history into your own language. That is a better exercise
 * than a generic paragraph, and it gives the checker real numbers, dates and
 * names to lose, which is exactly what fidelity is measuring.
 *
 * Each is kept short on purpose. A passage you can translate in two minutes
 * gets translated; a page does not.
 *
 * Written from general knowledge and limited to long-settled facts: founding
 * dates, dynasties, well-known works. Worth a skim before you rely on any one
 * of them.
 */
export const PASSAGES = {
  English: [
    "The Anglo-Saxon Chronicle was begun in the ninth century and kept up for roughly 250 years, making it one of the earliest sustained records written in English.",
    "Magna Carta was sealed at Runnymede in 1215. Most of its clauses were about feudal grievances, but a few about lawful judgement outlived the rest.",
    "Chaucer wrote the Canterbury Tales in the late fourteenth century in Middle English, at a time when official business was still done in French and Latin.",
    "William Caxton set up a printing press at Westminster in 1476 and printed around a hundred books, many of them his own translations.",
    "Shakespeare's plays were collected in the First Folio in 1623, seven years after his death. Eighteen of them had never been printed before.",
    "Samuel Johnson's dictionary appeared in 1755 after some nine years of work, defining about 40,000 words with quotations showing each in use.",
    "The Oxford English Dictionary took decades to compile and relied on volunteer readers who mailed in slips recording words they had found in print.",
    "The Great Vowel Shift changed the pronunciation of English between roughly the fifteenth and eighteenth centuries, which is why the spelling and the sound no longer match.",
    "English has borrowed heavily from Latin, French and Norse, and later from every language its speakers traded with, which is why it has so many near-synonyms.",
    "The King James Bible was published in 1611 by a committee of 47 scholars, and its phrasing shaped written English for three centuries.",
  ],
  Chinese: [
    "Qin Shi Huang unified the warring states in 221 BC and became the first emperor of a unified China, standardising script, weights and axle widths.",
    "Papermaking was refined by Cai Lun around 105 AD. The technique took roughly a thousand years to reach Europe by way of the Silk Road.",
    "The Tang capital Chang'an was among the largest cities in the world, laid out on a grid and home to merchants from across Asia.",
    "Zheng He commanded seven voyages between 1405 and 1433, reaching the east coast of Africa with fleets far larger than any in Europe at the time.",
    "The Song dynasty issued the first government-backed paper money, several centuries before paper currency appeared anywhere in Europe.",
    "Movable type printing was invented by Bi Sheng in the eleventh century, using characters fired from clay and set in an iron frame.",
    "The Great Wall as it stands today was largely rebuilt in brick and stone under the Ming, on the line of much older earthen walls.",
    "The Grand Canal, begun under the Sui, linked the Yellow and Yangtze rivers and carried grain north for more than a thousand years.",
    "The imperial examination system selected officials by written test for roughly thirteen centuries, and was abolished in 1905.",
    "The compass was first described for navigation in Chinese texts of the eleventh century, having earlier been used for divination.",
  ],
  "Hindi-Urdu": [
    "The cities of Mohenjo-daro and Harappa had planned streets, standardised bricks and covered drains more than four thousand years ago.",
    "Ashoka renounced war after the Kalinga campaign and had edicts carved on rock faces and pillars across his empire in the third century BC.",
    "The treatment of zero as a number in its own right was formalised in India, and Brahmagupta wrote rules for arithmetic with it in 628 AD.",
    "Nalanda drew students from across Asia and held a library so large that its burning was said to have lasted for months.",
    "The Mughal emperor Akbar abolished the tax on non-Muslim subjects and invited scholars of many faiths to debate at his court.",
    "The Taj Mahal was built at Agra between roughly 1632 and 1653 as a tomb for Mumtaz Mahal, faced entirely in white marble.",
    "Hindi and Urdu share a spoken grammar and most everyday vocabulary, but are written in different scripts and draw on different literary registers.",
    "The Grand Trunk Road has carried traffic across the northern plains, from Bengal to the northwest, for more than five centuries.",
    "India and Pakistan became independent in August 1947. The partition that followed displaced many millions of people.",
    "Panini described the grammar of Sanskrit in about four thousand rules, a work of such precision that linguists still study its method.",
  ],
  Indonesian: [
    "Borobudur, built in central Java in the ninth century, is the largest Buddhist temple in the world, carved with more than two thousand relief panels.",
    "The Srivijaya empire controlled the Strait of Malacca from the seventh century and grew rich on the trade that had to pass through it.",
    "Majapahit, based in east Java, reached its greatest extent in the fourteenth century under Hayam Wuruk and his minister Gajah Mada.",
    "For centuries the Banda Islands were the world's only source of nutmeg, and the Moluccas the only source of cloves.",
    "Indonesian was standardised from Malay and adopted as the national language by the Youth Pledge of 1928, before the country itself existed.",
    "The Dutch East India Company was founded in 1602 and held a trading monopoly across the archipelago for nearly two hundred years.",
    "Indonesia declared independence on 17 August 1945, two days after the Japanese surrender.",
    "The archipelago has more than seventeen thousand islands and over seven hundred living languages.",
    "Krakatoa erupted in 1883 with a sound reported thousands of kilometres away, and the dust it threw up cooled the climate for years.",
    "Javanese batik uses wax resist applied by hand or copper stamp, and was recognised by UNESCO in 2009.",
  ],
  Latam: [
    "Tenochtitlan was built on an island in Lake Texcoco and was one of the largest cities in the world when the Spanish reached it in 1519.",
    "The Inca road network ran for tens of thousands of kilometres through the Andes, built and used without wheeled vehicles or draught animals.",
    "Maya astronomers tracked the movements of Venus across centuries and recorded the results in bark-paper books, four of which survive.",
    "Potatoes and maize were domesticated in the Americas over thousands of years and later became staple crops on every other continent.",
    "Simón Bolívar led the campaigns that won independence for several South American republics during the 1810s and 1820s.",
    "Brazil declared independence from Portugal in 1822 and remained a monarchy until 1889, unlike its republican neighbours.",
    "The Panama Canal opened in 1914 after decades of work, two attempts and an enormous loss of life to disease.",
    "Quipu, cords knotted in patterns, were used by the Inca to record numbers and quantities, and possibly a great deal more.",
    "Spanish and Portuguese are the most widely spoken languages of the region, alongside several hundred indigenous languages still in daily use.",
    "Machu Picchu was built in the fifteenth century, abandoned within about a hundred years, and never found by the Spanish.",
  ],
  Nigerian: [
    "The Nok culture produced terracotta figures in what is now central Nigeria more than two thousand years ago, some of them close to life size.",
    "The bronzes of Ife and Benin were cast by the lost-wax method with a precision that startled European museums when they first saw them.",
    "The walls and moats around the Benin Kingdom were among the largest earthworks ever raised by hand anywhere in the world.",
    "The Sokoto Caliphate, founded in 1804, became one of the largest states in nineteenth-century Africa.",
    "Nigeria gained independence from Britain on 1 October 1960.",
    "Nigeria has more than five hundred languages. Hausa, Yoruba and Igbo are the most widely spoken, and English is the official language.",
    "Nollywood grew from the 1990s into one of the largest film industries in the world measured by the number of films made each year.",
    "Lagos began as a port on a lagoon and has become one of the most populous cities in Africa.",
    "Nigerian Pidgin is spoken across the country as a common tongue between people who share no other language.",
    "The city walls of Kano, begun in the eleventh century, enclosed one of the great trading centres of the Sahel.",
  ],
  Russian: [
    "Kievan Rus adopted Christianity in 988 under Vladimir the Great, an event that shaped the writing, art and calendar of the region.",
    "The Cyrillic alphabet developed from the work of Cyril and Methodius in the ninth century and is now used by dozens of languages.",
    "Moscow is first mentioned in a chronicle of 1147 and grew over the following centuries into the centre of a very large state.",
    "Peter the Great founded Saint Petersburg in 1703 on marshland at the mouth of the Neva, and moved the capital there nine years later.",
    "The Trans-Siberian Railway was completed in 1916 and runs more than nine thousand kilometres from Moscow to Vladivostok.",
    "Mendeleev published his periodic table in 1869 and left gaps in it for elements that had not yet been discovered.",
    "Tolstoy's War and Peace was published in full in 1869 after years of revision and several complete rewrites.",
    "Sputnik 1 was launched in October 1957 and became the first artificial object to orbit the Earth.",
    "Yuri Gagarin orbited the Earth on 12 April 1961 in a flight lasting 108 minutes.",
    "The Hermitage in Saint Petersburg began as the private collection of Catherine the Great and now holds around three million items.",
  ],
  Korean: [
    "The Korean alphabet, Hangul, was created under King Sejong and promulgated in 1446, designed so that ordinary people could learn it quickly.",
    "Metal movable type was in use in Korea in the thirteenth century, some two hundred years before Gutenberg.",
    "The Tripitaka Koreana comprises more than eighty thousand carved wooden printing blocks, completed in the thirteenth century and still intact.",
    "Admiral Yi Sun-sin's armoured turtle ships fought the Japanese invasions of the 1590s and won a series of outnumbered engagements.",
    "Silla unified most of the peninsula in the seventh century and ruled for close to three hundred years afterwards.",
    "Goryeo, the dynasty from which the name Korea comes, ruled from 918 to 1392.",
    "The Joseon dynasty lasted more than five centuries, from 1392 to 1897, one of the longest in East Asian history.",
    "Seoul has served as a capital since 1394 and still contains five palaces from the Joseon period.",
    "Cheomseongdae in Gyeongju, built in the seventh century, is among the oldest surviving observatory structures in Asia.",
    "Korean was written with Chinese characters for centuries before Hangul, and the two were used side by side for a long time after.",
  ],
  Turkish: [
    "Göbekli Tepe in southeastern Anatolia was built before pottery and before farming, which overturned a great deal of what was assumed about early settlement.",
    "Constantinople was founded in 330 and served as the capital of the Eastern Roman Empire for over a thousand years.",
    "The Hagia Sophia was completed in 537 and remained the largest cathedral in the world for nearly a millennium.",
    "The Ottoman state grew from a small principality in northwestern Anatolia at the end of the thirteenth century.",
    "Mimar Sinan designed hundreds of buildings in the sixteenth century, and considered the Selimiye Mosque at Edirne his masterwork.",
    "Topkapi Palace served as the Ottoman court for about four hundred years before the sultans moved to the Bosphorus.",
    "The Republic of Turkey was declared in 1923 with its capital at Ankara rather than Istanbul.",
    "The Turkish alphabet was changed from Arabic to Latin script in 1928, and literacy rose steeply in the years that followed.",
    "Troy was excavated at Hisarlik from 1870 and revealed nine settlement layers built one on top of another.",
    "The Grand Bazaar in Istanbul has been trading since the fifteenth century and covers dozens of covered streets.",
  ],
  Ukranian: [
    "Kyiv is one of the oldest cities in Eastern Europe, with continuous settlement going back well over a thousand years.",
    "The Sophia Cathedral in Kyiv was built in the eleventh century and preserves mosaics and frescoes from that period.",
    "The Zaporozhian Sich was a self-governing Cossack community on the lower Dnipro with its own elected leadership.",
    "Ukrainian is an East Slavic language written in Cyrillic, with a literary tradition going back several centuries.",
    "The Kyiv-Mohyla Academy, founded in the seventeenth century, was among the oldest institutions of higher learning in Eastern Europe.",
    "Taras Shevchenko's poetry, published from 1840, did more than any other single body of work to shape the modern literary language.",
    "The deep black soil of the steppe made the region one of the great grain producers of Europe.",
    "Lviv grew at the crossing of trade routes and its old town preserves buildings from several centuries side by side.",
    "Ukraine declared independence in 1991 and confirmed it by referendum the same year.",
    "Pysanky, eggs decorated with wax resist and dye in repeated layers, are a folk tradition of considerable age.",
  ],
  Vietnamese: [
    "The Dong Son culture cast large bronze drums more than two thousand years ago, decorated with concentric bands of figures.",
    "The Trung sisters led a revolt in the year 40 and are still commemorated across the country.",
    "Hanoi was founded as Thang Long in 1010 and has been a capital, on and off, ever since.",
    "The Temple of Literature in Hanoi was established in 1070 and became the country's first university.",
    "Vietnamese was written in Chinese-derived characters for centuries before the Latin-based quoc ngu script was adopted.",
    "The Le dynasty ruled for much of the period between the fifteenth and eighteenth centuries, the longest in Vietnamese history.",
    "Hoi An was a major trading port where Japanese, Chinese and European merchants met, and its old quarter survives largely intact.",
    "The Nguyen dynasty made Hue its capital in 1802 and built a citadel and imperial city there.",
    "Vietnam declared independence in September 1945.",
    "Wet rice cultivation in the Red River delta has supported dense settlement for thousands of years.",
  ],
  Arabic: [
    "The Arabic script spread with Islam from the seventh century and came to be used across three continents, including for languages unrelated to Arabic.",
    "The House of Wisdom in Baghdad translated Greek, Persian and Indian works into Arabic and preserved a great deal that would otherwise have been lost.",
    "Al-Khwarizmi's ninth-century treatise gave algebra its name, and a Latin rendering of his own name gave us the word algorithm.",
    "Ibn al-Haytham's Book of Optics, written around 1021, argued that vision works by light entering the eye rather than leaving it.",
    "The Great Mosque of Kairouan, founded in 670, is among the oldest places of worship in North Africa still in use.",
    "The numerals used across most of the world today reached Europe through Arabic mathematical texts, which is why they are called Arabic numerals.",
    "Al-Qarawiyyin in Fez, founded in 859, is often described as the oldest continuously operating degree-granting institution in the world.",
    "The Muallaqat are pre-Islamic odes said to have been hung at Mecca, and they remain a benchmark for classical Arabic poetry.",
    "Ibn Battuta travelled for nearly thirty years across Africa and Asia and dictated an account of it on his return.",
    "Damascus and Aleppo are among the longest continuously inhabited cities anywhere in the world.",
  ],
  Persian: [
    "Cyrus the Great founded the Achaemenid Empire in the sixth century BC, and it became the largest empire the world had yet seen.",
    "Persepolis was begun under Darius I and burned during Alexander's campaign, but its stone reliefs survive in remarkable condition.",
    "The qanat, an underground channel that moves water for kilometres by gravity alone, has irrigated the plateau for nearly three thousand years.",
    "Ferdowsi completed the Shahnameh around 1010 after roughly three decades of work, in some fifty thousand couplets.",
    "The windcatcher, or badgir, cooled buildings by the movement of air alone, long before mechanical air conditioning existed.",
    "Omar Khayyam helped reform the calendar in the eleventh century, producing one accurate to within a day over several thousand years.",
    "Naqsh-e Jahan Square in Isfahan was laid out in the early seventeenth century and is among the largest public squares in the world.",
    "Persian served as a language of administration and poetry far beyond Iran, from Anatolia to Bengal, for many centuries.",
    "The Cyrus Cylinder, from the sixth century BC, records the king's own account of taking Babylon.",
    "Chogha Zanbil, built around 1250 BC, is one of the few ziggurats still standing outside Mesopotamia.",
  ],
  German: [
    "Gutenberg printed his Bible at Mainz around 1455 using movable metal type, and roughly fifty copies survive.",
    "Martin Luther published his theses at Wittenberg in 1517, and the new printing presses spread them across Europe within weeks.",
    "The Hanseatic League linked trading towns around the Baltic and North Sea and set common rules for merchants across them.",
    "Johann Sebastian Bach worked at Leipzig from 1723 until his death in 1750, writing much of his church music there.",
    "The Brothers Grimm collected folk tales and also began a German dictionary so large it was not finished for over a century.",
    "Germany was unified in 1871 out of a collection of kingdoms, duchies and free cities.",
    "The Bauhaus school, founded in 1919, changed the teaching of design and architecture worldwide in only fourteen years of existence.",
    "Cologne Cathedral was begun in 1248 and finally completed in 1880, following the original medieval plans.",
    "Construction of the autobahn network began in the 1930s, and parts of the earliest sections are still in use.",
    "The Berlin Wall stood from 1961 until 1989 and ran for more than 150 kilometres around West Berlin.",
  ],
  Japanese: [
    "The Kojiki, completed in 712, is the oldest surviving Japanese chronicle and mixes myth, genealogy and early history.",
    "The Tale of Genji, written by Murasaki Shikibu around 1010, is often described as the world's first novel.",
    "Nara was the capital from 710 to 794, and Kyoto for more than a thousand years after that.",
    "The tea ceremony was given its lasting form by Sen no Rikyu in the sixteenth century, who stripped it back to almost nothing.",
    "The Edo period lasted from 1603 to 1868 and brought more than two centuries of internal peace.",
    "Ukiyo-e woodblock prints were produced in large numbers for ordinary buyers and later changed how European painters saw composition.",
    "Japanese writing combines kanji with two syllabaries, hiragana and katakana, each used for a different purpose.",
    "The Meiji Restoration of 1868 began a period of industrialisation so rapid it is still studied as an economic case.",
    "Himeji Castle, largely completed in 1609, survives in its original wooden form, having escaped both fire and war.",
    "Ise Shrine has been rebuilt on an adjacent site every twenty years for many centuries, transferring the craft rather than the building.",
  ],
  Bangladeshi: [
    "Bengal was among the wealthiest provinces of the Mughal Empire, and its textiles were traded across Asia and Europe.",
    "Muslin woven in Dhaka was famous for being so fine that a whole length could pass through a ring.",
    "The Sundarbans is the largest mangrove forest in the world and is shared between Bangladesh and India.",
    "Rabindranath Tagore won the Nobel Prize in Literature in 1913, the first from outside Europe to do so.",
    "The Language Movement of 1952 is commemorated on 21 February, now also observed as International Mother Language Day.",
    "Bangladesh became independent in 1971.",
    "The Somapura Mahavihara at Paharpur was a major Buddhist monastery of the eighth century and one of the largest south of the Himalayas.",
    "The Ganges delta is the largest river delta on Earth and is formed by three great rivers meeting.",
    "Bengali is among the most widely spoken languages in the world, with well over two hundred million speakers.",
    "Jamdani weaving of Dhaka, done on a handloom without any mechanical patterning, was recognised by UNESCO in 2013.",
  ],
};

/* Which scripts a passage in this language may legitimately be written in.
   Used only to warn, never to refuse. A language can be written in more than
   one script, and Hindi-Urdu is written in two. */
/* A script is not a language. Persian and Arabic are two different languages
   written in the same script, and Hindi and Urdu are one spoken language written
   in two — which is exactly the confusion this page exists to be careful about.
   The keys below are script ids; these are what a reader should be shown. */
export const SCRIPT_NAMES = {
  latin: "the Latin alphabet",
  arabic: "the Arabic script",
  cyrillic: "the Cyrillic alphabet",
  han: "Han characters",
  kana: "kana",
  hangul: "Hangul",
  devanagari: "Devanagari",
  bengali: "the Bengali script",
};
export const scriptName = (id) => SCRIPT_NAMES[id] || id;

export const SCRIPTS = {
  English: ["latin"], Indonesian: ["latin"], Latam: ["latin"], Nigerian: ["latin"],
  Turkish: ["latin"], Vietnamese: ["latin"], German: ["latin"],
  Chinese: ["han"], Japanese: ["kana", "han"], Korean: ["hangul"],
  Russian: ["cyrillic"], Ukranian: ["cyrillic"],
  Arabic: ["arabic"], Persian: ["arabic"],
  "Hindi-Urdu": ["devanagari", "arabic"],
  Bangladeshi: ["bengali"],
};

const RANGES = {
  latin: /[A-Za-z]/,
  arabic: /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/,
  cyrillic: /[Ѐ-ӿ]/,
  han: /[一-鿿]/,
  kana: /[぀-ヿ]/,
  hangul: /[가-힯ᄀ-ᇿ]/,
  devanagari: /[ऀ-ॿ]/,
  bengali: /[ঀ-৿]/,
};

/* The script a passage is mostly written in, by counting characters rather than
   by looking at the first one. A Persian sentence that opens with a Latin
   product name is still Persian. */
export function scriptOf(text) {
  const counts = {};
  for (const ch of text) {
    for (const [name, re] of Object.entries(RANGES)) {
      if (re.test(ch)) { counts[name] = (counts[name] || 0) + 1; break; }
    }
  }
  let best = null, most = 0;
  for (const [name, n] of Object.entries(counts)) if (n > most) { most = n; best = name; }
  return best;
}
