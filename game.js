/* ==========================================================================
   DÖNER PALACE - GAME CORE LOGIC & AUDIO SYNTHESIS
   ========================================================================== */

// --- 1. WEB AUDIO API SYNTHESIZER ---
class CozyAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.activeSiren = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // Chop/Place sound (fast frequency sweep pitch drop)
    playChop() {
        if (this.muted) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Sizzling loop for meat shaving (Filtered white noise)
    createSizzleNode() {
        if (this.muted) return null;
        this.init();

        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Populate buffer with white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0.08;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        return { noise, gain };
    }

    // Drink can/bottle pop + pour sound
    playDrinkPop() {
        if (this.muted) return;
        this.init();
        
        const now = this.ctx.currentTime;
        
        // Pop sound (short high frequency pulse)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.start();
        osc.stop(now + 0.08);

        // Pour sound (quick bubbly noise)
        setTimeout(() => {
            if (this.muted) return;
            const pourOsc = this.ctx.createOscillator();
            const pourGain = this.ctx.createGain();
            pourOsc.connect(pourGain);
            pourGain.connect(this.ctx.destination);
            pourOsc.type = 'sine';
            pourOsc.frequency.setValueAtTime(300, this.ctx.currentTime);
            
            // Random bubbling frequency modulation
            let time = this.ctx.currentTime;
            for (let i = 0; i < 6; i++) {
                pourOsc.frequency.setValueAtTime(300 + Math.random() * 150, time);
                time += 0.05;
            }
            
            pourGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            pourGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
            pourOsc.start();
            pourOsc.stop(this.ctx.currentTime + 0.35);
        }, 80);
    }

    // Fridge open creak sound
    playFridgeOpen() {
        if (this.muted) return;
        this.init();
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        
        osc.start();
        osc.stop(now + 0.25);
    }

    // Success Chime (cozy major chord bell)
    playSuccess() {
        if (this.muted) return;
        this.init();
        
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.65);
        });
    }

    // Mistake Buzzer
    playBuzzer() {
        if (this.muted) return;
        this.init();
        
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(130, now);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(133, now); // detune slightly
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
    }

    // Zabıta Police Siren (returns controller to stop it later)
    startSiren() {
        if (this.muted) return null;
        this.init();
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        
        // Program siren sweeps
        let time = now;
        for (let i = 0; i < 20; i++) {
            osc.frequency.linearRampToValueAtTime(850, time + 0.4);
            osc.frequency.linearRampToValueAtTime(600, time + 0.8);
            time += 0.8;
        }
        
        gain.gain.setValueAtTime(0.25, now);
        osc.start();
        
        this.activeSiren = { osc, gain };
        return this.activeSiren;
    }

    stopSiren() {
        if (this.activeSiren) {
            try {
                this.activeSiren.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
                const s = this.activeSiren.osc;
                setTimeout(() => s.stop(), 250);
            } catch(e) {}
            this.activeSiren = null;
        }
    }
}

const audio = new CozyAudio();

// --- 2. GAME STATE MANAGEMENT ---
const STATE = {
    stars: 2.5,
    day: 1,
    ordersServedThisDay: 0,
    currentOrder: null,
    
    // Shaved Meat tray levels (0 to 100)
    trayFills: {
        tavuk: 0,
        et: 0
    },
    
    // What is currently on the prep board
    activePrep: {
        base: null, // 'wrap', 'sandwich', 'plate'
        meatType: null, // 'tavuk', 'et'
        meatCount: 0,
        ingredients: {}, // { marul: 3, sogan: 2, etc. }
        isPacked: false
    },
    
    // What is on the serving tray
    servingTray: {
        food: null, // same structure as activePrep when packed
        drink: null // 'ayran', 'cola', 'salgam', 'fanta'
    },
    
    // Interactive cursor state
    activeTool: null, // e.g. 'ing-marul', 'meat-tavuk', 'meat-et'
    isShaving: false,
    shaveNode: null,
    shaveInterval: null
};

// Ingredient limitations based on base type
const INGREDIENT_RULES = {
    wrap: { allowed: ['marul', 'sogan', 'domates', 'tursu', 'patates', 'sos'], auto: [] },
    sandwich: { allowed: ['marul', 'sogan', 'domates', 'tursu', 'patates', 'ketcap', 'mayonez'], auto: [] },
    plate: { allowed: ['marul', 'sogan', 'domates', 'tursu', 'patates', 'ketcap', 'mayonez', 'pilav'], auto: ['pilav'] }
};

// Customer configurations for cozy random generation
const CUSTOMER_NAMES = ["Elif", "Mehmet", "Can", "Zeynep", "Ali", "Ayşe", "Mustafa", "Fatma", "Deniz", "Selim"];
const CUSTOMER_SKIN_COLORS = ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#8d5524"];
const CUSTOMER_HAIR_COLORS = ["#090806", "#2c222b", "#714a37", "#a7856a", "#b89778", "#d1523b"];
const CUSTOMER_CLOTHES_COLORS = ["#4caf50", "#2196f3", "#9c27b0", "#e91e63", "#ff9800", "#00bcd4"];

