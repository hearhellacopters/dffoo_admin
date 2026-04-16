import { useEffect, useRef, useState } from "react";
import ConnectionStatus from "./ConnectionStatus";
import { FaCopy } from "react-icons/fa";
import { FaEraser } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaWindowMinimize } from "react-icons/fa";
import { FaWindowMaximize } from "react-icons/fa";
import { subscribe, subscribeConnectionState, request } from "../services/socket";
import '../css/ConsoleLog.css';

/**
 * Server Console Log Window
 * 
 * @param {{isMobile: boolean, isMinimize:boolean, setIsMinimize: ()=>{}}} param0 
 * @returns 
 */
export default function ConsoleLog({ isMobile, isMinimize, setIsMinimize }) {
    const [htmlLogs, setHtmlLogs] = useState([]);

    const [textLogs, setTextLogs] = useState([]);

    const [connectedState, setConnectedState] = useState("Disconnected");

    const idRef = useRef(0);

    useEffect(() => {
        const subLog = subscribe("log", (data) => {
            if (textLogs.length < 2000) {
                setTextLogs((prev) => [...prev, data.payload.text]);
            }

            if (htmlLogs.length < 2000) {
                setHtmlLogs((prev) => [
                    ...prev,
                    {
                        id: idRef.current++,
                        html: data.payload.html,
                    }
                ]);
            }
        });

        return () => {
            if (connectedState == "Connected") {
                subLog();
            }
        };
    }, []);

    useEffect(() => {
        return subscribeConnectionState(setConnectedState);
    }, [])

    const containerRef = useRef(null);

    const messagesEndRef = useRef(null);

    const scrollToBottomIfNeeded = () => {
        if (!containerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottomIfNeeded();
    }, [htmlLogs]);

    function clearLogs() {
        setHtmlLogs([]);
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

    async function downloadLog() {
        const res = await request("downloadLog");

        if (res.type != "error") {
            // text content
            const texts = res.payload.text;
            // file object
            const file = new Blob([texts], { type: 'text/plain' });
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
        <div className="log-wraper" style={isMobile ? { fontSize: "8px", marginBottom: isMinimize ? "" : "1rem" } : { marginLeft: "13.5rem", marginBottom: isMinimize ? "" : "1rem" }}>
            <h2 className="log-header">
                <span style={{ marginLeft: "3px" }}>
                    <sup>
                        <ConnectionStatus />
                    </sup>
                    Live Console Log
                    {textLogs.length == 2000 ? <span title="Log is full, reload window!" style={{ color: "#ff0000" }}>!</span> : ""}
                    {isMobile ? "" : connectedState != "Connected" ? ` - ${connectedState}` : ""}
                </span>
                <span className="log-icon-holder">
                    {isMinimize == true ? "" :
                        <>
                            <FaDownload title="Download Current Server Log File" className="clicky svgIcon" onClick={downloadLog} />&nbsp;
                            <FaCopy title="Copy Log" className="clicky svgIcon" onClick={copyToClipboard} />&nbsp;
                            <FaEraser title="Clear Log" className="clicky svgIcon" onClick={clearLogs} />&nbsp;
                        </>
                    }
                    {isMinimize ?
                        <FaWindowMaximize
                            title={"Maximize Log"}
                            className="clicky svgIcon"
                            onClick={() => setIsMinimize((preValue) => !preValue)}
                        />
                        :
                        <FaWindowMinimize
                            title={"Minimize Log"}
                            className="clicky svgIcon"
                            onClick={() => setIsMinimize((preValue) => !preValue)}
                        />
                    }
                </span>
            </h2>
            <div className={isMinimize ? "log-container-hide" : "log-container"} ref={containerRef}>
                {isMinimize ? "" :
                    <>
                        {htmlLogs.map((log) => (
                            <div
                                key={log.id}
                                className="log-line"
                                dangerouslySetInnerHTML={{ __html: log.html }}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                }
            </div>
        </div>
    );
};