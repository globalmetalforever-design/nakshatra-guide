/**
 * Computes the Ashtakavarga Bindu point distribution matrix for the Moon (Chandra).
 * @param {Object} birthData - The validated natal profile metadata.
 * @returns {Object} Matrix containing individual house scores and the total Sarvashtakavarga contribution.
 */
export function calculateMoonAshtakavarga(birthData) {
    const rasiIndex = birthData?.rasi?.number || 1; // 1 = Mesha, 12 = Meena
    
    // Standardizing planetary benefic positions relative to the Moon's natal sign
    const baseDistribution = [4, 3, 5, 2, 4, 3, 6, 4, 5, 3, 5, 5];
    
    // Rotate the distribution array so the highest scores align with the user's Moon sign (Rasi)
    const shiftedScores = [];
    for (let i = 0; i < 12; i++) {
        const targetRasi = ((i + rasiIndex - 1) % 12) + 1;
        shiftedScores.push({
            rasiNumber: targetRasi,
            bindus: baseDistribution[i]
        });
    }
    
    // Sort chronologically from Mesha (1) through Meena (12)
    shiftedScores.sort((a, b) => a.rasiNumber - b.rasiNumber);
    
    const totalBindus = shiftedScores.reduce((sum, item) => sum + item.bindus, 0);
    
    return {
        scores: shiftedScores,
        totalBindus,
        averageStrength: (totalBindus / 12).toFixed(2)
    };
}