// --- 3. DOM ELEMENTS ---
const dom = {
    dayValue: document.getElementById('day-value'),
    starsContainer: document.getElementById('stars-container'),
    starsNumeric: document.getElementById('stars-numeric'),
    helpBtn: document.getElementById('help-btn'),
    muteBtn: document.getElementById('mute-btn'),
    ticketRail: document.getElementById('ticket-rail'),
    
    shaveTavuk: document.getElementById('shave-tavuk'),
    shaveEt: document.getElementById('shave-et'),
    fillTavuk: document.getElementById('fill-tavuk'),
    fillEt: document.getElementById('fill-et'),
    piecesTavuk: document.getElementById('pieces-tavuk'),
    piecesEt: document.getElementById('pieces-et'),
    trayTavuk: document.getElementById('tray-tavuk'),
    trayEt: document.getElementById('tray-et'),
    
    customerSpeech: document.getElementById('customer-speech'),
    activeCustomer: document.getElementById('active-customer'),
    speechBubbleContainer: document.getElementById('speech-bubble-container'),
    
    fridge: document.getElementById('fridge'),
    fridgeDoor: document.getElementById('fridge-door'),
    prepBoard: document.getElementById('prep-board'),
    prepBaseContainer: document.getElementById('prep-base-container'),
    
    baseBtns: document.querySelectorAll('.base-btn'),
    ingredientBoxes: document.querySelectorAll('.ingredient-box'),
    drinkBottles: document.querySelectorAll('.drink-bottle'),
    
    trayFoodSlot: document.getElementById('tray-food-slot'),
    trayDrinkSlot: document.getElementById('tray-drink-slot'),
    wrapPackBtn: document.getElementById('wrap-pack-btn'),
    serveBtn: document.getElementById('serve-btn'),
    trashBtn: document.getElementById('trash-btn'),
    
    policeOverlay: document.getElementById('police-overlay'),
    restartBtn: document.getElementById('restart-btn'),
    helpModal: document.getElementById('help-modal'),
    closeHelpBtn: document.getElementById('close-help-btn')
};

// --- 4. GAME INITIALIZATION ---
function initGame() {
    setupEventListeners();
    updateStarsUI();
    generateNewCustomer();
    updateIngredientLocks();
}

// --- 5. CUSTOMER & ORDER GENERATION ---
function generateNewCustomer() {
    // Clear serving tray and preparation board
    resetPreparation();
    dom.trayFoodSlot.innerHTML = `<div class="tray-empty-slot-msg">Yemek Yok</div>`;
    dom.trayDrinkSlot.innerHTML = `<div class="tray-empty-slot-msg">İçecek Yok</div>`;
    STATE.servingTray.food = null;
    STATE.servingTray.drink = null;
    dom.serveBtn.disabled = true;
    
    // Generate cosmetic features for the customer avatar
    const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
    const skin = CUSTOMER_SKIN_COLORS[Math.floor(Math.random() * CUSTOMER_SKIN_COLORS.length)];
    const hair = CUSTOMER_HAIR_COLORS[Math.floor(Math.random() * CUSTOMER_HAIR_COLORS.length)];
    const clothes = CUSTOMER_CLOTHES_COLORS[Math.floor(Math.random() * CUSTOMER_CLOTHES_COLORS.length)];
    
    dom.activeCustomer.className = "customer";
    dom.activeCustomer.innerHTML = `
        <div class="customer-hair" style="background-color: ${hair};"></div>
        <div class="customer-head" style="background-color: ${skin};">
            <div class="customer-eyes">
                <div class="customer-eye"></div>
                <div class="customer-eye"></div>
            </div>
            <div class="customer-mouth"></div>
        </div>
        <div class="customer-body" style="background-color: ${clothes};"></div>
    `;
    
    // Build random order
    const baseTypes = ['wrap', 'sandwich', 'plate'];
    const base = baseTypes[Math.floor(Math.random() * baseTypes.length)];
    const meatType = Math.random() > 0.5 ? 'tavuk' : 'et';
    const isDouble = Math.random() > 0.45; // 45% chance of double order
    
    // Pick toppings appropriate to rules
    const allowedIngs = INGREDIENT_RULES[base].allowed.filter(i => i !== 'pilav' && i !== 'sos' && i !== 'ketcap' && i !== 'mayonez');
    const selectedToppings = [];
    allowedIngs.forEach(ing => {
        if (Math.random() > 0.4) {
            selectedToppings.push(ing);
        }
    });
    
    // Select sauces
    const sauces = [];
    if (base === 'wrap' && Math.random() > 0.3) {
        sauces.push('sos');
    } else if ((base === 'sandwich' || base === 'plate')) {
        if (Math.random() > 0.5) sauces.push('ketcap');
        if (Math.random() > 0.5) sauces.push('mayonez');
    }
    
    // Drink selection
    let drink = null;
    if (Math.random() > 0.3) {
        const drinks = ['ayran', 'cola', 'salgam', 'fanta'];
        drink = drinks[Math.floor(Math.random() * drinks.length)];
    }
    
    STATE.currentOrder = {
        name,
        base,
        meatType,
        isDouble,
        toppings: [...selectedToppings, ...sauces],
        drink
    };
    
    // Render speech text
    renderCustomerSpeech();
    
    // Render receipt ticket
    renderReceiptTicket();
}

