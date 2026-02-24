//@ts-check
/**
 * @type {WebSocket?}
 */
let socket = null;
/**
 * @type {NodeJS.Timeout?}
 */
let reconnectTimer = null;
/**
 * @type {string}
 */
export let connectionState = "Disconnected";

const stateListeners = new Set();

const messageListeners = new Map();

const pendingRequests = new Map();

let requestId = 0;

let reconnectAttempts = 0;

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

export const webhost = `${protocol}//${window.location.host}`;

function notifyState() {
    stateListeners.forEach(fn => fn(connectionState));
};

/**
 * 
 * @param {string} state 
 */
function setState(state) {
    connectionState = state;

    notifyState();
};

function scheduleReconnect() {
    if (reconnectTimer) return;

    reconnectAttempts++;

    const delay = Math.min(1000 * 2 ** reconnectAttempts, 10000);

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;

        connect();
    }, delay);
};

function connect() {
    if (socket &&
       (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ){
        return;
    };

    setState("Connecting...");

    socket = new WebSocket(webhost);

    socket.addEventListener("close", (event) => {
        setState("Disconnected");

        console.log('Close code:', event.code);

        console.log('Close reason:', event.reason);

        console.log('Was clean close?', event.wasClean);

        scheduleReconnect();
    });

    socket.addEventListener("open", (event) => {
        reconnectAttempts = 0;

        setState("Connected");
    });

    socket.addEventListener("error", (event) => {
        setState("Error");

        console.error('WebSocket error occurred:', event);
        // Log specific properties (though limited)
        console.dir(event);

        console.log('Event type:', event.type);

        console.log('Target readyState:', socket?.readyState);
    })

    socket.addEventListener("message", (event) => {
        /**
         * @template {RequestType} T
         * @type {RequestMap[T]["response"]}
         */
        const msg = JSON.parse(event.data);

        /** non {@link typeMsgSubscribe} */
        if (!(msg.type === "log" ||
              msg.type === "jobProgress" ||
              msg.type === "jobComplete")
        ) {
            const resolver = pendingRequests.get(msg.id);

            if (resolver) {
                resolver(msg);

                pendingRequests.delete(msg.id);
            }

            return;
        }

        const subs = messageListeners.get(msg.type);

        if (subs) {
            subs.forEach(/**@type {(value: any) => void}*/fn => fn(msg));
        }

        return;
    });
};

/**
 * Creates connection to server. Must be at start of `useEffect` in any componets. 
 * 
 * @example
 * ```js
 * useEffect(() => {
 *      startSocket();
 *      // Code for requests or subscribes here
 *  }, []);
 * ```
 */
export function startSocket() {
    connect();
}

/**
 * Get all messages of a type
 * 
 * @example
 * ```js
 * useEffect(() => {
 *      connect();
 *      
 *      const unsub = subscribe("log", (data) => {
 *          setTextLogs((prev) => [...prev, data.payload.text]);
 * 
 *          setLogs((prev) => [
 *              ...prev,
 *              {
 *                  id: idRef.current++,
 *                  html: data.payload.html,
 *              },
 *          ]);
 *      });
 * 
 *      return unsub;
 *  }, []);
 * ```
 * @template {typeMsgSubscribe} T subscribe types
 * @param {T} type Message type
 * @param {(data: RequestMap[T]["response"]) => void} handler payload return call back
 * @returns {() => void}
 */
export function subscribe(type, handler) {
    if (!messageListeners.has(type)) {
        messageListeners.set(type, new Set());
    }

    messageListeners.get(type).add(handler);

    return () => {
        messageListeners.get(type).delete(handler);
    };
};

/**
 * Gets connected state
 * 
 * @param {(data: string) => void} handler 
 * @returns 
 */
export function subscribeConnectionState(handler) {
    stateListeners.add(handler);

    handler(connectionState);

    return () => stateListeners.delete(handler);
}

/**
 * Make a single request / response to the server.
 * 
 * @async
 * @example
 * ```js
 *  async function getTime() {
 *     const res = await request("timeRequest");
 * 
 *     console.log(res);
 * };
 * ```
 * @template {typeMsgRequests} T Request type
 * @param {T} type command
 * @param {RequestMap[T]["request"]["payload"]} payload Sending data
 * @returns {Promise<RequestMap[T | "error"]["response"]>} return data
 */
export function request(type, payload) {
    return new Promise((resolve) => {
        const id = requestId++;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("WebSocket request made before connection was started.");
            
            resolve({ 
                //@ts-ignore
                type: "error", 
                id: id, 
                payload: { 
                    message: "Error, socket undefined" 
                } 
            });
        }

        pendingRequests.set(id, resolve);

        socket?.send(JSON.stringify({
            type: type,
            id: id,
            payload: payload
        }));
    });
};
