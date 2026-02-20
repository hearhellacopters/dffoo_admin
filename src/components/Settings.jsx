import React from "react";
import ConsoleLog from "./ConsoleLog";
import ExampleButtons from "./ExampleButtons";
import Nav from "./Nav";

export default function Settings() {
    return (
        <div>
            <Nav/>
            <ExampleButtons/>
            <ConsoleLog/>
        </div>
    );
};