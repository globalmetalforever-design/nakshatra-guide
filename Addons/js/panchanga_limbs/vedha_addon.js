/**
 * Addon Module: Implements highly precise Gochara Vedha (planetary obstruction) exception checks.
 * Note: Structural exceptions apply where specific alignments do not form Vedha pairs (e.g., Sun-Saturn / Moon-Mercury).
 */
export function checkPlanetaryVedha(planet, currentHouse, entireHouseMap) {
    const vedhaMap = {
        sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
        mars: { 3: 12, 6: 9, 11: 5 },
        mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
        jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
        venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 3, 12: 6 },
        saturn: { 3: 12, 6: 9, 11: 5 }
    };

    const targetPairs = vedhaMap[planet];
    if (!targetPairs || !targetPairs[currentHouse]) return false; // Not in a position that can be obstructed

    const obstructionHouseTarget = targetPairs[currentHouse];

    // Scan through all active transit coordinates to find out if an obstruction body is occupying that space
    for (const [otherPlanet, activeHouse] of Object.entries(entireHouseMap)) {
        if (otherPlanet === planet) continue;
        
        if (activeHouse === obstructionHouseTarget) {
            // Apply exemptions rules for exceptional classic planetary couplings
            if (planet === "sun" && otherPlanet === "saturn") continue; // Sun-Saturn are immune to mutual Vedha
            if (planet === "saturn" && otherPlanet === "sun") continue;
            if (planet === "moon" && otherPlanet === "mercury") continue; // Moon-Mercury are immune to mutual Vedha
            if (planet === "mercury" && otherPlanet === "moon") continue;

            return true; // The positive transit influence is actively blocked!
        }
    }
    return false;
}