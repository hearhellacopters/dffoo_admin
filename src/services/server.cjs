// @ts-check
/**
 * @typedef {import('node:querystring').ParsedUrlQuery} ParsedUrlQuery
 * @typedef {import('buffer').Buffer} Buffer
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('http').ServerResponse} ServerResponse
 * @typedef {ServerResponse & {req: IncomingMessage}} res
 * @typedef {import('ws')} WebSocket
 */

const { WebSocketServer } = require("ws");
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Master function for finding machine IP address.
 * 
 * @returns {string} example ``'127.0.0.1'``
 */
function _get_local_IPv4_address() {
    const interfaces = os.networkInterfaces();

    for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];

        if (networkInterface) {
            for (const entry of networkInterface) {
                if (!entry.internal && entry.family === 'IPv4') {
                    return entry.address;
                }
            }
        }
    }

    return '127.0.0.1'; // Default to localhost if no external IPv4 address is found
};

const IP_ADDRESS = _get_local_IPv4_address();

const PORT = 9000;

const SERVER_URL = `http://${IP_ADDRESS}:${PORT}/`;

/**
 * Logger base class. Not to be used outside of ``Logger``
 * 
 * @class
 */
class _CustomLog {
    constructor() {
    }
    /**
     * Log function.
     * @param {string} type - log type
     * @param {string} level - file and location
     * @param {string|number|object|boolean|undefined} text - message
     */
    log(type, level, text) {
        var message = text;
        if (typeof message == "number" ||
            typeof message == "boolean") {
            message = `${text}`;
        } else if (typeof message == "object" && !(message instanceof Error)) {
            message = JSON.stringify(text, null, 4);
        } else if (message == undefined) {
            message = "undefined";
        } else if (message instanceof Error) {
            message = "undefined";
        }

        switch (type) {
            case "error":
                console.error(level, message);
                break;
            case "warn":
                console.warn(level, message);
                break;
            case "log":
            default:
                console.log(level, message);
                break;
        }
    }
};

const _cl = new _CustomLog();

/**
 * Class Logger. 
 * 
 * ```js 
 * // Start as new if you want to use a timer.
 * const LG = new Logger("timerLabel");
 * // End timer with:
 * LG.end(); // does NOT repect log level
 * ```
 * 
 * Use ``Logger.debug()`` - Debug log. Highest level log. Adds timestamp, filename and line.
 * 
 * Use ``Logger.warn()`` - Warn log. Logs and writes if at warn or above. Adds timestamp.
 * 
 * Use ``Logger.error()``- Error log. Logs and writes if at error or above. Adds timestamp, filename and line.
 * 
 * Use``Logger.info()`` - Info log. Always logs and writes this. No extra info.
 * 
 * Use``Logger.log()`` - For dev use only. A console.log() with file and line info. Does NOT write to log.
 * 
 * Only creates log if matching log level is met.
 */
class Logger {
    constructor() {
    }
    /**
     * A ``console.log()`` with file and location.
     * 
     * Does not respect log level or write to log file.
     * 
     * Do NOT use on builds!
     * 
     * Only for temporary dev programming.
     * 
     * @param {any} message - Message to log.
     */
    static log(...message) {
        for (var key = 0; key < message.length; key++) {
            const text = message[key];

            if (typeof text == "number" ||
                typeof text == "boolean"
            ) {
                message[key] = `${text}`;
            } else if (text instanceof Error) {
                message[key] = text.stack;
            } else if (typeof text == "object") {
                message[key] = JSON.stringify(text, null, 4);
            } else if (text == undefined) {
                message[key] = `undefined`;
            }
        }

        const err = new Error();
        // Extract the stack trace information
        const stackTrace = err.stack ? err.stack.split('\n')[2].trim() : "";
        // Updated regular expression to capture file and line information
        const match = stackTrace.match(/\s*at .+ \((.*)\)/) || stackTrace.match(/\s*at (.*)/);
        // Extract the file name, line number, and column number
        const fileName = match ? path.basename(match[1]) : null;

        console.log(`${fileName ? fileName : ""} -`, message.join(" "));
    }