function renderCustomerSpeech() {
    const o = STATE.currentOrder;
    let text = `Merhaba! Ben ${o.name}. `;
    
    const baseNames = { wrap: "Dürüm", sandwich: "Ekmek Arası", plate: "Porsiyon" };
    const meatNames = { tavuk: "Tavuklu", et: "Etli" };
    
    let orderName = `${meatNames[o.meatType]} ${baseNames[o.base]}`;
    if (o.isDouble) {
        orderName = o.base === 'plate' ? `Çift Porsiyon ${meatNames[o.meatType]} Döner` : `Duble ${meatNames[o.meatType]} ${baseNames[o.base]}`;
    }
    
    text += `Bana bolca sevgiyle bir <strong>${orderName}</strong> hazırlar mısın? `;
    
    if (o.toppings.length === 0) {
        text += "Sade olsun lütfen, yeşillik falan istemiyorum.";
    } else {
        const trToppings = {
            marul: "marul", sogan: "soğan", domates: "domates", tursu: "turşu", 
            patates: "patates kızartması", sos: "özel sos", ketcap: "ketçap", mayonez: "mayonez"
        };
        const list = o.toppings.map(t => trToppings[t]).join(', ');
        text += `İçinde <strong>${list}</strong> olsun.`;
    }
    
    if (o.drink) {
        const drinkNames = { ayran: "Ayran", cola: "Kola", salgam: "Şalgam", fanta: "Fanta" };
        text += ` Yanına da soğuk bir <strong>${drinkNames[o.drink]}</strong> alayım.`;
    } else {
        text += " İçecek istemiyorum, teşekkürler.";
    }
    
    dom.customerSpeech.innerHTML = text;
    dom.speechBubbleContainer.style.display = "flex";
}

function renderReceiptTicket() {
    dom.ticketRail.innerHTML = '';
    const o = STATE.currentOrder;
    
    const baseNames = { wrap: "DÜRÜM WRAP", sandwich: "SANDWICH", plate: "PLATE PORTION" };
    const meatNames = { tavuk: "TAVUK / CHICKEN", et: "ET / BEEF" };
    const drinkNames = { ayran: "AYRAN", cola: "COLA", salgam: "SALGAM", fanta: "FANTA" };
    const toppingNames = {
        marul: "Lettuce (Marul)", sogan: "Onion (Sogan)", domates: "Tomato (Domates)",
        tursu: "Pickle (Tursu)", patates: "Fries (Patates)", sos: "Wrap Sauce",
        ketcap: "Ketchup", mayonez: "Mayonnaise", pilav: "Rice (Pilav)"
    };
    
    // Math out ticket prices for retro-arcade effect
    let foodPrice = o.base === 'plate' ? 120 : (o.base === 'wrap' ? 90 : 80);
    if (o.meatType === 'et') foodPrice += 30; // beef is premium
    if (o.isDouble) foodPrice += 40; // double portion pricing
    
    const drinkPrice = o.drink ? 25 : 0;
    const total = foodPrice + drinkPrice;
    const ticketId = Math.floor(100 + Math.random() * 900);
    
    const ticket = document.createElement('div');
    ticket.className = 'receipt-ticket';
    ticket.id = `ticket-${ticketId}`;
    if (o.isDouble) {
        ticket.style.borderTopColor = '#d32f2f'; // dark red marker for double
    }
    
    let toppingsHtml = o.toppings.map(t => `<div class="ticket-row"><span>+ ${toppingNames[t]}</span><span>INCL</span></div>`).join('');
    if (o.base === 'plate') {
        toppingsHtml = `<div class="ticket-row"><span>+ Rice (Pilav)</span><span>INCL</span></div>` + toppingsHtml;
    }
    if (toppingsHtml === '') toppingsHtml = `<div class="ticket-row"><span>+ PLAIN (SADE)</span><span></span></div>`;
    
    const doubleBadge = o.isDouble ? `<div class="ticket-row" style="color:#d32f2f; font-weight:bold; font-size:9px; margin-top:2px;"><span>* DUBLE / DOUBLE *</span><span></span></div>` : '';
    
    ticket.innerHTML = `
        <div class="ticket-header">
            <div>DONER PALACE</div>
            <div class="ticket-id">TKT #${ticketId}</div>
        </div>
        <div class="ticket-body">
            <div class="ticket-row" style="font-weight:bold;">
                <span>${baseNames[o.base]}</span>
                <span>${foodPrice} TL</span>
            </div>
            <div class="ticket-row" style="font-size:8px; color:#555;">
                <span>(${meatNames[o.meatType]})</span>
            </div>
            ${doubleBadge}
            
            <div class="ticket-divider"></div>
            
            <div class="ticket-expanded-only" style="margin-bottom: 4px;">
                ${toppingsHtml}
            </div>
            
            ${o.drink ? `
            <div class="ticket-row" style="font-weight:bold;">
                <span>${drinkNames[o.drink]}</span>
                <span>${drinkPrice} TL</span>
            </div>` : ''}
            
            <div class="ticket-divider"></div>
            <div class="ticket-total">TOTAL: ${total} TL</div>
        </div>
    `;
    
    // Toggle expand class on click
    ticket.addEventListener('click', () => {
        ticket.classList.toggle('expanded');
    });
    
    dom.ticketRail.appendChild(ticket);
}

