import { getBirthData } from "./birth_engine.js";
import { generateDailyForecast } from "./daily_forecast_engine.js";

let currentBirthProfile = null;
let selectedTargetDate = null;

// --- PROFILE COUPLING CONTROLLER ---
async function loadStoredProfileAndRender() {
    const savedProfile = localStorage.getItem("permanentBirthProfile");
    
    if (savedProfile) {
        try {
            currentBirthProfile = JSON.parse(savedProfile);
            
            const now = new Date();
            selectedTargetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // HIDE THE INSTRUCTIONAL ONBOARDING NOTE
            const notePanel = document.getElementById("instructionalNotePanel");
            if (notePanel) notePanel.style.display = "none";

            // CONDITION 2ND TIME ONWARDS: PANEL 1 (BIG WELCOME BACK - NO NAKSHATRA)
            const panel1 = document.getElementById("panel1");
            if (panel1) {
                panel1.innerHTML = `
                    <h2 style="font-size: 28px; color: #ffd36b; letter-spacing: 1px; margin-bottom: 15px;">WELCOME BACK</h2>
                    <p style="color: #fff; font-size: 15px; line-height: 1.6; margin: 0;">
                        Your profile is securely loaded. Enjoy reading your real-time daily cosmic alignment forecasts below.
                    </p>
                `;
            }

            // CONDITION 2ND TIME ONWARDS: PANEL 2 (RETAIN NAKSHATRA, REMOVE ACTION BUTTONS, INJECT RESET)
            document.getElementById("detectedNakshatra").innerText = `${currentBirthProfile.nakshatra.name}`;
            document.getElementById("detectedPada").innerText = `Pada ${currentBirthProfile.pada.number}`;
            document.getElementById("vedicRasi").innerText = currentBirthProfile.rasi.name;
            document.getElementById("westernZodiac").innerText = currentBirthProfile.zodiac.name;
            
            document.getElementById("confirmBtn").style.display = "none";
            document.getElementById("rejectBtn").style.display = "none";
            
            const actionRow = document.getElementById("onboardingActions");
            if (actionRow) {
                actionRow.innerHTML = `
                    <button id="resetProfileBtn" style="background-color: #ff9999; color: #000; font-weight: bold; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; margin-top: 10px; width: 100%;">
                        Reset Profile
                    </button>
                `;
                document.getElementById("resetProfileBtn")?.addEventListener("click", handleReset);
            }

            // GENERATE FORECAST & SHOW PANEL 3 LIVE TODAY'S GUIDANCE
            const dailyData = await generateDailyForecast(currentBirthProfile, selectedTargetDate);
            renderForecastToDOM(dailyData);

        } catch (err) {
            console.error("Local account profile parse failure:", err);
            localStorage.removeItem("permanentBirthProfile");
        }
    }
}

function renderForecastToDOM(dailyData) {
    // Populate text inside lower boxes
    document.getElementById("forecastBox").innerHTML = dailyData.forecast;
    document.getElementById("attentionBox").innerHTML = dailyData.attention;

    // Shift Panel 3 to live view configuration
    document.getElementById("guidanceStaticPlaceholder").style.display = "none";
    const liveView = document.getElementById("guidanceLiveContent");
    if (liveView) liveView.style.display = "block";

    // Bind metrics
    document.getElementById("luckyColor").innerText = dailyData.guidance.luckyColor;
    document.getElementById("luckyNumber").innerText = dailyData.guidance.luckyNumber;
    document.getElementById("goodTime").innerText = dailyData.guidance.goodTime;
    document.getElementById("badTime").innerText = dailyData.guidance.badTime;
    document.getElementById("dailyAction").innerText = dailyData.guidance.action;

    // Disclose bottom cards
    document.getElementById("forecastArea").style.display = "block";
}

async function handleSubmit() {
    const dob = document.getElementById("dob").value;
    const tob = document.getElementById("tob").value;
    const pob = document.getElementById("pob").value;
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

        selectedTargetDate = new Date(year, month - 1, day);
        currentBirthProfile = await getBirthData(inputPayload);

        document.getElementById("detectedNakshatra").innerText = `${currentBirthProfile.nakshatra.name}`;
        document.getElementById("detectedPada").innerText = `Pada ${currentBirthProfile.pada.number}`;
        document.getElementById("vedicRasi").innerText = currentBirthProfile.rasi.name;
        document.getElementById("westernZodiac").innerText = currentBirthProfile.zodiac.name;
        
        document.getElementById("confirmBtn").style.display = "inline-block";
        document.getElementById("rejectBtn").style.display = "inline-block";

    } catch (err) {
        document.getElementById("detectedNakshatra").innerText = err.message;
        document.getElementById("detectedPada").innerText = "";
        document.getElementById("vedicRasi").innerText = "-";
        document.getElementById("westernZodiac").innerText = "-";
        document.getElementById("confirmBtn").style.display = "none";
        document.getElementById("rejectBtn").style.display = "none";
    }
}

async function handleConfirm() {
    if (!currentBirthProfile || !selectedTargetDate) return;

    try {
        localStorage.setItem("permanentBirthProfile", JSON.stringify(currentBirthProfile));
        window.location.reload();
    } catch (err) {
        alert("Error executing forecast synthesis: " + err.message);
    }
}

function handleReject() {
    currentBirthProfile = null;
    selectedTargetDate = null;
    document.getElementById("confirmBtn").style.display = "none";
    document.getElementById("rejectBtn").style.display = "none";
    document.getElementById("detectedNakshatra").innerText = "Waiting for Birth Details";
    document.getElementById("detectedPada").innerText = "";
    document.getElementById("vedicRasi").innerText = "-";
    document.getElementById("westernZodiac").innerText = "-";
}

function handleReset() {
    localStorage.removeItem("permanentBirthProfile");
    currentBirthProfile = null;
    selectedTargetDate = null;
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

document.addEventListener("DOMContentLoaded", () => {
    loadStoredProfileAndRender();

    document.getElementById("submitBtn")?.addEventListener("click", handleSubmit);
    document.getElementById("confirmBtn")?.addEventListener("click", handleConfirm);
    document.getElementById("rejectBtn")?.addEventListener("click", handleReject);
    
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