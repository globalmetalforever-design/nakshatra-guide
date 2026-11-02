import { getBirthData } from "./birth_engine.js?v=103";
import { generateTimeLockedForecast as generateDailyForecast } from "../Addons/js/time_lock_addon.js?v=140";

let currentBirthProfile = null;

const GLOBAL_CITY_TZ_DB = {
    "chennai": 5.5, "mumbai": 5.5, "delhi": 5.5, "kolkata": 5.5, "bengaluru": 5.5, 
    "hyderabad": 5.5, "ahmedabad": 5.5, "pune": 5.5, "jaipur": 5.5, "lucknow": 5.5,
    "singapore": 8.0, "dubai": 4.0, "abu dhabi": 4.0, "sharjah": 4.0,
    "london": 0.0, "manchester": 0.0, "birmingham": 0.0, "paris": 1.0, "berlin": 1.0,
    "new york": -5.0, "miami": -5.0, "boston": -5.0, "toronto": -5.0, "montreal": -5.0,
    "chicago": -6.0, "houston": -6.0, "dallas": -6.0, "winnipeg": -6.0,
    "denver": -7.0, "phoenix": -7.0, "calgary": -7.0,
    "los angeles": -8.0, "san francisco": -8.0, "seattle": -8.0, "vancouver": -8.0
};

// -------------------------------------------------------------------------
// View & Layout State Controller
// -------------------------------------------------------------------------
function setProfileViewMode(hasStoredProfile) {
    const newUserDataRow = document.getElementById("newUserDataRow");
    const forecastContainer = document.getElementById("forecastContainer");

    if (hasStoredProfile) {
        // RETURNING USERS: Hide DOB form and Star Details panel completely
        if (newUserDataRow) newUserDataRow.style.display = "none";
        if (forecastContainer) forecastContainer.style.display = "block";
    } else {
        // NEW / RESET USERS: Show DOB form and Star detection panel
        if (newUserDataRow) {
            newUserDataRow.style.display = "grid";
            newUserDataRow.style.gridTemplateColumns = (window.innerWidth > 768) ? "1fr 1fr" : "1fr";
        }
        if (forecastContainer) forecastContainer.style.display = "none";
    }
}

function getFormattedCurrentDate(dateObj = new Date()) {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function filterWeekendJargon(rawForecast, targetDate) {
    const day = targetDate.getDay();
    const isWeekend = (day === 0 || day === 6);
    
    if (isWeekend) {
        return rawForecast
            .replace(/[^.!?]*\b(office|career|colleagues|business meetings|corporate|boss|job promotions|professional deadlines|employment)\b[^.!?]*[.!?]/gi, '')
            .replace(/^\s*<br\s*\/?>|<br\s*\/?>\s*$/gi, '')
            .trim();
    }
    return rawForecast;
}

// -------------------------------------------------------------------------
// Birthday & Festival Event Engine
// -------------------------------------------------------------------------
function checkBirthdayAndFestivals(profile) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentDayMonthStr = `${String(currentDay).padStart(2, '0')}-${String(currentMonth).padStart(2, '0')}`;

    // Birthday banner in Star Panel (during onboarding)
    const birthdayBox = document.getElementById("birthdayGreetingBox");
    if (profile && profile.inputs && profile.inputs.date) {
        const [bDay, bMonth] = profile.inputs.date.split("-").map(Number);
        if (bDay === currentDay && bMonth === currentMonth) {
            if (birthdayBox) birthdayBox.style.display = "block";
        } else {
            if (birthdayBox) birthdayBox.style.display = "none";
        }
    }

    // Special Event / Festival Banner under Logo
    const userCountry = (profile?.inputs?.country || "India").trim().toLowerCase();
    const festivalBox = document.getElementById("specialOccasionBox");
    const festTitle = document.getElementById("festivalTitle");
    const festDesc = document.getElementById("festivalDesc");

    const FESTIVAL_DATABASE = {
        "01-01": { global: "🎉 New Year's Day — Fresh Annual Planetary Cycle" },
        "14-01": { india: "🌾 Makar Sankranti / Pongal — Solar Transit into Makara (Capricorn)" },
        "08-03": { global: "🌸 Maha Shivaratri — Auspicious Night of Consciousness" },
        "25-03": { india: "🎨 Holi / Vasant Utsav — Spring Equinox Alignment" },
        "14-04": { india: "🌺 Vedic New Year / Baisakhi / Puthandu — Solar Transit into Mesha (Aries)" },
        "01-11": { india: "🪔 Diwali / Deepavali — Festival of Lights & Lakshmi Energy" },
        "25-12": { global: "🎄 Winter Solstice Observance & Yuletide Alignment" }
    };

    const todayEvents = FESTIVAL_DATABASE[currentDayMonthStr];
    if (todayEvents && festivalBox && festTitle && festDesc) {
        const matchedEvent = userCountry.includes("india") ? (todayEvents.india || todayEvents.global) : (todayEvents.global || todayEvents.india);
        if (matchedEvent) {
            const [title, ...descParts] = matchedEvent.split("—");
            festTitle.innerText = title.trim();
            festDesc.innerText = descParts.join("—").trim() || "";
            festivalBox.style.display = "block";
            return;
        }
    }

    if (festivalBox) festivalBox.style.display = "none";
}

