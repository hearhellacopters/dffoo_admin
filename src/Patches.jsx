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
    const [currentConsts  , setCurrentConsts  ] = useState();
    /**
     * @type {[import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"], (any)=> void]}
     */
    const [patchData      , setPatchData      ] = useState();
    /**
     * @type {[import('./services/socket.js').RequestMap["getServerDB"]["response"]["payload"], (any)=> void]}
     */
    const [serverDB       , setServerDB       ] = useState();

    const [selectedPatch  , setSelectedPatch  ] = useState();
    /**
     * @type {["installPatch" | "uninstallPatch", (any)=> void]}
     */
    const [runType        , setRunType        ] = useState();
    /**
     * @type {[boolean, (any)=> void]}
     */
    const [deleteAfter    , setDeleteAfter    ] = useState(false);

    const [jobRunning     , setJobRunning     ] = useState(false);

    const [finishedRunning, setFinishedRunning] = useState(true);

    const [progress       , setProgress       ] = useState(0);

    const [status         , setStatus         ] = useState("Awaiting status.");

    const [task           , setTask           ] = useState("Awaiting task.");

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

    /**
     * Compares if the current >= target
     *
     * @param {string} current Current version string
     * @param {string} target Required version string
     * @returns {boolean}
     */
    function versionMet(current, target) {
        const cr = current.split('.').map(Number);

        const tr = target.split('.').map(Number);

        const len = Math.max(cr.length, tr.length);

        for (let i = 0; i < len; i++) {
            const cra = cr[i] || 0;

            const trb = tr[i] || 0;

            if (cra > trb) return true;

            if (cra < trb) return false;
        }
        return true;
    };

    /**
     * Finds the installed entry for a patch name
     *
     * @param {string} name Patch name
     */
    function getInstalled(name) {
        return serverDB && serverDB.patches.find(self => self.name == name);
    };

    /**
     * Checks requirements, conflicts, server version and asset packages
     * before a patch can be installed.
     *
     * @param {import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"][0]} patch
     * @returns {string[]} list of blocking issues (empty = install ok)
     */
    function getInstallIssues(patch) {
        const issues = [];

        if (currentConsts == undefined || serverDB == undefined) {
            return issues;
        }

        if (!versionMet(currentConsts.SERVER_VERSION, patch.min_server_version)) {
            issues.push(`Requires server v${patch.min_server_version} (running v${currentConsts.SERVER_VERSION}).`);
        }

        const assets = serverDB.assets[patch.game_version];

        if (assets.Android == undefined && assets.iOS == undefined) {
            issues.push(`No ${patch.game_version} asset package installed.`);
        }

        for (let i = 0; i < patch.requires.length; i++) {
            const req = patch.requires[i];

            const installed = getInstalled(req.name);

            if (installed == undefined) {
                issues.push(`Requires patch ${req.name} v${req.patch_version}.`);
            } else if (!versionMet(installed.patch_version, req.patch_version)) {
                issues.push(`Requires patch ${req.name} v${req.patch_version} (installed v${installed.patch_version}).`);
            }
        }

        for (let i = 0; i < patch.conflicts.length; i++) {
            const conflict = patch.conflicts[i];

            if (getInstalled(conflict.name) != undefined) {
                issues.push(`Conflicts with installed patch ${conflict.name}.`);
            }
        }
        // installed patches can also list this patch as a conflict
        for (let i = 0; i < serverDB.patches.length; i++) {
            const installed = serverDB.patches[i];

            if (installed.name != patch.name &&
                installed.conflicts.findIndex(self => self.name == patch.name) != -1
            ) {
                issues.push(`Installed patch ${installed.name} conflicts with this patch.`);
            }
        }

        return issues;
    };

    /**
     * Blocks uninstalling a patch other installed patches still require.
     *
     * @param {import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"][0]} patch
     * @returns {string[]} list of blocking issues (empty = uninstall ok)
     */
    function getUninstallIssues(patch) {
        const issues = [];

        if (serverDB == undefined) {
            return issues;
        }

        for (let i = 0; i < serverDB.patches.length; i++) {
            const installed = serverDB.patches[i];

            if (installed.name != patch.name &&
                installed.requires.findIndex(self => self.name == patch.name) != -1
            ) {
                issues.push(`Installed patch ${installed.name} requires this patch.`);
            }
        }

        return issues;
    };

    /**
     * @param {import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"][0]} patch
     * @param {"installPatch" | "uninstallPatch"} type
     */
    function prepJob(patch, type){
        setFinishedRunning(true);

        setStatus("Awaiting status.");

        setTask("Awaiting task.");

        setRunType(type);

        setSelectedPatch(patch.name);
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

    async function startProcess() {
        if(jobRunning || !finishedRunning){
            return;
        }

        try {
            const message = runType == "installPatch" ? `Are you sure you want to install the ${selectedPatch} patch?` : `Are you sure you want to uninstall the ${selectedPatch} patch?`;

            const run = confirm(message);

            if(!run){
                return;
            }

            const payload = runType == "installPatch" ? { patch: selectedPatch, deleteAfter: deleteAfter } : { patch: selectedPatch };

            const res = await request(runType, payload);

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
    };

    /**
     * @param {import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"][0]} patch
     */
    function actionButtons(patch) {
        const installed = getInstalled(patch.name);

        const hasUpdate = installed != undefined &&
                          installed.patch_version != patch.patch_version &&
                          versionMet(patch.patch_version, installed.patch_version);

        const buttons = [];

        if (installed == undefined || hasUpdate) {
            const issues = getInstallIssues(patch);

            const label = hasUpdate ? "Update" : "Install";

            if (issues.length == 0) {
                buttons.push(
                    <div key={label} title={`${label} patch`} className="general-btn patches-btn" onClick={() => prepJob(patch, "installPatch")}>
                        {label}
                    </div>
                );
            } else {
                buttons.push(
                    <div key={label} title={issues.join("\n")} className="general-btn-inactive patches-btn">
                        {label} 🚫
                    </div>
                );
            }
        }

        if (installed != undefined) {
            const issues = getUninstallIssues(patch);

            if (issues.length == 0) {
                buttons.push(
                    <div key="uninstall" title="Uninstall patch" className="general-btn patches-btn" onClick={() => prepJob(patch, "uninstallPatch")}>
                        Uninstall
                    </div>
                );
            } else {
                buttons.push(
                    <div key="uninstall" title={issues.join("\n")} className="general-btn-inactive patches-btn">
                        Uninstall 🚫
                    </div>
                );
            }
        }

        return buttons;
    };

    /**
     * @param {import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"][0]} patch
     */
    function statusCell(patch) {
        const installed = getInstalled(patch.name);

        if (installed == undefined) {
            return <span className="sub-header">Not installed</span>;
        }

        if (installed.patch_version != patch.patch_version &&
            versionMet(patch.patch_version, installed.patch_version)
        ) {
            return <span className="color-yellow">{`⚠️ Update v${patch.patch_version}`}</span>;
        }

        return <span className="color-green">✔️ Installed</span>;
    };

    const patchesTable = (
        <table className="patches-table">
            <thead>
                <tr className="patches-table-header">
                    <th className="patches-th patches-border-bottom patches-border-right">Region</th>
                    <th className="patches-th patches-border-bottom patches-border-left patches-border-right">Name</th>
                    <th className="patches-th patches-border-bottom patches-border-left patches-border-right">Version</th>
                    <th className="patches-th patches-border-bottom patches-border-left patches-border-right">Server Ver.</th>
                    <th className="patches-th patches-border-bottom patches-border-left patches-border-right">Requires</th>
                    <th className="patches-th patches-border-bottom patches-border-left patches-border-right">Conflicts</th>
                    <th className="patches-th patches-border-bottom patches-border-left patches-border-right">Status</th>
                    <th className="patches-th patches-border-bottom patches-border-left">Actions</th>
                </tr>
            </thead>
            <tbody>
                {patchData && patchData.map((patch, index) => (
                    <tr key={patch.name || index}>
                        <td className="patches-th patches-subborder">{patch.game_version == "GL" ? <span title="Global" className="glFlag" /> : <span title="Japanese" className="jpFlag" />}</td>
                        <td className="patches-th patches-subborder" title={patch.desc}>{patch.name}</td>
                        <td className="patches-th patches-subborder">{patch.patch_version}</td>
                        <td className="patches-th patches-subborder">
                            {currentConsts == undefined || versionMet(currentConsts.SERVER_VERSION, patch.min_server_version)
                                ? <span title="Server version ok" className="color-green">{patch.min_server_version}</span>
                                : <span title={`Requires server v${patch.min_server_version}`} className="color-red">{patch.min_server_version}</span>
                            }
                        </td>
                        <td className="patches-th patches-subborder">
                            {patch.requires.length == 0 ? <span className="sub-header">-</span> :
                                patch.requires.map(req => {
                                    const installed = getInstalled(req.name);

                                    const met = installed != undefined && versionMet(installed.patch_version, req.patch_version);

                                    return (
                                        <div key={req.name} title={met ? `${req.name} v${req.patch_version} installed` : `Requires ${req.name} v${req.patch_version}`}>
                                            {met ? "✅" : "❌"} {req.name}
                                        </div>
                                    );
                                })
                            }
                        </td>
                        <td className="patches-th patches-subborder">
                            {patch.conflicts.length == 0 ? <span className="sub-header">-</span> :
                                patch.conflicts.map(conflict => {
                                    const active = getInstalled(conflict.name) != undefined;

                                    return (
                                        <div key={conflict.name} className={active ? "color-red" : ""} title={active ? `Conflicting patch ${conflict.name} is installed` : `Conflicts with ${conflict.name} (not installed)`}>
                                            {active ? "⚠️" : "•"} {conflict.name}
                                        </div>
                                    );
                                })
                            }
                        </td>
                        <td className="patches-th patches-subborder">{statusCell(patch)}</td>
                        <td className="patches-th patches-subborder">{actionButtons(patch)}</td>
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
            <div>General Info:</div>
            <hr/>
            <div style={{fontSize: "0.8rem"}}>
                <ul style={{paddingInlineStart:"1.5rem", marginBlockEnd: "0rem"}}>
                    <li><span style={{color: "#ff5656"}}>The default patch for the game region is required to play.</span></li>
                    <li>Patches can only be installed when all requirements are met:
                        <ul style={{paddingInlineStart:"1rem"}}>
                            <li>The server software version must meet the patch&apos;s minimum version.</li>
                            <li>An asset package for the patch&apos;s region must be installed.</li>
                            <li>All required patches must be installed first.</li>
                            <li>No conflicting patch can be installed.</li>
                        </ul>
                    </li>
                    <li>Blocked actions show a 🚫 icon, hover over them to see the reason.</li>
                    <li>There is an option to keep the downloaded zip file or <span className="color-yellow">delete after</span> install (if you wish to back it up).</li>
                </ul>
            </div>
            <div style={{marginTop: "10px"}}>Patches:</div>
            <hr/>
            {(patchData == undefined || serverDB == undefined || currentConsts == undefined) ? "" :
                patchesTable
            }
            {selectedPatch == undefined ? "" :
                <table className="patches-table patches-job-table">
                    <thead>
                        <tr className="patches-table-subheader patches-border-bottom">
                            <th>Patch:</th>
                            <th className="color-yellow">{selectedPatch}</th>
                            {runType != "installPatch" ? "" :
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
                            <th><div onClick={startProcess} className={`general-btn${finishedRunning != true ? "-inactive" : ""}`}>{runType == "installPatch" ? "Install" : "Uninstall"}</div></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th style={{textAlign: "left", paddingLeft: "5px", paddingRight: "5px", overflowY: "auto", display:"block"}} className="patches-subborder-bottom" colSpan="4">{task}</th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <th className="patches-subborder-bottom" colSpan="4" style={{overflowY: "auto", minHeight: "1rem", display:"block"}}>
                                <progress style={{width: "95%"}} value={progress} max={100}>{`${progress}%`}</progress>
                            </th>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr style={{overflowWrap: "break-word", hyphens: "manual"}}>
                            <th className="color-yellow" colSpan="4" style={{fontSize: ".8rem", paddingLeft: "5px", paddingRight: "5px", overflowY: "auto", textAlign: "left", minHeight: "2rem", display:"block"}}>{status}</th>
                        </tr>
                    </tbody>
                </table>
            }
        </div>
    )
}
