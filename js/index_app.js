import { getBirthData } from "./birth_engine.js?v=103";
import { generateTimeLockedForecast as generateDailyForecast } from "../Addons/js/time_lock_addon.js?v=130";
import { generateTimeLockedForecast as generateHistoryForecast } from "../Addons/js/time_lock_addon.js?v=130";

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
    const profileFormPanel = document.getElementById("profileFormPanel");
    const detectedPanel = document.getElementById("detectedStatusPanel");
    const topRow = document.querySelector(".dashboard-row-three-columns");

    if (hasStoredProfile) {
        // RETURNING USER: Hide the DOB/Time/City/Country input card
        if (profileFormPanel) profileFormPanel.style.display = "none";
        if (detectedPanel) detectedPanel.style.display = "block";
        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        if (document.getElementById("confirmBtn")) document.getElementById("confirmBtn").style.display = "none";
        if (document.getElementById("rejectBtn")) document.getElementById("rejectBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";

        if (topRow && window.innerWidth > 768) {
            topRow.style.gridTemplateColumns = "1fr 1fr";
        }
    } else {
        // FRESH / RESET USER: Show input card and reset action states
        if (profileFormPanel) profileFormPanel.style.display = "block";
        if (detectedPanel) detectedPanel.style.display = "block";
        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "inline-block";
        if (document.getElementById("confirmBtn")) document.getElementById("confirmBtn").style.display = "none";
        if (document.getElementById("rejectBtn")) document.getElementById("rejectBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "none";

        if (topRow && window.innerWidth > 768) {
            topRow.style.gridTemplateColumns = "repeat(3, 1fr)";
        }
    }
}

function updateHistoryCardHeader() {
    const historyBox = document.getElementById("attentionBox");
    if (!historyBox) return;

    const cardParent = historyBox.closest('.card');
    if (cardParent) {
        const headerElement = cardParent.querySelector('.card-header') || cardParent.querySelector('h3') || cardParent.querySelector('h2');
        if (headerElement) {
            headerElement.innerText = "History";
        }
    }
}

function getFormattedCurrentDate(dateObj = new Date()) {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function normalizeToDisplayDate(dateString) {
    if (!dateString) return "";
    if (dateString.includes("-") && dateString.split("-")[0].length === 4) {
        const [y, m, d] = dateString.split("-");
        return `${d}-${m}-${y}`;
    }
    return dateString;
}

function restoreFormInputs(profile) {
    if (!profile || !profile.inputs) return;
    if (document.getElementById("dob")) {
        document.getElementById("dob").value = normalizeToDisplayDate(profile.inputs.date || "");
    }
    if (document.getElementById("tob")) document.getElementById("tob").value = profile.inputs.time || "";
    if (document.getElementById("birth-place-input")) document.getElementById("birth-place-input").value = profile.inputs.place || "";
    if (document.getElementById("country-input")) document.getElementById("country-input").value = profile.inputs.country || "";
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
// Dynamic Birthday & Special Event Engine
// -------------------------------------------------------------------------
function checkBirthdayAndFestivals(profile) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentDayMonthStr = `${String(currentDay).padStart(2, '0')}-${String(currentMonth).padStart(2, '0')}`;

    // 1. Birthday Check in Panel 3
    const birthdayBox = document.getElementById("birthdayGreetingBox");
    if (profile && profile.inputs && profile.inputs.date) {
        const dateParts = profile.inputs.date.split("-").map(Number);
        const bDay = dateParts[0];
        const bMonth = dateParts[1];

        if (bDay === currentDay && bMonth === currentMonth) {
            if (birthdayBox) birthdayBox.style.display = "block";
        } else {
            if (birthdayBox) birthdayBox.style.display = "none";
        }
    } else {
        if (birthdayBox) birthdayBox.style.display = "none";
    }

    // 2. Festival / Special Event Check
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

    if (todayEvents) {
        let matchedEvent = null;
        if (userCountry.includes("india")) {
            matchedEvent = todayEvents.india || todayEvents.global;
        } else {
            matchedEvent = todayEvents.global || todayEvents.india;
        }

        if (matchedEvent && festivalBox && festTitle && festDesc) {
            const [title, ...descParts] = matchedEvent.split("—");
            festTitle.innerText = title.trim();
            festDesc.innerText = descParts.join("—").trim() || "";
            festivalBox.style.display = "block";
            return;
        }
    }

    if (festivalBox) {
        festivalBox.style.display = "none";
    }
}

// -------------------------------------------------------------------------
// Load Profile & Core Rendering
// -------------------------------------------------------------------------
async function loadStoredProfileAndRender() {
    try {
        const storedData = localStorage.getItem("permanentBirthProfile");
        if (!storedData) {
            setProfileViewMode(false);
            return;
        }

        const profile = JSON.parse(storedData);
        currentBirthProfile = profile;

        if (!profile.nakshatra || (profile.hour === undefined && profile.birthHour === undefined && profile.inputs?.hour === undefined)) {
            localStorage.removeItem("permanentBirthProfile");
            setProfileViewMode(false);
            return;
        }

        document.getElementById("detectedNakshatra").innerText = profile.nakshatra?.name || "";
        document.getElementById("detectedPada").innerText = `Pada ${profile.pada?.number || ""}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = profile.rasi?.name || "-";
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = profile.zodiac?.name || "-";

        restoreFormInputs(profile);
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
        const forecastBox = document.getElementById("forecastBox");
        
        if (forecastBox) {
            forecastBox.style.setProperty("color", "#e2e8f0", "important");
            const processedText = filterWeekendJargon(dynamicForecast.forecast, targetDate);
            forecastBox.innerHTML = processedText || "Rest and realign your energy fields today.";
        }

        const activeDateBox = document.getElementById("activeForecastDateDisplay");
        if (activeDateBox) {
            activeDateBox.innerText = `Date: ${getFormattedCurrentDate(targetDate)}`;
        }

        // Render Combined Guidance Metrics beneath forecast
        if (document.getElementById("luckyColor")) document.getElementById("luckyColor").innerText = dynamicForecast.guidance.luckyColor;
        if (document.getElementById("goodTime")) document.getElementById("goodTime").innerText = dynamicForecast.guidance.goodTime;
        if (document.getElementById("badTime")) document.getElementById("badTime").innerText = dynamicForecast.guidance.badTime;

        checkBirthdayAndFestivals(storedBirthProfile);

        // History Panel
        const historyBox = document.getElementById("attentionBox");
        if (historyBox) {
            updateHistoryCardHeader();
            historyBox.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size:0.85rem; opacity:0.7; margin-bottom:6px;">Enter History Date (DD-MM-YYYY):</label>
                    <input type="text" id="history-manual-date" placeholder="DD-MM-YYYY" maxlength="10" style="width:100%; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.15); padding:8px; border-radius:4px; color:#fff; font-family:inherit; outline:none; font-size:0.95rem;">
                </div>
                <div id="historyDisplayResult" style="font-size:1.05rem; opacity:0.85; line-height:1.6; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; font-style:italic; color:rgba(255,255,255,0.5); max-height:260px; overflow-y:auto;">
                    Enter any date above to unlock historical forecast details...
                </div>
            `;

            const historyInput = document.getElementById("history-manual-date");
            if (historyInput) {
                historyInput.addEventListener("input", (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 2 && v.length <= 4) {
                        v = `${v.slice(0, 2)}-${v.slice(2)}`;
                    } else if (v.length > 4) {
                        v = `${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4, 8)}`;
                    }
                    e.target.value = v;

                    if (v.length === 10) {
                        processManualHistoryLookup(storedBirthProfile, v);
                    }
                });
            }
        }

        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        const mobNav = document.getElementById("mobile-navigation-bar");
        
        if (window.innerWidth <= 768) {
            if (mobNav) mobNav.style.display = "block";
            if (panelsContainer) {
                panelsContainer.style.display = "block";
                panelsContainer.style.width = "100%";
            }
            if (typeof switchMobileTab === "function") {
                switchMobileTab('forecast');
            }
        } else {
            if (mobNav) mobNav.style.display = "none";
            if (panelsContainer) {
                panelsContainer.style.display = "grid";
                panelsContainer.style.width = "100%";
            }
            
            const cForecast = document.getElementById("card-forecast");
            const cHistory = document.getElementById("card-history");

            if (cForecast) cForecast.style.display = 'block';
            if (cHistory) cHistory.style.display = 'block';
        }

    } catch (error) {
        console.error("Dashboard render failed:", error);
    }
}

