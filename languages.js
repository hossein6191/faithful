/* Every language the page offers, and where to put it on a globe.
 *
 * Two kinds of entry, and the difference is the point:
 *
 *   discord: true   one of the sixteen communities that has its own channel.
 *                   These are the ones the passages were written for, and the
 *                   ones the contract's `communities()` publishes.
 *
 *   discord: false  everything else. The contract accepts any language string,
 *                   so a translator who works in one of these is not turned
 *                   away; there are simply no ready-made passages, and the page
 *                   says so and lets them paste their own source.
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
 * `lat`/`lon` place a marker where most of that language's speakers are. That
 * is a rough thing to do and it is only a map pin: Spanish is not Colombia and
 * Arabic is not Saudi Arabia, which is exactly why the label beside the pin is
 * the language rather than a flag.
 */

export const LANGUAGES = [
  // ---- the sixteen Discord communities -----------------------------------
  { label: "English",     code: "en", endonym: "English",           country: "United Kingdom", lat: 51.51,  lon: -0.13,   discord: true },
  { label: "Chinese",     code: "zh", endonym: "中文",               country: "China",          lat: 39.90,  lon: 116.40,  discord: true },
  { label: "Hindi-Urdu",  code: "hi", endonym: "हिन्दी · اردو",        country: "India, Pakistan", lat: 28.61, lon: 77.21,  discord: true },
  { label: "Indonesian",  code: "id", endonym: "Bahasa Indonesia",  country: "Indonesia",      lat: -6.20,  lon: 106.85,  discord: true },
  { label: "Latam",       code: "es", endonym: "Español",           country: "Latin America",  lat: 4.71,   lon: -74.07,  discord: true },
  { label: "Nigerian",    code: "en", endonym: "Naijá",             country: "Nigeria",        lat: 6.52,   lon: 3.38,    discord: true },
  { label: "Russian",     code: "ru", endonym: "Русский",           country: "Russia",         lat: 55.76,  lon: 37.62,   discord: true },
  { label: "Korean",      code: "ko", endonym: "한국어",              country: "Korea",          lat: 37.57,  lon: 126.98,  discord: true },
  { label: "Turkish",     code: "tr", endonym: "Türkçe",            country: "Türkiye",        lat: 39.93,  lon: 32.86,   discord: true },
  { label: "Ukranian",    code: "uk", endonym: "Українська",        country: "Ukraine",        lat: 50.45,  lon: 30.52,   discord: true },
  { label: "Vietnamese",  code: "vi", endonym: "Tiếng Việt",        country: "Vietnam",        lat: 21.03,  lon: 105.85,  discord: true },
  { label: "Arabic",      code: "ar", endonym: "العربية",            country: "Arab world",     lat: 24.71,  lon: 46.68,   discord: true },
  { label: "Persian",     code: "fa", endonym: "فارسی",             country: "Iran",           lat: 35.69,  lon: 51.39,   discord: true },
  { label: "German",      code: "de", endonym: "Deutsch",           country: "Germany",        lat: 52.52,  lon: 13.40,   discord: true },
  { label: "Japanese",    code: "ja", endonym: "日本語",              country: "Japan",          lat: 35.68,  lon: 139.69,  discord: true },
  { label: "Bangladeshi", code: "bn", endonym: "বাংলা",              country: "Bangladesh",     lat: 23.81,  lon: 90.41,   discord: true },

  // ---- everything else, alphabetical by label ----------------------------
  { label: "Afrikaans",   code: "af", endonym: "Afrikaans",         country: "South Africa",   lat: -25.75, lon: 28.19,   discord: false },
  { label: "Albanian",    code: "sq", endonym: "Shqip",             country: "Albania",        lat: 41.33,  lon: 19.82,   discord: false },
  { label: "Amharic",     code: "am", endonym: "አማርኛ",              country: "Ethiopia",       lat: 9.01,   lon: 38.76,   discord: false },
  { label: "Armenian",    code: "hy", endonym: "Հայերեն",           country: "Armenia",        lat: 40.18,  lon: 44.51,   discord: false },
  { label: "Azerbaijani", code: "az", endonym: "Azərbaycanca",      country: "Azerbaijan",     lat: 40.41,  lon: 49.87,   discord: false },
  { label: "Basque",      code: "eu", endonym: "Euskara",           country: "Basque Country", lat: 43.26,  lon: -2.93,   discord: false },
  { label: "Belarusian",  code: "be", endonym: "Беларуская",        country: "Belarus",        lat: 53.90,  lon: 27.57,   discord: false },
  { label: "Bulgarian",   code: "bg", endonym: "Български",         country: "Bulgaria",       lat: 42.70,  lon: 23.32,   discord: false },
  { label: "Burmese",     code: "my", endonym: "မြန်မာဘာသာ",          country: "Myanmar",        lat: 16.87,  lon: 96.20,   discord: false },
  { label: "Catalan",     code: "ca", endonym: "Català",            country: "Catalonia",      lat: 41.39,  lon: 2.17,    discord: false },
  { label: "Croatian",    code: "hr", endonym: "Hrvatski",          country: "Croatia",        lat: 45.81,  lon: 15.98,   discord: false },
  { label: "Czech",       code: "cs", endonym: "Čeština",           country: "Czechia",        lat: 50.08,  lon: 14.44,   discord: false },
  { label: "Danish",      code: "da", endonym: "Dansk",             country: "Denmark",        lat: 55.68,  lon: 12.57,   discord: false },
  { label: "Dutch",       code: "nl", endonym: "Nederlands",        country: "Netherlands",    lat: 52.37,  lon: 4.90,    discord: false },
  { label: "Estonian",    code: "et", endonym: "Eesti",             country: "Estonia",        lat: 59.44,  lon: 24.75,   discord: false },
  { label: "Filipino",    code: "tl", endonym: "Filipino",          country: "Philippines",    lat: 14.60,  lon: 120.98,  discord: false },
  { label: "Finnish",     code: "fi", endonym: "Suomi",             country: "Finland",        lat: 60.17,  lon: 24.94,   discord: false },
  { label: "French",      code: "fr", endonym: "Français",          country: "France",         lat: 48.86,  lon: 2.35,    discord: false },
  { label: "Georgian",    code: "ka", endonym: "ქართული",           country: "Georgia",        lat: 41.72,  lon: 44.78,   discord: false },
  { label: "Greek",       code: "el", endonym: "Ελληνικά",          country: "Greece",         lat: 37.98,  lon: 23.73,   discord: false },
  { label: "Gujarati",    code: "gu", endonym: "ગુજરાતી",             country: "India",          lat: 23.02,  lon: 72.57,   discord: false },
  { label: "Hausa",       code: "ha", endonym: "Hausa",             country: "Nigeria, Niger", lat: 12.00,  lon: 8.52,    discord: false },
  { label: "Hebrew",      code: "he", endonym: "עברית",             country: "Israel",         lat: 31.77,  lon: 35.21,   discord: false },
  { label: "Hungarian",   code: "hu", endonym: "Magyar",            country: "Hungary",        lat: 47.50,  lon: 19.04,   discord: false },
  { label: "Icelandic",   code: "is", endonym: "Íslenska",          country: "Iceland",        lat: 64.15,  lon: -21.94,  discord: false },
  { label: "Igbo",        code: "ig", endonym: "Igbo",              country: "Nigeria",        lat: 6.34,   lon: 7.36,    discord: false },
  { label: "Italian",     code: "it", endonym: "Italiano",          country: "Italy",          lat: 41.90,  lon: 12.50,   discord: false },
  { label: "Kannada",     code: "kn", endonym: "ಕನ್ನಡ",              country: "India",          lat: 12.97,  lon: 77.59,   discord: false },
  { label: "Kazakh",      code: "kk", endonym: "Қазақша",           country: "Kazakhstan",     lat: 51.17,  lon: 71.45,   discord: false },
  { label: "Khmer",       code: "km", endonym: "ភាសាខ្មែរ",            country: "Cambodia",       lat: 11.56,  lon: 104.92,  discord: false },
  { label: "Kurdish",     code: "ku", endonym: "Kurdî",             country: "Kurdistan",      lat: 36.19,  lon: 44.01,   discord: false },
  { label: "Lao",         code: "lo", endonym: "ລາວ",                country: "Laos",           lat: 17.97,  lon: 102.63,  discord: false },
  { label: "Latvian",     code: "lv", endonym: "Latviešu",          country: "Latvia",         lat: 56.95,  lon: 24.11,   discord: false },
  { label: "Lithuanian",  code: "lt", endonym: "Lietuvių",          country: "Lithuania",      lat: 54.69,  lon: 25.28,   discord: false },
  { label: "Macedonian",  code: "mk", endonym: "Македонски",        country: "North Macedonia", lat: 41.998, lon: 21.43,  discord: false },
  { label: "Malay",       code: "ms", endonym: "Bahasa Melayu",     country: "Malaysia",       lat: 3.14,   lon: 101.69,  discord: false },
  { label: "Malayalam",   code: "ml", endonym: "മലയാളം",            country: "India",          lat: 9.93,   lon: 76.27,   discord: false },
  { label: "Marathi",     code: "mr", endonym: "मराठी",              country: "India",          lat: 19.08,  lon: 72.88,   discord: false },
  { label: "Mongolian",   code: "mn", endonym: "Монгол",            country: "Mongolia",       lat: 47.89,  lon: 106.91,  discord: false },
  { label: "Nepali",      code: "ne", endonym: "नेपाली",              country: "Nepal",          lat: 27.72,  lon: 85.32,   discord: false },
  { label: "Norwegian",   code: "no", endonym: "Norsk",             country: "Norway",         lat: 59.91,  lon: 10.75,   discord: false },
  { label: "Pashto",      code: "ps", endonym: "پښتو",              country: "Afghanistan",    lat: 34.53,  lon: 69.17,   discord: false },
  { label: "Polish",      code: "pl", endonym: "Polski",            country: "Poland",         lat: 52.23,  lon: 21.01,   discord: false },
  { label: "Portuguese",  code: "pt", endonym: "Português",         country: "Portugal, Brazil", lat: 38.72, lon: -9.14,  discord: false },
  { label: "Punjabi",     code: "pa", endonym: "ਪੰਜਾਬੀ",              country: "India, Pakistan", lat: 31.55, lon: 74.34,  discord: false },
  { label: "Romanian",    code: "ro", endonym: "Română",            country: "Romania",        lat: 44.43,  lon: 26.10,   discord: false },
  { label: "Serbian",     code: "sr", endonym: "Српски",            country: "Serbia",         lat: 44.79,  lon: 20.45,   discord: false },
  { label: "Sinhala",     code: "si", endonym: "සිංහල",              country: "Sri Lanka",      lat: 6.93,   lon: 79.86,   discord: false },
  { label: "Slovak",      code: "sk", endonym: "Slovenčina",        country: "Slovakia",       lat: 48.15,  lon: 17.11,   discord: false },
  { label: "Slovenian",   code: "sl", endonym: "Slovenščina",       country: "Slovenia",       lat: 46.06,  lon: 14.51,   discord: false },
  { label: "Somali",      code: "so", endonym: "Soomaali",          country: "Somalia",        lat: 2.05,   lon: 45.32,   discord: false },
  { label: "Spanish",     code: "es", endonym: "Español",           country: "Spain",          lat: 40.42,  lon: -3.70,   discord: false },
  { label: "Swahili",     code: "sw", endonym: "Kiswahili",         country: "East Africa",    lat: -6.79,  lon: 39.21,   discord: false },
  { label: "Swedish",     code: "sv", endonym: "Svenska",           country: "Sweden",         lat: 59.33,  lon: 18.07,   discord: false },
  { label: "Tamil",       code: "ta", endonym: "தமிழ்",              country: "India, Sri Lanka", lat: 13.08, lon: 80.27, discord: false },
  { label: "Telugu",      code: "te", endonym: "తెలుగు",              country: "India",          lat: 17.39,  lon: 78.49,   discord: false },
  { label: "Thai",        code: "th", endonym: "ไทย",                country: "Thailand",       lat: 13.76,  lon: 100.50,  discord: false },
  { label: "Tigrinya",    code: "ti", endonym: "ትግርኛ",              country: "Eritrea",        lat: 15.34,  lon: 38.93,   discord: false },
  { label: "Uzbek",       code: "uz", endonym: "Oʻzbekcha",         country: "Uzbekistan",     lat: 41.30,  lon: 69.24,   discord: false },
  { label: "Yoruba",      code: "yo", endonym: "Yorùbá",            country: "Nigeria, Benin", lat: 7.38,   lon: 3.90,    discord: false },
  { label: "Zulu",        code: "zu", endonym: "isiZulu",           country: "South Africa",   lat: -29.86, lon: 31.02,   discord: false },
];

export const DISCORD = LANGUAGES.filter((l) => l.discord);

/* Search across the three names somebody might type: the label, the language's
   own name, and the country. Somebody looking for their language is as likely
   to type "Iran" or "فارسی" as "Persian". */
export function search(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return LANGUAGES;
  const hit = (l) =>
    l.label.toLowerCase().includes(q) ||
    l.endonym.toLowerCase().includes(q) ||
    l.country.toLowerCase().includes(q);
  /* Communities first, so the ones with passages are what you see when several
     languages match. */
  return LANGUAGES.filter(hit).sort((a, b) => (b.discord === true) - (a.discord === true));
}