    /**
     * Info log. Always logs and writes this.
     * 
     * No extra info.
     * 
     * @param {any[]} message - Message to log.
     */
    static info(...message) {
        for (var key = 0; key < message.length; key++) {
            const text = message[key];

            if (typeof text == "number" ||
                typeof text == "boolean"
            ) {
                message[key] = `${text}`;
            } else if (text instanceof Error) {
                message[key] = text.stack;
            } else if (typeof text == "object") {
                message[key] = JSON.stringify(text, null, 4);
            } else if (text == undefined) {
                message[key] = `undefined`;
            }
        }

        _cl.log("log", `${C_HEX.cyan}[info]${C_HEX.reset}`, message.join(""));
    };

    /**
     * Error log. Logs and writes if at error or above.
     * 
     * Adds timestamp, filename and line.
     * 
     * @param {any[]} message - Message to log
     */
    static error(...message) {
        for (var key = 0; key < message.length; key++) {
            const text = message[key];

            if (typeof text == "number" ||
                typeof text == "boolean"
            ) {
                message[key] = `${text}`;
            } else if (text instanceof Error) {
                message[key] = text.stack;
            } else if (typeof text == "object") {
                message[key] = JSON.stringify(text, null, 4);
            } else if (text == undefined) {
                message[key] = `undefined`;
            }
        }

        const err = new Error();
        // Extract the stack trace information
        const stackTrace = err.stack ? err.stack.split('\n')[2].trim() : "";
        // Updated regular expression to capture file and line information
        const match = stackTrace.match(/\s*at .+ \((.*)\)/) || stackTrace.match(/\s*at (.*)/);
        // Extract the file name, line number, and column number
        const fileName = match ? path.basename(match[1]) : null;

        const now = new Date();

        let hours = now.getHours();

        const minutes = String(now.getMinutes()).padStart(2, '0');

        const seconds = String(now.getSeconds()).padStart(2, '0');

        hours = hours % 12 || 12;

        _cl.log("error", `${C_HEX.red}[error][${hours}.${minutes}.${seconds}]${C_HEX.reset} ${fileName ? fileName : ""} -`, message.join(" "));
    };

    /**
     * Warn log. Logs and writes if at warn or above.
     * 
     * Adds timestamp.
     * 
     * @param {any[]} message - Message to log
     */
    static warn(...message) {
        for (var key = 0; key < message.length; key++) {
            const text = message[key];

            if (typeof text == "number" ||
                typeof text == "boolean"
            ) {
                message[key] = `${text}`;
            } else if (text instanceof Error) {
                message[key] = text.stack;
            } else if (typeof text == "object") {
                message[key] = JSON.stringify(text, null, 4);
            } else if (text == undefined) {
                message[key] = `undefined`;
            }
        }

        const now = new Date();

        let hours = now.getHours();

        const minutes = String(now.getMinutes()).padStart(2, '0');

        const seconds = String(now.getSeconds()).padStart(2, '0');

        hours = hours % 12 || 12;

        _cl.log("warn", `${C_HEX.magenta}[warn] [${hours}.${minutes}.${seconds}]${C_HEX.reset}`, message.join(" "));
    };

    /**
     * Debug log. Highest level log.
     * 
     * Adds timestamp, filename and line.
     * 
     * @param {any[]} message - Message to log
     */
    static debug(...message) {
        for (var key = 0; key < message.length; key++) {
            const text = message[key];

            if (typeof text == "number" ||
                typeof text == "boolean"
            ) {
                message[key] = `${text}`;
            } else if (text instanceof Error) {
                message[key] = text.stack;
            } else if (typeof text == "object") {
                message[key] = JSON.stringify(text, null, 4);
            } else if (text == undefined) {
                message[key] = `undefined`;
            }
        }

        const err = new Error();
        // Extract the stack trace information
        const stackTrace = err.stack ? err.stack.split('\n')[2].trim() : "";
        // Updated regular expression to capture file and line information
        const match = stackTrace.match(/\s*at .+ \((.*)\)/) || stackTrace.match(/\s*at (.*)/);
        // Extract the file name, line number, and column number
        const fileName = match ? path.basename(match[1]) : null;

        const now = new Date();

        let hours = now.getHours();

        const minutes = String(now.getMinutes()).padStart(2, '0');

        const seconds = String(now.getSeconds()).padStart(2, '0');

        hours = hours % 12 || 12;

        _cl.log("log", `${C_HEX.green}[debug][${hours}.${minutes}.${seconds}]${C_HEX.reset} ${fileName ? fileName : ""} -`, message.join(" "));
    }
};

