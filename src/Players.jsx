import react from "react";

/**
 * User page
 * 
 * @param {{connected: boolean, setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Players({ connected, setNeedsRestart}){
    return (
        <div className='main-holder'>
            <h3>
                Players
                <div className='sub-header'>
                    Player Account Management.
                </div>
            </h3>
        </div>
    )
}