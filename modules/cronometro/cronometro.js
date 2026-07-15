let timer = null;
let seconds = 0;

export function init() {
    const display = document.getElementById('cronometroDisplay');
    document.getElementById('btnStart').addEventListener('click', () => {
        if (timer) return;
        timer = setInterval(() => {
            seconds++;
            const h = String(Math.floor(seconds/3600)).padStart(2,'0');
            const m = String(Math.floor((seconds%3600)/60)).padStart(2,'0');
            const s = String(seconds%60).padStart(2,'0');
            display.textContent = `${h}:${m}:${s}`;
        }, 1000);
    });
    document.getElementById('btnPause').addEventListener('click', () => { clearInterval(timer); timer = null; });
    document.getElementById('btnReset').addEventListener('click', () => { clearInterval(timer); timer = null; seconds = 0; display.textContent = '00:00:00'; });
}