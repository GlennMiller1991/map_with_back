import React, {ChangeEvent, useEffect, useState} from "react";
import {objectClassType, objectType} from "../../../../../misc/types";
import "../../../EditSideBar.scss";

type CustomSelectPropsType = {
    text: string,
    value: objectClassType,
    keyName: string,
    callback: (obj: Partial<objectType>) => void,
    disabled: boolean,
}
export const CustomSelect: React.FC<CustomSelectPropsType> = React.memo((props) => {

    const [value, setValue] = useState<objectClassType>(props.value)

    const onChangeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
        props.callback({
            [props.keyName]: event.currentTarget.value
        })
    }

    useEffect(() => {
        setValue(props.value)
    }, [props.value])

    return (
        <div className={'inputContainer'}>
            <div className={'inputLabel'}>
                {props.text}
            </div>
            <div className={'input'}>
                <select disabled={props.disabled} className={'select'} value={value} onChange={onChangeHandler}>
                    <option value={undefined}>прочее</option>
                    <option value={'office'}>оффис</option>
                    <option value={'shop'}>магазин</option>
                    <option value={'storage'}>склад</option>
                </select>
            </div>
        </div>
    )
})