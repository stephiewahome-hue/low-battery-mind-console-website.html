// =========================================================================
//  1. LOCAL SEED STRUCTS (ADAPTIVE HABIT MATRIX)
// =========================================================================
const baseHabitMatrix = {
    low: [
        { id: "h_l1", task: "Rinse mouth with water or wipe teeth", points: 5 },
        { id: "h_l2", task: "Splash cold water across your face", points: 5 },
        { id: "h_l3", task: "Stand outside or open window for 60s", points: 10 }
    ],
    medium: [
        { id: "h_m1", task: "Brush teeth completely", points: 10 },
        { id: "h_m2", task: "Take a warm reset shower", points: 15 },
        { id: "h_m3", task: "Step out for a 5 minute fresh air walk", points: 15 }
    ],
    high: [
        { id: "h_h1", task: "Complete full brushing & flossing cycle", points: 20 },
        { id: "h_h2", task: "Indulge in a relaxing warm bath", points: 20 },
        { id: "h_h3", task: "Exercise or walk intentionally for 20 mins", points: 25 }
    ]
};

// =========================================================================
//  2. GLOBAL STATE APP MODEL
// =========================================================================
let runtimeStorage = {
    xp: 0,
    currentBattery: 50,
    checkedHabitIds: [],
    erpSteps: [
        { title: "Look at photo of trigger", level: "Low Challenge" },
        { title: "Sit near trigger without wiping", level: "Moderate Discomfort" }
    ],
    journalEntries: [],
    medicationReminders: [],
    careAppointments: [],
    historyLogs: [30, 40, 60, 20, 50] // Seed values for the dashboard graph
};

// Stopwatch Engine Variables
let clockTrackerId = null;
let tickingSecondsCounter = 0;

// =========================================================================
//  3. APP INITIALIZATION & CORE REPOSITORY LINKING
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Render current date string dynamically
    const dateElement = document.getElementById("current-date-string");
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Attempt local file ingestion from localStorage cache
    if (localStorage.getItem("oasis_mvp_secure_dataset")) {
        try {
            runtimeStorage = JSON.parse(localStorage.getItem("oasis_mvp_secure_dataset"));
            
            // Safety fallback initialization for older saves missing newer fields
            if (!runtimeStorage.medicationReminders) runtimeStorage.medicationReminders = [];
            if (!runtimeStorage.careAppointments) runtimeStorage.careAppointments = [];
            if (!runtimeStorage.historyLogs) runtimeStorage.historyLogs = [30, 40, 60, 20, 50];
        } catch (e) {
            console.error("Data restore error, initializing safe default schema.", e);
        }
    }
    
    // Sync UI elements across all modules
    syncEcosystemVisuals();
    buildDynamicRoutines();
    renderHierarchyStack();
    populateJournalLogHistory();
    renderCareLogs();
    drawAnalyticsGraph();
});

function commitStateToMemory() {
    localStorage.setItem("oasis_mvp_secure_dataset", JSON.stringify(runtimeStorage));
}

