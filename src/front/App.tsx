import React, {useCallback, useEffect, useMemo, useState} from 'react';
import './App.scss';
import {MapMain} from "./components/MapMain/MapMain";
import {objectType, TCountry, TDistrict, TEditingObjectType, TObject, TRegion} from "./misc/types";
import {EditSideBar} from "./components/EditSideBar/EditSideBar";
import EventEmitter from "events";
import {ErrorMessage} from "./components/ErrorMessage/ErrorMessage";
import {
    DB__NAME,
    DB__OBJECTS_STORAGE_NAME,
    EXCEPTION__EXCEED_MEMORY,
    EXCEPTION__FORBIDDEN,
    NETWORK__TIMEOUT
} from "./misc/constants";

import {dbStringToCoords} from './utils/dbStringToCoords'
import {serverApi} from "./rest_api/serverApi";
import {objectToSql} from "./utils/objectToSql";
import {Simulate} from "react-dom/test-utils";
import load = Simulate.load;

export const fakeObject: objectType = {
    // empty coords array and id is
    // using for dis/able functionality
    classOfObject: undefined,
    square: '',
    coords: [],
    entranceCoords: [],
    telephone: '',
    email: '',
    id: '-1',
    name: '',
    address: '',
    itIs: "point",
    squareBorders: [],
}


