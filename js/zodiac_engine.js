import { normalizeDegrees } from "./birth_engine.js";
const ZODIAC_SIZE = 30;

const zodiacNames = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
];

function determineZodiac(longitude) {
    const normalized = normalizeDegrees(longitude);
    const index = Math.min(Math.floor(normalized / ZODIAC_SIZE), zodiacNames.length - 1);

    return {
        index,
        number: index + 1,
        name: zodiacNames[index],
        degree: normalized % ZODIAC_SIZE
    };
}

function getZodiac(longitude) {
    return determineZodiac(longitude).name;
}

export {
    ZODIAC_SIZE,
    determineZodiac,
    getZodiac,
    zodiacNames
};

if (typeof window !== "undefined") {
    window.determineZodiac = determineZodiac;
    window.getZodiac = getZodiac;
}
