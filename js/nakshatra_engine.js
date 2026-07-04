import { normalizeDegrees } from "./birth_engine.js";

const NAKSHATRA_SIZE = 360 / 27;

const nakshatraNames = [
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashira",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Mula",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Shatabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati"
];

function determineNakshatra(longitude) {
    const normalized = normalizeDegrees(longitude);
    const index = Math.min(
        Math.floor(normalized / NAKSHATRA_SIZE),
        nakshatraNames.length - 1
    );
    const startLongitude = index * NAKSHATRA_SIZE;
    const endLongitude = startLongitude + NAKSHATRA_SIZE;

    return {
        index,
        number: index + 1,
        name: nakshatraNames[index],
        startLongitude,
        endLongitude,
        degreesIntoNakshatra: normalized - startLongitude
    };
}

function getNakshatra(longitude) {
    return determineNakshatra(longitude).index;
}

export {
    NAKSHATRA_SIZE,
    determineNakshatra,
    getNakshatra,
    nakshatraNames
};

if (typeof window !== "undefined") {
    window.determineNakshatra = determineNakshatra;
    window.getNakshatra = getNakshatra;
}
