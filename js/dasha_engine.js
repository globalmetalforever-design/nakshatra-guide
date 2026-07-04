const DASHA_LORDS = [
    { name: "Ketu", years: 7 },
    { name: "Venus", years: 20 },
    { name: "Sun", years: 6 },
    { name: "Moon", years: 10 },
    { name: "Mars", years: 7 },
    { name: "Rahu", years: 18 },
    { name: "Jupiter", years: 16 },
    { name: "Saturn", years: 19 },
    { name: "Mercury", years: 17 }
];

/**
 * Calculates a 120-year Vimshottari Maha Dasha timeline starting from the date of birth.
 * @param {Object} birthData - The confirmed natal profile profile object.
 * @param {Date} birthDate - The validated JavaScript Date object representing the DOB.
 * @returns {Array} List of timeline objects containing planetary periods, start dates, and end dates.
 */
export function calculateVimshottariTimeline(birthData, birthDate) {
    if (!birthData || !birthDate) return [];
    
    const nakNumber = birthData?.nakshatra?.number || 1; // 1 to 27
    const padaNum = birthData?.pada?.number || 1;       // 1 to 4
    
    // Determine initial dasha lord based on the Nakshatra ruler sequence
    const initialLordIndex = (nakNumber - 1) % 9;
    
    // Calculate the elapsed balance portion based on the Pada value
    const currentLord = DASHA_LORDS[initialLordIndex];
    const balanceFactor = (4 - padaNum) / 4; 
    const initialLordRemainingYears = currentLord.years * balanceFactor;
    
    let currentTimelineDate = new Date(birthDate.getTime());
    const timeline = [];
    
    // Project periods sequentially across the 120-year cycle
    for (let i = 0; i < 9; i++) {
        const lordIndex = (initialLordIndex + i) % 9;
        const lord = DASHA_LORDS[lordIndex];
        
        const start = new Date(currentTimelineDate.getTime());
        const durationYears = (i === 0) ? initialLordRemainingYears : lord.years;
        
        // Add years to the current timeline marker date
        currentTimelineDate.setFullYear(currentTimelineDate.getFullYear() + Math.floor(durationYears));
        const fractionalDays = Math.round((durationYears % 1) * 365.25);
        currentTimelineDate.setDate(currentTimelineDate.getDate() + fractionalDays);
        
        const end = new Date(currentTimelineDate.getTime());
        
        timeline.push({
            lord: lord.name,
            duration: durationYears.toFixed(2),
            startDate: start.toLocaleDateString('en-GB'), // DD/MM/YYYY
            endDate: end.toLocaleDateString('en-GB')
        });
    }
    
    return timeline;
}