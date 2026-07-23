import { useState, useEffect } from "react";
import { request } from "./services/socket.js";
import "./css/Players.css";

const PAGE_SIZE = 12;

/**
 * Players page
 *
 * @param {{connected: boolean, setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0
 */
export default function Players({ connected, setNeedsRestart }){
    /**
     * @type {[import('./services/socket.js').RequestMap["getPlayerAccounts"]["response"]["payload"]["accounts"], (any)=> void]}
     */
    const [accounts     , setAccounts     ] = useState();
    /**
     * @type {["all" | "player_id" | "ip_address" | "uuid", (any)=> void]}
     */
    const [searchType   , setSearchType   ] = useState("all");

    const [searchValue  , setSearchValue  ] = useState("");

    const [page         , setPage         ] = useState(1);
    /**
     * @type {[{type: "delete" | "switch", account: any} | undefined, (any)=> void]}
     */
    const [modal        , setModal        ] = useState();

    const [switchUUID   , setSwitchUUID   ] = useState("");

    const [actionMessage, setActionMessage] = useState();

    const [secretName   , setSecretName   ] = useState("");
    /**
     * @type {[{found: boolean, secret: string} | undefined, (any)=> void]}
     */
    const [secretResult , setSecretResult ] = useState();

    useEffect(()=>{
        (async () => {
            if (connected && accounts == undefined) {
                await loadAccounts();
            }
        })();
    },[connected]);

    /**
     * Loads accounts with the current search filter.
     *
     * Only one of uuid, player_id or ip_address can be set per request.
     */
    async function loadAccounts() {
        /**
         * @type {import('./services/socket.js').RequestMap["getPlayerAccounts"]["request"]["payload"]}
         */
        const payload = {};

        if (searchType != "all" && searchValue.trim() != "") {
            payload[searchType] = searchValue.trim();
        }

        try {
            const res = await request("getPlayerAccounts", payload);

            if (res.type == "getPlayerAccounts") {
                if (res.payload.success) {
                    setAccounts(res.payload.accounts);

                    setPage(1);
                } else {
                    console.error("Issue getting player accounts");
                }
            } else {
                console.error(res.payload.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    async function handleSearch(e) {
        e.preventDefault();

        await loadAccounts();
    };

    async function clearSearch() {
        setSearchType("all");

        setSearchValue("");

        try {
            const res = await request("getPlayerAccounts", {});

            if (res.type == "getPlayerAccounts" && res.payload.success) {
                setAccounts(res.payload.accounts);

                setPage(1);
            } else {
                console.error("Issue getting player accounts");
            }
        } catch (error) {
            console.error(error);
        }
    };

    function openModal(type, account) {
        setActionMessage();

        setSwitchUUID("");

        setModal({ type: type, account: account });
    };

    function closeModal() {
        setModal();

        setSwitchUUID("");
    };

    async function confirmDelete() {
        if (modal == undefined) {
            return;
        }

        try {
            if(modal.account.player_id == "999999999"){
                setActionMessage(`Can't delete dummy account.`);

                closeModal();
                
                return;
            }
            
            const res = await request("deletePlayerID", { id: modal.account.id });

            if (res.type == "deletePlayerID" && res.payload.success) {
                setActionMessage(`Account ${modal.account.player_id} deleted.`);

                await loadAccounts();
            } else if (res.type == "error") {
                setActionMessage(res.payload.message);

                console.error(res.payload.message);
            } else {
                setActionMessage(`Couldn't delete account ${modal.account.player_id}.`);
            }
        } catch (error) {
            console.error(error);
        }

        closeModal();
    };

    async function confirmSwitch() {
        if (modal == undefined || switchUUID.trim() == "") {
            return;
        }

        try {
            const res = await request("switchDevice", {
                uuid: switchUUID.trim(),
                player_id: modal.account.player_id
            });

            if (res.type == "switchDevice" && res.payload.success) {
                setActionMessage(`Account ${modal.account.player_id} linked to device ${switchUUID.trim()}.`);

                await loadAccounts();
            } else if (res.type == "error") {
                setActionMessage(res.payload.message);

                console.error(res.payload.message);
            } else {
                setActionMessage(`Couldn't switch device for ${modal.account.player_id}.`);
            }
        } catch (error) {
            console.error(error);
        }

        closeModal();
    };

    async function getSecret(e) {
        e.preventDefault();

        if (secretName.trim() == "") {
            return;
        }

        try {
            const res = await request("getSecret", { username: secretName.trim() });

            if (res.type == "getSecret") {
                setSecretResult({ found: res.payload.success, secret: res.payload.secret });
            } else {
                setSecretResult({ found: false, secret: "" });

                console.error(res.payload.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const totalPages = accounts == undefined ? 1 : Math.max(1, Math.ceil(accounts.length / PAGE_SIZE));

    const pageAccounts = accounts == undefined ? [] : accounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const accountsList = (
        <div className="players-list">
            {pageAccounts.length == 0 ?
                <div className="sub-header">No accounts found.</div>
                :
                pageAccounts.map(account => (
                    <div key={account.id} className="players-card">
                        <div className="players-card-top">
                            {account.version == "GL" ? "🌎" : <span title="Japanese" className="jpFlag miniFlag" />}
                            <span title="IP Address">{account.ip_address}</span>
                            {account.rebalance ? <span title="Rebalance active">⚖️</span> : ""}
                        </div>
                        <div className="players-card-id">
                            <div style={{paddingBottom:"6px"}} className="color-yellow">{account.player_id}</div>
                            <div style={{paddingBottom:"6px"}} title="Device UUID" className="players-uuid">{"📱 "+account.uuid}</div>
                            <div className="sub-header">{`Created ${account.create_at}`}</div>
                        </div>
                        <div className="players-card-actions">
                            <div title="Re-link this account to a new device UUID" className="general-btn players-btn" onClick={() => openModal("switch", account)}>
                                Switch Device
                            </div>
                            <div title="Delete this player account" className="btn-reset players-btn players-delete-btn" onClick={() => openModal("delete", account)}>
                                Delete
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    );

    const pagination = (
        <div className="players-pagination">
            <div className={`general-btn${page <= 1 ? "-inactive" : ""} players-btn`} onClick={() => page > 1 && setPage(page - 1)}>
                ◀ Prev
            </div>
            <span className="players-page-info">
                {`Page ${page} of ${totalPages}`}
                <span className="sub-header">{accounts == undefined ? "" : ` (${accounts.length} account${accounts.length == 1 ? "" : "s"})`}</span>
            </span>
            <div className={`general-btn${page >= totalPages ? "-inactive" : ""} players-btn`} onClick={() => page < totalPages && setPage(page + 1)}>
                Next ▶
            </div>
        </div>
    );

    return (
        <div className='main-holder'>
            <h3>
                Players
                <div className='sub-header'>
                    Player Account Management.
                </div>
            </h3>

            <div>Search Accounts:</div>
            <hr/>
            <form onSubmit={handleSearch} className="players-search">
                <select
                    name="searchType"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                >
                    <option value="all">All accounts</option>
                    <option value="player_id">Player ID</option>
                    <option value="ip_address">IP Address</option>
                    <option value="uuid">Device UUID</option>
                </select>
                &nbsp;
                <input
                    type="text"
                    name="searchValue"
                    value={searchValue}
                    disabled={searchType == "all"}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={searchType == "all" ? "Lists all accounts" : `Search by ${searchType}`}
                />
                &nbsp;
                <button className="general-btn players-btn" type="submit">Search</button>
                &nbsp;
                <div className="general-btn players-btn" onClick={clearSearch}>Reset</div>
            </form>
            {actionMessage == undefined ? "" :
                <div style={{fontSize: ".8rem"}} className="color-yellow">{actionMessage}</div>
            }
            {accounts == undefined ? "" :
                <>
                    {accountsList}
                    {pagination}
                </>
            }

            <div style={{marginTop: "10px"}}>Password Reset:</div>
            <hr/>
            <div style={{fontSize: "0.8rem"}}>
                <ul style={{paddingInlineStart:"1.5rem", marginBlockEnd: "0rem"}}>
                    <li>Looks up the password reset secret for a user account by username.</li>
                    <li>Usernames and passwords are one-way hashed, they can not be recovered, only reset.</li>
                </ul>
            </div>
            <form onSubmit={getSecret} className="players-search">
                <input
                    type="text"
                    name="secretName"
                    value={secretName}
                    onChange={(e) => setSecretName(e.target.value)}
                    placeholder="Account username"
                />
                &nbsp;
                <button className="general-btn players-btn" type="submit">Get Reset Secret</button>
            </form>
            {secretResult == undefined ? "" :
                secretResult.found ?
                    <div style={{fontSize: ".8rem"}}>
                        Reset secret: <span className="color-yellow">{secretResult.secret}</span>
                    </div>
                    :
                    <div style={{fontSize: ".8rem"}} className="color-red">
                        Account not found. Usernames are one-way hashed, check the exact spelling.
                    </div>
            }

            {modal == undefined ? "" :
                <div className="players-modal-overlay" onClick={closeModal}>
                    <div className="players-modal" onClick={(e) => e.stopPropagation()}>
                        {modal.type == "delete" ?
                            <>
                                <div className="color-red">Delete Account</div>
                                <hr/>
                                <div style={{fontSize: ".8rem"}}>
                                    Are you sure you want to delete <span className="color-yellow">{modal.account.player_id}</span>?
                                    <ul style={{paddingInlineStart:"1.5rem"}}>
                                        <li>All player data for this account will be deleted.</li>
                                        <li>Any user accounts using this player ID get a new one.</li>
                                        <li><span className="color-red">This can not be undone.</span></li>
                                    </ul>
                                </div>
                                <div className="players-modal-buttons">
                                    <div className="general-btn players-btn" onClick={closeModal}>Cancel</div>
                                    <div className="btn-reset players-btn players-delete-btn" onClick={confirmDelete}>Delete</div>
                                </div>
                            </>
                            :
                            <>
                                <div>Switch Device</div>
                                <hr/>
                                <div style={{fontSize: ".8rem"}}>
                                    Re-link <span className="color-yellow">{modal.account.player_id}</span> to a new device UUID.
                                    <br/><br/>
                                    Current device:<br/>
                                    <span className="sub-header">{modal.account.uuid}</span>
                                </div>
                                <br/>
                                <label htmlFor="switchUUID" style={{fontSize: ".8rem"}}>
                                    New device UUID:
                                </label>
                                <br/>
                                <input
                                    style={{width: "95%"}}
                                    type="text"
                                    name="switchUUID"
                                    id="switchUUID"
                                    value={switchUUID}
                                    onChange={(e) => setSwitchUUID(e.target.value)}
                                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                                />
                                <div className="players-modal-buttons">
                                    <div className="general-btn players-btn" onClick={closeModal}>Cancel</div>
                                    <div className={`general-btn${switchUUID.trim() == "" ? "-inactive" : ""} players-btn`} onClick={confirmSwitch}>Switch</div>
                                </div>
                            </>
                        }
                    </div>
                </div>
            }
        </div>
    )
}
