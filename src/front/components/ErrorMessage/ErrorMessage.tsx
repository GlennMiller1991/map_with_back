import React, {useEffect} from "react";
import "./ErrorMessage.scss";

type ErrorMessagePropsType = {
    message: string,
    removeMessage: (value: string) => void,
}
export const ErrorMessage: React.FC<ErrorMessagePropsType> = React.memo((props) => {

    useEffect(() => {
        setTimeout(() => {
            props.removeMessage('')
        }, 10000)
    }, [props.removeMessage])

    return (
        <div className={'errorMessage'}>
            <span className={'errorText'}>
                {
                    props.message
                }
            </span>
        </div>
    )
})