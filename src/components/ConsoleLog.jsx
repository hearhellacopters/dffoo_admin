import { useEffect, useRef, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { FaEraser } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { startSocket, subscribe, subscribeConnectionState, request } from "../services/socket";
import '../css/ConsoleLog.css';

export default function ConsoleLog() {
    const [logs, setLogs] = useState([]);

    const [textLogs, setTextLogs] = useState([]);

    const [connectedState, setConnectedState] = useState("disconnected");

    const idRef = useRef(0);

    const bottomRef = useRef(null);

    useEffect(() => {
        startSocket();

        subscribe("log", (data) => {
            setTextLogs((prev) => [...prev, data.payload.text]);

            setLogs((prev) => [
                ...prev,
                {
                    id: idRef.current++,
                    html: data.payload.html,
                }
            ]);
        });

        return subscribeConnectionState(setConnectedState);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    function clearLogs() {
        setLogs([]);
    };

    async function copyToClipboard() {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(textLogs.join('\n'));

                alert('Copied log to clipboard!');
            } catch (err) {
                // Fallback if permission is denied or other error
                fallbackCopyToClipboard(textLogs.join('\n'));
            }
        } else {
            fallbackCopyToClipboard(textLogs.join('\n'));
        }
    };

    /**
     * 
     * @param {string} text 
     */
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement("textarea");

        textArea.value = text;
        // Make the textarea invisible
        textArea.style.position = "fixed";

        textArea.style.left = "-999999px";

        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();

        textArea.select();

        try {
            const successful = document.execCommand('copy');
            
            if (successful) {
                alert('Copied log to clipboard!');
            } else {
                alert('Clipboard Fallback Error: unable to copy');
            }
        } catch (err) {
            alert('Clipboard Fallback Error: unable to copy' + err);
        }

        document.body.removeChild(textArea);
    };

    async function downloadLog (){
        const res = await request("downloadLog");

        if(res.type != "error"){
            // text content
            const texts = res.payload.text;
            // file object
            const file = new Blob([texts], {type: 'text/plain'});
            // anchor link
            const element = document.createElement("a");

            element.href = URL.createObjectURL(file);

            element.download = res.payload.name;
            // simulate link click (Required for this to work in FireFox)
            document.body.appendChild(element); 

            element.click();

            document.body.removeChild(element);
        } else {
            console.error(res.payload.message);
        }
    }

    return (
        <div className="logWraper">
            <h2 className="logHeader">
                <span style={{ marginLeft: "3px" }}><sup title={connectedState} style={{ color: connectedState == "Connected" ? "#07ff07": connectedState == "Connecting..." ? "#FFEB3B" : "#ff0000" }}>●</sup>Live Console Log{connectedState != "Connected" ? ` - ${connectedState}`: ""}</span>
                <span className="iconHolder">
                    <FaDownload title="Download Current Server Log File" className="clicky svgIcon" onClick={downloadLog}/>
                    <span>{" "}</span>
                    <FaCopy title="Copy Log" className="clicky svgIcon" onClick={copyToClipboard} />
                    <span>{" "}</span>
                    <FaEraser title="Clear Log" className="clicky svgIcon" onClick={clearLogs} />
                </span>
            </h2>
            <div className="logContainer">
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className="logLine"
                        dangerouslySetInnerHTML={{ __html: log.html }}
                    />
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};