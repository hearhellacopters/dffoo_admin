import React, { Suspense, useState } from 'react';
import { Navigate, BrowserRouter, Route, Routes } from 'react-router-dom';
import Loading from './components/Loading.jsx';
import NotFound from './404.jsx';
const Layout = React.lazy(() => import("./components/Layout.jsx"));
const Home = React.lazy(() => import('./Home.jsx'));
const Settings = React.lazy(() => import('./Settings.jsx'));
const Assets = React.lazy(() => import('./Assets.jsx'));
const Patches = React.lazy(() => import('./Patches.jsx'));
const Users = React.lazy(() => import('./Users.jsx'));
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
    const [needsRestart, setNeedsRestart] = useState(false);

    return (
        <div>
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
                                        setNeedsRestart={setNeedsRestart} 
                                    />
                                } />

                                <Route path="/settings" exact element={
                                    <Settings 
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/assets" exact element={
                                    <Assets 
                                        setNeedsRestart={setNeedsRestart}
                                    />
                                } />

                                <Route path="/patches" exact element={<Patches />} />

                                <Route path="/users" exact element={
                                    <Users 
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
        </div>
    )
};