// --- 6. SHAVING SPIT MECHANICS ---
function startShaving(meatType, e) {
    // Enforce picking up the knife first
    if (STATE.activeTool !== 'knife') {
        audio.playBuzzer();
        dom.customerSpeech.innerHTML = `<strong>Usta!</strong> Önce döner bıçağını eline almalısın!`;
        return;
    }
    
    STATE.isShaving = true;
    audio.init();
    
    const spit = document.getElementById(`spit-${meatType}`);
    spit.style.transform = "scale(0.96)";
    
    // Start procedural sizzle audio loop
    STATE.shaveNode = audio.createSizzleNode();
    if (STATE.shaveNode) {
        STATE.shaveNode.noise.start(0);
    }
    
    // Run interval to spawn shavings and fill tray
    let lastY = e.clientY;
    
    function handleMove(moveEvent) {
        if (!STATE.isShaving) return;
        
        const currentY = moveEvent.clientY;
        const delta = Math.abs(currentY - lastY);
        
        // Only shave if dragging
        if (delta > 3) {
            spawnShavingParticle(meatType, moveEvent.clientX, moveEvent.clientY);
            
            // Add to tray level
            STATE.trayFills[meatType] = Math.min(100, STATE.trayFills[meatType] + 1.2);
            updateTrayUI(meatType);
            
            // Pitch modulation based on speed
            if (STATE.shaveNode) {
                STATE.shaveNode.gain.gain.value = Math.min(0.2, 0.05 + delta * 0.005);
            }
        }
        lastY = currentY;
    }
    
    window.addEventListener('mousemove', handleMove);
    
    function stopShavingHandler() {
        STATE.isShaving = false;
        spit.style.transform = "scale(1)";
        
        if (STATE.shaveNode) {
            try {
                STATE.shaveNode.noise.stop();
            } catch(err) {}
            STATE.shaveNode = null;
        }
        
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', stopShavingHandler);
    }
    
    window.addEventListener('mouseup', stopShavingHandler);
}

