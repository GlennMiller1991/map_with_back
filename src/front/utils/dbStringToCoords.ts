export const dbStringToCoords = (elem: Array<any>) => {
        if (typeof elem[0] !== 'number') {
            for (let innerElem of elem) {
                dbStringToCoords(innerElem)
            }
        } else {
            let temp: number = elem[0]
            elem[0] = elem[1]
            elem[1] = temp
        }
}