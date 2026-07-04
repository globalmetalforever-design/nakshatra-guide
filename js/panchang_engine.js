import { calculateSunMoonLongitudes, normalizeDegrees } from "./swiss_wrapper.js";

const TITHIS = [
    "Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami",
    "Shashthi","Saptami","Ashtami","Navami","Dashami",
    "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
    "Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami",
    "Shashthi","Saptami","Ashtami","Navami","Dashami",
    "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya"
];

const KARANAS = [
    "Bava","Balava","Kaulava","Taitila",
    "Garaja","Vanija","Vishti"
];

const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const YOGAS = [
    "Vishkambha","Priti","Ayushman","Saubhagya","Shobhana",
    "Atiganda","Sukarma","Dhriti","Shoola","Ganda",
    "Vriddhi","Dhruva","Vyaghata","Harshana","Vajra",
    "Siddhi","Vyatipata","Variyana","Parigha","Shiva",
    "Siddha","Sadhya","Shubha","Shukla","Brahma",
    "Indra","Vaidhriti"
];

export async function getTodayPanchang(date = new Date()) {
    // CRITICAL ENGINES REFACTOR: We map variables strictly from the explicit date argument instance
    const birthInput = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        timezone: -date.getTimezoneOffset() / 60
    };

    const astro = await calculateSunMoonLongitudes(birthInput);

    const ayanamsa = astro.ayanamsa;
    const sunSidereal = normalizeDegrees(astro.tropicalSunLongitude - ayanamsa);
    const moonSidereal = astro.siderealMoonLongitude; 

    const elongation = normalizeDegrees(moonSidereal - sunSidereal);
    const tithiIndex = Math.min(Math.floor(elongation / 12), 29);

    const yogaIndex = Math.min(
        Math.floor(normalizeDegrees(sunSidereal + moonSidereal) / (360 / 27)),
        26
    );

    const totalHalfTithis = Math.floor(elongation / 6);
    let karanaName = "";

    if (totalHalfTithis === 0) {
        karanaName = "Kimstughna";
    } else if (totalHalfTithis >= 57) {
        if (totalHalfTithis === 57) karanaName = "Shakuni";
        else if (totalHalfTithis === 58) karanaName = "Chatuspada";
        else karanaName = "Naga";
    } else {
        karanaName = KARANAS[(totalHalfTithis - 1) % 7];
    }

    return {
        date: date.toISOString().slice(0, 10),
        vara: WEEKDAYS[date.getDay()],
        tithi: TITHIS[tithiIndex],
        yoga: YOGAS[yogaIndex],
        karana: karanaName
    };
}