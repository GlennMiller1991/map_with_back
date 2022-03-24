export type TPointArr = [number, number]
export type TPointObj = {
    lat: number,
    lng: number
}

interface IPolyline extends Array<TPointArr[]> {

}

interface IMultiPolyline extends Array<IPolyline[]> {

}

// interface IViewboxObj {
//     top: number,
//     right: number, 
//     bottom: number, 
//     left: number
// }

export interface IBBox {
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number
}

export interface ICoordsBaseRaw {
    coords: string
}

export interface ICoordsBase {
    coords: IPolyline | IMultiPolyline
}

export interface ICoordsSecondary {
    type: 'Polygon' | 'MultiPolygon',
    mapLatLngBounds?: IBBox
}

export interface IGeoSquare extends ICoordsBase, ICoordsSecondary {

}

export interface IGeoSquareRaw extends ICoordsBaseRaw, ICoordsSecondary {

}

export interface IGeoSquareToShow extends IGeoSquare {
    coords: IPolyline | IMultiPolyline,
    pixelDims: {
        width: number,
        height: number
    },
    mapLatLngBounds: IBBox,
    setInfo: any,
    cssClassName: string
}

export function latlngToPx(
    point: TPointObj,
    pixelDims: {
        width: number,
        height: number
    },
    latLngBounds: IBBox,
) {
    let coefX = pixelDims.width / (latLngBounds.lngMax - latLngBounds.lngMin);
    const coefY = pixelDims.height / (latLngBounds.latMax - latLngBounds.latMin);
    const viewboxCurrentX = (point.lng - latLngBounds.lngMin) * coefX;
    const viewboxCurrentY = (point.lat - latLngBounds.latMin) * coefY;
    return [viewboxCurrentX, pixelDims.height - viewboxCurrentY];
}