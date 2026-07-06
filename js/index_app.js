import { getBirthData } from "./birth_engine.js?v=100";
import { generateDailyForecast as generateDailyForecast } from "./daily_forecast_engine.js?v=100";


let currentBirthProfile = null;

/**
 * Inline structural layout injector to safely display verified parameters
 * inside the native card element without expanding bounding layouts.
 */
function appendVerificationSubtitles(profile) {
    const detectedPada = document.getElementById("detectedPada");
    if (!detectedPada) return;

    // Check if verification metadata elements already exist to avoid layout duplicating cascades
    if (document.getElementById("verify-metadata-block")) {
        document.getElementById("verify-metadata-block").remove();
    }

    // Capture explicit inputs from form profiles safely
    const birthY = profile.year || (profile.inputs?.year) || "-";
    const birthM = profile.month || (profile.inputs?.month) || "-";
    const birthD = profile.day || (profile.inputs?.day) || "-";
    const birthH = String(profile.hour !== undefined ? profile.hour : (profile.inputs?.hour || 0)).padStart(2, '0');
    const birthMin = String(profile.minute !== undefined ? profile.minute : (profile.inputs?.minute || 0)).padStart(2, '0');
    
    // Fallback lookup strings for locations
    const birthPlace = profile.inputs?.place || "Recorded Location";

    const verifyDiv = document.createElement("div");
    verifyDiv.id = "verify-metadata-block";
    verifyDiv.style.marginTop = "6px";
    verifyDiv.style.paddingTop = "4px";
    verifyDiv.style.borderTop = "1px solid rgba(255, 255, 255, 0.08)";
    verifyDiv.style.fontSize = "0.78rem";
    verifyDiv.style.fontStyle = "italic";
    verifyDiv.style.opacity = "0.7";
    verifyDiv.style.lineHeight = "1.3";

    verifyDiv.innerHTML = `
        <div>Date: ${birthY}-${String(birthM).padStart(2, '0')}-${String(birthD).padStart(2, '0')}</div>
        <div>Time: ${birthH}:${birthMin}</div>
        <div>Place: ${birthPlace}</div>
    `;
    
    // Appends cleanly inside the box container directly below the Pada line item
    detectedPada.appendChild(verifyDiv);
}

function initializeDatePicker() {
    const datePicker = document.getElementById("forecast-date-input");
    if (datePicker && !datePicker.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        datePicker.value = `${yyyy}-${mm}-${dd}`;
    }
}

