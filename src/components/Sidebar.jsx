import { useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

/**
 * Side Bar
 * 
 * @param {{pages: {id: string, label:string}[], active: string, setActive: (value: SetStateAction<string>) => void, isMobile: boolean, open: boolean}} param0 
 */
export default function Sidebar({ pages, active, setActive, isMobile, open }) {
    const location = useLocation();

    const page = location.pathname.substring(1).split('/')[0];

    useEffect(() => {
        setActive((page == "" || page == undefined) ? "home" : page);
    }, []);

    return (
        <aside
            className="sidebar"
            style={{
                ...(isMobile
                    ? {
                        position: "fixed",
                        left: open ? 0 : "-240px",
                        top: "50px",
                        height: "calc(100% - 50px)",
                        transition: "left 0.25s ease",
                        zIndex: 20
                    }
                    : {})
            }}
        >
            <div className="sidebar-menu">Menu</div>
            <hr/>
            {pages.map(item => (
                <Link
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    to={item.id}
                    className={active === item.id ? "sidebar-menu-item sidebar-active-item" : "sidebar-menu-item"}
                >
                    {item.label}
                </Link>
            ))}
        </aside>
    );
};