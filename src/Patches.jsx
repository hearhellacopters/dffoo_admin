import react from "react";
import { request } from '../services/socket';
import "./css/Patches.css";

/**
 * Patches page
 * 
 * @param {{setNeedsRestart: (value: SetStateAction<boolean>) => void}} param0 
 */
export default function Patches({setNeedsRestart}){

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert("Please select a file first.");

        setUploading(true);

        // Convert file to Base64 to send over JSON WebSocket
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            const base64Data = reader.result.split(',')[1];

            try {
                // Use the 'installPatch' type
                const response = await request("installPatch", {
                    name: selectedFile.name,
                    data: base64Data
                });

                if (response.type === "error") {
                    alert(`Upload failed: ${response.payload.message}`);
                } else {
                    alert("Patch installed successfully!");
                    setSelectedFile(null); // Clear input
                }
            } catch (err) {
                console.error("Upload error:", err);
            } finally {
                setUploading(false);
            }
        };
    };

    const handleUninstall = async (patchName) => {
        if (window.confirm(`Are you sure you want to uninstall ${patchName}?`)) {
            const response = await request("uninstallPatch", { name: patchName });

            if (response.type === "error") {
                alert(`Uninstall failed: ${response.payload.message}`);
            } else {
                alert(`${patchName} uninstalled successfully.`);
            }
        }
    };

    const patchesTable = (
        <table className="patches-table">
            <thead>
                <tr>
                    <th>Patch Name</th>
                    <th>Date Installed</th>
                    <th>Unistall</th>
                </tr>
            </thead>
            <tbody>
                {patchesList.map((patch, index) => (
                    <tr key={patch.name || index}>
                        <td>{patch.name}</td>
                        <td>{patch.date}</td>
                        <td>
                            <button
                                className="btn-uninstall"
                                onClick={() => handleUninstall(patch.name)}
                            >
                                Uninstall
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className='main-holder'>
            <h3>
                Patches
            </h3>

            <h3>Upload New Patch</h3>
            <form onSubmit={handleUpload}>
                <div className="file-input-group">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".bin,.patch,.zip" // Adjust extensions as needed
                    />
                </div>
                <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                >
                    {uploading ? "Installing..." : "Install Patch"}
                </button>
            </form>

            <div className='sub-header'>
                <he3>Patches Management.</he3>

                {patchesTable}
            </div>

        </div>
    )
}