/**
 * @type {{[key: string]: any}}
 */
const ENV_VALUES = {
    /**
     * in minutes
     */
    BACKUP: 30,
    /**
     * Game version running
     * @type {"GL"|"JP"}
     */
    VER: 'GL',
    /**
     * IP Address running the server on.
     */
    IP_ADDRESS: '192.168.0.110',
    /**
     * Port running the server on.
     */
    PORT: '8000',
    /**
     * If the server uses https or not
     */
    USE_HTTPS: false,
    /**
     * If the admin panel is active
     */
    ADMIN_PANEL: true,
    /**
     * Admin panel port running the server on.
     */
    ADMIN_PORT: '8080',
    /**
     * Admin username
     */
    ADMIN_USERNAME: 'admin',
    /**
     * Admin password
     */
    ADMIN_PASSWORD: 'password',
    /**
     * Log level
     */
    LOG_LEVEL: 'error'
};

/**
 * Base path where server is running.
 * 
 * @returns {string} directory name
 */
function _get_dir_name() {
    // @ts-ignore
    if (process.pkg) {
        return path.dirname(process.execPath);
    } else {
        return process.cwd();
    }
};

const DIR_NAME = _get_dir_name();

/**
 * @type {string[]}
 */
const CURRENT_LOG = [];

/**
 * For console log colors
 * 
 * @readonly
 * @enum {any}
 */
const C_HEX = {
    black: '\x1b[30m',
    30: "#000000",
    red: '\x1b[31m',     // error
    31: "#db6a6a",
    green: '\x1b[32m',   // debug
    32: "#05a905",
    yellow: '\x1b[33m',
    33: "#cece05",
    blue: '\x1b[34m',
    34: "#03a9f4",
    magenta: '\x1b[35m', // warn
    35: "#c965c9",
    cyan: '\x1b[36m',    // info
    36: "#00bcd4",
    white: '\x1b[37m',
    37: "#ffffff",
    grey: '\x1b[90m',
    90: "#808080",
    reset: '\x1b[0m',    // ending
    ansiToHtml: ansiToHtml
};

/**
 * Converts ANSI color codes to HTML spans.
 * Supports standard 30-37 foreground colors + reset.
 * 
 * @param {string} input 
 */
