import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { request } from "./services/socket.js";
import './css/Home.css';

/**
 * Home page
 * 
 * @param {{connected: boolean, setNeedsRestart: (value: boolean) => void}} param0 
 */
export default function Home({ connected, setNeedsRestart }) {
    /**
     * @type {[import('./services/socket.js').RequestMap["getConstValues"]["response"]["payload"], (any)=> void]}
     */
    const [currentConsts, setCurrentConsts] = useState();

    const [hasUpdate    , setHasUpdate    ] = useState(false);
    /**
     * @type {[import('./services/socket.js').RequestMap["checkServerVersion"]["response"]["payload"], (any)=> void]}
     */
    const [updateData   , setUpdateData   ] = useState();
    /**
     * @type {[import('./services/socket.js').RequestMap["getServerDB"]["response"]["payload"], (any)=> void]}
     */
    const [serverDB     , setServerDB     ] = useState();
    /**
     * @type {[import('./services/socket.js').RequestMap["getPatches"]["response"]["payload"], (any)=> void]}
     */
    const [patchData    , setPatchData    ] = useState();

    const [patchUpdate  , setPatchUpdate  ] = useState(false);

    const [patchNew     , setPatchNew     ] = useState(false);

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

            if (connected && updateData == undefined) {
                try {
                    const res = await request("checkServerVersion");

                    if (res.type == "checkServerVersion") {
                        if(res.payload.update == true){
                            setHasUpdate(true);
                        }

                        setUpdateData(res.payload);
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

    /**
     * Compares if the current > target
     * 
     * @param {string} current Current version string
     * @param {string} target Required version string
     * @returns {boolean}
     */
    function compareVersions(current, target) {
        const cr = current.split('.').map(Number);

        const tr = target.split('.').map(Number);

        const len = Math.max(cr.length, tr.length);

        for (let i = 0; i < len; i++) {
            const cra = cr[i] || 0;

            const trb = tr[i] || 0;

            if (cra > trb) return true;

            if (cra < trb) return false;
        }
        return false;
    };

    useEffect(()=>{
        if(patchData != undefined && serverDB != undefined){
            for (let i = 0; i < patchData.length; i++) {
                const patch = patchData[i];

                const hasPatch = serverDB.patches.findIndex(data => data.name == patch.name)
                
                if(hasPatch != -1){
                    // patch is found
                    if(serverDB.patches[hasPatch].patch_version != patch.patch_version &&
                        compareVersions(patch.patch_version, serverDB.patches[hasPatch].patch_version)
                    ){
                        // patch has update
                        setPatchUpdate(true);
                    }
                } else {
                    setPatchNew(true);
                }
            }
        }
    },[patchData, serverDB]);

    return (
        <div className='main-holder'>
            <h3>
                Home
                <div className='sub-header'>
                    Current Configuration.
                </div>
            </h3>
            {currentConsts == undefined ? "" : 
                <div>
                    {hasUpdate == false ? "" :
                        <div style={{margin: "10px 5px"}}>
                            <div className="color-yellow">{`⚠️ Server Software Update v${updateData.version}!`}</div>
                            <hr/>
                            {updateData.urls.map((url, index) => (
                                <a className="hyperlink clicky" href={url} target="_blank" rel="noopener noreferrer">
                                    {`Download Link ${index+1}`}
                                </a>
                            ))}
                            <hr/>
                        </div>
                    }
                    {serverDB == undefined ? "" :
                        <div style={{fontSize: ".8rem"}}>
                            {
                                serverDB.assets[currentConsts.VER].Android == undefined && serverDB.assets[currentConsts.VER].iOS == undefined 
                                ?
                                <div>
                                    ❌ No asset packages installed for selected region.<br/>&nbsp;- <Link className="hyperlink clicky" to="/assets">Install them here.</Link>
                                </div>
                                : 
                                serverDB.assets[currentConsts.VER].Android == undefined
                                ?
                                <div>
                                    ⚠️ Android assets available for selected region.<br/>&nbsp;- <Link className="hyperlink clicky" to="/assets">Install it here.</Link>
                                </div>
                                :
                                serverDB.assets[currentConsts.VER].iOS == undefined
                                ?
                                <div>
                                    ⚠️ iOS assets available for selected region.<br/>&nbsp;- <Link className="hyperlink clicky" to="/assets">Install it here.</Link>
                                </div>
                                : ""
                            }
                        </div> 
                    }
                    {(serverDB == undefined || patchData == undefined) ? "" :
                        patchUpdate == true && patchNew == false ?
                            <div style={{fontSize: ".8rem"}}>
                                ⚠️ Patch updates are available.<br/>&nbsp;- <Link className="hyperlink clicky" to="patches">Install them here.</Link>
                            </div>
                        : patchUpdate == false && patchNew == true ?
                            <div style={{fontSize: ".8rem"}}>
                                ⚠️ New patchs are available.<br/>&nbsp;- <Link className="hyperlink clicky" to="patches">Install them here.</Link>
                            </div>
                        : patchUpdate == true && patchNew == true ?
                            <div style={{fontSize: ".8rem"}}>
                                ⚠️ New patchs and updates are available.<br/>&nbsp;- <Link className="hyperlink clicky" to="patches">Install them here.</Link>
                            </div>
                        : ""                        
                    }
                    <table class="home-table">
                        <thead>
                            <tr className="home-table-header">
                                <th colspan="4"class="home-th home-border-bottom"><Link style={{color: "white"}} to="/settings">Game Address</Link></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th colspan="4"class="home-th home-border-bottom"><a className="hyperlink clicky" href={currentConsts.SERVER_URL} target="_blank" rel="noopener noreferrer">
                                    {currentConsts.SERVER_URL}
                                </a></th>
                            </tr>
                        </tbody>
                        <tbody>
                            <tr className="home-table-header">
                                <th class="home-th home-border-bottom home-border-right">Version</th>
                                <th class="home-th home-border-bottom home-border-left home-border-right">Region</th>
                                <th class="home-th home-border-bottom home-border-left home-border-right">O.S.</th>
                                <th class="home-th home-border-bottom home-border-left">CPU</th>
                            </tr>
                        </tbody>
                        <tbody>
                            <tr>
                                <td class="home-th home-subborder-right color-yellow">{`v${currentConsts.SERVER_VERSION}`}</td>
                                <td class="home-th home-subborder-left home-subborder-right">{currentConsts.VER == "GL" ? <span title="Global" className="glFlag" /> : <span title="Japanese" className="jpFlag" />}</td>
                                <td class="home-th home-subborder-left home-subborder-right color-green">{currentConsts.MACHINE_OS}</td>
                                <td class="home-th home-subborder-left color-green">{currentConsts.MACHINE_ARCH}</td>
                            </tr>
                        </tbody>
                        {serverDB == undefined ? "" :
                            <>
                                <tbody>
                                    <tr className="home-table-header">
                                        <th class="home-th home-border-bottom home-border-top" colspan="4"><Link style={{color: "white"}} to="/assets">Installed Asset Packages</Link></th>
                                    </tr>
                                </tbody>
                                <tbody>
                                    <tr>
                                        <td class="home-th bottom home-subborder-right home-gl-bg" colspan="2"><span title="Global" className="glFlag" /></td>
                                        <td class="home-th bottom home-subborder-left home-jp-bg" colspan="2"><span title="Japanese" className="jpFlag" /></td>
                                    </tr>
                                    <tr>
                                        <td class="home-th home-gl-bg">
                                            <div title={`GL Android`} style={{margin: "auto"}} className={`android ${serverDB.assets.GL.Android != undefined ? "make-green" : "make-red"}`}/>
                                        </td>
                                        <td class="home-th home-subborder-right home-gl-bg">
                                            <div title={`GL iOS`} style={{margin: "auto"}} className={`ios ${serverDB.assets.GL.iOS != undefined ? "make-green"  :"make-red"}`}/>
                                        </td>
                                        <td class="home-th home-subborder-left home-jp-bg">
                                            <div title={`JP Android`} style={{margin: "auto"}} className={`android ${serverDB.assets.JP.Android != undefined ? "make-green"  :"make-red"}`}/>
                                        </td>
                                        <td class="home-th home-jp-bg">
                                            <div title={`JP iOS`} style={{margin: "auto"}} className={`ios ${serverDB.assets.JP.iOS != undefined ? "make-green"  :"make-red"}`}/>
                                        </td>
                                    </tr>
                                </tbody>
                                <tbody>
                                    <tr className="home-table-header">
                                        <th class="home-th home-border-bottom home-border-top home-border-right" colspan="2"><Link style={{color: "white"}} to="/patches">Patches Installed</Link></th>
                                        <th class="home-th home-border-bottom home-border-top home-border-left" colspan="2"><Link style={{color: "white"}} to="/players">Player Accounts</Link></th>
                                    </tr>
                                </tbody>
                                <tbody>
                                    <tr>
                                        <th class="home-th home-subborder-right" colspan="2">{serverDB.patches.length}</th>
                                        <th class="home-th home-subborder-left" colspan="2">{serverDB.player_accounts}</th>
                                    </tr>
                                </tbody>
                            </>
                        }
                    </table>
                </div>
            }
        </div>
    );
};