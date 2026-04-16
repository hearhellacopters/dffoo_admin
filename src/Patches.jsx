import { useState, useRef, useEffect } from "react";
import { subscribe, request } from "./services/socket.js";
import "./css/Patches.css";

/**
 * Patches page
 * 
 * @param {{connected: boolean, setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Patches({ connected, setNeedsRestart }) {
    /**
     * @type {[import('./services/socket.js').RequestMap["getConstValues"]["response"]["payload"], (any)=> void]}
     */
    const [currentConsts, setCurrentConsts] = useState();
    /**
     * @type {[import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"], (any)=> void]}
     */
    const [patchData    , setPatchData    ] = useState();
    /**
     * @type {[import('./services/socket.js').RequestMap["getServerDB"]["response"]["payload"], (any)=> void]}
     */
    const [serverDB     , setServerDB     ] = useState();

    const jobs = useRef(new Map());

    useEffect(()=>{
        (async () => {
            if (connected && currentConsts == undefined) {
                try {
                    const res = await request("getConstValues");

                    if (res.type == "getConstValues") {
                        setCurrentConsts(res.payload);
                    } else {
                        console.error(res.payload.message);
                    }
                } catch (error) {
                    console.error(error);
                }  
            }

            if (connected && serverDB == undefined) {
                try {
                    const res = await request("getServerDB");

                    if (res.type == "getServerDB") {
                        setServerDB(res.payload);
                    } else {
                        console.error(res.payload.message);
                    }
                } catch (error) {
                    console.error(error);
                }  
            }

            if (connected && patchData == undefined) {
                try {
                    const res = await request("getPatches");

                    if (res.type == "getPatches") {
                        setPatchData(res.payload);
                    } else {
                        console.error(res.payload.message);
                    }
                } catch (error) {
                    console.error(error);
                }  
            }
        })();
    },[connected]);


    useEffect(() => {
        const subProgress = subscribe("jobProgress", (data) => {
            const job = jobs.current.get(data.payload && data.payload.jobId);

            if (job) {
                job.onProgress(data);
            };
        });

        const subComplete = subscribe("jobComplete", (data) => {
            const job = jobs.current.get(data.payload && data.payload.jobId);

            if (job) {
                job.onComplete(data);
            };
        });

        return () => {
            if(connected){
                subProgress();
                subComplete();
            }
        };
    }, []);

    const patchesTable = (
        <table className="patches-table">
            <thead>
                <tr>
                    <th className="patches-th">Region</th>
                    <th className="patches-th">Name</th>
                    <th className="patches-th">Version</th>
                    <th className="patches-th">Server Ver.</th>
                    <th className="patches-th">Requires</th>
                    <th className="patches-th">Conflicts</th>
                    <th className="patches-th">Uninstall</th>
                </tr>
            </thead>
            <tbody>
                {patchData && patchData.map((patch, index) => (
                    <tr key={patch.name || index}>
                        <td className="patches-th">{patch.game_version == "GL" ? <span title="Global" className="glFlag" /> : <span title="Japanese" className="jpFlag" />}</td>
                        <td className="patches-th">{patch.name}</td>
                        <td className="patches-th">{patch.patch_version}</td>
                        <td className="patches-th">{patch.min_server_version}</td>
                        <td className="patches-th">{patch.requires.length != 0 ? "" : ""}</td>
                        <td className="patches-th">{patch.conflicts.length  != 0 ? "" : ""}</td>
                        <td className="patches-th">
                            <button
                                className="btn"
                                onClick={() => handleUninstall(patch.name)}
                            >
                                Uninstall
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className='main-holder'>
            <h3>
                Patches
                <div className='sub-header'>
                    Patches Management.
                </div>
            </h3>
            
            <div className='sub-header'>
                

                {patchesTable}
            </div>

        </div>
    )
}