async function processManualHistoryLookup(profile, formattedDateString) {
    const resultBox = document.getElementById("historyDisplayResult");
    if (!resultBox) return;

    resultBox.innerHTML = `<span style="opacity:0.5; font-style:italic;">Calculating historical snapshot...</span>`;

    try {
        const [dd, mm, yyyy] = formattedDateString.split("-").map(Number);
        if (isNaN(dd) || isNaN(mm) || isNaN(yyyy) || mm < 1 || mm > 12 || dd < 1 || dd > 31) {
            resultBox.innerText = "Invalid date format. Confirm format matches DD-MM-YYYY.";
            return;
        }

        const explicitHistoryDate = new Date(yyyy, mm - 1, dd, 12, 0, 0);
        const historicalPayload = await generateHistoryForecast(profile, explicitHistoryDate);
        
        resultBox.style.fontStyle = "normal";
        resultBox.style.color = "#fff";
        
        const processedHistory = filterWeekendJargon(historicalPayload.forecast, explicitHistoryDate);
        resultBox.innerHTML = processedHistory;
    } catch (err) {
        resultBox.innerText = "Error tracking historical metrics.";
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

        const inputPayload = {
            year, month, day, hour, minute,
            timezone: resolvedTimezone
        };

        currentBirthProfile = await getBirthData(inputPayload);

        currentBirthProfile.inputs = { 
            date: dobInput, 
            time: tobValue, 
            place: placeValue,
            country: countryValue,
            year, month, day, hour, minute,
            timezone: resolvedTimezone
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
        localStorage.setItem("permanentBirthProfile", JSON.stringify(currentBirthProfile));
        
        setProfileViewMode(true);
        
        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        if (panelsContainer) {
            panelsContainer.style.display = (window.innerWidth <= 768) ? "block" : "grid";
        }

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
    if (document.getElementById("activeForecastDateDisplay")) document.getElementById("activeForecastDateDisplay").innerText = "";
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
    document.getElementById("resetBtn")?.addEventListener("click", handleReset);
    
    // DOB Auto-hyphenation listener
    const dobInput = document.getElementById("dob");
    if (dobInput) {
        dobInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, '');
            let formattedValue = '';

            if (v.length > 0) {
                formattedValue = v.slice(0, 2);
                if (v.length > 2) {
                    formattedValue += '-' + v.slice(2, 4);
                }
                if (v.length > 4) {
                    formattedValue += '-' + v.slice(4, 8);
                }
            }

            e.target.value = formattedValue;

            if (v.length === 8) {
                setTimeout(() => {
                    document.getElementById("tob")?.focus();
                }, 10);
            }
        });
    }

    // TOB Complete 5-Character Validation before shifting focus
    const tobInput = document.getElementById("tob");
    if (tobInput) {
        tobInput.addEventListener("change", () => {
            if (tobInput.value && tobInput.value.length === 5) {
                document.getElementById("birth-place-input")?.focus();
            }
        });
    }
});

// Mobile Submenu Switching
window.switchMobileTab = function(tabId) {
    if (window.innerWidth > 768) return; 
    
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('onclick').includes(tabId)) {
            tab.style.color = "#ffffff";
            tab.style.fontWeight = "bold";
        } else {
            tab.style.color = "rgba(255,255,255,0.6)";
            tab.style.fontWeight = "normal";
        }
    });

    const forecastCard = document.getElementById("card-forecast");
    const historyCard = document.getElementById("card-history");

    if (forecastCard) forecastCard.style.display = (tabId === 'forecast') ? 'block' : 'none';
    if (historyCard) historyCard.style.display = (tabId === 'history') ? 'block' : 'none';
};