import { calculateSunMoonLongitudes, normalizeDegrees } from "./birth_engine.js?v=12";

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

export async function getTodayPanchang(birthInput, targetDate = new Date()) {
    // Extract properties defensively to support multiple naming schemas (e.g., hour vs birthHour)
    const year = birthInput.year || birthInput.birthYear;
    const month = birthInput.month || birthInput.birthMonth;
    const day = birthInput.day || birthInput.birthDay;
    const hour = birthInput.hour !== undefined ? birthInput.hour : birthInput.birthHour;
    const minute = birthInput.minute !== undefined ? birthInput.minute : (birthInput.birthMinute ?? 0);
    const timezone = birthInput.timezone !== undefined ? birthInput.timezone : (birthInput.birthTimezone ?? 0);

    // 1. Structure the target date fields cleanly for the ephemeris reader
    const targetInput = {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        day: targetDate.getDate(),
        hour: hour,
        minute: minute,
        timezone: timezone
    };

    // 2. Fetch the true planet positions for this specific target calendar day
    const positions = await calculateSunMoonLongitudes(targetInput);
    
    // 3. Compute transit Nakshatra indexes for this date
    const nakshatraTotalDegrees = 360 / 27;
    const nakshatraIndex = Math.floor(positions.siderealMoonLongitude / nakshatraTotalDegrees);
    
    // 4. Compute transit Tithi (Elongation tracking)
    const tithiIndex = Math.floor(positions.elongation / 12);

    return {
        julianDay: positions.julianDay,
        siderealMoonLongitude: positions.siderealMoonLongitude,
        siderealSunLongitude: positions.siderealSunLongitude,
        nakshatraIndex: nakshatraIndex,
        tithiIndex: tithiIndex,
        isWaxing: positions.isWaxing
    };
}