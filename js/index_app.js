import { getBirthData } from "./birth_engine.js?v=103";
import { generateTimeLockedForecast as generateDailyForecast } from "../Addons/js/time_lock_addon.js?v=111";
import { generateTimeLockedForecast as generateHistoryForecast } from "../Addons/js/time_lock_addon.js?v=111";

let currentBirthProfile = null;

// Built-in Indian Cities Timezone Lookup Registry for automation
const TIMEZONE_GEO_REGISTRY = {
    "chennai": 5.5,
    "mumbai": 5.5,
    "delhi": 5.5,
    "kolkata": 5.5,
    "bengaluru": 5.5,
    "hyderabad": 5.5,
    "ahmedabad": 5.5,
    "pune": 5.5
};

// Force the starfield canvas completely out of the layout flow on launch
document.addEventListener("DOMContentLoaded", () => {
    const bgCanvas = document.getElementById("starfield-bg");
    if (bgCanvas) {
        bgCanvas.style.position = "fixed";
        bgCanvas.style.top = "0";
        bgCanvas.style.left = "0";
        bgCanvas.style.width = "100vw";
        bgCanvas.style.height = "100vh";
        bgCanvas.style.zIndex = "-9999";
        bgCanvas.style.pointerEvents = "none";
    }
});

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
}

function adjustMobileInitialPanelVisibility(hasStoredProfile) {
    if (window.innerWidth <= 768) {
        const panels = document.querySelectorAll('.dashboard-row-three-columns .card');
        if (panels.length >= 3) {
            const dobPanel = panels[1]; // Center panel containing form inputs
            const detectedPanel = panels[2]; // Right panel containing calculated results
            
            if (hasStoredProfile) {
                if (dobPanel) dobPanel.style.display = 'none';
                if (detectedPanel) detectedPanel.style.display = 'block';
            } else {
                if (dobPanel) dobPanel.style.display = 'block';
                if (detectedPanel) detectedPanel.style.display = 'block';
            }
        }
    }
}

