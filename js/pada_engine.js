import { NAKSHATRA_SIZE } from "./nakshatra_engine.js";
import { normalizeDegrees } from "./swiss_wrapper.js";

const PADA_SIZE = NAKSHATRA_SIZE / 4;

function determinePada(longitude) {
    const normalized = normalizeDegrees(longitude);
    const degreesIntoNakshatra = normalized % NAKSHATRA_SIZE;
    const index = Math.min(Math.floor(degreesIntoNakshatra / PADA_SIZE), 3);
    const startOffset = index * PADA_SIZE;
    const endOffset = startOffset + PADA_SIZE;

    return {
        index,
        number: index + 1,
        degreesIntoPada: degreesIntoNakshatra - startOffset,
        startOffset,
        endOffset
    };
}

function getPada(longitude) {
    return determinePada(longitude).number;
}

export {
    PADA_SIZE,
    determinePada,
    getPada
};

if (typeof window !== "undefined") {
    window.determinePada = determinePada;
    window.getPada = getPada;
}
