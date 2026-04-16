import { useEffect, useState } from "react";
import ConsoleLog from "./ConsoleLog";
import Header from './Header';
import Sidebar from './Sidebar';
import'../css/Layout.css';

/**
 * Basic Layout
 * 
 * @param {{ children: JSX.Element, setNeedsRestart: (value: SetStateAction<boolean>) => void, needsRestart: boolean}} param0 
 */
export default function Layout({ children, setNeedsRestart, needsRestart }) {
    const [active, setActive] = useState("home");

    const [isMobile, setIsMobile] = useState(false);

    const [menuOpen, setMenuOpen] = useState(false);

    const [isMinimize, setIsMinimize] = useState(true);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 800);

        check();

        window.addEventListener("resize", check);

        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (!isMobile) setMenuOpen(false);
    }, [isMobile]);

    const pages = [
        { id: "home",     label: "Home" },
        { id: "settings", label: "Settings" },
        { id: "assets",   label: "Assets" },
        { id: "patches",  label: "Patches" },
        { id: "players",  label: "Players" }
    ];

    return (
        <>
            <Header
                isMobile={isMobile}
                onMenuClick={() => setMenuOpen(v => !v)}
                needsRestart={needsRestart}
                setNeedsRestart={setNeedsRestart}
            />
            <div className="layout-wrapper">
                <div className="layout-body">
                    {(isMobile && menuOpen) && (
                        <div
                            className="layout-overlay"
                            onClick={() => setMenuOpen(false)}
                        />
                    )}
                    <Sidebar 
                        pages={pages}
                        active={active}
                        setActive={(id) => {
                            setActive(id);
                            
                            if (isMobile) {
                                setMenuOpen(false)
                            };
                        }}
                        isMobile={isMobile}
                        open={menuOpen} 
                        isMinimize={isMinimize}
                        />
                    <main 
                        style={isMobile ?
                            {} :
                            {marginLeft: "13rem"}
                        }
                        className="layout-content">
                        {children}
                    </main>
                </div>
            </div>
            <ConsoleLog 
                setIsMinimize={setIsMinimize}
                isMinimize={isMinimize}
                isMobile={isMobile} 
            />
        </>
    );
};