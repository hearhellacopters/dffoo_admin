import React, { Suspense, useState, useEffect } from 'react';
import { Navigate, BrowserRouter, Route, Routes } from 'react-router-dom';
import { startSocket, subscribeConnectionState } from "./services/socket.js";
import Loading from './components/Loading.jsx';
import NotFound from './404.jsx';
import Layout from "./components/Layout.jsx";
import Home from './Home.jsx';
import Settings from './Settings.jsx';
import Assets from './Assets.jsx';
import Patches from './Patches.jsx';
import Players from './Players.jsx';
import TestPage from './testPage.jsx';
import './css/App.css';

const getQuery = () => {
    if (typeof window !== "undefined") {
        return new URLSearchParams(window.location.search);
    }

    return new URLSearchParams();
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);

        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.log(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const { pathname } = window.location;

            const query = getQuery();

            const url = `${pathname}?${query.toString()}`;

            return (
                <div>
                    <h1>Something went wrong.</h1>
                    <div className='subheader infolocation'>Location: {url}</div>
                </div>
            );
        }

        return this.props.children;
    }
};

/**
 * App entry point
 */
export default function App() {
    const [connectedState, setConnectedState] = useState("Disconnected");

    const [connected     , setConnected     ] = useState(false);

    const [needsRestart  , setNeedsRestart  ] = useState(false);

    useEffect(() => {
        startSocket();

        return subscribeConnectionState(setConnectedState);
    }, []);

    useEffect(() => {
        if(connectedState == "Connected"){
            setConnected(true);
        } else {
            setConnected(false);
        }
    }, [connectedState]);

    return (
        <>
            <title>Opera Omnia Server Management</title>
            <BrowserRouter >
                <ErrorBoundary>
                    <Layout 
                        setNeedsRestart={setNeedsRestart}
                        needsRestart={needsRestart}
                    >
                        <Suspense fallback={<Loading />}>
                            <Routes>
                                <Route path="/adminPanel" element={<Navigate replace to="/" />} />

                                <Route path="/home" exact element={<Navigate replace to="/" />} />

                                <Route path="/" exact element={
                                    <Home 
                                        connected={connected}
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/settings" exact element={
                                    <Settings 
                                        connected={connected}
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/assets" exact element={
                                    <Assets 
                                        connected={connected}
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/patches" exact element={
                                    <Patches 
                                        connected={connected}
                                        setNeedsRestart={setNeedsRestart}
                                    />} 
                                />

                                <Route path="/players" exact element={
                                    <Players 
                                        connected={connected}
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/testPage" exact element={
                                    <TestPage 
                                        connected={connected}
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/loading" exact element={<Loading />} />

                                <Route path="/404" element={<NotFound />} />
                                <Route path='*' element={<NotFound />} />
                                <Route element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </Layout>
                </ErrorBoundary>
            </BrowserRouter>
        </>
    )
};