// Global View Tab Navigation Engine
function navigateOasis(targetPanelId) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-tile').forEach(tile => tile.classList.remove('active'));
    
    const targetPanel = document.getElementById(`panel-${targetPanelId}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// =========================================================================
//  4. QUICK CHECK-IN & SCORE LOGIC
// =========================================================================
function submitDailyCheckIn() {
    const energyVal = parseInt(document.getElementById("checkin-energy").value);
    runtimeStorage.currentBattery = energyVal;
    
    // Inject logged score inside historical trends tracking array
    runtimeStorage.historyLogs.push(energyVal);
    if (runtimeStorage.historyLogs.length > 8) runtimeStorage.historyLogs.shift(); // Limit display columns
    
    runtimeStorage.xp += 10;
    
    commitStateToMemory();
    syncEcosystemVisuals();
    buildDynamicRoutines();
    drawAnalyticsGraph();
    
    alert(`State captured securely. Routine updated to match your energy grid. (+10 XP)`);
}

function syncEcosystemVisuals() {
    const scoreElement = document.getElementById("xp-score-text");
    if (scoreElement) scoreElement.innerText = runtimeStorage.xp;
    
    const avatar = document.getElementById("oasis-spirit");
    if (avatar) {
        if (runtimeStorage.xp >= 120) avatar.innerText = "🌳";
        else if (runtimeStorage.xp >= 50) avatar.innerText = "🌿";
        else avatar.innerText = "🌱";
    }

    const progressFillPercent = Math.min((runtimeStorage.xp % 150) / 1.5, 100);
    const fillLine = document.getElementById("xp-fill-line");
    if (fillLine) fillLine.style.width = `${progressFillPercent}%`;
}

// =========================================================================
//  5. HABIT & ROUTINE ENGINE (ADAPTIVE GENERATION)
// =========================================================================
function buildDynamicRoutines() {
    const listNode = document.getElementById("adaptive-habits-container");
    if (!listNode) return;
    listNode.innerHTML = "";
    
    let scaleTarget = "medium";
    if (runtimeStorage.currentBattery <= 30) scaleTarget = "low";
    else if (runtimeStorage.currentBattery >= 80) scaleTarget = "high";

    baseHabitMatrix[scaleTarget].forEach(habit => {
        const checked = runtimeStorage.checkedHabitIds.includes(habit.id);
        const strip = document.createElement("div");
        strip.className = `item-strip-row ${checked ? 'done' : ''}`;
        strip.style.opacity = checked ? "0.5" : "1";
        strip.innerHTML = `
            <span>${habit.task} <small style="color:var(--primary)">(+${habit.points} XP)</small></span>
            ${checked ? '<span>✓ Claimed</span>' : `<button class="secondary-btn" style="width:auto; margin:0; padding:6px 12px;" onclick="executeHabitCheck('${habit.id}', ${habit.points})">Earn</button>`}
        `;
        listNode.appendChild(strip);
    });
}

function executeHabitCheck(id, award) {
    runtimeStorage.checkedHabitIds.push(id);
    runtimeStorage.xp += award;
    
    syncEcosystemVisuals();
    commitStateToMemory();
    buildDynamicRoutines();
}

// =========================================================================
//  6. CBT FORK & DEFUSION HANDLING
// =========================================================================
function routeThoughtProcess(trackKey) {
    const rawVal = document.getElementById("raw-thought-box").value.trim();
    if (!rawVal) return alert("Write your loop thought inside the input first.");

    document.getElementById("cbt-mdd-form").style.display = "none";
    document.getElementById("cbt-ocd-form").style.display = "none";

    if (trackKey === 'mdd') {
        document.getElementById("cbt-mdd-form").style.display = "block";
    } else {
        document.getElementById("ocd-defusion-text").innerText = `I recognize that my anxious mind is cycling through an intrusive loop stating that: "${rawVal}". I see you loop, but I choose not to dispute you right now.`;
        document.getElementById("cbt-ocd-form").style.display = "block";
    }
}

function finalizeCBTLog(label) {
    document.getElementById("raw-thought-box").value = "";
    document.getElementById("mdd-balanced-input").value = "";
    document.getElementById("cbt-mdd-form").style.display = "none";
    document.getElementById("cbt-ocd-form").style.display = "none";
    
    runtimeStorage.xp += 15;
    syncEcosystemVisuals();
    commitStateToMemory();
    alert(`Thought processed via ACT/CBT principles (${label}). +15 XP`);
}

// =========================================================================
//  7. OCD LAB (ERP COCHING TIMER & HIERARCHY)
// =========================================================================
function addExposureToHierarchy() {
    const titleInp = document.getElementById("erp-exposure-title");
    const diffInp = document.getElementById("erp-difficulty-level");
    
    if (!titleInp || !titleInp.value.trim()) return;

    runtimeStorage.erpSteps.push({
        title: titleInp.value.trim(),
        level: diffInp.value
    });

    titleInp.value = "";
    commitStateToMemory();
    renderHierarchyStack();
}

function renderHierarchyStack() {
    const stack = document.getElementById("erp-hierarchy-stack");
    if (!stack) return;
    stack.innerHTML = "";
    
    runtimeStorage.erpSteps.forEach(step => {
        const item = document.createElement("div");
        item.className = "item-strip-row";
        item.innerHTML = `
            <span>${step.title}</span>
            <span class="badge">${step.level}</span>
        `;
        stack.appendChild(item);
    });
}

function toggleERPStopwatch() {
    const button = document.getElementById("erp-master-toggle-btn");
    if (!button) return;

    if (clockTrackerId) {
        // Turning stopwatch off
        clearInterval(clockTrackerId);
        clockTrackerId = null;
        button.innerText = "Start Delay Timer";
        button.style.background = "var(--primary)";
        button.style.color = "#000";
        
        if (tickingSecondsCounter >= 5) {
            const rewardPoints = Math.min(Math.floor(tickingSecondsCounter / 2), 40);
            runtimeStorage.xp += rewardPoints;
            syncEcosystemVisuals();
            commitStateToMemory();
            alert(`Terrific work tracking distress and delaying your compulsion. Earned +${rewardPoints} XP.`);
        }
        tickingSecondsCounter = 0;
        document.getElementById("erp-stopwatch").innerText = "00:00";
    } else {
        // Activating stopwatch engine
        button.innerText = "Stop / Completed Cycle";
        button.style.background = "var(--error)";
        button.style.color = "#fff";
        clockTrackerId = setInterval(() => {
            tickingSecondsCounter++;
            let mm = String(Math.floor(tickingSecondsCounter / 60)).padStart(2, '0');
            let ss = String(tickingSecondsCounter % 60).padStart(2, '0');
            document.getElementById("erp-stopwatch").innerText = `${mm}:${ss}`;
        }, 1000);
    }
}

// =========================================================================
//  8. GROUNDING TOOL SWITCHES
// =========================================================================
function activateGroundingTool(toolKey) {
    document.getElementById("tool-breathe-box").classList.remove("active-tool");
    document.getElementById("tool-54321-box").classList.remove("active-tool");
    
    if (toolKey === 'breathe') {
        document.getElementById("tool-breathe-box").classList.add("active-tool");
    } else {
        document.getElementById("tool-54321-box").classList.add("active-tool");
    }
}

// =========================================================================
//  9. TAILORED JOURNAL MODULE
// =========================================================================
function applyJournalPrompt() {
    const selection = document.getElementById("journal-prompt-dropdown").value;
    const textBox = document.getElementById("journal-body-text");
    if (!textBox) return;

    if (selection !== "None") {
        textBox.value = `[Prompt: ${selection}]\n\n`;
    } else {
        textBox.value = "";
    }
}

function saveJournalEntry() {
    const text = document.getElementById("journal-body-text").value.trim();
    if (!text) return;

    runtimeStorage.journalEntries.unshift({
        timestamp: new Date().toLocaleDateString(),
        content: text
    });

    document.getElementById("journal-body-text").value = "";
    document.getElementById("journal-prompt-dropdown").value = "None";
    
    runtimeStorage.xp += 10;
    syncEcosystemVisuals();
    commitStateToMemory();
    populateJournalLogHistory();
}

function populateJournalLogHistory() {
    const list = document.getElementById("saved-journal-logs-list");
    if (!list) return;
    list.innerHTML = "";
    
    runtimeStorage.journalEntries.forEach(entry => {
        const card = document.createElement("div");
        card.className = "item-strip-row";
        card.style.flexDirection = "column";
        card.style.alignItems = "flex-start";
        card.style.gap = "4px";
        card.innerHTML = `
            <small style='color:var(--primary)'>${entry.timestamp}</small>
            <p style='font-size:0.85rem; line-height:1.3;'>${entry.content}</p>
        `;
        list.appendChild(card);
    });
}

// =========================================================================
//  10. CARE MANAGEMENT SUITE (MEDS & APPTS)
// =========================================================================
function addMedicationReminder() {
    const medName = document.getElementById("care-med-name").value.trim();
    const medTime = document.getElementById("care-med-time").value;
    
    if (!medName) return alert("Please specify a medication name.");
    
    runtimeStorage.medicationReminders.push({
        id: "med_" + Date.now(),
        name: medName,
        time: medTime || "Flexible"
    });
    
    document.getElementById("care-med-name").value = "";
    document.getElementById("care-med-time").value = "";
    
    commitStateToMemory();
    renderCareLogs();
}

function addAppointmentSchedule() {
    const apptName = document.getElementById("care-appt-name").value.trim();
    const apptDate = document.getElementById("care-appt-date").value;
    
    if (!apptName || !apptDate) return alert("Please specify both an appointment description and date.");
    
    runtimeStorage.careAppointments.push({
        id: "appt_" + Date.now(),
        name: apptName,
        dateString: new Date(apptDate).toLocaleString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    });
    
    document.getElementById("care-appt-name").value = "";
    document.getElementById("care-appt-date").value = "";
    
    commitStateToMemory();
    renderCareLogs();
}

function removeCareItem(type, id) {
    if (type === 'med') {
        runtimeStorage.medicationReminders = runtimeStorage.medicationReminders.filter(item => item.id !== id);
    } else {
        runtimeStorage.careAppointments = runtimeStorage.careAppointments.filter(item => item.id !== id);
    }
    commitStateToMemory();
    renderCareLogs();
}

function renderCareLogs() {
    // Render Medications list
    const medContainer = document.getElementById("med-reminders-list-hook");
    if (medContainer) {
        medContainer.innerHTML = "";
        if (runtimeStorage.medicationReminders.length === 0) {
            medContainer.innerHTML = `<p style="color:var(--text-secondary); font-size:0.8rem; font-style:italic;">No reminders logged yet.</p>`;
        } else {
            runtimeStorage.medicationReminders.forEach(item => {
                const row = document.createElement("div");
                row.className = "item-strip-row";
                row.innerHTML = `
                    <span><strong>${item.name}</strong> <small style="color:var(--text-secondary)">⏰ ${item.time}</small></span>
                    <button onclick="removeCareItem('med', '${item.id}')" style="background:none; border:none; color:var(--error); cursor:pointer; font-size:0.8rem;">Delete</button>
                `;
                medContainer.appendChild(row);
            });
        }
    }

    // Render Appointments list
    const apptContainer = document.getElementById("appt-schedule-list-hook");
    if (apptContainer) {
        apptContainer.innerHTML = "";
        if (runtimeStorage.careAppointments.length === 0) {
            apptContainer.innerHTML = `<p style="color:var(--text-secondary); font-size:0.8rem; font-style:italic;">No upcoming entries logged.</p>`;
        } else {
            runtimeStorage.careAppointments.forEach(item => {
                const row = document.createElement("div");
                row.className = "item-strip-row";
                row.innerHTML = `
                    <span><strong>${item.name}</strong> <br><small style="color:var(--warning)">🗓️ ${item.dateString}</small></span>
                    <button onclick="removeCareItem('appt', '${item.id}')" style="background:none; border:none; color:var(--error); cursor:pointer; font-size:0.8rem;">Dismiss</button>
                `;
                apptContainer.appendChild(row);
            });
        }
    }
}

// =========================================================================
//  11. REFRESHABLE DASHBOARD ANALYTICS BAR CHART
// =========================================================================
function drawAnalyticsGraph() {
    const hook = document.getElementById("chart-bars-hook");
    if (!hook) return;
    hook.innerHTML = "";
    
    runtimeStorage.historyLogs.forEach(metricValue => {
        const pillar = document.createElement("div");
        pillar.className = "chart-bar-pillar";
        // Convert metric score out of 100 directly into a percentage coordinate height layout style
        pillar.style.height = `${metricValue}%`;
        
        // Color mapping markers based on distress parameters
        if (metricValue <= 30) pillar.style.backgroundColor = "var(--error)";
        else if (metricValue >= 75) pillar.style.backgroundColor = "var(--success)";
        else pillar.style.backgroundColor = "var(--primary)";
        
        hook.appendChild(pillar);
    });
}

// =========================================================================
//  12. CRISIS ANCHOR MODAL INTERCEPTOR
// =========================================================================
function toggleSafetyModal(shouldReveal) {
    const modal = document.getElementById("safety-modal-overlay");
    if (modal) {
        modal.style.display = shouldReveal ? "flex" : "none";
    }
}