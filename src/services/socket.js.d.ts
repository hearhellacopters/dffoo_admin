// @ts-check

// "log"            // subscribe only
// "downloadLog"    // request & response
// "error"          // response only
// "timeRequest"    // request & response
// "getEnvValues"   // request & response
// "setEnvValue"    // request & response
// "startProcess"   // request & response
// "test"           // request & response
// "jobProgress"    // subscribe by jobId only
// "jobComplete"    // subscribe by jobId only
// "restartServer"  // request & response
// "shutdownServer" // request & response
// "installAsset"   // response only with jobId
// "uninstallAsset" // response only with jobId
// "installPatch"   // response only with jobId
// "uninstallPatch" // response only with jobId
// "getUserAccounts"// request & response
// "getSecret"      // request & response
// "switchDevice"   // request & response

/**
 * Increasing unique number for tracking requests and returns
 */
type id = number;

/**
 * Single response type
 */
type typeMsgRequests =
    | "downloadLog"
    | "timeRequest"
    | "getEnvValues"
    | "setEnvValue"
    | "startProcess"  // w/ jobId
    | "test"
    | "restartServer"
    | "shutdownServer"
    | "installAsset"  // w/ jobId
    | "uninstallAsset"// w/ jobId
    | "installPatch"  // w/ jobId
    | "uninstallPatch"// w/ jobId
    | "getUserAccounts"
    | "getSecret"
    | "switchDevice";

/**
 * Message type to subscribe (has more than 1 response) 
 * 
 * Jobs use `jobId` to track
 */
type typeMsgSubscribe =
    | "log"
    | "jobProgress"
    | "jobComplete";

interface RequestMap {
    /**
     * response only
     */
    log: {
        request: {
            payload: any
        },
        response: {
            type: "log",
            id: id,
            payload: {
                /**
             * Log message as text
             */
                text: string,
                /**
                 * Log message as html
                 */
                html: string
            };
        }
    },
    downloadLog: {
        request: {
            type: "downloadLog",
            id: id,
            payload: any
        },
        response: {
            type: "downloadLog",
            id: id,
            payload: {
                /**
                 * Log file name
                 */
                name: string,
                /**
                 * Log text data
                 */
                text: string
            };
        }
    },
    /**
     * response only
     */
    error: {
        request: {
            payload: any
        },
        response: {
            type: "error",
            id: id,
            payload: {
                /**
                 * Error message
                 */
                message: string,
                /**
                 * JobId that errored
                 */
                jobId?: number
            }
        }
    },
    timeRequest: {
        request: {
            type: "timeRequest",
            id: id,
            payload: any
        },
        response: {
            type: "timeRequest",
            id: id,
            payload: {
                /**
                 * Server time
                 */
                time: string
            }
        }
    },
    getEnvValues: {
        request: {
            type: "getEnvValues",
            id: id,
            payload: any
        },
        response: {
            type: "getEnvValues",
            id: id,
            payload: {
                /**
                 * Server env key and value set
                 */
                [key: string]: any
            }
        }
    }
    setEnvValue: {
        request: {
            type: "setEnvValue",
            id: id,
            payload: {
                /**
                 * Key to set
                 */
                key: string,
                /**
                 * value to set the key
                 */
                value: any
            }
        },
        response: {
            type: "setEnvValue",
            id: id,
            payload: {
                /**
                 * Return only. If server set the value
                 */
                success: boolean
            }
        }
    },
    startProcess: {
        request: {
            type: "startProcess",
            id: id,
            payload: any
        },
        response: {
            type: "startProcess",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    test: {
        request: {
            type: "test",
            id: id,
            payload: any
        },
        response: {
            type: "test",
            id: id,
            payload: {
                message: string
            }
        }
    },
    /**
     * response only
     */
    jobProgress: {
        request: {
            payload: any
        },
        response: {
            type: "jobProgress",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    /**
     * response only
     */
    jobComplete: {
        request: {
            payload: any
        },
        response: {
            type: "jobComplete",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    restartServer: {
        request: {
            type: "restartServer",
            id: id,
            payload: any
        },
        response: {
            type: "restartServer",
            id: id,
            payload: {
                /**
                 * Return only. If server will reset
                 */
                success: boolean
            }
        }
    },
    shutdownServer: {
        request: {
            type: "shutdownServer",
            id: id,
            payload: any
        },
        response: {
            type: "shutdownServer",
            id: id,
            payload: {
                /**
                 * Return only. If server will shut down
                 */
                success: boolean
            }
        }
    },
    installAsset: {
        request: {
            type: "installAsset",
            id: id,
            payload: {
                /**
                 * Language type
                 */
                version: "GL" | "JP",
                /**
                 * Device version
                 */
                os: "Andorid" | "iOs"
            }
        },
        response: {
            type: "installAsset",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    uninstallAsset: {
        request: {
            type: "uninstallAsset",
            id: id,
            payload: {
                /**
                 * Language type
                 */
                version: "GL" | "JP",
                /**
                 * Device version
                 */
                os: "Andorid" | "iOs"
            }
        },
        response: {
            type: "uninstallAsset",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    installPatch: {
        request: {
            type: "installPatch",
            id: id,
            payload: {
                /**
                 * Patch name
                 */
                patch: string,
                /**
                 * Patch version number
                 */
                version: "Andorid" | "iOs"
            }
        },
        response: {
            type: "installPatch",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    uninstallPatch: {
        request: {
            type: "uninstallPatch",
            id: id,
            payload: {
                /**
                 * Patch name
                 */
                patch: string,
                /**
                 * Patch version number
                 */
                version: "Andorid" | "iOs"
            }
        },
        response: {
            type: "uninstallPatch",
            id: id,
            payload: {
                /**
                 * Job reference for subscribe
                 */
                jobId: number,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                progress: number
            }
        }
    },
    getUserAccounts: {
        request: {
            type: "getUserAccounts",
            id: id,
            payload: {
                /**
                 * Request a single account or get all.
                 */
                account?: string
            }
        },
        response: {
            type: "getUserAccounts",
            id: id,
            payload: {
                /**
                 * Return only. If server switched accounts
                 */
                success: boolean,
                /**
                 * Return only. TDB account infos
                 */
                accounts: any[]
            }
        }

    },
    getSecret: {
        request: {
            type: "getSecret",
            id: id,
            payload: {
                /**
                 * account username
                 */
                username: string
            }
        },
        response: {
            type: "getSecret",
            id: id,
            payload: {
                /**
                 * Return only. If server was able to find account and get secret
                 */
                success: boolean
                /**
                 * Return only. User account secret
                 */
                secret: string
            }
        }
    },
    switchDevice: {
        request: {
            type: "switchDevice",
            id: id,
            payload: {
                /**
                 * device id you want to switch account on
                 */
                uuid: string,
                /**
                 * account to switch it to
                 */
                player_id: string
            }
        },
        response: {
            type: "switchDevice",
            id: id,
            payload: {
                /**
                 * Return only. If server switched accounts
                 */
                success: boolean
            }
        }
    }
};

/**
 * Basic message types
 */
type RequestType = keyof RequestMap;

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
function startSocket(): void;

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
 */
function subscribe<T = typeMsgSubscribe>(type: subscribe, handler: (data: RequestMap[T]["response"]) => void): () => void;

/**
 * Gets connected state
 */
function subscribeConnectionState(handler: (data: "Disconnected" | "Connecting..." | "Connected") => void): () => boolean;

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
 */
async function request<T = typeMsgRequests>(type: T, payload: RequestMap[T | "error"]["request"]["payload"]): Promise<RequestMap[T]["response"]>