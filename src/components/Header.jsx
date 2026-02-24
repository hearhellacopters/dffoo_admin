import react from "react";
import ConnectionStatus from'./ConnectionStatus';
import { FaPowerOff } from "react-icons/fa";
import { FaUndoAlt } from "react-icons/fa";
import { request } from "../services/socket";
import '../css/Header.css';

/**
 * Site Header
 * 
 * @param {{isMobile: boolean, onMenuClick: () => void, setNeedsRestart: (value: SetStateAction<boolean>) => void, needsRestart: boolean }} param0 
 */
export default function Header({ isMobile, onMenuClick, setNeedsRestart, needsRestart}) {
    async function serverRestart() {
        if (confirm("Are you sure you want to restart the server?")) {
            const res = await request("restartServer");

            if(res.type == "restartServer" && res.payload.success == true){
                alert("Server restarting...");

                setNeedsRestart(false);
            } else {
                alert("Issue restarting server!");
            }
        }
    }

    async function serverShutdown() {
        if (confirm("Are you sure you want to shutdown the server?")) {
            const res = await request("shutdownServer");

            if(res.type == "shutdownServer" && res.payload.success == true){
                alert("Server shutting down...");

                setNeedsRestart(false);
            } else {
                alert("Issue shutting down server!");
            }
        }
    }

    return (
        <header className="header-header">
            <div className="header-left-header">
                {isMobile && (
                    <button className="header-hamburger" onClick={onMenuClick}>
                        ☰
                    </button>
                )}
                <div className="header-logo">Admin{isMobile ? <br /> : " "}
                    Panel <ConnectionStatus/>
                </div>
            </div>
            <div title="Opera Omnia Admin Panel" className="header-banner-image"></div>
            <div className="header-header-right">
                <FaUndoAlt title={needsRestart? "Changes made!\nRestart needed!": "Restart Server"} className={needsRestart ? "needs-restart" : "clicky"} onClick={serverRestart}/>
                <span>{" "}</span>
                <FaPowerOff title="Shutdown Server" className="clicky" onClick={serverShutdown}/>
            </div>
        </header>
    );
};