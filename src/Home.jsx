import React from "react";
import ExampleButtons from "./components/ExampleButtons";

/**
 * Home page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Home({setNeedsRestart}) {
    return (
        <div className='main-holder'>
            <h3>
                Home
            </h3>
            <ExampleButtons
                setNeedsRestart={setNeedsRestart}
            />
        </div>
    );
};