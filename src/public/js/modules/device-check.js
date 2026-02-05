/**
 * Detects if the user is employing a mobile device.
 * Uses UserAgent string and touch point analysis.
 * @returns {boolean} true if mobile device is detected
 */
export function checkIsMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}
