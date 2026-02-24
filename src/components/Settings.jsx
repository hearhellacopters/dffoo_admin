import Nav from "./Nav";
import { useState, useEffect } from 'react';
import "../css/Settings.css";
import { startSocket, subscribe, request } from '../services/socket';

export default function Settings() {

    const [region, setRegion] = useState('JP'); // Default state
    const [ip, setIp] = useState('');
    const [port, setPort] = useState('');

    useEffect(() => {
        // Initialize connection
        startSocket();

        // Subscribe to region updates 
        // Replace 'getEnvValues' with the actual message type your server broadcasts
        const unsubscribe = subscribe('getEnvValues', (data) => {
            if (data.payload && data.payload.REGION) {
                setRegion(data.payload.REGION);
            }
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const handleToggle = async (e) => {
        const newRegion = e.target.value;
    
        // Use the request helper to tell the server to swap
        const response = await request('setEnvValue', { 
            key: 'REGION', 
            value: newRegion 
        });

        if (response.type === 'error') {
            console.error("Failed to update region:", response.payload.message);
        }
    };

    /**
    * Sends a request to the server to reset/restart.
    */
    const handleReset = async () => {
        try {
            // 'restartServer' from socket.js 
            // We pass an empty object or null if no specific payload is required
            const response = await request("restartServer", {});

            if (response.type === "error") {
                console.error("Reset failed:", response.payload.message);
                alert(`Error: ${response.payload.message}`);
            } else {
                console.log("Server reset initiated successfully:", response);
                alert("Server is resetting...");
            }
        } catch (err) {
            console.error("An unexpected error occurred during reset:", err);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIpAddress(ip, port);
    };
    
    /**
     * Validates and sends the IP/Port to the server.
     */
    const setIpAddress = async (ip, port) => {
        // Basic regex for IPv4 and IPv6 validation
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

        if (!ipv4Pattern.test(ip) && !ipv6Pattern.test(ip)) {
            alert("Please enter a valid IPv4 or IPv6 address.");
            return;
        }

        const fullAddress = port ? `${ip}:${port}` : ip;

        // Uses the 'setEnvValue' type recognized by socket.js
        const response = await request("setEnvValue", { 
            key: "SERVER_IP", 
            value: fullAddress 
        });

        if (response.type === "error") {
            alert(`Failed: ${response.payload.message}`);
        } else {
            alert("IP Address updated successfully!");
        }
    };

    return (
        <div>
            <Nav/>

            <form onSubmit={handleSubmit}>
                <div className="region">
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
                    <br/>
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

                <div className="network">
                    <h3>Network Configuration</h3>
                    
                    <div className="ip-port">
                        <label>IP Address (v4/v6): </label>
                        <input 
                            type="text" 
                            value={ip} 
                            onChange={(e) => setIp(e.target.value)} 
                            placeholder="192.168.1.1 or 2001:db8::1"
                            required 
                        />
                    </div>

                    <div className="ip-port">
                        <label>Port (Optional): </label>
                        <input 
                            type="number" 
                            value={port} 
                            onChange={(e) => setPort(e.target.value)} 
                            placeholder="8080"
                        />
                    </div>
                    <button className="btn" type="submit">Update IP</button>
                </div>

                <div className="reset">
                    <label htmlFor="reset">
                        <button className="btn-reset"
                            type="button"
                            name="reset"
                            value="reset"
                            id="reset"
                            onClick={handleReset}>
                            RESET SERVER
                        </button>
                    </label>
                </div>

            </form>
        </div>
    );
};