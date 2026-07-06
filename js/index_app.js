import { getBirthData } from "./birth_engine.js?v=100";
import { generateTimeLockedForecast as generateDailyForecast } from "../Addons/js/time_lock_addon.js?v=100";

let currentBirthProfile = null;

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

function restoreFormInputs(profile) {
    if (!profile || !profile.inputs) return;
    if (document.getElementById("dob")) document.getElementById("dob").value = profile.inputs.date || "";
    if (document.getElementById("tob")) document.getElementById("tob").value = profile.inputs.time || "";
    if (document.getElementById("birth-place-input")) document.getElementById("birth-place-input").value = profile.inputs.place || "";
}

async function loadStoredProfileAndRender() {
    try {
        initializeDatePicker();
        const storedData = localStorage.getItem("permanentBirthProfile");
        if (!storedData) return;

        const profile = JSON.parse(storedData);
        currentBirthProfile = profile;

        if (!profile.nakshatra || (profile.hour === undefined && profile.birthHour === undefined && profile.inputs?.hour === undefined)) {
            localStorage.removeItem("permanentBirthProfile");
            return;
        }

        document.getElementById("detectedNakshatra").innerText = profile.nakshatra?.name || "";
        document.getElementById("detectedPada").innerText = `Pada ${profile.pada?.number || ""}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = profile.rasi?.name || "-";
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = profile.zodiac?.name || "-";

        restoreFormInputs(profile);

        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";
        if (document.getElementById("notePanel")) document.getElementById("notePanel").style.display = "none";
        
        // Hide the standalone Attention container layout fully
        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        if (panelsContainer) {
            panelsContainer.style.display = "grid";
            panelsContainer.style.gridTemplateColumns = "1fr"; // Force the main Forecast block to span full width
        }
        const attentionCard = document.getElementById("attentionBox")?.closest('.card') || document.getElementById("attentionBox");
        if (attentionCard) attentionCard.style.display = "none";

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
        if (forecastBox) forecastBox.innerText = dynamicForecast.forecast;

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
    const placeValue = document.getElementById("birth-place-input")?.value || ""; 

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

        // Retain specific city strings cleanly inside inputPayload configurations
        currentBirthProfile.inputs = { 
            date: dobValue, 
            time: tobValue, 
            place: placeValue,
            year, month, day, hour, minute
        };

        document.getElementById("detectedNakshatra").innerText = `${currentBirthProfile.nakshatra.name}`;
        document.getElementById("detectedPada").innerText = `Pada ${currentBirthProfile.pada.number}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = currentBirthProfile.rasi.name;
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = currentBirthProfile.zodiac.name;
        
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
        const locationValue = document.getElementById("birth-place-input")?.value || "";

        const [year, month, day] = dobValue.split("-").map(Number);
        const [hour, minute] = tobValue.split(":").map(Number);

        const profileSavePackage = {
            ...currentBirthProfile,
            year, month, day, hour, minute,
            timezone: -(new Date().getTimezoneOffset() / 60),
            inputs: { 
                date: dobValue, 
                time: tobValue, 
                place: locationValue,
                year, month, day, hour, minute
            }
        };

        localStorage.setItem("permanentBirthProfile", JSON.stringify(profileSavePackage));
        
        if (document.getElementById("confirmBtn")) document.getElementById("confirmBtn").style.display = "none";
        if (document.getElementById("rejectBtn")) document.getElementById("rejectBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";
        if (document.getElementById("notePanel")) document.getElementById("notePanel").style.display = "none";
        
        // Ensure standalone Attention box hides dynamically upon real-time confirmation execution[cite: 14]
        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        if (panelsContainer) {
            panelsContainer.style.display = "grid";
            panelsContainer.style.gridTemplateColumns = "1fr";
        }
        const attentionCard = document.getElementById("attentionBox")?.closest('.card') || document.getElementById("attentionBox");
        if (attentionCard) attentionCard.style.display = "none";

        const datePicker = document.getElementById("forecast-date-input");
        const targetDate = datePicker && datePicker.value ? new Date(datePicker.value) : new Date();
        await renderUserDashboard(profileSavePackage, targetDate);

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