function ansiToHtml(input) {
    const ansiRegex = /\x1b\[(\d+)m/g;

    let result = "";

    let lastIndex = 0;

    let openSpan = false;

    /**
     * escapeHtml
     * 
     * @param {string} str 
     */
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    /**
     * Converts URLs in text into clickable links.
     * Must be called AFTER escapeHtml.
     * @param {string} text
     * @returns {string}
     */
    function linkify(text) {
        const urlRegex = /\b((https?:\/\/|www\.)[^\s<]+)/gi;

        return text.replace(urlRegex, (url) => {
            const href = url.startsWith("http") ? url : `https://${url}`;

            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    let match;

    while ((match = ansiRegex.exec(input)) !== null) {
        const code = parseInt(match[1], 10);

        const textChunk = input.slice(lastIndex, match.index);

        result += escapeHtml(textChunk);

        lastIndex = ansiRegex.lastIndex;

        if (code === 0) {
            if (openSpan) {
                result += "</span>";

                openSpan = false;
            }

            continue;
        }

        // @ts-ignore
        if (C_HEX[code] != undefined) {
            if (openSpan) result += "</span>";
            // @ts-ignore
            result += `<span style="color:${C_HEX[code]}">`;

            openSpan = true;
        }
    }

    result += linkify(escapeHtml(escapeHtml(input.slice(lastIndex))));

    if (openSpan) result += "</span>";

    return result;
};

/**
 * Creates admin panel server
 */
async function admin_panel() {
    const ADMIN_URL = `http://${IP_ADDRESS}:${PORT}/`;

    const clients = new Set();

    const admin_server = http.createServer(async (req, res) => {
        if (req.method === 'OPTIONS') {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin

            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow these HTTP methods

            res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials (e.g., cookies)

            res.writeHead(200);

            res.end();

            return;
        } else if (
            req.method === 'POST' ||
            req.method === 'GET' ||
            req.method === "PUT"
        ) {
            // everything is handled here.
            _admin_route(req, res, ADMIN_URL);
        } else {
            const ipAddress = req && req.socket && req.socket.remoteAddress && req.socket.remoteAddress.replace(/::ffff:/, "");

            Logger.warn(`${ipAddress} req method outside of POST / GET / PUT for Admin Panel: ` + req.method);

            res.writeHead(404, { 'Content-Type': 'text/plain' });

            res.end('Not Found');

            return;
        }
    });

    const wss = new WebSocketServer({ noServer: true });
    /**
     * Broadcast message to all connected admin clients.
     * 
     * @param {{type: string, id: number, payload: any}} message 
     */
    function broadcast(message) {
        const payload = JSON.stringify(message);

        for (const client of clients) {
            if (client.readyState === 1) {
                client.send(payload);
            }
        }
    };
    /**
     * Send message to client
     * 
     * @param {WebSocket} ws 
     * @param {any} message 
     */
    function send(ws, message) {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(message));
        }
    };

    /**
     * Simple increaing number for ids on WebSocket messages
     */
    var ID = 0;

    /**
     * Intercept console methods so existing console.log 
     * calls still work normally while also streaming 
     * to admin panel.
     */
    function interceptConsole() {
        const originalLog = console.log;

        const originalError = console.error;

        const originalWarn = console.warn;

        const regexRemove = /\x1b\[[0-9;]*[mG]/g;

        console.log = (...args) => {
            originalLog(...args);

            const message = args.join(" ");

            const text = message.replace(regexRemove, '');

            CURRENT_LOG.push(text);

            broadcast({ type: "log", id: ID++, payload: { text: text, html: C_HEX.ansiToHtml(message) } });
        };

        console.error = (...args) => {
            originalError(...args);

            const message = args.join(" ");

            const text = message.replace(regexRemove, '');

            CURRENT_LOG.push(text);

            broadcast({ type: "log", id: ID++, payload: { text: text, html: C_HEX.ansiToHtml(message) } });
        };

        console.warn = (...args) => {
            originalWarn(...args);

            const message = args.join(" ");

            const text = message.replace(regexRemove, '');

            CURRENT_LOG.push(text);

            broadcast({ type: "log", id: ID++, payload: { text: text, html: C_HEX.ansiToHtml(message) } });
        };
    };

    /**
     * Critical: Authenticate BEFORE upgrade.
     */
    admin_server.on("upgrade", (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    });

    wss.on("connection", (ws) => {
        clients.add(ws);

        ws.on("message", async (raw) => {
            try {
                /**
                 * @type {{type:string, id:number, payload:any}}
                 */
                const msg = JSON.parse(raw.toString());

                if(msg.type != undefined){
                     _admin_websocket_functions(send, ws, msg, ID++);
                } else {
                    send(ws, {
                        type: "error",
                        id: msg.id,
                        payload: { message: "Unknown action" }
                    });
                }
            } catch {
                send(ws, {
                    type: "error",
                    payload: { message: "Invalid message format" }
                });
            }
        });

        ws.on("close", () => clients.delete(ws));
    });

    interceptConsole();
    // Start the Admin Panel
    admin_server.listen(PORT, () => {
        Logger.info(`Admin Panel active on ${C_HEX.cyan}${ADMIN_URL}adminPanel${C_HEX.reset}`);
    });
};

/**
 * URL without the base.
 * 
 * @param {string|undefined} requestUrl - URL string
 * @returns {string} string
 */
function get_endpoint(requestUrl = "") {
    const parsedUrl = new URL(requestUrl, SERVER_URL);

    return parsedUrl.pathname;
};

/**
 * Function that handles all admin routing.
 * 
 * If the route isn't defined here, it doesn't have an endpoint.
 * 
 * @async
 * @param { IncomingMessage } req - Message Request
 * @param { res } res - Message Response
 * @param { string } ADMIN_URL - url to endpoint
 */
async function _admin_route(req, res, ADMIN_URL) {
    /**
     * @type {Buffer[]}
     */
    var _body = [];

    req.on('data', (chunk) => {
        _body.push(chunk);
    });

    req.on('end', () => {
        const body = Buffer.concat(_body);

        const parsedUrl = new URL(req.url || "", ADMIN_URL);

        const urlParams = parsedUrl.searchParams;

        const ipAddress = req && req.socket && req.socket.remoteAddress && req.socket.remoteAddress.replace(/::ffff:/, "") || "";

        const endpoint = get_endpoint(req.url);

        if (/\/test(.*)/.test(endpoint)) {
            Logger.info("Test log");

            Logger.warn("Warning log");

            Logger.error("Error log");

            Logger.debug("Debug log");

            res.writeHead(200, { 'Content-Type': 'text/plain' });

            res.end('ping');
        } else {
            _handle_admin_route(body, endpoint, urlParams, ipAddress, res);
        }
    });
};

/**
 * Check if a file exist.
 * 
 * @param {string} filePath - Path to file to check.
 * @returns {boolean} if exists
 */
function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);

        return true;  // File exists
    } catch (error) {
        // @ts-ignore
        if (error.code === 'ENOENT') {
            return false;  // File does not exist
        } else {
            Logger.error(error); // Other errors

            return false;
        }
    }
};

