export const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const toRad = (deg) => deg * (Math.PI / 180);
export const toDeg = (rad) => rad * (180 / Math.PI);

// Angle interpolation to avoid 359->0 flips
export const lerpAngle = (start, end, t) => {
    let diff = end - start;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    return start + diff * t;
};
