import { useEffect, useRef, useState } from "react";
import { startSocket, subscribe, request } from "../services/socket.js";

export default function ExampleButtons() {
    const [progress, setProgress] = useState("");

    const [status, setStatus] = useState("");

    const [time, setTime] = useState("");

    const jobs = useRef(new Map());

    useEffect(() => {
        startSocket();
        
        const unsubProgress = subscribe("jobProgress", (data) => {
            const job = jobs.current.get(data.payload && data.payload.jobId);

            if (job) {
                // pass off happens here
                job.onProgress(data);
            };
        });

        const unsubComplete = subscribe("jobComplete", (data) => {
            const job = jobs.current.get(data.payload && data.payload.jobId);

            if (job) {
                // pass off happens here
                job.onComplete(data);
            };
        });

        return () => {
            unsubProgress();
            unsubComplete();
        };
    }, []);
    // multi-reponse test
    async function startBigProcess() {
        try {
            const res = await request("startProcess");

            if( res.type == "error" || 
                res.type != "startProcess" ||
                res.payload == undefined 
            ){
                console.error(res.payload.message);

                return;
            }

            const jobId = res.payload.jobId;

            setStatus(res.payload.status);

            jobs.current.set(jobId, {
                // processing happens here
                onProgress: (data) => {
                    setProgress(data.payload.progress);

                    setStatus(data.payload.status);
                },
                onComplete: (data) => {
                    setProgress(data.payload.progress);

                    setStatus(data.payload.status);

                    jobs.current.delete(jobId);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }
    // single reponse test
    async function getTime() {
        const res = await request("timeRequest");

        if(res.type != "error"){
            setTime(res.payload.time);
        } else {
            console.error(res.payload.message);
        }
    };

    // single reponse test
    async function getTest() {
        return await request("test");
    };

    return (
        <div style={{ margin: "auto", textAlign: "center" }}>
            <br />
            <button type="button" onClick={getTest}>Test Log</button>
            <br />
            <button type="button" onClick={getTime}>Get Time</button>
            <br />
            {time}
            <br />
            <button type="button" onClick={startBigProcess}>Run Process Test</button>
            <br />
            {progress != "" ? `${progress}% - ${status}` : ""}
        </div>
    );
}