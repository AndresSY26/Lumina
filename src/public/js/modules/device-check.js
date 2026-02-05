/**
 * Detects if the user is employing a mobile device.
 * Uses UserAgent string and touch point analysis.
 * @returns {boolean} true if mobile device is detected
 */
export function checkIsMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isTouch = navigator.maxTouchPoints > 0;
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Strict check: Must be touch-capable AND have a mobile User Agent
    // This avoids false positives on touch-enabled laptops
    return isTouch && isMobileUA;
}