/**
 * Function for serving the admin website data.
 * 
 * @param {Buffer} body - Messge Body
 * @param {string} file - Requested File
 * @param {URLSearchParams} urlParams - URL Params
 * @param {string|undefined} ipAddress - ip address of request
 * @param {ServerResponse} res - Message Response
 */
function _handle_admin_route(body, file, urlParams, ipAddress = "", res) {
    // get endpoint requested file
    if (file == "/adminPanel" || file == "/" || file == "") {
        file = 'index.html';
    }
    // Construct the path to the file in the adminPanel folder
    const indexPath = path.join(DIR_NAME, "dist", file);

    if (!fileExists(indexPath)) {
        Logger.error(`Asset missing for admin page: ${indexPath}`);

        res.writeHead(404, { 'Content-Type': 'text/plain' });

        res.end("Not Found");

        return;
    }
    // Read the content of the file
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            Logger.error(`Asset missing for admin page: ${indexPath}`);

            res.writeHead(500, { 'Content-Type': 'text/plain' });

            res.end("Not Found");
        } else {
            var mime;

            switch (path.extname(indexPath)) {
                case ".txt":
                    mime = 'text/plain';
                    break;
                case ".json":
                    mime = 'application/json';
                    break;
                case ".js":
                    mime = 'text/javascript';
                    break;
                case ".jsx":
                    mime = 'text/javascript';
                    break;
                case ".css":
                    mime = 'text/css';
                    break;
                case ".html":
                    mime = 'text/html';
                    break;
                case ".ico":
                    mime = "image/x-icon";
                    break;
                default:
                    mime = 'text/plain';
                    break;
            }

            res.setHeader("Content-Type", mime);

            if (typeof data != "string") {
                data = JSON.stringify(data);
            }

            res.end(data);
        }
    });
};

/**
 * Restarts server
 * 
 * @param {string|undefined} args - arguments for restart
 */
function restart(args = undefined) {
    process.on("exit", function () {
        const argv = args || process.argv && process.argv.shift();

        require("child_process").spawn(argv || "", process.argv, {
            cwd: _get_dir_name(),
            detached: true,
            stdio: "inherit"
        });
    });

    process.exit();
};

/**
 * 
 * @param {Date|string|number|undefined} date - ``new Date()`` by default
 * @returns 
 */
function humanReadable(date = undefined) {
    if (date != undefined) {
        if (typeof date == "string" ||
            typeof date == "number"
        ) {
            date = new Date(date);
        } else if (!(date instanceof Date)) {
            Logger.error("Date must be an instanceof new Date()");
        }
    } else {
        date = new Date();
    };

    return new Intl.DateTimeFormat('en-US', {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        weekday: "short",
    }).format(date);
};

