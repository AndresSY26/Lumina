// Helper to format degrees
export function formatDeg(deg) {
    return `${Math.round(deg)}°`;
}

// Helper for time formatting
export function formatTime(date) {
    if (!date || isNaN(new Date(date))) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function safeText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = text;
}
