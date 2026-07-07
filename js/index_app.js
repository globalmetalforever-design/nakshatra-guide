import { getBirthData } from "./birth_engine.js?v=100";
import { generateTimeLockedForecast as generateDailyForecast } from "../Addons/js/time_lock_addon.js?v=100";
import { generateTimeLockedForecast as generateHistoryForecast } from "../Addons/js/time_lock_addon.js?v=100";

let currentBirthProfile = null;

/**
 * UI Helper: Forces the attention block container header to read "History"
 */
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

function initializeDatePicker() {
    const datePicker = document.getElementById("forecast-date-input");
    if (datePicker && !datePicker.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        datePicker.value = `${yyyy}-${mm}-${dd}`;
    }
    const pickerDisplay = document.getElementById("forecast-date-input-display");
    if (pickerDisplay && datePicker) {
        pickerDisplay.innerText = datePicker.value;
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
        
        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        if (panelsContainer) {
            panelsContainer.style.display = "grid";
            panelsContainer.style.gridTemplateColumns = "repeat(3, 1fr)"; 
            panelsContainer.style.gap = "20px";
        }

        const historyBox = document.getElementById("attentionBox");
        if (historyBox) {
            const historyCard = historyBox.closest('.card') || historyBox;
            historyCard.style.display = "block";
            updateHistoryCardHeader();
        }

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
        
        if (forecastBox) {
            forecastBox.innerHTML = dynamicForecast.forecast.split('\n').join('<br>');
        }

        const historyBox = document.getElementById("attentionBox");
        if (historyBox) {
            updateHistoryCardHeader();
            
            historyBox.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size:0.85rem; opacity:0.7; margin-bottom:6px;">Enter History Date (DD-MM-YYYY):</label>
                    <input type="text" id="history-manual-date" placeholder="DD-MM-YYYY" maxlength="10" style="width:100%; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.15); padding:8px; border-radius:4px; color:#fff; font-family:inherit; outline:none; font-size:0.95rem;">
                </div>
                <div id="historyDisplayResult" style="font-size:0.88rem; opacity:0.85; line-height:1.5; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; font-style:italic; color:rgba(255,255,255,0.5); max-height:260px; overflow-y:auto;">
                    Enter any date above to unlock historical forecast details...
                </div>
            `;

            const historyInput = document.getElementById("history-manual-date");
            
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

        if (document.getElementById("luckyColor")) document.getElementById("luckyColor").innerText = dynamicForecast.guidance.luckyColor;
        if (document.getElementById("luckyNumber")) document.getElementById("luckyNumber").innerText = dynamicForecast.guidance.luckyNumber;
        if (document.getElementById("goodTime")) document.getElementById("goodTime").innerText = dynamicForecast.guidance.goodTime;
        if (document.getElementById("badTime")) document.getElementById("badTime").innerText = dynamicForecast.guidance.badTime;
        if (document.getElementById("dailyAction")) document.getElementById("dailyAction").innerText = dynamicForecast.guidance.action;

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
        
        const panelsContainer = document.getElementById("forecastAndAttentionPanels");
        if (panelsContainer) {
            panelsContainer.style.display = "grid";
            panelsContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
            panelsContainer.style.gap = "20px";
        }

        const historyBox = document.getElementById("attentionBox"); 
        if (historyBox) {
            updateHistoryCardHeader();
        }

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
                
                const pickerDisplay = document.getElementById("forecast-date-input-display");
                if (pickerDisplay) pickerDisplay.innerText = event.target.value;
                
                await renderUserDashboard(currentBirthProfile, targetedLocalDate);
            }
        });
    }
});
/**
 * Celestial Addon: Renders an independent, low-overhead HTML5 Canvas 
 * animated starfield constellation matrix directly into the UI background layer.
 */
function initializeGalaxyStarfield() {
    const canvas = document.getElementById('starfield-bg');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let stars = [];
    const numStars = 240; // Perfect count for a rich galaxy without impacting rendering performance

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Generate individual star coordinate structures with distinct sizes and twinkle rates
    for (let i = 0; i < numStars; i++) {
        const isSupergiant = Math.random() > 0.95; 
    const starSize = isSupergiant ? (Math.random() * 4.5 + 3.0) : (Math.random() * 2.0 + 0.8);
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3.0 + 1.0,
            alpha: Math.random(),
            twinkleSpeed: 0.005 + Math.random() * 0.015,
            direction: Math.random() > 0.5 ? 1 : -1
        });
    }

    // Continuous Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render background void tint
        ctx.fillStyle = '#060d1a'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw and update star coordinates
        for (let i = 0; i < numStars; i++) {
            let s = stars[i];
            
            // Adjust opacity delta to handle organic twinkling
            s.alpha += s.twinkleSpeed * s.direction;
            if (s.alpha >= 1 || s.alpha <= 0.1) {
                s.direction *= -1; // Reverse twinkle glow wave
            }

            // Draw glowing star points
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 150, ${s.alpha})`; // Elegant soft gold star colors
            ctx.fill();
        }
        
        requestAnimationFrame(animate);
    }

    animate();
}

// Fire the background engine immediately when the DOM initializes
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGalaxyStarfield);
} else {
    initializeGalaxyStarfield();
}