import react from "react";

/**
 * Patches page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Patches({setNeedsRestart}){
    return (
        <div className='main-holder'>
            <h3>
                Patches
                <div className='sub-header'>
                    Patches Management.
                </div>
            </h3>
        </div>
    )
}