// -------------------------------------------------------------------------
// Load Profile & Core Rendering
// -------------------------------------------------------------------------
async function loadStoredProfileAndRender() {
    try {
        const storedData = localStorage.getItem("permanentBirthProfile");
        if (!storedData) {
            setProfileViewMode(false); // New user
            return;
        }

        const profile = JSON.parse(storedData);
        currentBirthProfile = profile;

        if (!profile.nakshatra || (profile.hour === undefined && profile.birthHour === undefined && profile.inputs?.hour === undefined)) {
            localStorage.removeItem("permanentBirthProfile");
            setProfileViewMode(false);
            return;
        }

        // Returning user mode: hide top star panel and show forecast directly
        setProfileViewMode(true);
        await renderUserDashboard(profile, new Date());
    } catch (err) {
        console.error("Profile auto-load failed:", err);
        localStorage.removeItem("permanentBirthProfile");
        setProfileViewMode(false);
    }
}

async function renderUserDashboard(storedBirthProfile, targetDate = new Date()) {
    try {
        const dynamicForecast = await generateDailyForecast(storedBirthProfile, targetDate);
        
     // Inside renderUserDashboard() in js/index_app.js:
const forecastBox = document.getElementById("forecastBox");
if (forecastBox) {
    forecastBox.style.setProperty("color", "#e2e8f0", "important");
    
    let processedText = filterWeekendJargon(dynamicForecast.forecast, targetDate);

    // GUARANTEED PURGE: Strip any instance of Caution, CAUTION:, or upcoming warnings
    processedText = processedText
        .replace(/<p[^>]*>.*?(?:caution|warning).*?<\/p>/gi, '')
        .replace(/<span[^>]*>.*?(?:caution|warning).*?<\/span>.*?(?:<br\s*\/?>|$)/gi, '')
        .replace(/<b>.*?caution.*?<\/b>.*?(?:<br\s*\/?>|$)/gi, '')
        .replace(/<strong[^>]*>.*?caution.*?<\/strong>.*?(?:<br\s*\/?>|$)/gi, '')
        .replace(/<u>.*?caution.*?<\/u>.*?(?:<br\s*\/?>|$)/gi, '')
        .replace(/(?:⚠️\s*)?CAUTION:?.*$/gim, '')
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
        .trim();

    forecastBox.innerHTML = processedText || "Rest and realign your energy fields today.";
}

        const dateBadge = document.getElementById("forecastDateBadge");
        if (dateBadge) {
            dateBadge.innerText = getFormattedCurrentDate(targetDate);
        }

        // Combined Guidance Metrics
        if (document.getElementById("luckyColor")) document.getElementById("luckyColor").innerText = dynamicForecast.guidance.luckyColor;
        if (document.getElementById("goodTime")) document.getElementById("goodTime").innerText = dynamicForecast.guidance.goodTime;
        if (document.getElementById("badTime")) document.getElementById("badTime").innerText = dynamicForecast.guidance.badTime;

        checkBirthdayAndFestivals(storedBirthProfile);
    } catch (error) {
        console.error("Dashboard render failed:", error);
    }
}

