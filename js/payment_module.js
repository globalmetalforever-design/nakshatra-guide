// js/payment_module.js

const PAYMENT_CONFIG = {
    upi: {
        id: "YOUR_UPI_ID@okaxis", // Replace with your actual UPI ID
        name: "NakshatraGuide",
        amountINR: "299",
        getDeepLink: function() {
            return `upi://pay?pa=${this.id}&pn=${encodeURIComponent(this.name)}&am=${this.amountINR}&cu=INR`;
        }
    },
    paypal: {
        meLink: "https://paypal.me/YOUR_PAYPAL_USERNAME", // Replace with your PayPal.me link
        amountUSD: "4.99",
        getRedirectUrl: function() {
            return `${this.meLink}/${this.amountUSD}`;
        }
    }
};

let selectedGateway = null;

export function initPaymentUI() {
    window.openPaymentModal = () => {
        const modal = document.getElementById("paymentModal");
        if (modal) modal.style.display = "flex";
    };

    window.closePaymentModal = () => {
        const modal = document.getElementById("paymentModal");
        if (modal) modal.style.display = "none";
    };

    window.selectPaymentMode = (gateway) => {
        selectedGateway = gateway;
        const details = document.getElementById("checkoutDetails");
        const priceBox = document.getElementById("priceDisplay");
        const payBtn = document.getElementById("payRedirectBtn");

        if (!details || !priceBox || !payBtn) return;

        details.style.display = "block";

        if (gateway === 'upi') {
            priceBox.innerText = `Price: ₹${PAYMENT_CONFIG.upi.amountINR} (One-Time Lifetime)`;
            
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                payBtn.innerText = "Open GPay / PhonePe App";
                payBtn.onclick = () => {
                    window.location.href = PAYMENT_CONFIG.upi.getDeepLink();
                };
            } else {
                payBtn.innerText = `Copy UPI ID (${PAYMENT_CONFIG.upi.id})`;
                payBtn.onclick = () => {
                    navigator.clipboard.writeText(PAYMENT_CONFIG.upi.id);
                    alert(`UPI ID "${PAYMENT_CONFIG.upi.id}" copied to clipboard! Open your GPay/PhonePe mobile app and pay ₹${PAYMENT_CONFIG.upi.amountINR}.`);
                };
            }

        } else if (gateway === 'paypal') {
            priceBox.innerText = `Price: $${PAYMENT_CONFIG.paypal.amountUSD} USD (One-Time Lifetime)`;
            payBtn.innerText = "Proceed to PayPal";
            payBtn.onclick = () => {
                window.open(PAYMENT_CONFIG.paypal.getRedirectUrl(), '_blank');
            };
        }
    };

    window.verifyAndActivatePremium = () => {
        const input = document.getElementById("activationCodeInput")?.value.trim();
        if (!input || input.length < 4) {
            alert("Please enter a valid Transaction Reference or UTR Number.");
            return;
        }

        localStorage.setItem("isNakshatraPremium", "true");
        alert("Premium Interactive Mode Activated!");
        window.closePaymentModal();
        window.location.reload();
    };

    window.closeOffTopicModal = () => {
        const modal = document.getElementById("offTopicModal");
        if (modal) modal.style.display = "none";
    };

    window.handleQnaSubmit = (category) => {
        const inputElement = document.getElementById(`${category}QnaInput`) || document.getElementById("careerQnaInput");
        const resultBox = document.getElementById("qnaResultBox");
        
        if (!inputElement) return;

        const userQuery = inputElement.value.trim();
        if (!userQuery) {
            alert("Please type a question before clicking Get Answer.");
            return;
        }

        if (resultBox) {
            resultBox.innerHTML = `<span style="color: rgba(255,255,255,0.7); font-style: italic;">Consulting timing matrices...</span>`;
        }

        const lowerQuery = userQuery.toLowerCase();
        
        // 1. Check for off-topic queries (e.g., recipes, sports, jokes)
        const offTopicKeywords = ["cake", "bake", "recipe", "cook", "score", "match", "movie", "weather", "joke"];
        const isOffTopic = offTopicKeywords.some(keyword => lowerQuery.includes(keyword));

        setTimeout(() => {
            if (isOffTopic) {
                if (resultBox) resultBox.innerText = "";
                
                const offTopicModal = document.getElementById("offTopicModal");
                const offTopicText = document.getElementById("offTopicAnswerText");
                
                if (offTopicText) {
                    if (lowerQuery.includes("cake") || lowerQuery.includes("bake")) {
                        offTopicText.innerText = "To bake a simple cake: Mix 1 cup flour, 1 cup sugar, 1/2 cup butter, 2 eggs, and 1 tsp baking powder. Bake at 180°C (350°F) for 25-30 minutes until golden!";
                    } else {
                        offTopicText.innerText = `Here is a quick answer regarding "${userQuery}": It's best looked up via a general web search or sports guide!`;
                    }
                }
                if (offTopicModal) offTopicModal.style.display = "flex";

            } else {
                // 2. Dynamic Topic Classifier & Response Generator
                let responseText = "";

                if (lowerQuery.includes("finance") || lowerQuery.includes("money") || lowerQuery.includes("buy") || lowerQuery.includes("invest") || lowerQuery.includes("pay")) {
                    responseText = "<strong>💰 Financial Reading:</strong> Financial flows look steady. Avoid impulsive high-risk expenses over the next 48 hours, but mid-week brings favorable liquidity.";
                
                } else if (lowerQuery.includes("job") || lowerQuery.includes("career") || lowerQuery.includes("work") || lowerQuery.includes("boss") || lowerQuery.includes("promotion") || lowerQuery.includes("switch")) {
                    responseText = "<strong>💼 Career Reading:</strong> Your career house shows steady progress. Good window for skill-building, though major communication or job switches are best initiated in 3 to 5 days.";
                
                } else if (lowerQuery.includes("family") || lowerQuery.includes("love") || lowerQuery.includes("relation") || lowerQuery.includes("home") || lowerQuery.includes("marry") || lowerQuery.includes("marriage")) {
                    responseText = "<strong>👨‍👩‍👧‍👦 Family & Relationship Reading:</strong> Emotional alignment is positive today. Practice active listening with loved ones to resolve any underlying doubts smoothly.";
                
                } else if (lowerQuery.includes("health") || lowerQuery.includes("stress") || lowerQuery.includes("energy") || lowerQuery.includes("tired") || lowerQuery.includes("sleep")) {
                    responseText = "<strong>🔋 Vitality Reading:</strong> Energy levels require light pacing today. Prioritize rest during the afternoon window and avoid physical overexertion.";
                
                } else {
                    responseText = `<strong>✨ Timing Reading:</strong> Regarding "<em>${userQuery}</em>": The current lunar phase indicates a stable cycle. Take structured action within the favorable activity window.`;
                }

                if (resultBox) {
                    resultBox.style.color = "#ffd700";
                    resultBox.innerHTML = responseText;
                }
            }
        }, 500);
    };
}

export function checkPremiumState() {
    return localStorage.getItem("isNakshatraPremium") === "true";
}