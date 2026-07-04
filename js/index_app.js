import { getBirthData } from "./birth_engine.js?v=13";
import { generateDailyForecast } from "./daily_forecast_engine.js?v=13";

let currentBirthProfile = null;

// Set today's date in picker as default baseline
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

// --- PROFILE INITIALIZER & RENDERER ---
async function loadStoredProfileAndRender() {
    try {
        initializeDatePicker();
        const storedData = localStorage.getItem("permanentBirthProfile");
        if (!storedData) return;

        const profile = JSON.parse(storedData);
        currentBirthProfile = profile;

        // Populate Panel 2 with the stored information right away
        document.getElementById("detectedNakshatra").innerText = profile.nakshatra?.name || "";
        document.getElementById("detectedPada").innerText = `Pada ${profile.pada?.number || ""}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = profile.rasi?.name || "-";
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = profile.zodiac?.name || "-";

        // UI WORKFLOW SWAP: Remove Note, Hide Submit, Reveal Reset and Split Cards
        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";
        if (document.getElementById("notePanel")) document.getElementById("notePanel").style.display = "none";
        if (document.getElementById("forecastAndAttentionPanels")) document.getElementById("forecastAndAttentionPanels").style.display = "grid";
        
        const datePicker = document.getElementById("forecast-date-input");
        const targetDate = datePicker && datePicker.value ? new Date(datePicker.value) : new Date();
        await renderUserDashboard(profile, targetDate);
    } catch (err) {
        console.error("Local profile engine initialization failure:", err);
    }
}

// --- DYNAMIC CORE FORECAST RENDERER ---
async function renderUserDashboard(storedBirthProfile, targetDate = new Date()) {
    try {
        const dynamicForecast = await generateDailyForecast(storedBirthProfile, targetDate);

        // 1. Output your text blocks down into their separate lower layout panels
        const forecastBox = document.getElementById("forecastBox");
        const attentionBox = document.getElementById("attentionBox");
        
        if (forecastBox) forecastBox.innerText = dynamicForecast.forecast;
        if (attentionBox) attentionBox.innerText = dynamicForecast.attention;

        // 2. Output the discrete metadata counters into the core Guidance panel metrics
        if (document.getElementById("luckyColor")) document.getElementById("luckyColor").innerText = dynamicForecast.guidance.luckyColor;
        if (document.getElementById("luckyNumber")) document.getElementById("luckyNumber").innerText = dynamicForecast.guidance.luckyNumber;
        if (document.getElementById("goodTime")) document.getElementById("goodTime").innerText = dynamicForecast.guidance.goodTime;
        if (document.getElementById("badTime")) document.getElementById("badTime").innerText = dynamicForecast.guidance.badTime;
        if (document.getElementById("dailyAction")) document.getElementById("dailyAction").innerText = dynamicForecast.guidance.action;

    } catch (error) {
        console.error("Dashboard render failed:", error);
    }
}

// --- INTERACTIVE SYSTEM EVENT HANDLERS ---
async function handleSubmit() {
    const dob = document.getElementById("dob").value;
    const tob = document.getElementById("tob").value;
    const ampm = document.getElementById("ampm").value;

    try {
        if (!dob.includes("-") || dob.trim().length !== 10) {
            throw new Error("Date must be in DD-MM-YYYY format.");
        }
        if (!tob.includes(":") || tob.trim().length !== 5) {
            throw new Error("Time must be in HH:MM format.");
        }

        const [day, month, year] = dob.split("-").map(Number);
        const parts = tob.split(":");
        let hour = Number(parts[0]);
        let minute = Number(parts[1]);

        if (isNaN(hour) || isNaN(minute) || hour > 12 || hour < 1 || minute > 59) {
            throw new Error("Invalid time values. Use 01:00 to 12:59.");
        }
        
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;

        const inputPayload = {
            year, month, day, hour, minute,
            timezone: -(new Date().getTimezoneOffset() / 60)
        };

        currentBirthProfile = await getBirthData(inputPayload);

        document.getElementById("detectedNakshatra").innerText = `${currentBirthProfile.nakshatra.name}`;
        document.getElementById("detectedPada").innerText = `Pada ${currentBirthProfile.pada.number}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = currentBirthProfile.rasi.name;
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = currentBirthProfile.zodiac.name;
        
        // Align actions nicely on the target entry row
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
        const dob = document.getElementById("dob").value;
        const tob = document.getElementById("tob").value;
        const ampm = document.getElementById("ampm").value;

        const [day, month, year] = dob.split("-").map(Number);
        const parts = tob.split(":");
        let hour = Number(parts[0]);
        let minute = Number(parts[1]);
        
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;

        const profileSavePackage = {
            ...currentBirthProfile,
            year,
            month,
            day,
            hour,
            minute,
            timezone: -(new Date().getTimezoneOffset() / 60)
        };

        localStorage.setItem("permanentBirthProfile", JSON.stringify(profileSavePackage));
        window.location.reload();
    } catch (err) {
        alert("Error executing forecast synthesis: " + err.message);
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

function configureDateMask(element) {
    if (!element) return;
    element.setAttribute("maxLength", "10");
    element.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 2 && val.length <= 4) {
            e.target.value = val.slice(0, 2) + "-" + val.slice(2);
        } else if (val.length > 4) {
            e.target.value = val.slice(0, 2) + "-" + val.slice(2, 4) + "-" + val.slice(4, 8);
        } else {
            e.target.value = val;
        }
    });
}

// --- APPARATUS BOOTSTRAPPING ---
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
    
    configureDateMask(document.getElementById("dob"));

    const tobInput = document.getElementById("tob");
    if (tobInput) {
        tobInput.setAttribute("maxLength", "5");
        tobInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "");
            if (val.length === 1 && val[0] > '1') val = "0" + val;
            if (val.length > 2) {
                e.target.value = val.slice(0, 2) + ":" + val.slice(2, 4);
            } else {
                e.target.value = val;
            }
        });
    }
});