// -------------------------------------------------------------------------
// User Interaction Handlers
// -------------------------------------------------------------------------
async function handleSubmit() {
    const dobInput = document.getElementById("dob").value; 
    const tobValue = document.getElementById("tob").value; 
    const placeValue = document.getElementById("birth-place-input")?.value || ""; 
    const countryValue = document.getElementById("country-input")?.value || ""; 

    try {
        if (!dobInput || dobInput.length < 10) throw new Error("Please enter a valid Date of Birth (DD-MM-YYYY).");
        if (!tobValue) throw new Error("Please select your Time of Birth.");

        const [day, month, year] = dobInput.split("-").map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
            throw new Error("Invalid date components. Use DD-MM-YYYY format.");
        }

        const [hour, minute] = tobValue.split(":").map(Number);
        let resolvedTimezone = -(new Date().getTimezoneOffset() / 60); 
        const normalizedCity = placeValue.trim().toLowerCase();
        
        if (GLOBAL_CITY_TZ_DB[normalizedCity] !== undefined) {
            resolvedTimezone = GLOBAL_CITY_TZ_DB[normalizedCity];
        }

        const inputPayload = { year, month, day, hour, minute, timezone: resolvedTimezone };
        currentBirthProfile = await getBirthData(inputPayload);

        currentBirthProfile.inputs = { 
            date: dobInput, 
            time: tobValue, 
            place: placeValue,
            country: countryValue,
            year, month, day, hour, minute,
            timezone: resolvedTimezone
        };

        // Populate Star Details for confirmation
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
        document.getElementById("confirmBtn").style.display = "none";
        document.getElementById("rejectBtn").style.display = "none";
        document.getElementById("submitBtn").style.display = "inline-block";
    }
}

async function handleConfirm() {
    if (!currentBirthProfile) return;

    try {
        localStorage.setItem("permanentBirthProfile", JSON.stringify(currentBirthProfile));
        
        // Switch immediately to returning user layout (hiding top star/DOB panels)
        setProfileViewMode(true);
        await renderUserDashboard(currentBirthProfile, new Date());
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

function initializeGalaxyStarfield() {
    const canvas = document.getElementById('starfield-bg');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let stars = [];
    const numStars = 120;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    for (let i = 0; i < numStars; i++) {
        const isSupergiant = Math.random() > 0.95; 
        const starSize = isSupergiant ? (Math.random() * 4.5 + 3.0) : (Math.random() * 2.0 + 0.8);

        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: starSize,
            alpha: Math.random(),
            twinkleSpeed: isSupergiant ? 0.003 : (0.005 + Math.random() * 0.015),
            direction: Math.random() > 0.5 ? 1 : -1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#060d1a'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < numStars; i++) {
            let s = stars[i];
            s.alpha += s.twinkleSpeed * s.direction;
            if (s.alpha >= 1 || s.alpha <= 0.1) s.direction *= -1;

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 150, ${s.alpha})`; 
            ctx.fill();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// -------------------------------------------------------------------------
// DOM Initialization
// -------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initializeGalaxyStarfield();
    loadStoredProfileAndRender();

    document.getElementById("submitBtn")?.addEventListener("click", handleSubmit);
    document.getElementById("confirmBtn")?.addEventListener("click", handleConfirm);
    document.getElementById("rejectBtn")?.addEventListener("click", handleReject);
    document.getElementById("resetProfileLink")?.addEventListener("click", handleReset);
    
    // Auto-hyphenation listener
    const dobInput = document.getElementById("dob");
    if (dobInput) {
        dobInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, '');
            let formattedValue = '';
            if (v.length > 0) {
                formattedValue = v.slice(0, 2);
                if (v.length > 2) formattedValue += '-' + v.slice(2, 4);
                if (v.length > 4) formattedValue += '-' + v.slice(4, 8);
            }
            e.target.value = formattedValue;

            if (v.length === 8) {
                setTimeout(() => document.getElementById("tob")?.focus(), 10);
            }
        });
    }

    // TOB 5-Character Validation
    const tobInput = document.getElementById("tob");
    if (tobInput) {
        tobInput.addEventListener("change", () => {
            if (tobInput.value && tobInput.value.length === 5) {
                document.getElementById("birth-place-input")?.focus();
            }
        });
    }
});