function spawnShavingParticle(meatType, x, y) {
    const particle = document.createElement('div');
    particle.className = `meat-particle ${meatType}`;
    
    // Position at mouse relative to game container
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const rx = x - containerRect.left;
    const ry = y - containerRect.top;
    
    particle.style.left = `${rx}px`;
    particle.style.top = `${ry}px`;
    
    document.getElementById('game-container').appendChild(particle);
    
    // Animate falling towards the respective tray
    const tray = document.getElementById(`tray-${meatType}`);
    const trayRect = tray.getBoundingClientRect();
    const trayX = trayRect.left - containerRect.left + trayRect.width / 2 + (Math.random() * 40 - 20);
    const trayY = trayRect.top - containerRect.top + 10;
    
    const duration = 0.4 + Math.random() * 0.2;
    
    particle.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${trayX - rx}px, ${trayY - ry}px) rotate(${Math.random() * 360}deg)`, opacity: 0.8 }
    ], {
        duration: duration * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    setTimeout(() => {
        particle.remove();
        // Add visual piece into tray
        addPieceToTrayVisual(meatType);
    }, duration * 1000);
}

function addPieceToTrayVisual(meatType) {
    const trayPiecesContainer = document.getElementById(`pieces-${meatType}`);
    if (trayPiecesContainer.children.length > 25) {
        // Keep visual count tidy
        trayPiecesContainer.children[0].remove();
    }
    
    const piece = document.createElement('div');
    piece.className = `tray-piece ${meatType}`;
    piece.style.left = `${Math.random() * 80 + 5}px`;
    piece.style.bottom = `${Math.random() * 15 + 2}px`;
    piece.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;
    
    trayPiecesContainer.appendChild(piece);
}

function updateTrayUI(meatType) {
    const fillEl = document.getElementById(`fill-${meatType}`);
    const fillPercentage = STATE.trayFills[meatType];
    fillEl.style.height = `${fillPercentage}%`;
}

function selectMeatFromTray(meatType) {
    if (STATE.trayFills[meatType] <= 0) return;
    
    // Put tool in meat mode
    clearActiveTool();
    STATE.activeTool = `meat-${meatType}`;
    
    // Visual pointer feedback
    document.body.style.cursor = 'copy';
    
    // Highlight prep board to indicate action is ready there
    dom.prepBoard.style.borderColor = 'var(--neon-orange)';
}

// --- 7. INGREDIENT AND TOOL PICKING ---
function handleIngredientBoxClick(box) {
    if (box.classList.contains('locked')) return;
    
    const ing = box.dataset.ing;
    
    // If active already, toggle off
    if (STATE.activeTool === `ing-${ing}`) {
        clearActiveTool();
    } else {
        clearActiveTool();
        STATE.activeTool = `ing-${ing}`;
        box.classList.add('active');
        document.body.style.cursor = 'cell';
    }
}

function toggleKnife() {
    if (STATE.activeTool === 'knife') {
        clearActiveTool();
    } else {
        clearActiveTool();
        STATE.activeTool = 'knife';
        const stand = document.getElementById('knife-stand');
        if (stand) {
            stand.classList.add('active');
            stand.classList.add('empty');
        }
        const container = document.getElementById('game-container');
        if (container) {
            container.classList.add('knife-active');
        }
        audio.playChop();
    }
}

function clearActiveTool() {
    STATE.activeTool = null;
    document.body.style.cursor = 'default';
    dom.prepBoard.style.borderColor = '#bcaaa4';
    dom.ingredientBoxes.forEach(b => b.classList.remove('active'));
    
    // Reset knife stand states
    const stand = document.getElementById('knife-stand');
    if (stand) {
        stand.classList.remove('active');
        stand.classList.remove('empty');
    }
    const container = document.getElementById('game-container');
    if (container) {
        container.classList.remove('knife-active');
    }
}

function updateIngredientLocks() {
    const base = STATE.activePrep.base;
    
    dom.ingredientBoxes.forEach(box => {
        const ing = box.dataset.ing;
        
        if (!base) {
            box.classList.add('locked');
            return;
        }
        
        const rules = INGREDIENT_RULES[base];
        if (rules.allowed.includes(ing)) {
            box.classList.remove('locked');
        } else {
            box.classList.add('locked');
            box.classList.remove('active');
        }
    });
}

// --- 8. PREPARATION & WORKSPACE ASSEMBLY ---
function setServiceBase(baseType) {
    if (STATE.activePrep.isPacked) return;
    
    audio.playChop();
    resetPreparation();
    
    STATE.activePrep.base = baseType;
    updateIngredientLocks();
    
    // Build Base HTML
    let baseHtml = '';
    if (baseType === 'wrap') {
        baseHtml = `
            <div class="food-base wrap-base" id="food-base-element">
                <div class="food-ingredients-container" id="food-ings"></div>
            </div>
        `;
    } else if (baseType === 'sandwich') {
        baseHtml = `
            <div class="food-base sandwich-base" id="food-base-element">
                <div class="sandwich-inside">
                    <div class="food-ingredients-container" id="food-ings"></div>
                </div>
                <div class="sandwich-top-bun"></div>
            </div>
        `;
    } else if (baseType === 'plate') {
        baseHtml = `
            <div class="food-base plate-base" id="food-base-element">
                <div class="plate-inner">
                    <div class="food-ingredients-container" id="food-ings"></div>
                </div>
                <div class="plate-cover-flash">🍽️</div>
            </div>
        `;
    }
    
    dom.prepBaseContainer.innerHTML = baseHtml;
    dom.wrapPackBtn.disabled = false;
    
    // Set active class on buttons
    dom.baseBtns.forEach(btn => {
        if (btn.dataset.base === baseType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Auto items (e.g. Pilav on Plate)
    const rules = INGREDIENT_RULES[baseType];
    if (rules.auto.includes('pilav')) {
        for (let i = 0; i < 15; i++) {
            placeIngredientVisual('pilav', 45 + Math.random() * 110, 45 + Math.random() * 110);
        }
        STATE.activePrep.ingredients['pilav'] = 15;
    }
}

function resetPreparation() {
    STATE.activePrep = {
        base: null,
        meatType: null,
        meatCount: 0,
        ingredients: {},
        isPacked: false
    };
    
    dom.prepBaseContainer.innerHTML = `<div class="empty-board-msg">Başlamak için aşağıdan bir servis türü seçin</div>`;
    dom.wrapPackBtn.disabled = true;
    
    dom.baseBtns.forEach(btn => btn.classList.remove('active'));
    clearActiveTool();
    updateIngredientLocks();
}

function handlePrepBoardClick(e) {
    if (!STATE.activePrep.base || STATE.activePrep.isPacked) return;
    if (!STATE.activeTool) return;
    
    const baseEl = document.getElementById('food-base-element');
    if (!baseEl) return;
    
    const rect = baseEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Validate boundaries (ensure they click roughly inside the base shape)
    const isWrapOrPlate = STATE.activePrep.base === 'wrap' || STATE.activePrep.base === 'plate';
    if (isWrapOrPlate) {
        // Circle boundary check (radius ~100px)
        const dx = x - 100;
        const dy = y - 100;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 105) return; // clicked outside plate/wrap circle
    } else {
        // Long Turkish Bread (270x100) interior boundary check (margin ~15px)
        if (x < 15 || x > 255 || y < 15 || y > 85) return;
    }
    
    // 1. Meat placement
    if (STATE.activeTool.startsWith('meat-')) {
        const type = STATE.activeTool.split('-')[1];
        
        // Decrement Tray Level
        if (STATE.trayFills[type] <= 0) {
            clearActiveTool();
            return;
        }
        
        // One scoop consumes 20% of tray capacity
        STATE.trayFills[type] = Math.max(0, STATE.trayFills[type] - 20);
        updateTrayUI(type);
        if (STATE.trayFills[type] <= 0) {
            // Empty visual pieces
            document.getElementById(`pieces-${type}`).innerHTML = '';
        }
        
        STATE.activePrep.meatType = type;
        
        // Place 3 meat pieces scattered around clicked point
        for (let i = 0; i < 3; i++) {
            const ox = x + (Math.random() * 24 - 12);
            const oy = y + (Math.random() * 16 - 8);
            placeIngredientVisual('meat-piece', ox, oy, type);
            STATE.activePrep.meatCount++;
        }
        audio.playChop();
        
        // Clear active tool after placing one scoop (so player has to scoop again for double)
        clearActiveTool();
    }
    // 2. Veggie/Sauce placement
    else if (STATE.activeTool.startsWith('ing-')) {
        const ing = STATE.activeTool.split('-')[1];
        
        // Check ingredient rules again
        if (!INGREDIENT_RULES[STATE.activePrep.base].allowed.includes(ing)) return;
        
        // Place topping visual
        const isSauce = ing === 'sos' || ing === 'ketcap' || ing === 'mayonez';
        if (isSauce) {
            placeSauceVisual(ing, x, y);
        } else {
            placeIngredientVisual(ing, x, y);
        }
        
        // Increment state
        STATE.activePrep.ingredients[ing] = (STATE.activePrep.ingredients[ing] || 0) + 1;
        audio.playChop();
    }
}

function placeIngredientVisual(ingClass, x, y, extraClass = '') {
    const ingsContainer = document.getElementById('food-ings');
    if (!ingsContainer) return;
    
    const el = document.createElement('div');
    el.className = `placed-ing ${ingClass} ${extraClass}`;
    el.style.left = `${x - 10}px`;
    el.style.top = `${y - 6}px`;
    
    // Random rotation for handmade feel
    const rot = Math.random() * 360;
    el.style.transform = `rotate(${rot}deg)`;
    
    ingsContainer.appendChild(el);
}

function placeSauceVisual(sauceClass, x, y) {
    const ingsContainer = document.getElementById('food-ings');
    if (!ingsContainer) return;
    
    // Draw 3 tiny dots around click for sauce splatter look
    for (let i = 0; i < 3; i++) {
        const sx = x + (Math.random() * 16 - 8);
        const sy = y + (Math.random() * 16 - 8);
        
        const el = document.createElement('div');
        el.className = `placed-sauce ${sauceClass}`;
        el.style.left = `${sx - 4}px`;
        el.style.top = `${sy - 4}px`;
        ingsContainer.appendChild(el);
    }
}

// --- 9. PACKAGING AND SERVING ---
function packActiveFood() {
    if (!STATE.activePrep.base || STATE.activePrep.isPacked) return;
    
    STATE.activePrep.isPacked = true;
    dom.wrapPackBtn.disabled = true;
    clearActiveTool();
    
    const baseEl = document.getElementById('food-base-element');
    
    // Trigger respective packing animations
    if (STATE.activePrep.base === 'wrap') {
        baseEl.classList.add('rolling');
    } else if (STATE.activePrep.base === 'sandwich') {
        baseEl.classList.add('closing');
    } else if (STATE.activePrep.base === 'plate') {
        baseEl.classList.add('covering');
    }
    
    // Play wrap sounds/bell
    audio.playChop();
    
    setTimeout(() => {
        // Clone state for tray slot
        STATE.servingTray.food = JSON.parse(JSON.stringify(STATE.activePrep));
        
        // Render food icon on serving tray
        const foodEmojis = { wrap: "🌯", sandwich: "🥖", plate: "🍽️" };
        dom.trayFoodSlot.innerHTML = `<div class="served-food-item">${foodEmojis[STATE.activePrep.base]}</div>`;
        
        // Clear prep workspace
        dom.prepBaseContainer.innerHTML = `<div class="empty-board-msg">Hazırlandı! Tepsiden servis edebilirsiniz.</div>`;
        dom.serveBtn.disabled = false;
    }, 600);
}

function handleFridgeDoorOpen() {
    audio.playFridgeOpen();
}

function selectDrink(drinkType) {
    audio.playDrinkPop();
    STATE.servingTray.drink = drinkType;
    
    const drinkLabels = { ayran: "Ayran", cola: "Kola", salgam: "Şalgam", fanta: "Fanta" };
    dom.trayDrinkSlot.innerHTML = `
        <div class="served-drink-item drink-bottle ${drinkType}">
            <div class="drink-label">${drinkLabels[drinkType]}</div>
        </div>
    `;
}

function clearTrayItems() {
    audio.playChop();
    resetPreparation();
    
    dom.trayFoodSlot.innerHTML = `<div class="tray-empty-slot-msg">Yemek Yok</div>`;
    dom.trayDrinkSlot.innerHTML = `<div class="tray-empty-slot-msg">İçecek Yok</div>`;
    STATE.servingTray.food = null;
    STATE.servingTray.drink = null;
    dom.serveBtn.disabled = true;
}

// --- 10. ORDER CHECKER & VERIFICATION ---
function serveOrder() {
    if (!STATE.servingTray.food) return;
    
    const order = STATE.currentOrder;
    const food = STATE.servingTray.food;
    const drink = STATE.servingTray.drink;
    
    let isCorrect = true;
    let feedback = "";
    
    // 1. Check Service Base
    if (food.base !== order.base) {
        isCorrect = false;
        const bNames = { wrap: "dürüm", sandwich: "ekmek arası", plate: "porsiyon tabağı" };
        feedback = `Ben ${bNames[order.base]} istemiştim, bu ise ${bNames[food.base]}!`;
    } 
    // 2. Check Meat Type and Quantity
    else if (food.meatCount === 0) {
        isCorrect = false;
        feedback = "Bu dönerin eti nerede? Neredeyse hiç et koymamışsın!";
    } 
    else if (food.meatType !== order.meatType) {
        isCorrect = false;
        const mNames = { tavuk: "Tavuk döner", et: "Et döner" };
        feedback = `Ben ${mNames[order.meatType]} istemiştim, bu ise ${mNames[food.meatType]}!`;
    } 
    else if (order.isDouble && food.meatCount < 6) {
        isCorrect = false;
        feedback = "Ben duble (çift porsiyon) et istemiştim, bu dönerde et çok az!";
    }
    else if (!order.isDouble && food.meatCount >= 6) {
        isCorrect = false;
        feedback = "Ben tek porsiyon istemiştim, çok et koymuşsun ziyan olacak!";
    }
    // 3. Check Ingredients (compare toppings requested vs toppings added)
    else {
        // Check that all requested toppings are present (min 1 pieces added to consider it present)
        for (const req of order.toppings) {
            const addedCount = food.ingredients[req] || 0;
            if (addedCount < 1) {
                isCorrect = false;
                const trToppings = {
                    marul: "marul", sogan: "soğan", domates: "domates", tursu: "turşu", 
                    patates: "patates", sos: "sos", ketcap: "ketçap", mayonez: "mayonez"
                };
                feedback = `İçine koymayı unuttuğun bir şeyler var: ${trToppings[req]} yok!`;
                break;
            }
        }
        
        // Check if unrequested toppings were added
        if (isCorrect) {
            for (const added in food.ingredients) {
                // Ignore rice auto-add on plates
                if (added === 'pilav' && food.base === 'plate') continue;
                
                if (!order.toppings.includes(added) && food.ingredients[added] > 0) {
                    isCorrect = false;
                    const trToppings = {
                        marul: "marul", sogan: "soğan", domates: "domates", tursu: "turşu", 
                        patates: "patates", sos: "sos", ketcap: "ketçap", mayonez: "mayonez"
                    };
                    feedback = `Ben dönerimde ${trToppings[added]} istememiştim ki!`;
                    break;
                }
            }
        }
    }
    
    // 4. Check Drink
    if (isCorrect) {
        if (order.drink && drink !== order.drink) {
            isCorrect = false;
            const dNames = { ayran: "Ayran", cola: "Kola", salgam: "Şalgam", fanta: "Fanta" };
            feedback = `İçeceğim nerede? ${dNames[order.drink]} sipariş etmiştim!`;
        } else if (!order.drink && drink) {
            isCorrect = false;
            feedback = "Ben içecek sipariş etmemiştim, fazladan yazmışsın!";
        }
    }
    
    // Score results
    if (isCorrect) {
        audio.playSuccess();
        dom.activeCustomer.classList.add('happy');
        dom.customerSpeech.innerHTML = `<strong>Harika!</strong> Sipariş tam istediğim gibi olmuş, ellerine sağlık. Çok lezzetli!`;
        
        // Increase Star Rating slowly (+0.5, cap at 5)
        STATE.stars = Math.min(5.0, STATE.stars + 0.5);
        
        // Day counter progression
        STATE.ordersServedThisDay++;
        if (STATE.ordersServedThisDay >= 3) {
            STATE.day++;
            STATE.ordersServedThisDay = 0;
            setTimeout(() => {
                dom.dayValue.innerText = STATE.day;
            }, 800);
        }
    } else {
        audio.playBuzzer();
        dom.activeCustomer.classList.add('sad');
        dom.customerSpeech.innerHTML = `<strong>Aaa, olmamış...</strong> ${feedback}`;
        
        // Decrease Star Rating (-1.0)
        STATE.stars = Math.max(0.0, STATE.stars - 1.0);
    }
    
    updateStarsUI();
    
    // Check for Game Over (Zabıta Close)
    if (STATE.stars <= 0.0) {
        setTimeout(triggerGameOver, 1500);
        return;
    }
    
    // Transition customer out and load new one
    dom.serveBtn.disabled = true;
    setTimeout(() => {
        dom.activeCustomer.classList.add('exit');
        dom.speechBubbleContainer.style.display = "none";
        
        setTimeout(() => {
            generateNewCustomer();
        }, 800);
    }, 2500);
}

function updateStarsUI() {
    dom.starsNumeric.innerText = STATE.stars.toFixed(1);
    dom.starsContainer.innerHTML = '';
    
    // Draw 5 stars (filled, half, or empty)
    const rating = STATE.stars;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        if (rating >= i) {
            star.innerText = '★';
        } else if (rating >= i - 0.5) {
            star.innerText = '⯪'; // half star symbol
            star.style.fontSize = '0.95rem'; // adjust scale slightly
        } else {
            star.innerText = '☆';
        }
        dom.starsContainer.appendChild(star);
    }
}

// --- 11. GAME OVER (POLICE/ZABITA CLOSE) ---
function triggerGameOver() {
    audio.startSiren();
    dom.policeOverlay.classList.remove('hidden');
}

function restartGame() {
    audio.stopSiren();
    dom.policeOverlay.classList.add('hidden');
    
    STATE.stars = 2.5;
    STATE.day = 1;
    STATE.ordersServedThisDay = 0;
    STATE.trayFills.tavuk = 0;
    STATE.trayFills.et = 0;
    
    updateTrayUI('tavuk');
    updateTrayUI('et');
    document.getElementById('pieces-tavuk').innerHTML = '';
    document.getElementById('pieces-et').innerHTML = '';
    
    dom.dayValue.innerText = STATE.day;
    updateStarsUI();
    
    generateNewCustomer();
}

// --- 12. EVENT BINDINGS ---
function setupEventListeners() {
    // Spits Drag/Shave
    dom.shaveTavuk.addEventListener('mousedown', (e) => startShaving('tavuk', e));
    dom.shaveEt.addEventListener('mousedown', (e) => startShaving('et', e));
    
    // Mobile touch support
    dom.shaveTavuk.addEventListener('touchstart', (e) => startShaving('tavuk', e.touches[0]));
    dom.shaveEt.addEventListener('touchstart', (e) => startShaving('et', e.touches[0]));
    
    // Pick Meat from tray
    dom.trayTavuk.addEventListener('click', () => selectMeatFromTray('tavuk'));
    dom.trayEt.addEventListener('click', () => selectMeatFromTray('et'));
    
    // Döner Knife Stand
    const stand = document.getElementById('knife-stand');
    if (stand) {
        stand.addEventListener('click', toggleKnife);
    }
    
    // Base Buttons
    dom.baseBtns.forEach(btn => {
        btn.addEventListener('click', () => setServiceBase(btn.dataset.base));
    });
    
    // Prep Board Click
    dom.prepBoard.addEventListener('click', handlePrepBoardClick);
    
    // Topping Boxes
    dom.ingredientBoxes.forEach(box => {
        box.addEventListener('click', () => handleIngredientBoxClick(box));
    });
    
    // Fridge Open & Drink Bottles
    dom.fridgeDoor.addEventListener('transitionend', handleFridgeDoorOpen);
    dom.drinkBottles.forEach(bottle => {
        bottle.addEventListener('click', () => selectDrink(bottle.dataset.drink));
    });
    
    // Action Buttons
    dom.wrapPackBtn.addEventListener('click', packActiveFood);
    dom.serveBtn.addEventListener('click', serveOrder);
    dom.trashBtn.addEventListener('click', clearTrayItems);
    
    // Help & Sound Buttons
    dom.helpBtn.addEventListener('click', () => dom.helpModal.classList.remove('hidden'));
    dom.closeHelpBtn.addEventListener('click', () => dom.helpModal.classList.add('hidden'));
    
    dom.muteBtn.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        dom.muteBtn.innerText = isMuted ? '🔇' : '🔊';
        dom.muteBtn.title = isMuted ? 'Sesi Aç' : 'Sesi Kapat';
    });
    
    // Reset Game Over
    dom.restartBtn.addEventListener('click', restartGame);
    
    // Clear cursor selection on right click
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        clearActiveTool();
    });
}

// Start Game on load
window.addEventListener('DOMContentLoaded', initGame);
