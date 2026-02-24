import react from "react";

/**
 * Assets page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Assets({setNeedsRestart}){
    return (
        <div className='main-holder'>
            <h3>
                Assets
                <div className='sub-header'>
                    Asset Management.
                </div>
            </h3>
        </div>
    )
}