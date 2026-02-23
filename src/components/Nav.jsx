import { Link } from "react-router-dom";
import "../css/Nav.css";

export default function Nav(){
    return(
        <div className="navigation">
            <Link to="/">HOME</Link>
            <Link to="/assets">ASSETS</Link>
            <Link to="/patches">PATCHES</Link>
            <Link to="/settings">SETTINGS</Link>
        </div>
    );
};