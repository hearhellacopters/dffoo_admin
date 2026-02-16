/**
 * @type {WebSocket}
 */
let socket;
const listeners = new Map();
const pending = new Map();
let requestId = 0;

/**
 * Creates connection to server. Must be at start of `useEffect` in any componets. 
 * 
 * @example
 * ```js
 * useEffect(() => {
 *      connect();
 *      // Code for requests or subscribes here
 *  }, []);
 * ```
 * @returns {void}
 */
export function connect() {
    if (socket) {
        return socket;
    };

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
        /**
         * @typedef {"log"|"reponse"|"error"} typeResonse more to come
         * @type {{type: typeResonse, id: number, payload: any}}
         */
        const msg = JSON.parse(event.data);

        if (msg.type === "response") {
            const resolver = pending.get(msg.id);

            if (resolver) {
                resolver(msg.payload);

                pending.delete(msg.id);
            }

            return;
        }

        const subs = listeners.get(msg.type);

        if (subs) {
            subs.forEach(fn => fn(msg.payload));
        }
    };

    socket.onerror = () => {
        console.error("WebSocket error");

        socket = null;
    };

    return socket;
};

/**
 * Get all messages of a type
 * 
 * @example
 * ```js
 * useEffect(() => {
 *      connect();
 *      
 *      const unsub = subscribe("log", (data) => {
 *          setTextLogs((prev) => [...prev, data.text]);
 * 
 *          setLogs((prev) => [
 *              ...prev,
 *              {
 *                  id: idRef.current++,
 *                  html: data.html,
 *              },
 *          ]);
 *      });
 * 
 *      return unsub;
 *  }, []);
 * ```
 * @param {string} type 
 * @param {(any) => void} handler 
 * @returns {() => void}
 */
export function subscribe(type, handler) {
    if (!listeners.has(type)) {
        listeners.set(type, new Set());
    }

    listeners.get(type).add(handler);

    return () => {
        listeners.get(type).delete(handler);
    };
};

/**
 * Make a request to the server request
 * 
 * @async
 * @example
 * ```js
 *  const getTime = async () => {
 *     const res = await request("timeRequest");
 * 
 *     console.log(res);
 * };
 * ```
 * @param {string} action 
 * @param {any?} payload 
 * @returns {Promise<any>}
 */
export function request(action, payload = {}) {
    return new Promise((resolve) => {
        const id = requestId++;

        pending.set(id, resolve);

        socket.send(JSON.stringify({
            type: action,
            id,
            payload
        }));
    });
};