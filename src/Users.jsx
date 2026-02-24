import react from "react";

/**
 * User page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Users({setNeedsRestart}){
    return (
        <div className='main-holder'>
            <h3>
                Users
                <div className='sub-header'>
                    User Management.
                </div>
            </h3>
        </div>
    )
}