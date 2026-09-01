/* Every language the page knows about, and which of them the page supports.
 *
 * Three kinds of entry:
 *
 *   discord: true   one of the fifteen communities with its own channel in the
 *                   GenLayer Discord. These are what the passages were written
 *                   for and what the contract's `communities()` publishes, and
 *                   they are the only markers drawn on the globe.
 *
 *   source: true    English. Not a Discord community: it is the language every
 *                   passage is written in, so it is the source rather than a
 *                   target, and it is offered as a target only for somebody
 *                   deliberately testing their English.
 *
 *   neither         the remaining sixty-one. The contract takes any language
 *                   string, so they are not blocked, but there are no passages
 *                   for them, they are not on the globe, and the page says so
 *                   before anybody spends a signature finding out. Keeping the
 *                   working set small is what keeps the page light enough to
 *                   draw seventy-seven markers' worth of work in none.
 *
 * `label` is what the contract is told. For the sixteen it is the community's
 * own name, because that is what `communities()` publishes and what validators
 * are handed. For the rest it is the plain English name of the language.
 *
 * `code` is the ISO 639-1 tag the in-page translator speaks. Nigerian maps to
 * `en`, because the machine translators do not offer Pidgin and pretending
 * otherwise would hand somebody English and call it Naijá.
 *
 * `endonym` is the language's name in itself, which is what belongs on a globe
 * next to a country.
 *
 * `aka` is the other names people actually type: the language's own name in
 * plain letters, and the countries where it is spoken. Without it "Farsi",
 * "Mandarin", "Bengali" and "Mexico" all found nothing, which reads as a site
 * that does not know the language rather than one that calls it something else.
 *
 * `lat`/`lon` place a marker where most of that language's speakers are. That
 * is a rough thing to do and it is only a map pin: Spanish is not Colombia and
 * Arabic is not Saudi Arabia, which is exactly why the label beside the pin is
 * the language rather than a flag.
 */

