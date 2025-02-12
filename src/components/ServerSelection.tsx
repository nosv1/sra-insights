export interface ServerSelectionProps {
    selectedServers: string[];
    setSelectedServers: React.Dispatch<React.SetStateAction<string[]>>;
    uniqueServers: string[];
}

export const ServerSelection: React.FC<ServerSelectionProps> = ({
    selectedServers,
    setSelectedServers,
    uniqueServers
}: ServerSelectionProps) => {
    const handleServerChange = (server: string) => {
        setSelectedServers(prev =>
            prev.includes(server) ? prev.filter(s => s !== server) : [...prev, server]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedServers.length >= uniqueServers.length) {
            setSelectedServers([]);
        } else {
            setSelectedServers(uniqueServers);
        }
    };

    return (
        <div className="div-selection">
            {uniqueServers.map(server => (
                <label key={server}>
                    <input
                        type="checkbox"
                        checked={selectedServers.includes(server)}
                        onChange={() => handleServerChange(server)}
                    />
                    {`${server}`}
                </label>
            ))}
            <label>
                <input
                    type="checkbox"
                    checked={selectedServers.length >= uniqueServers.length}
                    onChange={handleToggleSelectAll}
                />
                Select All
            </label>
        </div>
    )
}