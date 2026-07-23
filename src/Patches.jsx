import { useState, useRef, useEffect } from "react";
import { subscribe, request } from "./services/socket.js";
import "./css/Patches.css";

const PAGE_SIZE = 5;

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
    /**
     * @type {[boolean, (any)=> void]}
     */
    const [deleteAfter  , setDeleteAfter  ] = useState(false);
    /**
     * The currently running job. Only one patch job runs at a time.
     *
     * @type {[{name: string, type: "installPatch" | "uninstallPatch", progress: number, status: string} | undefined, (any)=> void]}
     */
    const [activeJob    , setActiveJob    ] = useState();
    /**
     * Result of the last finished job, shown inline in that patch's row.
     *
     * @type {[{name: string, status: string, success: boolean} | undefined, (any)=> void]}
     */
    const [lastJob      , setLastJob      ] = useState();

    const [page         , setPage         ] = useState(1);

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
     * Readable patch name, underscores become spaces.
     *
     * @param {string} name Patch name
     */
    function displayName(name) {
        return name.split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

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
                issues.push(`Requires patch ${displayName(req.name)} v${req.patch_version}.`);
            } else if (!versionMet(installed.patch_version, req.patch_version)) {
                issues.push(`Requires patch ${displayName(req.name)} v${req.patch_version} (installed v${installed.patch_version}).`);
            }
        }

        for (let i = 0; i < patch.conflicts.length; i++) {
            const conflict = patch.conflicts[i];

            if (getInstalled(conflict.name) != undefined) {
                issues.push(`Conflicts with installed patch ${displayName(conflict.name)}.`);
            }
        }
        // installed patches can also list this patch as a conflict
        for (let i = 0; i < serverDB.patches.length; i++) {
            const installed = serverDB.patches[i];

            if (installed.name != patch.name &&
                installed.conflicts.findIndex(self => self.name == patch.name) != -1
            ) {
                issues.push(`Installed patch ${displayName(installed.name)} conflicts with this patch.`);
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
                issues.push(`Installed patch ${displayName(installed.name)} requires this patch.`);
            }
        }

        return issues;
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

    /**
     * Runs an install or uninstall job for a patch. Progress is shown
     * inline in the patch's actions cell.
     *
     * @param {import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"][0]} patch
     * @param {"installPatch" | "uninstallPatch"} type
     */
    async function startJob(patch, type) {
        if (activeJob != undefined) {
            return;
        }

        try {
            const message = type == "installPatch" ? `Are you sure you want to install ${displayName(patch.name)} v${patch.patch_version}?` : `Are you sure you want to uninstall ${displayName(patch.name)}?`;

            const run = confirm(message);

            if(!run){
                return;
            }

            setLastJob();

            const payload = type == "installPatch" ? { patch: patch.name, deleteAfter: deleteAfter } : { patch: patch.name };

            const res = await request(type, payload);

            if (res.type == "error") {
                console.error(res.payload.message);

                setLastJob({ name: patch.name, status: res.payload.message, success: false });

                return;
            } else {
                const jobId = res.payload.jobId;

                setActiveJob({ name: patch.name, type: type, progress: 0, status: res.payload.status });

                jobs.current.set(jobId, {
                    onProgress: async (data) => {
                        setActiveJob((prevValue) => prevValue && {
                            ...prevValue,
                            progress: data.payload.progress,
                            status: data.payload.status
                        });
                    },
                    onComplete: async (data) => {
                        if(data.payload.success != 0){
                            setNeedsRestart(true);
                        }

                        setLastJob({ name: patch.name, status: data.payload.status, success: data.payload.success });

                        setActiveJob();

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
    function actionsCell(patch) {
        if (activeJob != undefined && activeJob.name == patch.name) {
            return (
                <div className="patches-job">
                    <progress style={{width: "100%"}} value={activeJob.progress} max={100}>{`${activeJob.progress}%`}</progress>
                    <div className="sub-header">{activeJob.status}</div>
                </div>
            );
        }

        const installed = getInstalled(patch.name);

        const hasUpdate = installed != undefined &&
                          installed.patch_version != patch.patch_version &&
                          versionMet(patch.patch_version, installed.patch_version);

        const busy = activeJob != undefined;

        const buttons = [];

        if (installed == undefined || hasUpdate) {
            const issues = busy ? ["Another patch job is running."] : getInstallIssues(patch);

            const label = hasUpdate ? "Update" : "Install";

            if (issues.length == 0) {
                buttons.push(
                    <div key={label} title={`${label} patch`} className="general-btn patches-btn" onClick={() => startJob(patch, "installPatch")}>
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
            const issues = busy ? ["Another patch job is running."] : getUninstallIssues(patch);

            if (issues.length == 0) {
                buttons.push(
                    <div key="uninstall" title="Uninstall patch" className="general-btn patches-btn" onClick={() => startJob(patch, "uninstallPatch")}>
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

        return (
            <>
                {buttons}
                {lastJob == undefined || lastJob.name != patch.name ? "" :
                    <div className={`patches-job-result ${lastJob.success ? "color-green" : "color-red"}`}>{lastJob.status}</div>
                }
            </>
        );
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
            return <span className="color-yellow" title={`Installed v${installed.patch_version}, update v${patch.patch_version} available`}>{`⚠︎ v${installed.patch_version} → v${patch.patch_version}`}</span>;
        }

        return <span className="color-green" title="Patch is up to date">{`✓ v${installed.patch_version}`}</span>;
    };

    const totalPages = patchData == undefined ? 1 : Math.max(1, Math.ceil(patchData.length / PAGE_SIZE));

    const safePage = Math.min(page, totalPages);

    const pagePatches = patchData == undefined ? [] : patchData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const patchesList = (
        <div className="patches-list">
            {pagePatches.map((patch, index) => {
                const installed = getInstalled(patch.name);

                const hasUpdate = installed != undefined &&
                                  installed.patch_version != patch.patch_version &&
                                  versionMet(patch.patch_version, installed.patch_version);
                // only surface validation info when something actually blocks an action
                const warnings = [
                    ...(installed == undefined || hasUpdate ? getInstallIssues(patch) : []),
                    ...(installed != undefined ? getUninstallIssues(patch) : [])
                ];

                return (
                    <div key={patch.name || index} className="patches-card">
                        <div className="patches-card-info">
                            <div className="patches-name">{patch.game_version == "GL" ? "🌎" : <span title="Japanese" className="jpFlag miniFlag" />}{" "}{displayName(patch.name) + " - v" + patch.patch_version}</div>
                            <div className="sub-header">{patch.desc}</div>
                            {warnings.map(warning => (
                                <div key={warning} className="patches-warning color-yellow">⚠︎ {warning}</div>
                            ))}
                        </div>
                        <div className="patches-card-actions">
                            {statusCell(patch)}
                            {actionsCell(patch)}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const pagination = (
        <div className="patches-pagination">
            <div className={`general-btn${safePage <= 1 ? "-inactive" : ""} patches-btn`} onClick={() => safePage > 1 && setPage(safePage - 1)}>
                ◀ Prev
            </div>
            <span className="patches-page-info">
                {`Page ${safePage} of ${totalPages}`}
                <span className="sub-header">{patchData == undefined ? "" : ` (${patchData.length} patch${patchData.length == 1 ? "" : "es"})`}</span>
            </span>
            <div className={`general-btn${safePage >= totalPages ? "-inactive" : ""} patches-btn`} onClick={() => safePage < totalPages && setPage(safePage + 1)}>
                Next ▶
            </div>
        </div>
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
                    <li>There is an option to keep the downloaded zip files or <span className="color-yellow">delete after</span> install (if you wish to back them up).</li>
                </ul>
            </div>
            <div style={{marginTop: "10px"}}>Patches:</div>
            <hr/>
            {(patchData == undefined || serverDB == undefined || currentConsts == undefined) ? "" :
                <>
                    <div className="patches-options" title="Deletes downloaded zip files after install">
                        <input
                            key={deleteAfter}
                            type="checkbox"
                            name="deleteAfter"
                            id="deleteAfter"
                            checked={deleteAfter}
                            onChange={() => setDeleteAfter((prevValue)=>!prevValue)}
                            placeholder="false"
                        />
                        <label htmlFor="deleteAfter">
                            &nbsp;Delete downloaded zip files after install?
                        </label>
                    </div>
                    {patchesList}
                    {pagination}
                </>
            }
        </div>
    )
}
