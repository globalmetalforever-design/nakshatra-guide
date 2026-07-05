import { getBirthData } from "./birth_engine.js?v=14";
import { generateDailyForecast } from "./daily_forecast_engine.js?v=14";

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
    const dobValue = document.getElementById("dob").value; // Returns YYYY-MM-DD
    const tobValue = document.getElementById("tob").value; // Returns HH:MM (24h format)

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

        const [year, month, day] = dobValue.split("-").map(Number);
        const [hour, minute] = tobValue.split(":").map(Number);

        const profileSavePackage = {
            ...currentBirthProfile,
            year, month, day, hour, minute,
            timezone: -(new Date().getTimezoneOffset() / 60)
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
            if (currentBirthProfile) {
                await renderUserDashboard(currentBirthProfile, new Date(event.target.value));
            }
        });
    }
});