import { useEffect, useState } from "react";
import { startSocket, subscribeConnectionState } from '../services/socket';

/**
 * Connection Dot Icon
 */
export default function ConnectionStatus() {
    const [connectedState, setConnectedState] = useState("Disconnected");

    useEffect(() => {
        startSocket();

        return subscribeConnectionState(setConnectedState);
    }, []);

    return (
        <span title ={connectedState} style={{ fontSize: "12px", color: connectedState == "Connected" ? "#07ff07" : connectedState == "Connecting..." ? "#FFEB3B" : "#ff0000" }}>
            ●
        </span>
    );
};