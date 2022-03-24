export const host = 'http://localhost:8340/';

export const serverApi = {
    getCountry(id: number, signal: AbortSignal) {
        return fetch(host + `country/${id}`, {signal})
    },
    getRegions(signal: AbortSignal) {
        return fetch(host + 'regions', {signal})
    },
    getRegion(id: number, signal: AbortSignal) {
        return fetch(host + `region/${id}`, {signal})
    },
    getRegionDistricts(id: number, signal: AbortSignal) {
        return fetch(host + `districts/${id}`, {signal})
    },
    getMapObjects(signal: AbortSignal) {
        return fetch(host + 'objects', {signal})
    },
}