function App() {

    //state
    // hover while wait
    const [pageLoader, setPageLoader] = useState(false)

    // error log for user
    const [appError, setAppError] = useState<string>('')

    // object that now is in edit bar component for creating or editin
    const [currentObject, setCurrentObject] = useState<TEditingObjectType>(fakeObject)

    // show edit bar?
    const [editMode, setEditMode] = useState(false)

    // objects on the map without just created
    const [objectsSet, setObjectsSet] = useState<objectType[]>([])

    // event emitters - messages exchange between map and sidebar
    const [emitterSideBar, emitterMap] = useMemo(() => {
        return [new EventEmitter(), new EventEmitter()]
    }, [])


    //callbacks
    const rerenderFunction = useCallback(() => {
        // return to default state of app
        // clearing error, wiping object out of edit bar
        // rerender saved objects in state
        setObjectsSet([...objectsSet])
        setCurrentObject(fakeObject)
        setAppError('')
    }, [objectsSet])
    const setError = useCallback((error: string) => {
        // function for easier throwing setState function in component
        // NO NEED!! REFACTOR
        setAppError(error)
    }, [])
    const onClickHandler = useCallback(() => {
        // switching edit mode
        // if next mode is edit - wiping object in sidebar
        // else - rerender
        if (editMode) {
            setObjectsSet([...objectsSet])
        } else {
            setCurrentObject(fakeObject)
        }
        setEditMode(!editMode)
    }, [objectsSet, editMode])
    const createObject = useCallback((obj: TEditingObjectType) => {
        // create object inside map component
        // function for easier throwing setState function in component
        // NO NEED!!! REFACTOR
        setCurrentObject(obj)
    }, [])
    const addObject = useCallback((obj: objectType) => {
        // switching edit mode with sweeping garbage
        // then add current object to objectsSet
        onClickHandler()
        setObjectsSet([...objectsSet, obj])
    }, [objectsSet, onClickHandler])
    const updateObject = useCallback((obj: TEditingObjectType) => {
        // switching edit mode with sweeping garbage
        // then update given object in state objectsSet if there is
        let {changeMarkerDraggableMode, activeEntrance, ...newObj} = obj
        let newObjectSet = objectsSet.map((object) => {
            return object.id === currentObject.id ? newObj as objectType : object
        })
        setObjectsSet(newObjectSet)
        setEditMode(!editMode)
        debugger
    }, [onClickHandler, objectsSet, currentObject])
    const deleteObject = useCallback((id: string) => {
        // filter objectsSet by id
        // then update objectsSet
        // then close editBar
        const newObjectsSet = objectsSet.filter(object => object.id !== id)
        setObjectsSet(newObjectsSet)
        setEditMode(false)
    }, [objectsSet])
    const saveToLS = useCallback((objectsSet: objectType[]) => {
        // Function reflects current objects set in state on localstorage.
        // So can delete all local storage data if call it with empty objects array.
        // Objects is stored by 2gis id of object
        //
        // 1. clear local storage
        // 2. save all objects from state
        //
        // set error if browser does not allow to save to local storage
        try {
            localStorage.clear()
            objectsSet.forEach((object) => {
                localStorage.setItem(object.id, JSON.stringify(object))
            })
            setAppError('Данные сохранены')
        } catch (err) {
            let error = err as DOMException
            switch (error.code) {
                case EXCEPTION__FORBIDDEN:
                    setAppError('Ошибка доступа')
                    break
                case EXCEPTION__EXCEED_MEMORY:
                    setAppError('Ошибка памяти')
                    break
                default:
                    setAppError('Ошибка записи')
            }
        }
    }, [])
    const loadFromLS = useCallback(() => {
        setEditMode(false)
        // load object from ls with deleting all current objects in state
        // set error if browser does not allow to save to local storage
        try {
            let objects: Array<objectType> = []
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i)
                if (key) {
                    let object = localStorage.getItem(key)
                    if (object) {
                        objects[i] = JSON.parse(object) as objectType
                        let q = objectToSql(objects[i])
                        console.log(q)
                    }
                }
            }
            setAppError('Данные загружены')
            setObjectsSet(objects)
        } catch (err) {
            let error = err as DOMException
            switch (error.code) {
                case EXCEPTION__FORBIDDEN:
                    setAppError('Ошибка доступа')
                    break
                case EXCEPTION__EXCEED_MEMORY:
                    setAppError('Ошибка памяти')
                    break
                default:
                    setAppError('Ошибка чтения данных')
            }
        }
    }, [])
    const saveToIndexedDB = useCallback((objectsSet: objectType[]) => {
        // Function reflects current objects set in state on indexedDB.
        // So can delete all indexedDB data if call it with empty objects array.
        // Objects is stored by 2gis id of object
        //
        // 1. clear indexedDB storage
        // 2. save all objects from state

        // open database then set event handler
        let openDB = indexedDB.open(DB__NAME, 1)
        openDB.onupgradeneeded = () => {
            // if there is not storage then create it
            let db = openDB.result
            if (!db.objectStoreNames.contains(DB__OBJECTS_STORAGE_NAME)) {
                db.createObjectStore(DB__OBJECTS_STORAGE_NAME, {keyPath: 'id'})
            }
        }
        openDB.onsuccess = () => {
            // if opening was succeeded
            let db = openDB.result

            // create transaction -
            // or all operations will be completed
            // or all operations will be uncompleted without changing of database state
            let transaction = db.transaction(DB__OBJECTS_STORAGE_NAME, 'readwrite')
            transaction.oncomplete = () => {
                setAppError('Сохранение прошло успешно')
            }
            transaction.onerror = () => {
                setAppError('Сохранение не было выполнено')
            }

            // get db storage
            let objectsDB = transaction.objectStore(DB__OBJECTS_STORAGE_NAME)

            // clear all data
            objectsDB.clear()

            // set current objects set to db storage
            objectsSet.forEach((object,) => {
                objectsDB.add(object)
            })

        }
        openDB.onerror = () => {
            setAppError('Не удаётся открыть базу данных')
        }
    }, [])
    const loadFromIndexedDB = useCallback(() => {
        setEditMode(false)
        // load object from indexedDB with deleting all current objects in state
        // let openDB = indexedDB.open(DB__NAME, 1)
        let openDB = indexedDB.open(DB__NAME, 1)
        openDB.onsuccess = () => {
            let db = openDB.result
            let transaction = db.transaction(DB__OBJECTS_STORAGE_NAME, 'readonly')
            let objects: Array<objectType> = []
            transaction.oncomplete = () => {
                setAppError('Данные загружены')
                setObjectsSet(objects)
            }
            transaction.onerror = () => {
                setAppError('Данные не были загружены')
            }
            let objectsDB = transaction.objectStore(DB__OBJECTS_STORAGE_NAME)
            let request = objectsDB.getAll()
            request.onsuccess = () => {
                request.result.forEach((object: objectType, index) => {
                    objects[index] = object
                })
            }
        }
        openDB.onerror = () => {
            setAppError('Не удалось открыть базу данных')
        }
    }, [])
    const loadDataDecorator = useCallback(async (callback: Function, args: Array<any> = [],
                                                 timeout: number = NETWORK__TIMEOUT) => {
        // wrapper around ajax request with timeout control and error handling
        // pageloader is on
        setPageLoader(true)

        // create timeout controller
        let controller = new AbortController()
        let signal = controller.signal

        // start timeout controller
        setTimeout(() => {
            controller.abort()
        }, timeout)

        // try to execute callback
        try {
            await callback(...args, signal)
        } catch (err) {
            if (err.name === 'AbortError') setAppError('Время ожидания запроса превышено')
            else throw err
        }
        setPageLoader(false)
    }, [])

    // cartweb database requests
    const getCountry = useCallback(async function (countryId: number, signal: AbortSignal) {
        let response = await serverApi.getCountry(countryId, signal)
        let country: TCountry = await response.json()
        let coords = JSON.parse(country.coords)
        dbStringToCoords(coords)
        let object: objectType = {
            ...fakeObject,
            id: String(country.id),
            //@ts-ignore
            coords: coords,
            name: country.name,
            itIs: "polygon",
        }
        setObjectsSet([object])
    }, [])
    const getRegions = useCallback(async (signal: AbortSignal) => {
        let response = await serverApi.getRegions(signal)
        let regions = await response.json()
        let objects = regions.map((region: TRegion) => {
            let coords = JSON.parse(region.coords)
            dbStringToCoords(coords)
            let object: objectType = {
                ...fakeObject,
                id: String(region.regionId),
                coords,
                name: region.name,
                itIs: "polygon",
            }
            return object
        })
        setObjectsSet(objects)
    }, [])
    const getRegion = useCallback(async (id: number, signal: AbortSignal) => {
        let response = await serverApi.getRegion(id, signal)
        let region: TRegion = await response.json()
        let coords = JSON.parse(region.coords)
        dbStringToCoords(coords)
        let object: objectType = {
            ...fakeObject,
            id: String(region.regionId),
            coords,
            name: region.name,
            itIs: 'polygon'
        }
        setObjectsSet([object])
    }, [])
    const getRegionDistricts = useCallback(async (id: number, signal: AbortSignal) => {
        let response = await serverApi.getRegionDistricts(id, signal)
        let districts: TDistrict[] = await response.json()
        let objects = districts
            .filter((district) => !!district.coords)
            .map((district) => {
                let coords = JSON.parse(district.coords)
                dbStringToCoords(coords)
                let object: objectType = {
                    ...fakeObject,
                    coords,
                    id: String(district.id),
                    name: district.name,
                    itIs: 'polygon',
                }
                return object
            })
        setObjectsSet(
            objects
                .filter((object) => typeof object.coords[0] !== 'number')
        )
    }, [])
    const getMapObjects = useCallback(async (signal: AbortSignal) => {
        let response = await serverApi.getMapObjects(signal)
        let dbObjects: Array<TObject> = await response.json()
        let objects = dbObjects.map((object) => {
            return {
                ...fakeObject,
                id: object.id,
                name: object.name,
                address: object.address,
                coords: [object.latitude, object.longitude],
                entranceCoords: JSON.parse(object.entranceCoords),
                squareBorders: JSON.parse(object.squareCoords),
                itIs: object.itIs,
            }
        })
        setObjectsSet(objects)
    }, [])
    // side effects

    useEffect(() => {
        // listen for storage event from another browser tab
        const storageListener = () => {
            setAppError('Данные изменились в другой вкладке')
        }
        window.addEventListener('storage', storageListener)
        return () => {
            // delete event listener after app component will die
            window.removeEventListener('storage', storageListener)
        }
    }, [])

    return (
        <div className={'App'}>
            <div className={'mapContainer'}>
                <button className={'addControl'} onClick={onClickHandler}>
                    <span className={'addSign'}>Edit</span>
                </button>
                <button className={'addControl saveControl'}
                        onClick={() => saveToLS(objectsSet)}>
                    <span className={'addSign'}>Save</span>
                </button>
                <button className={'addControl loadControl'}
                        onClick={loadFromLS}>
                    <span className={'addSign'}>Load</span>
                </button>
                <button className={'addControl testCountry'}
                        onClick={() => loadDataDecorator(getCountry, [190])}>
                    <span className={'addSign'}>GetC</span>
                </button>
                <button className={'addControl testRegions'}
                        onClick={() => loadDataDecorator(getRegions, undefined, NETWORK__TIMEOUT * 2)}>
                    <span className={'addSign'}>GetRs</span>
                </button>
                <button className={'addControl testRegion'}
                        onClick={() => loadDataDecorator(getRegion, [10])}>
                    <span className={'addSign'}>GetR</span>
                </button>
                <button className={'addControl testDistricts'}
                        onClick={() => loadDataDecorator(getRegionDistricts, [10])}>
                    <span className={'addSign'}>GetD</span>
                </button>
                <button className={'addControl testObjects'}
                        onClick={() => loadDataDecorator(getMapObjects)}>
                    <span className={'addSign'}>GetO</span>
                </button>
                {
                    editMode &&
                    <EditSideBar emitterSideBar={emitterSideBar}
                                 emitterMap={emitterMap}
                                 object={currentObject}
                                 callback={
                                     // update object or add object function if it new object or old object
                                     objectsSet.find(object => object.id === currentObject.id) ?
                                         updateObject :
                                         addObject
                                 }
                                 rerenderFunction={rerenderFunction}
                                 deleteObject={deleteObject}
                                 isNew={!objectsSet.find(object => object.id === currentObject.id)}
                                 setError={setError}/>
                }
                <MapMain emitterMap={emitterMap}
                         emitterSideBar={emitterSideBar}
                         objs={objectsSet}
                         editMode={editMode}
                         createObject={createObject}
                         setError={setError}/>
            </div>
            {
                appError &&
                <ErrorMessage message={appError} removeMessage={setError}/>
            }
            {
                pageLoader &&
                <div className={'sheet'}>
                    <div className={'pageLoader'}/>
                </div>
            }
        </div>
    );
}

export default App;