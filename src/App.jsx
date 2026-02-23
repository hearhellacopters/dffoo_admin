import React, { Suspense } from 'react';
import { Navigate, BrowserRouter, Route, Routes } from 'react-router-dom';
const Admin = React.lazy(() => import('./AdminPanel.jsx'));
import Loading from './components/Loading.jsx';
import NotFound from './404.jsx';
import Assets from "./components/Assets.jsx";
import Patches from "./components/Patches.jsx";
import Settings from "./components/Settings.jsx";
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
            return <div className='App'>
                <h1>Something went wrong.</h1>
                <div className='subheader infolocation'>Location: {url}</div>
            </div>;
        }
        return this.props.children;
    }
};

export default function App() {
    return (
        <div>
            <title>Opera Omnia Server Management</title>
            <BrowserRouter >
                <ErrorBoundary>
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            <Route path="/" element={<Navigate replace to="/adminPanel" />} />

                            <Route path="/adminPanel" exact element={<Admin />} />
                            <Route path="/assets" exact element={<Assets />} />
                            <Route path="/patches" exact element={<Patches />} />
                            <Route path="/settings" exact element={<Settings />} />

                            <Route path="/loading" exact element={<Loading />} />

                            <Route path="/404" element={<NotFound />} />
                            <Route path='*' element={<NotFound />} />
                            <Route element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </BrowserRouter>
        </div>
    )
};