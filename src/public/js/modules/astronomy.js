/* global SunCalc */ // Assumes SunCalc is loaded globally from layout

export class AstronomyModule {
    constructor() {
        this.sunTimes = {};
        this.moonPhase = {};
        this.moonPos = {};
    }

    update(lat, lng) {
        const now = new Date();
        
        // Sun Times
        this.sunTimes = SunCalc.getTimes(now, lat, lng);
        
        // Moon
        this.moonPhase = SunCalc.getMoonIllumination(now);
        this.moonPos = SunCalc.getMoonPosition(now, lat, lng);
        
        // Sun Pos (for compass)
        this.sunPos = SunCalc.getPosition(now, lat, lng);

        return {
            sun: { ...this.sunTimes, position: this.sunPos },
            moon: { ...this.moonPhase, position: this.moonPos }
        };
    }
}
