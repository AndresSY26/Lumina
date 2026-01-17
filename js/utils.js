// Helper to format degrees
function formatDeg(deg) {
    return `${Math.round(deg)}°`;
}

// Helper for time formatting
function formatTime(date) {
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
}
