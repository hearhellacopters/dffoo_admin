// @ts-check

/**
 * Increasing unique number for tracking requests and returns
 */
type id = number;

/**
 * Single response type
 */
export type typeMsgRequests =
    | "downloadLog"
    | "error"
    | "timeRequest"
    | "getPatches"
    | "getServerDB"
    | "displayURLs"
    | "getEnvValues"
    | "getConstValues"
    | "setEnvValues"
    | "startProcess"
    | "test"
    | "restartServer"
    | "shutdownServer"
    | "installAsset"  
    | "uninstallAsset"
    | "installPatch"  
    | "uninstallPatch"
    | "deletePlayerAccount"
    | "deletePlayerID"
    | "getPlayerAccounts"
    | "getSecret"
    | "checkServerVersion"
    | "switchDevice"
    | "purgeLogs";

/**
 * Message type to subscribe (has more than 1 response) 
 * 
 * Jobs use `jobId` to track
 */
export type typeMsgSubscribe =
    | "log"
    | "jobProgress"
    | "jobComplete";

export interface RequestMap {
    /**
     * response only {@link typeMsgSubscribe}
     */
    log: {
        request: {
            type: "log",
            id: id,
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
    /**
     * Downloads the current log file from the server
     */
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
            type: "error",
            id: id,
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
    /**
     * Test function for general ping
     */
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
    /**
     * gets the current constants that the server is working with
     */
    getConstValues:{
        request: {
            type: "getConstValues",
            id: id,
            payload: any
        },
        response: {
            type: "getConstValues",
            id: id,
            payload: {
                /**
                 * start up arguments
                 */
                ARGV: {[key: string]: any};
                /**
                 * root process directory
                 */
                DIR_NAME: string;
                /**
                 * file path to .env file
                 */
                ENV_FILE_PATH: string;
                /**
                 * key and values to current .env file
                 * 
                 * Can be changed with {@link RequestMap.setEnvValues}
                 */
                CURRENT_ENV_VALUES: {
                    /**
                     * Time your server backs up the DB in minutes
                     */
                    BACKUP: number;
                    /**
                     * Version of the game the server is running
                     */
                    VER: "GL"|"JP";
                    /**
                     * IP Address of the server
                     */
                    IP_ADDRESS: string;
                    /**
                     * Port the server is runnning on (not admin panel)
                     */
                    PORT: string;
                    /**
                     * For using https instead of http (advanced stuff)
                     */
                    USE_HTTPS: boolean;
                    /**
                     * if the admin panel is active
                     */
                    ADMIN_PANEL: boolean;
                    /**
                     * Admin panel port
                     */
                    ADMIN_PORT: string;
                    /**
                     * Admin panel username
                     */
                    ADMIN_USERNAME: string;
                    /**
                     * Admin panel password
                     */
                    ADMIN_PASSWORD: string;
                    /**
                     * Level the log file writes at
                     */
                    LOG_LEVEL: "debug"| "warn" | "error" | "info";
                };
                /**
                 * array values for creating .env file and values when error
                 */
                DEFAULT_ENV_VALUES: {
                    desc: string;
                    key: string;
                    value: string;
                }[];
                /**
                 * Time your server backs up the DB in minutes
                 */
                BACKUP: number;
                /**
                 * file path to server.json
                 */
                SERVER_DB_PATH: string;
                /**
                 * file path to users.db
                 */
                USERS_DB_PATH: string;
                /**
                 * If the game data has an active rebalance
                 */
                REBALANCE: boolean;
                /**
                 * Server software version number
                 */
                SERVER_VERSION: string;
                /**
                 * For using https instead of http (advanced stuff)
                 */
                USE_HTTPS: boolean;
                /**
                 * Level the log file writes at
                 */
                LOG_LEVEL: "debug"| "warn" | "error" | "info";
                /**
                 * Version of the game the server is running
                 */
                VER: "GL" | "JP";
                /**
                 * IP Address of the server
                 */
                IP_ADDRESS: string;
                /**
                 * Port the server is runnning on (not admin panel)
                 */
                PORT: string;
                /**
                 * full url of the server
                 */
                SERVER_URL: string;
                /**
                 * Expected client master data version
                 */
                CLIENT_MVER: number;
                /**
                 * Client software version (will never change)
                 */
                CLIENT_VER: {
                    GL: number;
                    JP: number;
                };
                /**
                 * if the admin panel is active
                 */
                ADMIN_PANEL: boolean;
                /**
                 * Admin panel port
                 */
                ADMIN_PORT: string,
                /**
                 * Admin panel username
                 */
                ADMIN_USERNAME: string,
                /**
                 * Admin panel password
                 */
                ADMIN_PASSWORD: string,
                /**
                 * Machine architecture like `x64` or `arm64`
                 */
                MACHINE_ARCH: string,
                /**
                 * Machine operating system
                 */
                MACHINE_OS: string
            }
        }
    },
    /**
     * Displays in the log where you can manually download the asset or patch data with instructions 
     */
    displayURLs:{
        request:{
            type: "displayURLs",
            id: id,
            payload: any
        },
        response: {
            type: "displayURLs",
            id: id,
            payload: {
                success: boolean,
                data: {
                    string: boolean, 
                    link: boolean, 
                    text: string 
                }[]
            }
        }
    },
    /**
     * Gets the currently available patch list to check against the current installed patches 
     */
    getPatches:{
        request:{
            type: "getPatches",
            id: id,
            payload: any
        },
        response:{
            type: "getPatches",
            id: id,
            payload: {
                name: string;
                file: string;
                patch_version: string;
                game_version: "GL" | "JP";
                min_server_version: string;
                desc: string;
                requires: {
                    name: string;
                    patch_version: string;
                }[];
                conflicts: {
                    name: string;
                    patch_version: string;
                }[];
                mega: string;
                google: string;
                hash: string;
            }[]
        }
    },
    /**
     * current server running config, including the assets packages and patches installed
     */
    getServerDB:{
        request:{
            type: "getServerDB",
            id: id,
            payload: any
        },
        response:{
            type: "getServerDB",
            id: id,
            payload: {
                ins_id: number;
                uid: number;
                player_id: number;
                player_accounts: number,
                assets: {
                    GL: {
                        Android?: string | undefined;
                        iOS?: string | undefined;
                    };
                    JP: {
                        Android?: string | undefined;
                        iOS?: string | undefined;
                    };
                };
                patches: {
                    name: string;
                    patch_version: string;
                    game_version: "GL" | "JP";
                    requires: {
                        name: string;
                        patch_version: string;
                    }[];
                    conflicts: {
                        name: string;
                        patch_version: string;
                    }[];
                    hash: string;
                }[];
            }
        }
    },
    /**
     * Editable values for setting the .env file
     */
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
                 * Time your server backs up the DB in minutes
                 */
                BACKUP: number;
                /**
                 * Version of the game the server is running
                 */
                VER: "GL"|"JP";
                /**
                 * IP Address of the server
                 */
                IP_ADDRESS: string;
                /**
                 * Port the server is runnning on (not admin panel)
                 */
                PORT: string;
                /**
                 * For using https instead of http (advanced stuff)
                 */
                USE_HTTPS: boolean;
                /**
                 * if the admin panel is active
                 */
                ADMIN_PANEL: boolean;
                /**
                 * Admin panel port
                 */
                ADMIN_PORT: string;
                /**
                 * Admin panel username
                 */
                ADMIN_USERNAME: string;
                /**
                 * Admin panel password
                 */
                ADMIN_PASSWORD: string;
                /**
                 * Level the log file writes at
                 */
                LOG_LEVEL: "debug"| "warn" | "error" | "info";
            }
        }
    },
    /**
     * update {@link RequestMap.getEnvValues}
     */
    setEnvValues: {
        request: {
            type: "setEnvValues",
            id: id,
            payload: {
                /**
                 * Values from {@link RequestMap.getEnvValues}
                 */
                [key:string]: string
            }
        },
        response: {
            type: "setEnvValues",
            id: id,
            payload: {
                /**
                 * Return only. If server set the value
                 */
                success: boolean
            }
        }
    },
    /**
     * test function
     */
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
    /**
     * test function
     */
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
     * Gets the current server software version and checks if there is an update
     */
    checkServerVersion: {
        request: {
            type: "checkServerVersion",
            id: id,
            payload: any
        },
        response: {
            type: "checkServerVersion",
            id: id,
            payload: {
                update: boolean,
                version: string,
                urls: string[]
            }
        }
    },
    /**
     * response only {@link typeMsgSubscribe}
     */
    jobProgress: {
        request: {
            type: "jobProgress",
            id: id,
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
                 * Title of task
                 */
                task: string,
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
     * response only {@link typeMsgSubscribe}
     */
    jobComplete: {
        request: {
            type: "jobComplete",
            id: id,
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
                 * Title of task
                 */
                task: string,
                /**
                 * Current step in process
                 */
                status: string,
                /**
                 * % of 100
                 */
                success: boolean
            }
        }
    },
    /**
     * restarts the server instance (not a full restart)
     */
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
    /**
     * kill the process
     */
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
    /**
     * Installs an asset package
     * 
     * Gets updates with jobId
     */
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
                os: "Android" | "iOS",
                /**
                 * delete zip after downloading
                 */
                deleteAfter : boolean
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
    /**
     * Uninstalls an asset package
     * 
     * Gets updates with jobId
     */
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
                os: "Android" | "iOS"
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
    /**
     * Installs a patch
     * 
     * Gets updates with jobId
     */
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
                 * delete zip after downloading
                 */
                deleteAfter : boolean
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
    /**
     * Uninstalls a patch
     * 
     * Gets updates with jobId
     */
    uninstallPatch: {
        request: {
            type: "uninstallPatch",
            id: id,
            payload: {
                /**
                 * Patch name
                 */
                patch: string
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
    /**
     * Deletes a player account link to the device from the db.
     * 
     * Doesn't delete player_id data
     */
    deletePlayerAccount:{
        request: {
            type: "deletePlayerAccount",
            id: id,
            payload: {
                id: number
            }
        },
        response: {
            type: "deletePlayerAccount",
            id: id,
            payload: {
                success: boolean
            }
        }
    },
    /**
     * Deletes a player_id from the db. Deletes player_id data as well
     * 
     * Replaces any user accounts with player_id with a new one
     */
    deletePlayerID:{
        request: {
            type: "deletePlayerID",
            id: id,
            payload: {
                id: number
            }
        },
        response: {
            type: "deletePlayerID",
            id: id,
            payload: {
                success: boolean
            }
        }
    },
    /**
     * Gets all accounts if a value isn't set 
     * 
     * Only set one uuid, player_id or ip_address
     */
    getPlayerAccounts: {
        request: {
            type: "getPlayerAccounts",
            id: id,
            payload: {
                uuid?: string;
                player_id?: string;
                ip_address?: string;
            }
        },
        response: {
            type: "getPlayerAccounts",
            id: id,
            payload: {
                /**
                 * Return only. If server switched accounts
                 */
                success: boolean,
                /**
                 * Return only. TDB account infos
                 */
                accounts: {
                    id: number;
                    uuid: string;
                    player_id: string;
                    ip_address: string;
                    rebalance: boolean;
                    version: "GL" | "JP";
                    create_at: string
                }[]
            }
        }
    },
    /**
     * Gets the user account (bridge replacement login software) password reset secret
     */
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
    /**
     * switches a player_id attached to a uuid
     */
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
    },
    /**
     * Deletes non-active log files
     */
    purgeLogs:{
        request: {
            type: "purgeLogs",
            id: id,
            payload: any
        },
        response: {
            type: "purgeLogs",
            id: id,
            payload: {
                success: boolean
            }
        }
    }
}

/**
 * Basic message types
 */
export type RequestType = keyof RequestMap;