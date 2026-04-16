import { useState, useEffect } from 'react';
import { request } from "./services/socket";
import "./css/Settings.css";

/**
 * Settings page
 * 
 * @param {{connected: boolean, setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Settings({ connected, setNeedsRestart }) {
    const [updatedValues , setUpdatedValues ] = useState({});

    const [hasUpdates    , setHasUpdates    ] = useState(false);

    const [portOK        , setPortOK        ] = useState(true);

    const [adminPortOK   , setAdminPortOK   ] = useState(true);

    const [IPAddressOK   , setIPAddressOK   ] = useState(true);

    const [envValues     , setEnvValues     ] = useState(undefined);

    const [BACKUP        , setBACKUP        ] = useState("30"); 

    const [VER           , setVER           ] = useState("GL"); 

    const [IP_ADDRESS    , setIP_ADDRESS    ] = useState("127.0.0.1"); 

    const [PORT          , setPORT          ] = useState("8000"); 

    const [USE_HTTPS     , setUSE_HTTPS     ] = useState(false); 

    const [ADMIN_PANEL   , setADMIN_PANEL   ] = useState(true); 

    const [ADMIN_PORT    , setADMIN_PORT    ] = useState("8081"); 

    const [ADMIN_USERNAME, setADMIN_USERNAME] = useState("admin"); 

    const [ADMIN_PASSWORD, setADMIN_PASSWORD] = useState("password"); 
    
    const [LOG_LEVEL     , setLOG_LEVEL     ] = useState("error");

    const [logsPurged    , setLogsPurged    ] = useState();

    useEffect(() => {
        (async () => {
            if (envValues == undefined && connected) {
                try {
                    const response = await request("getEnvValues");

                    if (response.type === "getEnvValues") {
                        setEnvValues(response.payload);

                        setBACKUP(response.payload.BACKUP);

                        setVER(response.payload.VER);

                        setIP_ADDRESS(response.payload.IP_ADDRESS);

                        setPORT(response.payload.PORT);

                        setUSE_HTTPS(response.payload.USE_HTTPS);

                        setADMIN_PANEL(response.payload.ADMIN_PANEL);

                        setADMIN_PORT(response.payload.ADMIN_PORT);

                        setADMIN_USERNAME(response.payload.ADMIN_USERNAME);

                        setADMIN_PASSWORD(response.payload.ADMIN_PASSWORD);

                        setLOG_LEVEL(response.payload.LOG_LEVEL);
                    } else {
                        console.error("Error on getEnvValues return.");
                    }
                } catch (error) {
                    console.error("Error on getEnvValues request.");

                    console.error(error);
                }
            }
        })();
    }, [connected]);

    const handleChange = async (e) => {
        e.preventDefault();

        const key = e.target.name;

        const value = e.target.value;

        switch (key) {
            case "BACKUP":
                setBACKUP(value);

                if(envValues[key] != value){
                    setUpdatedValues((prevValue) => {
                        prevValue[key] = `${value}`;

                        return prevValue;
                    });

                    setHasUpdates(true);
                }
                break;
            case "VER":
                {
                    setVER(value);

                    if(!(value == "GL" || value == "JP")){
                        return;
                    } else {
                        if(envValues[key] != value){
                            setUpdatedValues((prevValue) => {
                                prevValue[key] = value;
                                
                                return prevValue;
                            });

                            setHasUpdates(true);
                        }
                    }

                    return true;
                }
                break;
            case "IP_ADDRESS":
                {
                    setIP_ADDRESS(value);

                    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
                    if (!ipv4Pattern.test(value)) {
                        setIPAddressOK(false);

                        return;
                    } else {
                        setIPAddressOK(true);
                    }

                    if(envValues[key] != value){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = value;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "PORT":
                {
                    setPORT(value);

                    const portPattern = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

                    if (!portPattern.test(value)) {
                        setPortOK(false);

                        return;
                    } else {
                        setPortOK(true);
                    }
                    if(envValues[key] != value){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = `${value}`;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "USE_HTTPS":
                {
                    const isChecked = e.target.checked;

                    setUSE_HTTPS(!!isChecked);

                    if(envValues[key] != isChecked){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = `${isChecked}`;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "ADMIN_PANEL":
                {
                    const isChecked = e.target.checked;

                    setADMIN_PANEL(!!isChecked);

                    if(envValues[key] != isChecked){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = `${isChecked}`;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "ADMIN_PORT":
                {
                    setADMIN_PORT(value);

                    const portPattern = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

                    if (!portPattern.test(value)) {
                        setAdminPortOK(false);

                        return;
                    } else {
                        setAdminPortOK(true);
                    }

                    if(envValues[key] != value){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = `${value}`;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "ADMIN_USERNAME":
                {
                    setADMIN_USERNAME(value);

                    if(envValues[key] != value){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = value;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "ADMIN_PASSWORD":
                {
                    setADMIN_PASSWORD(value);

                    if(envValues[key] != value){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = value;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            case "LOG_LEVEL":
                {
                    setLOG_LEVEL(value);
                    if(envValues[key] != value){
                        setUpdatedValues((prevValue) => {
                            prevValue[key] = value;
                            
                            return prevValue;
                        });

                        setHasUpdates(true);
                    }
                }
                break;
            default:
                return;
                break;
        }
        
        return;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await request("setEnvValues", updatedValues);

        if (response.type === "setEnvValues") {
            if(response.payload.success == true){
                setUpdatedValues({});

                setNeedsRestart(true);

                setHasUpdates(false);

                alert("Server settings updated!\nNeeds resets!");
            } else {
                setUpdatedValues({});

                setHasUpdates(false);

                alert("No server settings values were updating!");
            }
        } else {
            alert("Server settings update failed!");

            throw new Error(`Failed: ${response.payload.message}`);
        }
    };

    async function purgeLogs(){
        const response = await request("purgeLogs");

        if (response.type === "purgeLogs") {
            setLogsPurged("Logs Purged!");
        } else if(response.type === "error"){
            setLogsPurged(response.payload.message);

            console.error(response.payload.message);
        } else {
            setLogsPurged("Error purging log files.");

            console.error("Error purging log files.");
        }

        setTimeout(() => {
            setLogsPurged();
        },5000);
    };

    return (
        <div className='main-holder'>
            <h3>
                Settings
                <div className='sub-header'>
                    Edit the server configuration.
                </div>
            </h3>

            <form onSubmit={handleSubmit}>
                <div>

                    <div>Game Server</div>
                    <hr/>
                    <div className='settings-pad-top'>Region</div>
                    <label htmlFor="JP" style={{display:"flex", alignItems:"center"}}>
                        <input
                            key={VER}
                            type="radio"
                            name="VER"
                            id="JP"
                            value="JP"
                            checked={VER == "JP"}
                            onChange={(e) => handleChange(e)}
                        />
                        &nbsp;<span className="jpFlag" />&nbsp;(Japan)
                    </label>
                    <label htmlFor="GL" style={{display:"flex", alignItems:"center"}}>
                        <input
                            key={VER}
                            type="radio"
                            name="VER"
                            id="GL"
                            value="GL"
                            checked={VER == "GL"}
                            onChange={(e) => handleChange(e)}
                        />
                        &nbsp;<span className="glFlag" />&nbsp;(Global)
                    </label>
                </div>
                <div className='settings-pad-top'>Network Configuration</div>
                <div className="settings-sub">
                    <label htmlFor="IP_ADDRESS">
                        IP Address (v4):
                    </label>
                    <br/>
                    <div style={{display:"flex"}}>
                        <input
                            type="text"
                            name="IP_ADDRESS"
                            id="IP_ADDRESS"
                            value={IP_ADDRESS}
                            onChange={(e) => handleChange(e)}
                            placeholder="127.0.0.1"
                        />
                        <span title={IPAddressOK ? "IP Address format ok!" : "IP Address in incorrect format"} >&nbsp;{IPAddressOK ? "✅" : "❌"}</span>
                    </div>
                    <br/>
                    <label htmlFor="PORT">
                        Port:
                    </label>
                    <br/>
                    <div style={{display:"flex"}}>
                        <input
                            type="number"
                            name="PORT"
                            id="PORT"
                            value={PORT}
                            onChange={(e) => handleChange(e)}
                            placeholder="8000"
                        />
                        <span title={portOK ? "Port format ok!" : "Port in incorrect format"}>&nbsp;{portOK ? "✅" : "❌"}</span>
                    </div>
                    <br/>
                    <input
                        key={USE_HTTPS}
                        type="checkbox"
                        name="USE_HTTPS"
                        id="USE_HTTPS"
                        checked={USE_HTTPS}
                        title="Requires key.pem and cert.pem files in root of server folder."
                        onChange={(e) => handleChange(e)}
                        placeholder="false"
                    />
                    <label 
                        htmlFor="USE_HTTPS"
                        title="Requires key.pem and cert.pem files in root of server folder."
                    >
                        &nbsp;Use HTTPS?<br/>
                        <span className='sub-header'>Requires key.pem & cert.pem<br/>files in root of server folder.</span>
                    </label>
                </div>

                <div >Server Management</div>
                <hr/>
                <div className="settings-sub">
                    <label htmlFor="BACKUP" className='settings-pad-top'>
                        Backup time:<br/>
                        <span className='sub-header'>in minutes.</span>
                    </label>
                    <br/>
                    <input
                        style={{display:"flex"}}
                        type="number"
                        name="BACKUP"
                        id="BACKUP"
                        value={BACKUP}
                        onChange={(e) => handleChange(e)}
                        placeholder="30"
                    />
                    <br/>
                    <label htmlFor="LOG_LEVEL">
                        Log level:
                    </label>
                    <br/>
                    <select
                        key={LOG_LEVEL}
                        name="LOG_LEVEL"
                        id="LOG_LEVEL"
                        value={LOG_LEVEL}
                        onChange={(e) => handleChange(e)}
                        placeholder="error"
                    >
                        <option defaultValue={true} value="error">error</option>
                        <option  value="debug">debug</option>
                        <option  value="warn">warn</option>
                        <option  value="info">info</option>
                    </select>
                    <br/>
                    <div 
                        title="Delete old log files."
                        onClick={purgeLogs}
                        className='general-btn'
                    >
                        Purge Log Files
                    </div>
                    {logsPurged == undefined ? "":
                        <div style={{fontSize: ".8rem"}} className='color-yellow'>
                            {logsPurged}
                        </div>
                    }
                </div>

                <div>Admin Panel</div>
                <hr/>
                <div className="settings-sub">
                    <input
                        key={ADMIN_PANEL}
                        type="checkbox"
                        name="ADMIN_PANEL"
                        id="ADMIN_PANEL"
                        title="Disables this webpage, operate server VIA command lines."
                        checked={ADMIN_PANEL}
                        onChange={(e) => handleChange(e)}
                        placeholder="true"
                    />
                    <label 
                        htmlFor="ADMIN_PANEL"
                        title="Disables this webpage, operate server VIA command lines."
                    >
                        &nbsp;Enabled?<br/>
                        <span className='sub-header' style={{display:"flex"}}>Disables this webpage, operate<br/>server with command lines ONLY.</span>
                    </label>
                    <br/>
                    <label htmlFor="ADMIN_USERNAME">
                        Username:
                    </label>
                    <br/>
                    <input
                        style={{display:"flex"}}
                        type="text"
                        name="ADMIN_USERNAME"
                        id="ADMIN_USERNAME"
                        value={ADMIN_USERNAME}
                        onChange={(e) => handleChange(e)}
                        placeholder="admin"
                    />
                    <br/>
                    <label htmlFor="ADMIN_PASSWORD">
                        Password:
                    </label>
                    <br/>
                    <input
                        style={{display:"flex"}}
                        type="text"
                        name="ADMIN_PASSWORD"
                        id="ADMIN_PASSWORD"
                        value={ADMIN_PASSWORD}
                        onChange={(e) => handleChange(e)}
                        placeholder="password"
                    />
                    <br/>
                    <label htmlFor="ADMIN_PORT">
                        Port:
                    </label>
                    <br/>
                    <div style={{display:"flex"}}>
                        <input
                            type="number"
                            name="ADMIN_PORT"
                            id="ADMIN_PORT"
                            value={ADMIN_PORT}
                            onChange={(e) => handleChange(e)}
                            placeholder="8081"
                        />
                        <span title={adminPortOK ? "Port format ok!" : "Port in incorrect format"}>&nbsp;{adminPortOK ? "✅" : "❌"}</span> 
                    </div>
                </div>
                <button 
                    className={hasUpdates ? 'btn-active' : 'btn-inactive'}
                    disabled={!hasUpdates}
                    type="submit"
                >
                    Update Settings
                </button>
            </form>
        </div>
    )
}