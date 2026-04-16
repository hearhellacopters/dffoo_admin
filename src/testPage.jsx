import react from "react";
import ExampleButtons from "./components/ExampleButtons";

/**
 * test page
 * 
 * @param @param {{connected: boolean, setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0  param0 
 */
export default function TestPage({ connected, setNeedsRestart }) {
    return(
        <div className='main-holder'>
            <h3>
                Test Page
            </h3>
            <ExampleButtons
                connected={connected}
                setNeedsRestart={setNeedsRestart}
            />
        </div>
    );
};