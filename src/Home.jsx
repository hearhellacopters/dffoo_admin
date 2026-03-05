import React, { useState, useEffect } from "react";
import ExampleButtons from "./components/ExampleButtons";
import { startSocket, request } from "./services/socket.js";

/**
 * Home page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void, currentConsts: {[key:string]: any}, setCurrentConsts: (value: SetStateAction<[key:string]:any>) => void}} param0 
 */
export default function Home({ setNeedsRestart}) {

    const [currentConsts, setCurrentConsts] = useState(undefined);

    useEffect(() => {
        startSocket();

        if(currentConsts == undefined){
            getConstValues();
        }
    },[]);

    async function getConstValues() {
        const res = await request("getConstValues");

        if (res.type != "error") {
            setCurrentConsts(res.payload);
        } else {
            console.error(res.payload.message);
        }
    }

    return (
        <div className='main-holder'>
            <h3>
                Home
                {
                    currentConsts == undefined ? "" :
                        currentConsts && currentConsts.VER == "GL" ?
                            <span className="glFlag" /> :
                            <span className="jpFlag" />
                }
            </h3>
            <ExampleButtons
                setNeedsRestart={setNeedsRestart}
            />
        </div>
    );
};