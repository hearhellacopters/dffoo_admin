import { useState, useEffect } from 'react';
import { startSocket, request, connectionState } from "./services/socket";
import "./css/Settings.css";

/**
 * Settings page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Settings({setNeedsRestart}) {
    const [envValues, setEnvValues] = useState();

    const [region, setRegion] = useState();

    const [ip, setIp] = useState();

    const [port, setPort] = useState();

    useEffect(() => {
        // Initialize connection
        startSocket();
    }, []);

    useEffect(() => {
        (async () => {
            if(envValues == undefined && connectionState == "Connected"){
                try {
                    const response = await request("getEnvValues", {});

                    if (!response.type === "getEnvValues") {
                        setRegion({});

                        console.error("Error on getEnvValues return.");
                    } else {
                        setEnvValues(response.payload);

                        setRegion(response.payload.VER);

                        setIp(response.payload.IP_ADDRESS);

                        setPort(response.payload.PORT);
                    }
                } catch (error) {
                    console.error("Error on getEnvValues request.");

                    console.error(error);
                }
            }
        })();
    }, [connectionState]);

    const handleToggle = async (e) => {
        const newRegion = e.target.value;
        // Use the request helper to tell the server to swap
        try {
            const response = await request('setEnvValue', { 
                key: 'VER', 
                value: newRegion 
            });

            if (!response.type === "setEnvValue") {
                console.error("Failed to update region:", response.payload.message);
            } else if(response.payload && response.payload.success == true){
                setRegion(newRegion);

                envValues.VER = newRegion;

                setEnvValues(envValues);

                setNeedsRestart(true);
            } else {
                console.error("Error on setEnvValue return");
            }
        } catch (error) {
            console.error("Error on setEnvValue request");

            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedIp = await changeIpAddress(ip);

            const updatedPort = await changePort(port);

            if(updatedPort && updatedIp){
                alert("Settings updated!");
            } else {
                if(updatedPort){
                    alert("Settings Port!");
                }

                if(updatedIp){
                    alert("Settings IP Address!");
                }
            }
        } catch (error) {
            console.error(error);

            alert("Issue updating settings!");
        }
    };

    /**
     * Validates and sends the Port to the server.
     */
    const changePort = async (pt) => {
        const portPattern = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

        if (!portPattern.test(pt)) {
            throw new Error("Please enter a valid port number.");
        }

        try {
            // Uses the 'setEnvValue' type recognized by socket.js
            const response = await request("setEnvValue", {
                key: "PORT",
                value: `${pt}`
            });

            if (!response.type === "setEnvValue") {
                throw new Error(`Failed: ${response.payload.message}`);
            } else if(response.payload && response.payload.success == true){
                setPort(pt);

                envValues.PORT = `${pt}`;

                setEnvValues(envValues);

                setNeedsRestart(true);

                return true;
            } else {
                if(response.payload.success == false){
                    // no update needed
                    return false;
                }

                throw new Error("Error on setEnvValue return");
            }
        } catch (error) {
            console.log(error);

            throw new Error("An unexpected error occurred during reset");
        }
    };

    /**
     * Validates and sends the IP Address to the server.
     */
    const changeIpAddress = async (ipAddress) => {
        // Basic regex for IPv4 and IPv6 validation
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

        if (!ipv4Pattern.test(ipAddress)) {
            throw new Error("Please enter a valid IPv4 address.");
        }

        try {
            // Uses the 'setEnvValue' type recognized by socket.js
            const response = await request("setEnvValue", {
                key: "IP_ADDRESS",
                value: ipAddress
            });

            if (!response.type === "setEnvValue") {
                throw new Error(`Failed: ${response.payload.message}`);
            } else if(response.payload && response.payload.success == true){
                setIp(ipAddress);

                envValues.IP_ADDRESS = ipAddress;

                setEnvValues(envValues);

                setNeedsRestart(true);

                return true;
            } else {
                if(response.payload.success == false){
                    // no update needed
                    return false;
                }

                throw new Error("Error on setEnvValue return");
            }
        } catch (error) {
            console.error(error);

            throw new Error("An unexpected error occurred during reset");
        }
    };

    return (
        <div className='main-holder'>
            <h3>
                Settings
                <div className='sub-header'>
                    Basic server settings.
                </div>
            </h3>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <h3>Server Region</h3>

                    <label htmlFor="JP">
                        <input type="radio"
                            name="JP/GL"
                            value="JP"
                            id="JP"
                            checked={region === 'JP'}
                            onChange={handleToggle} />
                        JP (Japan)
                    </label>
                    <br />
                    <label htmlFor="GL">
                        <input type="radio"
                            name="JP/GL"
                            value="GL"
                            id="GL"
                            checked={region === 'GL'}
                            onChange={handleToggle} />
                        GL (Global)
                    </label>
                </div>

                <h3>Network Configuration</h3>

                <div className="ip-port">
                    <label>IP Address (v4): </label>
                    <input
                        type="text"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        placeholder="127.0.0.1"
                        required
                    />
                </div>

                <div className="ip-port">
                    <label>Port: </label>
                    <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="8000"
                    />
                </div>
                <button type="submit">Update IP</button>
            </form>
        </div>
    )
}