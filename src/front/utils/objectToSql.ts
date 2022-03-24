import {objectType} from "../misc/types";

export const objectToSql = (object: objectType) => {
    let coordsString: string = '['
    for (let i = 0; i < object.entranceCoords.length; i++) {
        if (i) {
            coordsString += `,[${object.entranceCoords[i][0]},${object.entranceCoords[i][1]}]`
        } else {
            coordsString += `[${object.entranceCoords[i][0]},${object.entranceCoords[i][1]}]`
        }
    }
    coordsString += ']'

    let squareString: string = '['
    for (let i = 0; i < object.squareBorders.length; i++) {
        if (i) {
            squareString += `,[${object.squareBorders[i][0]},${object.squareBorders[i][1]}]`
        } else {
            squareString += `[${object.squareBorders[i][0]},${object.squareBorders[i][1]}]`
        }
    }
    squareString += ']'


    let q = `
INSERT INTO map_objects VALUES (
    "${object.id}",
    ${object.coords[0]},
    ${object.coords[1]}, 
    "${object.itIs}",
    "${object.name.slice(0, 40)}",
    "${object.address.slice(0, 50)}",
    "${coordsString}",
    "${squareString}"
);`
    return q
}