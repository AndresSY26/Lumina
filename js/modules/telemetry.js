
import { formatDeg, formatTime, safeText } from '../utils.js';

export const Telemetry = {
    update(lat, lon) {
        if (!window.SunCalc) return;
        const now = new Date();

        // Moon Data
        const moonPos = SunCalc.getMoonPosition(now, lat, lon);
        const moonIllum = SunCalc.getMoonIllumination(now);
        const moonTimes = SunCalc.getMoonTimes(now, lat, lon);

        // Convert Radians
        const azimuth = (moonPos.azimuth * 180 / Math.PI) + 180;
        const altitude = moonPos.altitude * 180 / Math.PI;

        const distance = Math.round(moonPos.distance);
        const fraction = Math.round(moonIllum.fraction * 100);

        // UI Updates
        safeText('phase-val', this.getMoonPhaseName(moonIllum.phase));
        safeText('illum-val', `${fraction}%`);
        safeText('alt-val', formatDeg(altitude));
        safeText('dist-val', `${distance} km`);
        
        safeText('rise-time', formatTime(moonTimes.rise));
        safeText('set-time', formatTime(moonTimes.set));

        // Zenith
        if (moonTimes.rise && moonTimes.set) {
            const zenith = new Date((moonTimes.rise.getTime() + moonTimes.set.getTime()) / 2);
            safeText('zenith-time', formatTime(zenith));
        } else {
             safeText('zenith-time', 'N/A');
        }

        // Return calculated Azimuth for Compass module to use
        return { azimuth, altitude, moonTimes };
    },

    getMoonPhaseName(phase) {
        if (phase == 0) return "New Moon";
        if (phase < 0.25) return "Waxing Crescent";
        if (phase == 0.25) return "First Quarter";
        if (phase < 0.5) return "Waxing Gibbous";
        if (phase == 0.5) return "Full Moon";
        if (phase < 0.75) return "Waning Gibbous";
        if (phase == 0.75) return "Last Quarter";
        return "Waning Crescent";
    }
};
