document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables (can be changed by settings) ---
    let focusTitle = "Programming";
    let breakTitle = "Coffee Break";
    let focusMins = 25;
    let breakMins = 5;
    let longBreakMins = 15;
    const CYCLES_UNTIL_LONG_BREAK = 4;

    // --- DOM Elements ---
    const pomodoroContainer = document.querySelector('.pomodoro-container');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const modeTitleEl = document.getElementById('mode-title');
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cycleCountEl = document.getElementById('cycle-count');
    const alarmSound = document.getElementById('alarm-sound');
    const bodyEl = document.body;

    // --- Settings Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const inputFocusTitle = document.getElementById('input-title-focus');
    const inputBreakTitle = document.getElementById('input-title-break');
    const inputFocus = document.getElementById('input-focus');
    const inputBreak = document.getElementById('input-break');
    const inputLongBreak = document.getElementById('input-long-break');
    
    // --- Candle Elements ---
    const candles = document.querySelectorAll('.candle');

    // --- Timer State ---
    let timer;
    let totalSeconds;
    let isPaused = true;
    let currentMode = 'focus'; // 'focus', 'break', 'long_break'
    let pomodoroCount = 0;

    // --- Timer Logic ---
    function startTimer() {
        if (isPaused) {
            isPaused = false;
            startPauseBtn.textContent = 'Pause';
            setCandleAnimationState('running');
            timer = setInterval(tick, 1000);
        }
    }

    function pauseTimer() {
        if (!isPaused) {
            isPaused = true;
            startPauseBtn.textContent = 'Start';
            setCandleAnimationState('paused');
            clearInterval(timer);
        }
    }
    
    function resetTimer(applyNewSettings = false) {
        pauseTimer();
        // Don't reset cycles if just applying new settings from the current focus state
        if (!applyNewSettings || currentMode !== 'focus') {
             pomodoroCount = 0;
             cycleCountEl.textContent = '0';
        }
        currentMode = 'focus';
        initTimer(focusMins);
        updateUI();
        initCandles();
    }
    
    function tick() {
        if (totalSeconds <= 0) {
            pauseTimer();
            alarmSound.play();
            switchMode();
            return;
        }
        totalSeconds--;
        updateDisplay();
    }

    function switchMode() {
        if (currentMode === 'focus') {
            pomodoroCount++;
            cycleCountEl.textContent = pomodoroCount;
            if (pomodoroCount > 0 && pomodoroCount % CYCLES_UNTIL_LONG_BREAK === 0) {
                currentMode = 'long_break';
                initTimer(longBreakMins);
            } else {
                currentMode = 'break';
                initTimer(breakMins);
            }
        } else {
            currentMode = 'focus';
            initTimer(focusMins);
        }
        updateUI();
        initCandles();
        // Automatically start the next session
        setTimeout(startTimer, 1000);
    }
    
    // --- UI & Display Logic ---
    function updateDisplay() {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        minutesEl.textContent = String(mins).padStart(2, '0');
        secondsEl.textContent = String(secs).padStart(2, '0');
        document.title = `${minutesEl.textContent}:${secondsEl.textContent} - ${modeTitleEl.textContent}`;
    }

    function updateUI() {
        if (currentMode === 'focus') {
            modeTitleEl.textContent = focusTitle;
            bodyEl.className = 'programming-theme';
        } else { // 'break' or 'long_break'
            modeTitleEl.textContent = breakTitle;
            bodyEl.className = 'coffee-theme';
        }
        updateDisplay();
    }
    
    function initTimer(minutes) {
        totalSeconds = Math.round(minutes * 60);
        updateDisplay();
    }
    
    // --- Candle Animation Logic ---
    function initCandles() {
        const timePerCandle = totalSeconds / candles.length;
        candles.forEach((candle, index) => {
            const delay = index * timePerCandle;
            candle.classList.remove('burning');
            candle.classList.remove('extinguished');
            candle.style.animation = 'none'; // Clear previous animation
            candle.offsetHeight; // Trigger reflow to restart animation
            candle.style.animation = `burnDown ${timePerCandle}s linear ${delay}s forwards paused`;
        });
        document.querySelector('.candle:first-child').classList.add('burning');
    }

    function setCandleAnimationState(state) { // 'running' or 'paused'
        let burningCandle = document.querySelector('.candle.burning');
        if (!burningCandle) {
             // If no candle is burning (e.g. at start), light the first one
             burningCandle = document.querySelector('.candle:first-child');
             if(burningCandle) burningCandle.classList.add('burning');
        }

        if (burningCandle) {
             burningCandle.style.animationPlayState = state;
             burningCandle.querySelector('.flame').style.animationPlayState = state;

             // Find next candles to chain animation
            let nextCandle = burningCandle.nextElementSibling;
            while(nextCandle){
                nextCandle.style.animationPlayState = state;
                nextCandle = nextCandle.nextElementSibling;
            }
        }
    }
    
    // --- Settings Panel Logic ---
    function openSettings() {
        pauseTimer();
        // Load current values into input fields
        inputFocusTitle.value = focusTitle;
        inputBreakTitle.value = breakTitle;
        inputFocus.value = focusMins;
        inputBreak.value = breakMins;
        inputLongBreak.value = longBreakMins;
        
        pomodoroContainer.classList.add('hidden');
        settingsPanel.classList.remove('hidden');
    }

    function closeSettings() {
        pomodoroContainer.classList.remove('hidden');
        settingsPanel.classList.add('hidden');
    }
    
    function saveSettings() {
        const newFocusMins = parseFloat(inputFocus.value);
        const newBreakMins = parseFloat(inputBreak.value);
        const newLongBreakMins = parseFloat(inputLongBreak.value);
        const newFocusTitle = inputFocusTitle.value.trim();
        const newBreakTitle = inputBreakTitle.value.trim();

        if (newFocusMins > 0 && newBreakMins > 0 && newLongBreakMins > 0 && newFocusTitle && newBreakTitle) {
            focusMins = newFocusMins;
            breakMins = newBreakMins;
            longBreakMins = newLongBreakMins;
            focusTitle = newFocusTitle;
            breakTitle = newBreakTitle;

            resetTimer(true); // Apply settings by resetting the timer
            closeSettings();
        } else {
            alert("Please fill in all fields with valid values (time > 0).");
        }
    }

    // --- Event Listeners ---
    startPauseBtn.addEventListener('click', () => { isPaused ? startTimer() : pauseTimer(); });
    resetBtn.addEventListener('click', () => resetTimer(false)); // a regular reset
    settingsBtn.addEventListener('click', openSettings);
    cancelSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Check when a candle finishes burning to light the next one
    candles.forEach(candle => {
        candle.addEventListener('animationend', () => {
            candle.classList.remove('burning');
            candle.classList.add('extinguished');
            const nextCandle = candle.nextElementSibling;
            if (nextCandle) {
                nextCandle.classList.add('burning');
            }
        });
    });

    // --- Initial Setup ---
    initTimer(focusMins);
    updateUI();
    initCandles();
});