import { Link } from "react-router-dom";
import "../css/Nav.css";
import logo from '../img/Compendium_Logo_Smaller.png';

export default function Nav(){
    return(
        <nav className="navigation">
            <ul className="logo">
                <li><img src={logo} /></li>
            </ul>

            <label for='menu' tabindex="0">
                &equiv;
            </label>
            <input id='menu' type='checkbox' />

            <ul className="menu">
                <li><Link to="/">HOME</Link></li>
                <li><Link to="/assets">ASSETS</Link></li>
                <li><Link to="/patches">PATCHES</Link></li>
                <li><Link to="/settings">SETTINGS</Link></li>
            </ul>
        </nav>
    );
};