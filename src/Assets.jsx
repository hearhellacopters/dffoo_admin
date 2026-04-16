import { useState, useRef, useEffect } from "react";
import { subscribe, request } from "./services/socket.js";
import './css/Assets.css';

/**
 * Assets page
 * 
 * @param {{connected: boolean, setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Assets({connected, setNeedsRestart}){
    /**
     * @type {[import('./services/socket.js').RequestMap["getServerDB"]["response"]["payload"], (any)=> void]}
     */
    const [serverDB       , setServerDB        ] = useState();
    /**
     * @type {[{ string: boolean, link: boolean, text: string}[], (any)=> void]}
     */
    const [packageInfo    , setPackageInfo     ] = useState();

    const [selectedPackage, setSelectedPackage ] = useState();
    /**
     * @type {["installAsset" | "uninstallAsset", (any)=> void]}
     */
    const [runType        , setRunType         ] = useState();
    /**
     * @type {[boolean, (any)=> void]}
     */
    const [deleteAfter    , setDeleteAfter     ] = useState(false);

    const [jobRunning     , setJobRunning      ] = useState(false);

    const [finishedRunning, setFinishedRunning ] = useState(true);

    const [progress       , setProgress        ] = useState(0);

    const [status         , setStatus          ] = useState("Awaiting status.");

    const [task           , setTask            ] = useState("Awaiting task."); 

    const jobs = useRef(new Map());

    useEffect(()=>{
        (async () => {
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
        })();
    },[connected])

    useEffect(() => {
        const subProgress = subscribe("jobProgress", (data) => {
            const job = jobs.current.get(data.payload && data.payload.jobId);

            if (job) {
                // pass off happens here
                job.onProgress(data);
            };
        });

        const subComplete = subscribe("jobComplete", (data) => {
            const job = jobs.current.get(data.payload && data.payload.jobId);

            if (job) {
                // pass off happens here
                job.onComplete(data);
            };
        });

        return () => {
            if (connected) {
                subProgress();
                subComplete();
            }
        };
    }, []);

    async function getPackageInfo() {
        if(packageInfo == undefined){
            const res = await request("displayURLs");

            if (res.type == "error") {
                console.error(res.payload.message);
            } else {
                if(res.payload.success){
                    setPackageInfo(res.payload.data);
                } else {
                    console.error("Issue getting package data");
                }
            }
        } else {
            setPackageInfo();
        }
    };

    function prepUninstall(e){
        setFinishedRunning(true);

        setStatus("Awaiting status.");

        setTask("Awaiting task."); 

        setRunType("uninstallAsset");

        setSelectedPackage(e.target.dataset.value);
    };

    function prepInstall(e){
        setFinishedRunning(true);

        setStatus("Awaiting status.");

        setTask("Awaiting task.");  

        setRunType("installAsset");

        setSelectedPackage(e.target.dataset.value);
    };

    async function getServerDB(){
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
    };

    // multi-reponse test
    async function startProcess() {
        if(jobRunning || !finishedRunning){
            return;
        }

        try {
            const version = selectedPackage.split("_")[0];

            const os = selectedPackage.split("_")[1];
            // add confrim message here
            const message = runType == "installAsset" ? `Are you sure you want to install the ${version} ${os} asset package?` : `Are you sure you want to uninstall the ${version} ${os} asset package?`;

            const run = confirm(message);

            if(!run){
                return;
            }

            const res = await request(runType, 
                {
                    version: version,
                    os: os,
                    deleteAfter: deleteAfter
                }
            );

            if (res.type == "error") {
                console.error(res.payload.message);

                setStatus(res.payload.message);

                setJobRunning(false);

                return;
            } else {
                const jobId = res.payload.jobId;

                setStatus(res.payload.status);

                setJobRunning(true);

                setFinishedRunning(false);

                jobs.current.set(jobId, {
                    // processing happens here
                    onProgress: async (data) => {
                        setProgress(data.payload.progress);

                        setStatus(data.payload.status);

                        setTask(data.payload.task);
                    },
                    onComplete: async (data) => {
                        setProgress(data.payload.success ? 100 : 0);

                        if(data.payload.success != 0){
                            setNeedsRestart(true);
                        } else {
                            setFinishedRunning(true);
                        }

                        setStatus(data.payload.status);

                        setTask(data.payload.task);

                        setJobRunning(false);

                        jobs.current.delete(jobId);

                        await getServerDB();
                    }
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className='main-holder'>
            <h3>
                Assets
                <div className='sub-header'>
                    Asset Management.
                </div>
            </h3>
            <div>General Info:</div>
            <hr/>
            <div style={{fontSize: "0.8rem"}}>
                <ul style={{paddingInlineStart:"1.5rem", marginBlockEnd: "0rem"}}>
                    <li><span className="color-green">A single asset package requires around 20gigs of free space.</span></li>
                    <li><span style={{color: "#ff5656"}}>The game region / device asset package is required to play.</span></li>
                    <li>Asset packages can be installed or uninstalled at anytime.</li>
                    <li>Each asset package comes zipped in 500mb chunks. 
                        <ul style={{paddingInlineStart:"1rem"}}>
                            <li>Totaling around 7gigs fo space.</li>
                        </ul>
                    </li>
                    <li>There are two options for downloading the packages:
                        <ul style={{paddingInlineStart:"1rem"}}>
                            <li><u>Recommended:</u> Use this page and the server will download them automatically.</li>
                            <li><u>Alternative:</u> Download the parts manually to the <span className="color-yellow">/assets</span> folder from the locations <span onClick={getPackageInfo} className="clicky hyperlink">here</span>.</li>
                        </ul>
                    </li>
                    <li>Once downloaded in the <span className="color-yellow">/assets</span> folder, the server will merge the files together to unzip and install them.
                        <ul style={{paddingInlineStart:"1rem"}}>
                            <li>Requiring an additional 9gigs.</li>
                        </ul>
                    </li>
                    <li>There is an option to keep the final merged zip file or <span className="color-yellow">delete after</span> install (if you wish to back it up).
                        <ul style={{paddingInlineStart:"1rem"}}>
                            <li>This frees up around 7gigs of space.</li>
                        </ul>
                    </li>
                </ul>
                {packageInfo == undefined ? "" :
                    <>
                        <br/> 
                        <div style={{display: "inline-block", margin: "0px 10px 5px", padding: "10px", border: "2px solid #efefef"}}>
                            {packageInfo.map(self=>{
                                if(self.link){
                                    return <div><a className="clicky hyperlink" href={self.text} target="_blank" rel="noopener noreferrer">{self.text}</a></div>
                                }
                                if(self.string){
                                    return <div>{self.text}</div>
                                }
                            })}
                        </div>
                    </>
                }
            </div>
            <div style={{marginTop: "10px"}}>Packages:</div>
            <hr/>
            {serverDB == undefined ? "" :
                <table className="assets-table">
                    <thead>
                        <tr className="assets-table-header">
                            <th className="assets-th assets-border-bottom assets-border-right">Region</th>
                            <th className="assets-th assets-border-bottom assets-border-left assets-border-right">System</th>
                            <th className="assets-th assets-border-bottom assets-border-left assets-border-right">&nbsp;Install&nbsp;</th>
                            <th className="assets-th assets-border-bottom assets-border-left">Uninstall</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th className="assets-subborder-bottom assets-th assets-subborder-right"><span title="Global" className="glFlag" /></th>
                            <th className="assets-subborder-bottom assets-th assets-subborder-right assets-subborder-left"><div title={`GL Android`} style={{margin: "auto"}} className={`android ${serverDB.assets.GL.Android != undefined ? "make-green" : "make-red"}`}/></th>
                            <th title="Install asset package" style={{fontSize: "1.5rem"}} className="assets-subborder-bottom assets-th assets-subborder-right assets-subborder-left"><span data-value="GL_Android" className="clicky" onClick={(e)=> prepInstall(e)}>{serverDB.assets.GL.Android == undefined ? "📥" : ""}</span></th>
                            <th title="Uninstall asset package" style={{fontSize: "1.5rem"}} className="assets-subborder-bottom assets-th assets-subborder-left"><span data-value="GL_Android" className="clicky" onClick={(e)=> prepUninstall(e)}>{serverDB.assets.GL.Android != undefined ? "🗑️" : ""}</span></th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <th className="assets-subborder-bottom assets-th assets-subborder-right"><span title="Global" className="glFlag" /></th>
                            <th className="assets-subborder-bottom assets-th assets-subborder-right assets-subborder-left"><div title={`GL iOS`} style={{margin: "auto"}} className={`ios ${serverDB.assets.GL.iOS != undefined ? "make-green"  :"make-red"}`}/></th>
                            <th title="Install asset package" style={{fontSize: "1.5rem"}} className="assets-subborder-bottom assets-th assets-subborder-right assets-subborder-left"><span data-value="GL_iOS" className="clicky" onClick={(e)=> prepInstall(e)}>{serverDB.assets.GL.iOS == undefined ? "📥" : ""}</span></th>
                            <th title="Uninstall asset package" style={{fontSize: "1.5rem"}} className="assets-subborder-bottom assets-th assets-subborder-left"><span data-value="GL_iOS" className="clicky" onClick={(e)=> prepUninstall(e)}>{serverDB.assets.GL.iOS != undefined ? "🗑️" : ""}</span></th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <th className="assets-subborder-bottom assets-th assets-subborder-right"><span title="Japanese" className="jpFlag" /></th>
                            <th className="assets-subborder-bottom assets-th assets-subborder-left assets-subborder-right"><div title={`JP Android`} style={{margin: "auto"}} className={`android ${serverDB.assets.JP.Android != undefined ? "make-green"  :"make-red"}`}/></th>
                            <th title="Install asset package" style={{fontSize: "1.5rem"}} className="assets-subborder-bottom assets-th assets-subborder-left assets-subborder-right"><span data-value="JP_Android" className="clicky" onClick={(e)=> prepInstall(e)}>{serverDB.assets.JP.Android == undefined ? "📥" : ""}</span></th>
                            <th title="Uninstall asset package" style={{fontSize: "1.5rem"}} className="assets-subborder-bottom assets-th assets-subborder-left"><span data-value="JP_Android" className="clicky" onClick={(e)=> prepUninstall(e)}>{serverDB.assets.JP.Android != undefined ? "🗑️" : ""}</span></th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <th className="assets-th assets-subborder-right"><span title="Japanese" className="jpFlag" /></th>
                            <th className="assets-th assets-subborder-right assets-subborder-left"><div title={`JP iOS`} style={{margin: "auto"}} className={`ios ${serverDB.assets.JP.iOS != undefined ? "make-green"  :"make-red"}`}/></th>
                            <th title="Install asset package" style={{fontSize: "1.5rem"}} className="assets-th assets-subborder-right assets-subborder-left"><span data-value="JP_iOS" className="clicky" onClick={(e)=> prepInstall(e)}>{serverDB.assets.JP.iOS == undefined ? "📥" : ""}</span></th>
                            <th title="Uninstall asset package" style={{fontSize: "1.5rem"}} className="assets-th assets-subborder-left"><span data-value="JP_iOS" className="clicky" onClick={(e)=> prepUninstall(e)}>{serverDB.assets.JP.iOS != undefined ? "🗑️" : ""}</span></th>
                        </tr>
                    </tbody>
                </table>
            }
            {selectedPackage == undefined ? "" :
                <table className="assets-table">
                    <thead>
                        <tr className="assets-table-subheader assets-border-bottom">
                            <th>Package:</th>
                            <th>{selectedPackage.split("_")[0] == "GL" ? <span title="Global" className="glFlag" /> : <span title="Japanese" className="jpFlag" />}</th>
                            <th><div className={selectedPackage.split("_")[1] == "Android" ? "android make-green" : "ios make-green"} style={{margin: "auto"}}/></th>
                            {runType != "installAsset" ? "" :
                                <th style={{display: "flex"}} title="Deletes downloaded zip file after install">
                                    <div style={{fontSize: ".8rem"}}>Delete zip<br/>after?</div>
                                    <input
                                        key={deleteAfter}
                                        type="checkbox"
                                        name="deleteAfter"
                                        title="Deletes downloaded zip file after install"
                                        checked={deleteAfter}
                                        onChange={() => setDeleteAfter((prevValue)=>!prevValue)}
                                        placeholder="false"
                                    />
                                </th>
                            }
                            <th><div onClick={startProcess} className={`general-btn${finishedRunning != true ? "-inactive" : ""}`}>{runType == "installAsset" ? "Install" : "Uninstall"}</div></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th style={{textAlign: "left", paddingLeft: "5px", paddingRight: "5px", overflowY: "auto", display:"block"}} className="assets-subborder-bottom" colspan="5">{task}</th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <th className="assets-subborder-bottom" colspan="5" style={{overflowY: "auto", minHeight: "1rem", display:"block"}}>
                                <progress style={{width: "95%"}} value={progress} max={100}>{`${progress}%`}</progress>
                            </th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr style={{overflowWrap: "break-word", hyphens: "manual"}}>
                            <th className="color-yellow" colspan="5" style={{fontSize: ".8rem", paddingLeft: "5px", paddingRight: "5px", overflowY: "auto", textAlign: "left", minHeight: "2rem", display:"block"}}>{status}</th>
                        </tr>
                    </tbody>
                </table>
            }
        </div>
    )
}