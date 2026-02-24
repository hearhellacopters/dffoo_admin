import { useEffect, useRef, useState } from "react";
import ConnectionStatus from "./ConnectionStatus";
import { FaCopy } from "react-icons/fa";
import { FaEraser } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { startSocket, subscribe, subscribeConnectionState, request } from "../services/socket";
import '../css/ConsoleLog.css';

/**
 * Server Console Log Window
 * 
 * @param {{isMobile: boolean}} param0 
 * @returns 
 */
export default function ConsoleLog({ isMobile }) {
    const [htmlLogs, setHtmlLogs] = useState([]);

    const [textLogs, setTextLogs] = useState([]);

    const [connectedState, setConnectedState] = useState("Disconnected");

    const idRef = useRef(0);

    useEffect(() => {
        startSocket();

        subscribe("log", (data) => {
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

        return subscribeConnectionState(setConnectedState);
    }, []);

    const containerRef = useRef(null);

    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        const el = containerRef.current;

        if (!el) return;

        const threshold = 50; // px from bottom

        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        if (atBottom && autoScroll) {
            el.scrollTop = el.scrollHeight;
        }
    }, [htmlLogs, autoScroll]);

    useEffect(() => {
        const el = containerRef.current;

        if (!el) return;

        const handleScroll = () => {
            const threshold = 50;

            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

            setAutoScroll(atBottom);
        };

        el.addEventListener("scroll", handleScroll);

        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

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
        <div className="log-wraper" style={isMobile ? { fontSize: "8px" } : {}}>
            <h2 className="log-header">
                <span style={{ marginLeft: "3px" }}>
                    <sup>
                        <ConnectionStatus/>
                    </sup>
                    Live Console Log
                        {textLogs.length == 2000 ? <span title="Log is full, reload window!" style={{color: "#ff0000"}}>!</span> : ""}
                        {isMobile ? "" : connectedState != "Connected" ? ` - ${connectedState}` : ""}
                </span>
                <span className="log-icon-holder">
                    <FaDownload title="Download Current Server Log File" className="clicky svgIcon" onClick={downloadLog} />
                    <span>{" "}</span>
                    <FaCopy title="Copy Log" className="clicky svgIcon" onClick={copyToClipboard} />
                    <span>{" "}</span>
                    <FaEraser title="Clear Log" className="clicky svgIcon" onClick={clearLogs} />
                </span>
            </h2>
            <div className="log-container" ref={containerRef}>
                {htmlLogs.map((log) => (
                    <div
                        key={log.id}
                        className="log-line"
                        dangerouslySetInnerHTML={{ __html: log.html }}
                    />
                ))}
            </div>
        </div>
    );
};