async function loadStoredProfileAndRender() {
    try {
        initializeDatePicker();
        const storedData = localStorage.getItem("permanentBirthProfile");
        if (!storedData) return;

        const profile = JSON.parse(storedData);
        currentBirthProfile = profile;

        if (!profile.nakshatra || (!profile.hour && profile.birthHour === undefined)) {
            localStorage.removeItem("permanentBirthProfile");
            return;
        }

        document.getElementById("detectedNakshatra").innerText = profile.nakshatra?.name || "";
        document.getElementById("detectedPada").innerText = `Pada ${profile.pada?.number || ""}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = profile.rasi?.name || "-";
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = profile.zodiac?.name || "-";

        // Inject verified birth parameters inside the card box elements
        appendVerificationSubtitles(profile);

        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";
        if (document.getElementById("notePanel")) document.getElementById("notePanel").style.display = "none";
        if (document.getElementById("forecastAndAttentionPanels")) document.getElementById("forecastAndAttentionPanels").style.display = "grid";
        
        const datePicker = document.getElementById("forecast-date-input");
        const targetDate = datePicker && datePicker.value ? new Date(datePicker.value) : new Date();
        await renderUserDashboard(profile, targetDate);
    } catch (err) {
        console.error("Local profile engine initialization failure:", err);
        localStorage.removeItem("permanentBirthProfile");
    }
}

async function renderUserDashboard(storedBirthProfile, targetDate = new Date()) {
    try {
        const dynamicForecast = await generateDailyForecast(storedBirthProfile, targetDate);

        const forecastBox = document.getElementById("forecastBox");
        const attentionBox = document.getElementById("attentionBox");
        
        if (forecastBox) forecastBox.innerText = dynamicForecast.forecast;
        if (attentionBox) attentionBox.innerText = dynamicForecast.attention;

        if (document.getElementById("luckyColor")) document.getElementById("luckyColor").innerText = dynamicForecast.guidance.luckyColor;
        if (document.getElementById("luckyNumber")) document.getElementById("luckyNumber").innerText = dynamicForecast.guidance.luckyNumber;
        if (document.getElementById("goodTime")) document.getElementById("goodTime").innerText = dynamicForecast.guidance.goodTime;
        if (document.getElementById("badTime")) document.getElementById("badTime").innerText = dynamicForecast.guidance.badTime;
        if (document.getElementById("dailyAction")) document.getElementById("dailyAction").innerText = dynamicForecast.guidance.action;

    } catch (error) {
        console.error("Dashboard render failed:", error);
    }
}

async function handleSubmit() {
    const dobValue = document.getElementById("dob").value; 
    const tobValue = document.getElementById("tob").value; 

    try {
        if (!dobValue) throw new Error("Please select your Date of Birth.");
        if (!tobValue) throw new Error("Please select your Time of Birth.");

        const [year, month, day] = dobValue.split("-").map(Number);
        const [hour, minute] = tobValue.split(":").map(Number);

        const inputPayload = {
            year, month, day, hour, minute,
            timezone: -(new Date().getTimezoneOffset() / 60)
        };

        currentBirthProfile = await getBirthData(inputPayload);

        // Map inputs directly onto profile references for seamless text binding
        currentBirthProfile.inputs = { date: dobValue, time: tobValue, place: document.getElementById("birth-place-input")?.value || "India" };

        document.getElementById("detectedNakshatra").innerText = `${currentBirthProfile.nakshatra.name}`;
        document.getElementById("detectedPada").innerText = `Pada ${currentBirthProfile.pada.number}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = currentBirthProfile.rasi.name;
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = currentBirthProfile.zodiac.name;
        
        // Render verification texts safely into the active Nakshatra block container view
        appendVerificationSubtitles(currentBirthProfile);

        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("confirmBtn").style.display = "inline-block";
        document.getElementById("rejectBtn").style.display = "inline-block";

    } catch (err) {
        document.getElementById("detectedNakshatra").innerText = err.message;
        document.getElementById("detectedPada").innerText = "";
        if (document.getElementById("confirmBtn")) document.getElementById("confirmBtn").style.display = "none";
        if (document.getElementById("rejectBtn")) document.getElementById("rejectBtn").style.display = "none";
        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "inline-block";
    }
}

async function handleConfirm() {
    if (!currentBirthProfile) return;

    try {
        const dobValue = document.getElementById("dob").value;
        const tobValue = document.getElementById("tob").value;
        const locationValue = document.getElementById("birth-place-input")?.value || "India";

        const [year, month, day] = dobValue.split("-").map(Number);
        const [hour, minute] = tobValue.split(":").map(Number);

        const profileSavePackage = {
            ...currentBirthProfile,
            year, month, day, hour, minute,
            timezone: -(new Date().getTimezoneOffset() / 60),
            inputs: { date: dobValue, time: tobValue, place: locationValue }
        };

        localStorage.setItem("permanentBirthProfile", JSON.stringify(profileSavePackage));
        window.location.reload();
    } catch (err) {
        alert("Error executing profile save: " + err.message);
    }
}

function handleReject() {
    currentBirthProfile = null;
    document.getElementById("confirmBtn").style.display = "none";
    document.getElementById("rejectBtn").style.display = "none";
    document.getElementById("submitBtn").style.display = "inline-block";
    document.getElementById("detectedNakshatra").innerText = "Waiting for Birth Details";
    document.getElementById("detectedPada").innerText = "";
    if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = "-";
    if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = "-";
    
    if (document.getElementById("verify-metadata-block")) {
        document.getElementById("verify-metadata-block").remove();
    }
}

function handleReset() {
    localStorage.removeItem("permanentBirthProfile");
    currentBirthProfile = null;
    window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    loadStoredProfileAndRender();

    document.getElementById("submitBtn")?.addEventListener("click", handleSubmit);
    document.getElementById("confirmBtn")?.addEventListener("click", handleConfirm);
    document.getElementById("rejectBtn")?.addEventListener("click", handleReject);
    document.getElementById("resetBtn")?.addEventListener("click", handleReset);
    
    const datePicker = document.getElementById("forecast-date-input");
    if (datePicker) {
        datePicker.addEventListener("change", async (event) => {
            if (currentBirthProfile && event.target.value) {
                const [y, m, d] = event.target.value.split("-").map(Number);
                const targetedLocalDate = new Date(y, m - 1, d, 12, 0, 0);
                
                await renderUserDashboard(currentBirthProfile, targetedLocalDate);
            }
        });
    }
});