/**
 * Test WebSocket functions
 * 
 * @param {(ws: WebSocket, message: any) => void} send send back to client
 * @param {WebSocket} ws WebSocket client
 * @param {{type: string, id: number, payload: any}} msg current message
 * @param {number} jobId job unque id
 */
function _admin_websocket_functions(send, ws, msg, jobId) {
    switch (msg.type) {
        case "restartServer":
            {
                Logger.info(`${C_HEX.cyan}Restarting Offline Server...${C_HEX.reset}`);

                send(ws, {
                    type: "restartServer",
                    id: msg.id,
                    payload: { success: true }
                });

                restart();
            }
            break;
        case "shutdownServer":
            {
                Logger.info(`${C_HEX.cyan}Exiting Offline Server...${C_HEX.reset}`);

                send(ws, {
                    type: "shutdownServer",
                    id: msg.id,
                    payload: { success: true }
                });

                process.exit(0);
            }
            break;
        case "installAsset":
            break;
        case "uninstallAsset":
            break;
        case "installPatch":
            break;
        case "uninstallPatch":
            break;
        case "getUserAccounts":
            break;
        case "getSecret":
            break;
        case "switchDevice":
            break;
        case "timeRequest":
            send(ws, {
                type: "timeRequest",
                id: msg.id,
                payload: { time: humanReadable() }
            });
            break;
        case "getEnvValues":
            {
                send(ws, {
                    type: "getEnvValues",
                    id: msg.id,
                    payload: ENV_VALUES
                });
            }
            break;
        case "setEnvValue":
            {
                const values = ENV_VALUES;

                if ((msg.payload && msg.payload.key == undefined) ||
                    (msg.payload && msg.payload.value == undefined) ||
                    values[msg.payload.key] == undefined ||
                    (typeof values[msg.payload.key] != typeof msg.payload.value)
                ) {
                    send(ws, {
                        type: "error",
                        id: msg.id,
                        payload: { message: "Key Error." }
                    });
                } else {
                    values[msg.payload.key] = msg.payload.value;

                    const success = true;

                    send(ws, {
                        type: "setEnvValue",
                        id: msg.id,
                        payload: {
                            success: success
                        }
                    });
                }
            }
            break;
        case "startProcess":
            {
                // faked here for now
                let percent = 0;

                send(ws, {
                    type: "startProcess",
                    id: msg.id,
                    payload: { jobId, status: "Starting...", progress: percent }
                });

                const interval = setInterval(() => {
                    percent += 10;

                    send(ws, {
                        type: "jobProgress",
                        id: msg.id,
                        payload: { jobId, status: "Processing...", progress: percent }
                    });

                    if (percent >= 100) {
                        clearInterval(interval);

                        send(ws, {
                            type: "jobComplete",
                            id: msg.id,
                            payload: { jobId, status: "File processed successfully", progress: percent }
                        });
                    }
                }, 500);
            }
            break;
        case "test":
            {
                Logger.info("Test log");

                Logger.warn("Warning log with a super long string to see if the page will wrap the text around or clip it or add a scroll. Also here is some more text and some more. and a hyper link https://www.google.com and another http://localhost:9000");

                Logger.error("Error log");

                Logger.debug("Debug log");

                send(ws, {
                    type: "test",
                    id: msg.id,
                    payload: { message: "Logged test" }
                });
            }
            break;
        case "downloadLog":
            try {
                const fileName = "test.log";

                const data = CURRENT_LOG.join('\n').toString();

                send(ws, {
                    type: "downloadLog",
                    id: msg.id,
                    payload: {
                        name: fileName,
                        text: data
                    }
                });
            } catch (error) {
                Logger.error("downloadLog request error");

                Logger.error(error);
            }
            break;
        default:
            send(ws, {
                type: "error",
                id: msg.id,
                payload: { message: "Unknown action" }
            });
            break;
    }
};

// Starts server
(async function () {
    admin_panel();
})();