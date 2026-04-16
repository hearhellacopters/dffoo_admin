import { useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

/**
 * Side Bar
 * 
 * @param {{pages: {id: string, label:string}[], active: string, setActive: (value: SetStateAction<string>) => void, isMobile: boolean, open: boolean, isMinimize: boolean}} param0 
 */
export default function Sidebar({ pages, active, setActive, isMobile, open, isMinimize }) {
    const location = useLocation();

    const navigate = useNavigate();

    const page = location.pathname.substring(1).split('/')[0];

    useEffect(() => {
        setActive((page == "" || page == undefined) ? "home" : page);
    }, [page]);

    async function secretClick(event) {
        if (event.ctrlKey || event.shiftKey) {
            // Allow default browser behavior for Shift+Click (opens in new tab)
            // Note: React Router Link might prevent default behavior by design, 
            // so the browser might not automatically open a new tab. 
            // You might need a different approach (like a standard <a> tag 
            // or window.open) for guaranteed new tab behavior with shift+click.
            navigate('/testPage');
            return;
        }
        // Prevent default and use React Router for normal clicks
        event.preventDefault();
    }

    return (
        <aside
            className="sidebar"
            style={{
                ...(isMobile
                    ? {
                        position: "fixed",
                        left: open ? 0 : "-240px",
                        top: "50px",
                        height: `100%`,
                        transition: "left 0.25s ease",
                        zIndex: 20
                    }
                    : {
                        position: "fixed",
                        height: `100%`,
                    })
            }}
        >
            <div className="sidebar-menu" onClick={secretClick}>Menu</div>
            <hr />
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