export const LANGUAGES = [
  // ---- the sixteen Discord communities -----------------------------------
  { label: "English",     code: "en", endonym: "English",           country: "United Kingdom", lat: 51.51,  lon: -0.13,   discord: false, source: true, aka: ["england", "usa", "united states", "america", "british", "american", "australia", "canada", "ireland", "new zealand"] },
  { label: "Chinese",     code: "zh", endonym: "中文",               country: "China",          lat: 39.90,  lon: 116.40,  discord: true, aka: ["mandarin", "putonghua", "zhongwen", "china", "taiwan", "singapore", "hong kong", "beijing", "simplified chinese"] },
  { label: "Hindi-Urdu",  code: "hi", endonym: "हिन्दी · اردو",        country: "India, Pakistan", lat: 28.61, lon: 77.21,  discord: true, aka: ["hindi", "urdu", "hindustani", "india", "pakistan", "devanagari", "delhi", "karachi", "lahore"] },
  { label: "Indonesian",  code: "id", endonym: "Bahasa Indonesia",  country: "Indonesia",      lat: -6.20,  lon: 106.85,  discord: true, aka: ["bahasa", "bahasa indonesia", "jakarta", "java", "indonesia"] },
  { label: "Latam",       code: "es", endonym: "Español",           country: "Latin America",  lat: 4.71,   lon: -74.07,  discord: true, aka: ["spanish", "espanol", "espa\u00f1ol", "castellano", "latin america", "mexico", "argentina", "colombia", "chile", "peru", "venezuela", "cuba", "bolivia", "ecuador", "guatemala", "uruguay", "paraguay", "dominican republic", "costa rica", "honduras", "nicaragua", "panama", "el salvador", "puerto rico"] },
  { label: "Nigerian",    code: "en", endonym: "Naijá",             country: "Nigeria",        lat: 6.52,   lon: 3.38,    discord: true, aka: ["pidgin", "naija", "broken english", "west african pidgin", "nigeria", "lagos"] },
  { label: "Russian",     code: "ru", endonym: "Русский",           country: "Russia",         lat: 55.76,  lon: 37.62,   discord: true, aka: ["russkiy", "russia", "moscow", "kazakhstan", "belarus", "cyrillic"] },
  { label: "Korean",      code: "ko", endonym: "한국어",              country: "Korea",          lat: 37.57,  lon: 126.98,  discord: true, aka: ["hangul", "hangeul", "south korea", "north korea", "seoul", "korea"] },
  { label: "Turkish",     code: "tr", endonym: "Türkçe",            country: "Türkiye",        lat: 39.93,  lon: 32.86,   discord: true, aka: ["turkey", "turkiye", "turkce", "istanbul", "ankara", "cyprus"] },
  { label: "Ukranian",    code: "uk", endonym: "Українська",        country: "Ukraine",        lat: 50.45,  lon: 30.52,   discord: true, aka: ["ukrainian", "ukraine", "kyiv", "kiev", "ukrayinska"] },
  { label: "Vietnamese",  code: "vi", endonym: "Tiếng Việt",        country: "Vietnam",        lat: 21.03,  lon: 105.85,  discord: true, aka: ["viet", "vietnam", "hanoi", "saigon", "ho chi minh", "tieng viet"] },
  { label: "Arabic",      code: "ar", endonym: "العربية",            country: "Arab world",     lat: 24.71,  lon: 46.68,   discord: true, aka: ["arabiya", "fusha", "modern standard arabic", "egypt", "cairo", "saudi arabia", "morocco", "algeria", "iraq", "syria", "jordan", "lebanon", "tunisia", "libya", "yemen", "sudan", "uae", "emirates", "kuwait", "qatar", "oman", "bahrain", "palestine"] },
  { label: "Persian",     code: "fa", endonym: "فارسی",             country: "Iran",           lat: 35.69,  lon: 51.39,   discord: true, aka: ["farsi", "parsi", "iran", "tehran", "dari", "afghanistan", "tajik"] },
  { label: "German",      code: "de", endonym: "Deutsch",           country: "Germany",        lat: 52.52,  lon: 13.40,   discord: true, aka: ["deutsch", "germany", "austria", "switzerland", "berlin", "vienna", "zurich"] },
  { label: "Japanese",    code: "ja", endonym: "日本語",              country: "Japan",          lat: 35.68,  lon: 139.69,  discord: true, aka: ["nihongo", "japan", "tokyo", "kanji", "hiragana", "katakana"] },
  { label: "Bangladeshi", code: "bn", endonym: "বাংলা",              country: "Bangladesh",     lat: 23.81,  lon: 90.41,   discord: true, aka: ["bengali", "bangla", "bangladesh", "dhaka", "west bengal", "kolkata"] },

  // ---- everything else, alphabetical by label ----------------------------
  { label: "Afrikaans",   code: "af", endonym: "Afrikaans",         country: "South Africa",   lat: -25.75, lon: 28.19,   discord: false, aka: ["south africa", "namibia", "cape town"] },
  { label: "Albanian",    code: "sq", endonym: "Shqip",             country: "Albania",        lat: 41.33,  lon: 19.82,   discord: false, aka: ["shqip", "albania", "kosovo", "tirana"] },
  { label: "Amharic",     code: "am", endonym: "አማርኛ",              country: "Ethiopia",       lat: 9.01,   lon: 38.76,   discord: false, aka: ["ethiopia", "addis ababa"] },
  { label: "Armenian",    code: "hy", endonym: "Հայերեն",           country: "Armenia",        lat: 40.18,  lon: 44.51,   discord: false, aka: ["hayeren", "armenia", "yerevan"] },
  { label: "Azerbaijani", code: "az", endonym: "Azərbaycanca",      country: "Azerbaijan",     lat: 40.41,  lon: 49.87,   discord: false, aka: ["azeri", "azerbaijan", "baku"] },
  { label: "Basque",      code: "eu", endonym: "Euskara",           country: "Basque Country", lat: 43.26,  lon: -2.93,   discord: false, aka: ["euskara", "bilbao", "spain", "france"] },
  { label: "Belarusian",  code: "be", endonym: "Беларуская",        country: "Belarus",        lat: 53.90,  lon: 27.57,   discord: false, aka: ["belarus", "minsk"] },
  { label: "Bulgarian",   code: "bg", endonym: "Български",         country: "Bulgaria",       lat: 42.70,  lon: 23.32,   discord: false, aka: ["bulgaria", "sofia"] },
  { label: "Burmese",     code: "my", endonym: "မြန်မာဘာသာ",          country: "Myanmar",        lat: 16.87,  lon: 96.20,   discord: false, aka: ["myanmar", "burma", "yangon"] },
  { label: "Catalan",     code: "ca", endonym: "Català",            country: "Catalonia",      lat: 41.39,  lon: 2.17,    discord: false, aka: ["catala", "barcelona", "valencia", "andorra", "spain"] },
  { label: "Croatian",    code: "hr", endonym: "Hrvatski",          country: "Croatia",        lat: 45.81,  lon: 15.98,   discord: false, aka: ["hrvatski", "croatia", "zagreb"] },
  { label: "Czech",       code: "cs", endonym: "Čeština",           country: "Czechia",        lat: 50.08,  lon: 14.44,   discord: false, aka: ["cestina", "czechia", "czech republic", "prague"] },
  { label: "Danish",      code: "da", endonym: "Dansk",             country: "Denmark",        lat: 55.68,  lon: 12.57,   discord: false, aka: ["dansk", "denmark", "copenhagen"] },
  { label: "Dutch",       code: "nl", endonym: "Nederlands",        country: "Netherlands",    lat: 52.37,  lon: 4.90,    discord: false, aka: ["nederlands", "netherlands", "holland", "belgium", "flemish", "amsterdam"] },
  { label: "Estonian",    code: "et", endonym: "Eesti",             country: "Estonia",        lat: 59.44,  lon: 24.75,   discord: false, aka: ["eesti", "estonia", "tallinn"] },
  { label: "Filipino",    code: "tl", endonym: "Filipino",          country: "Philippines",    lat: 14.60,  lon: 120.98,  discord: false, aka: ["tagalog", "philippines", "manila", "pilipino"] },
  { label: "Finnish",     code: "fi", endonym: "Suomi",             country: "Finland",        lat: 60.17,  lon: 24.94,   discord: false, aka: ["suomi", "finland", "helsinki"] },
  { label: "French",      code: "fr", endonym: "Français",          country: "France",         lat: 48.86,  lon: 2.35,    discord: false, aka: ["francais", "france", "paris", "quebec", "canada", "belgium", "switzerland", "senegal", "ivory coast", "morocco"] },
  { label: "Georgian",    code: "ka", endonym: "ქართული",           country: "Georgia",        lat: 41.72,  lon: 44.78,   discord: false, aka: ["kartuli", "georgia", "tbilisi"] },
  { label: "Greek",       code: "el", endonym: "Ελληνικά",          country: "Greece",         lat: 37.98,  lon: 23.73,   discord: false, aka: ["ellinika", "greece", "athens", "cyprus"] },
  { label: "Gujarati",    code: "gu", endonym: "ગુજરાતી",             country: "India",          lat: 23.02,  lon: 72.57,   discord: false, aka: ["india", "gujarat", "ahmedabad"] },
  { label: "Hausa",       code: "ha", endonym: "Hausa",             country: "Nigeria, Niger", lat: 12.00,  lon: 8.52,    discord: false, aka: ["nigeria", "niger", "kano"] },
  { label: "Hebrew",      code: "he", endonym: "עברית",             country: "Israel",         lat: 31.77,  lon: 35.21,   discord: false, aka: ["ivrit", "israel", "tel aviv", "jerusalem"] },
  { label: "Hungarian",   code: "hu", endonym: "Magyar",            country: "Hungary",        lat: 47.50,  lon: 19.04,   discord: false, aka: ["magyar", "hungary", "budapest"] },
  { label: "Icelandic",   code: "is", endonym: "Íslenska",          country: "Iceland",        lat: 64.15,  lon: -21.94,  discord: false, aka: ["islenska", "iceland", "reykjavik"] },
  { label: "Igbo",        code: "ig", endonym: "Igbo",              country: "Nigeria",        lat: 6.34,   lon: 7.36,    discord: false, aka: ["nigeria", "enugu"] },
  { label: "Italian",     code: "it", endonym: "Italiano",          country: "Italy",          lat: 41.90,  lon: 12.50,   discord: false, aka: ["italiano", "italy", "rome", "milan", "switzerland"] },
  { label: "Kannada",     code: "kn", endonym: "ಕನ್ನಡ",              country: "India",          lat: 12.97,  lon: 77.59,   discord: false, aka: ["india", "karnataka", "bangalore", "bengaluru"] },
  { label: "Kazakh",      code: "kk", endonym: "Қазақша",           country: "Kazakhstan",     lat: 51.17,  lon: 71.45,   discord: false, aka: ["kazakhstan", "almaty", "astana"] },
  { label: "Khmer",       code: "km", endonym: "ភាសាខ្មែរ",            country: "Cambodia",       lat: 11.56,  lon: 104.92,  discord: false, aka: ["cambodia", "phnom penh"] },
  { label: "Kurdish",     code: "ku", endonym: "Kurdî",             country: "Kurdistan",      lat: 36.19,  lon: 44.01,   discord: false, aka: ["kurmanji", "sorani", "iraq", "turkey", "syria", "iran", "erbil"] },
  { label: "Lao",         code: "lo", endonym: "ລາວ",                country: "Laos",           lat: 17.97,  lon: 102.63,  discord: false, aka: ["laos", "vientiane"] },
  { label: "Latvian",     code: "lv", endonym: "Latviešu",          country: "Latvia",         lat: 56.95,  lon: 24.11,   discord: false, aka: ["latviesu", "latvia", "riga"] },
  { label: "Lithuanian",  code: "lt", endonym: "Lietuvių",          country: "Lithuania",      lat: 54.69,  lon: 25.28,   discord: false, aka: ["lietuviu", "lithuania", "vilnius"] },
  { label: "Macedonian",  code: "mk", endonym: "Македонски",        country: "North Macedonia", lat: 41.998, lon: 21.43,  discord: false, aka: ["north macedonia", "skopje"] },
  { label: "Malay",       code: "ms", endonym: "Bahasa Melayu",     country: "Malaysia",       lat: 3.14,   lon: 101.69,  discord: false, aka: ["bahasa melayu", "malaysia", "brunei", "singapore", "kuala lumpur"] },
  { label: "Malayalam",   code: "ml", endonym: "മലയാളം",            country: "India",          lat: 9.93,   lon: 76.27,   discord: false, aka: ["india", "kerala", "kochi"] },
  { label: "Marathi",     code: "mr", endonym: "मराठी",              country: "India",          lat: 19.08,  lon: 72.88,   discord: false, aka: ["india", "maharashtra", "mumbai"] },
  { label: "Mongolian",   code: "mn", endonym: "Монгол",            country: "Mongolia",       lat: 47.89,  lon: 106.91,  discord: false, aka: ["mongolia", "ulaanbaatar"] },
  { label: "Nepali",      code: "ne", endonym: "नेपाली",              country: "Nepal",          lat: 27.72,  lon: 85.32,   discord: false, aka: ["nepal", "kathmandu"] },
  { label: "Norwegian",   code: "no", endonym: "Norsk",             country: "Norway",         lat: 59.91,  lon: 10.75,   discord: false, aka: ["norsk", "norway", "oslo", "bokmal"] },
  { label: "Pashto",      code: "ps", endonym: "پښتو",              country: "Afghanistan",    lat: 34.53,  lon: 69.17,   discord: false, aka: ["pashtu", "afghanistan", "pakistan", "kabul", "peshawar"] },
  { label: "Polish",      code: "pl", endonym: "Polski",            country: "Poland",         lat: 52.23,  lon: 21.01,   discord: false, aka: ["polski", "poland", "warsaw", "krakow"] },
  { label: "Portuguese",  code: "pt", endonym: "Português",         country: "Portugal, Brazil", lat: 38.72, lon: -9.14,  discord: false, aka: ["portugues", "portugal", "brazil", "brasil", "lisbon", "sao paulo", "angola", "mozambique"] },
  { label: "Punjabi",     code: "pa", endonym: "ਪੰਜਾਬੀ",              country: "India, Pakistan", lat: 31.55, lon: 74.34,  discord: false, aka: ["panjabi", "india", "pakistan", "lahore", "amritsar"] },
  { label: "Romanian",    code: "ro", endonym: "Română",            country: "Romania",        lat: 44.43,  lon: 26.10,   discord: false, aka: ["romana", "romania", "moldova", "bucharest"] },
  { label: "Serbian",     code: "sr", endonym: "Српски",            country: "Serbia",         lat: 44.79,  lon: 20.45,   discord: false, aka: ["srpski", "serbia", "belgrade"] },
  { label: "Sinhala",     code: "si", endonym: "සිංහල",              country: "Sri Lanka",      lat: 6.93,   lon: 79.86,   discord: false, aka: ["sinhalese", "sri lanka", "colombo"] },
  { label: "Slovak",      code: "sk", endonym: "Slovenčina",        country: "Slovakia",       lat: 48.15,  lon: 17.11,   discord: false, aka: ["slovencina", "slovakia", "bratislava"] },
  { label: "Slovenian",   code: "sl", endonym: "Slovenščina",       country: "Slovenia",       lat: 46.06,  lon: 14.51,   discord: false, aka: ["slovenscina", "slovenia", "ljubljana"] },
  { label: "Somali",      code: "so", endonym: "Soomaali",          country: "Somalia",        lat: 2.05,   lon: 45.32,   discord: false, aka: ["somalia", "somaliland", "mogadishu", "djibouti"] },
  { label: "Spanish",     code: "es", endonym: "Español",           country: "Spain",          lat: 40.42,  lon: -3.70,   discord: false, aka: ["espanol", "castellano", "spain", "madrid", "barcelona"] },
  { label: "Swahili",     code: "sw", endonym: "Kiswahili",         country: "East Africa",    lat: -6.79,  lon: 39.21,   discord: false, aka: ["kiswahili", "kenya", "tanzania", "uganda", "congo", "nairobi"] },
  { label: "Swedish",     code: "sv", endonym: "Svenska",           country: "Sweden",         lat: 59.33,  lon: 18.07,   discord: false, aka: ["svenska", "sweden", "stockholm", "finland"] },
  { label: "Tamil",       code: "ta", endonym: "தமிழ்",              country: "India, Sri Lanka", lat: 13.08, lon: 80.27, discord: false, aka: ["india", "sri lanka", "singapore", "tamil nadu", "chennai"] },
  { label: "Telugu",      code: "te", endonym: "తెలుగు",              country: "India",          lat: 17.39,  lon: 78.49,   discord: false, aka: ["india", "andhra pradesh", "telangana", "hyderabad"] },
  { label: "Thai",        code: "th", endonym: "ไทย",                country: "Thailand",       lat: 13.76,  lon: 100.50,  discord: false, aka: ["thailand", "bangkok"] },
  { label: "Tigrinya",    code: "ti", endonym: "ትግርኛ",              country: "Eritrea",        lat: 15.34,  lon: 38.93,   discord: false, aka: ["eritrea", "ethiopia", "tigray", "asmara"] },
  { label: "Uzbek",       code: "uz", endonym: "Oʻzbekcha",         country: "Uzbekistan",     lat: 41.30,  lon: 69.24,   discord: false, aka: ["uzbekistan", "tashkent"] },
  { label: "Yoruba",      code: "yo", endonym: "Yorùbá",            country: "Nigeria, Benin", lat: 7.38,   lon: 3.90,    discord: false, aka: ["nigeria", "benin", "lagos", "ibadan"] },
  { label: "Zulu",        code: "zu", endonym: "isiZulu",           country: "South Africa",   lat: -29.86, lon: 31.02,   discord: false, aka: ["isizulu", "south africa", "durban"] },
];

/* The fifteen with a channel. */
export const DISCORD = LANGUAGES.filter((l) => l.discord);

/* What the page fully supports: the fifteen, plus English as the source. */
export const SUPPORTED = LANGUAGES.filter((l) => l.discord || l.source);
export const isSupported = (label) => SUPPORTED.some((l) => l.label === label);

/* Search across the three names somebody might type: the label, the language's
   own name, and the country. Somebody looking for their language is as likely
   to type "Iran" or "فارسی" as "Persian". */
export function search(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return LANGUAGES;
  const hit = (l) =>
    l.label.toLowerCase().includes(q) ||
    l.endonym.toLowerCase().includes(q) ||
    l.country.toLowerCase().includes(q) ||
    (l.aka || []).some((a) => a.includes(q));
  /* Supported first, so the ones with passages and a place on the globe are
     what you see when several languages match. Searching "spanish" should put
     Latam above Spain's Spanish, because Latam is the one this page can do
     anything with. */
  const rank = (l) => (l.discord ? 2 : l.source ? 1 : 0);
  return LANGUAGES.filter(hit).sort((a, b) => rank(b) - rank(a));
}