async function loadStoredProfileAndRender() {
    try {
        const storedData = localStorage.getItem("permanentBirthProfile");
        if (!storedData) {
            adjustMobileInitialPanelVisibility(false);
            return;
        }

        const profile = JSON.parse(storedData);
        currentBirthProfile = profile;

        if (!profile.nakshatra || (profile.hour === undefined && profile.birthHour === undefined && profile.inputs?.hour === undefined)) {
            localStorage.removeItem("permanentBirthProfile");
            adjustMobileInitialPanelVisibility(false);
            return;
        }

        document.getElementById("detectedNakshatra").innerText = profile.nakshatra?.name || "";
        document.getElementById("detectedPada").innerText = `Pada ${profile.pada?.number || ""}`;
        if (document.getElementById("vedicRasi")) document.getElementById("vedicRasi").innerText = profile.rasi?.name || "-";
        if (document.getElementById("westernZodiac")) document.getElementById("westernZodiac").innerText = profile.zodiac?.name || "-";

        restoreFormInputs(profile);

        if (document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";
        
        // Hide the DOB input wrapper panel strictly for returning mobile users
        adjustMobileInitialPanelVisibility(true);

        await renderUserDashboard(profile, new Date());
    } catch (err) {
        console.error("Local profile engine initialization failure:", err);
        localStorage.removeItem("permanentBirthProfile");
        adjustMobileInitialPanelVisibility(false);
    }
}

async function renderUserDashboard(storedBirthProfile, targetDate = new Date()) {
    try {
        const dynamicForecast = await generateDailyForecast(storedBirthProfile, targetDate);
        const forecastBox = document.getElementById("forecastBox");
        
        if (forecastBox) {
            forecastBox.style.setProperty("color", "#e2e8f0", "important");
            forecastBox.innerHTML = dynamicForecast.forecast;
            
            const strongTags = forecastBox.querySelectorAll("strong");
            strongTags.forEach(tag => {
                tag.style.setProperty("color", "#ffffff", "important");
                tag.style.setProperty("font-weight", "bold", "important");
            });
        }

        const activeDateBox = document.getElementById("activeForecastDateDisplay");
        if (activeDateBox) {
            activeDateBox.innerText = `Date: ${getFormattedCurrentDate(targetDate)}`;
        }

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

        if (document.getElementById("luckyColor")) document.getElementById("luckyColor").innerText = dynamicForecast.guidance.luckyColor;
        if (document.getElementById("luckyNumber")) document.getElementById("luckyNumber").innerText = dynamicForecast.guidance.luckyNumber;
        if (document.getElementById("goodTime")) document.getElementById("goodTime").innerText = dynamicForecast.guidance.goodTime;
        if (document.getElementById("badTime")) document.getElementById("badTime").innerText = dynamicForecast.guidance.badTime;

        let tipsCard = document.getElementById("mobile-tips-card");
        if (tipsCard) {
            tipsCard.innerHTML = `
                <div class="card-header">
                    <h3>🚨 Transit Watch: <span style="color: ${dynamicForecast.guidance.transitStatus === 'Clear' ? '#4adf8a' : '#ff6b6b'};">${dynamicForecast.guidance.transitStatus}</span></h3>
                </div>
                <div class="card-body">
                    <strong style="color: #ffffff !important; display: block; margin-bottom: 6px;">Transit Tips:</strong>
                    <span style="color: #e2e8f0; font-style: italic; line-height: 1.5; display: block; margin-bottom: 15px;">${dynamicForecast.guidance.transitTips}</span>
                    
                    <div style="border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 15px;">
                        <strong style="color: #ffffff !important; display: block; margin-bottom: 6px;">🎯 ACTVITIY OF THE DAY:</strong>
                        <span style="color: #e2e8f0; line-height: 1.5; display: block;">${dynamicForecast.guidance.cautionNote}</span>
                    </div>
                </div>
            `;
        }

        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        const mobNav = document.getElementById("mobile-navigation-bar");
        
        if (window.innerWidth <= 768) {
            if (mobNav) mobNav.style.display = "block";
            if (panelsContainer) {
                panelsContainer.style.display = "block";
                panelsContainer.style.gridTemplateColumns = "none";
                panelsContainer.style.width = "100%";
            }
            if (typeof switchMobileTab === "function") {
                switchMobileTab('forecast');
            }
        } else {
            if (mobNav) mobNav.style.display = "none";
            if (panelsContainer) {
                panelsContainer.style.display = "grid";
                panelsContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
                panelsContainer.style.gap = "20px";
                panelsContainer.style.width = "100%";
                panelsContainer.style.maxWidth = "100%";
            }
            
            const cForecast = document.getElementById("card-forecast");
            const cImportant = document.getElementById("card-important");
            const cHistory = document.getElementById("card-history");

            if (cForecast) cForecast.style.display = 'block';
            if (tipsCard) tipsCard.style.display = 'block';
            if (cImportant) cImportant.style.display = 'block';
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
            resultBox.innerText = "Invalid date values entered. Please confirm format matches DD-MM-YYYY.";
            return;
        }

        const explicitHistoryDate = new Date(yyyy, mm - 1, dd, 12, 0, 0);
        const historicalPayload = await generateHistoryForecast(profile, explicitHistoryDate);
        
        resultBox.style.fontStyle = "normal";
        resultBox.style.color = "#fff";
        resultBox.innerHTML = historicalPayload.forecast.split('\n').join('<br>');
    } catch (err) {
        resultBox.innerText = "Error tracking historical metrics.";
    }
}

async function handleSubmit() {
    const dobInput = document.getElementById("dob").value; 
    const tobValue = document.getElementById("tob").value; 
    const placeValue = document.getElementById("birth-place-input")?.value || ""; 

    try {
        if (!dobInput || dobInput.length < 10) throw new Error("Please enter a valid Date of Birth (DD-MM-YYYY).");
        if (!tobValue) throw new Error("Please select your Time of Birth.");

        const [day, month, year] = dobInput.split("-").map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
            throw new Error("Invalid date components. Use DD-MM-YYYY format.");
        }

        const [hour, minute] = tobValue.split(":").map(Number);

        // --- AUTOMATED TIMEZONE LOOKUP ---
        let resolvedTimezone = -(new Date().getTimezoneOffset() / 60); 
        const normalizedCity = placeValue.trim().toLowerCase();
        if (TIMEZONE_GEO_REGISTRY[normalizedCity] !== undefined) {
            resolvedTimezone = TIMEZONE_GEO_REGISTRY[normalizedCity];
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
        
        if (document.getElementById("confirmBtn")) document.getElementById("confirmBtn").style.display = "none";
        if (document.getElementById("rejectBtn")) document.getElementById("rejectBtn").style.display = "none";
        if (document.getElementById("resetBtn")) document.getElementById("resetBtn").style.display = "inline-block";
        
        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        if (panelsContainer) {
            panelsContainer.style.display = "grid";
            if (window.innerWidth > 768) {
                panelsContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
                panelsContainer.style.gap = "20px";
            } else {
                panelsContainer.style.display = "block";
            }
        }

        const historyBox = document.getElementById("attentionBox"); 
        if (historyBox) {
            updateHistoryCardHeader();
        }

        // Apply clean mobile panel toggle adjustments instantly on submission save
        adjustMobileInitialPanelVisibility(true);

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

document.addEventListener("DOMContentLoaded", () => {
    initializeGalaxyStarfield();
    loadStoredProfileAndRender();

    document.getElementById("submitBtn")?.addEventListener("click", handleSubmit);
    document.getElementById("confirmBtn")?.addEventListener("click", handleConfirm);
    document.getElementById("rejectBtn")?.addEventListener("click", handleReject);
    document.getElementById("resetBtn")?.addEventListener("click", handleReset);
    
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

    const tobInput = document.getElementById("tob");
    if (tobInput) {
        tobInput.addEventListener("change", () => {
            if (tobInput.value) {
                document.getElementById("birth-place-input")?.focus();
            }
        });
    }
});

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
    const tipsCard = document.getElementById("mobile-tips-card");
    const importantCard = document.getElementById("card-important");
    const historyCard = document.getElementById("card-history");

    if (forecastCard) forecastCard.style.display = (tabId === 'forecast') ? 'block' : 'none';
    if (tipsCard) tipsCard.style.display = (tabId === 'tips') ? 'block' : 'none';
    if (importantCard) importantCard.style.display = (tabId === 'important') ? 'block' : 'none';
    if (historyCard) historyCard.style.display = (tabId === 'history') ? 'block' : 'none';
};