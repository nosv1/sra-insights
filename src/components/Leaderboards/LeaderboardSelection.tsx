export const lapAttrs = ['lapTime', 'split1', 'split2', 'split3'];
const lapAttrToTitle: { [key: string]: string } = {
    'lapTime': 'Lap Time',
    'split1': 'Split 1',
    'split2': 'Split 2',
    'split3': 'Split 3'
};

export interface LapAttrSelectionProps {
    selectedLapAttrs: (string)[];
    setSelectedLapAttrs: React.Dispatch<React.SetStateAction<(string)[]>>;
}

export const LapAttrSelection: React.FC<LapAttrSelectionProps> = ({
    selectedLapAttrs,
    setSelectedLapAttrs
}: LapAttrSelectionProps) => {
    const handleLapAttrChange = (lapAttr: string) => {
        setSelectedLapAttrs(prev => {
            const newSelected = prev.includes(lapAttr)
                ? prev.filter(la => la !== lapAttr)
                : [...prev, lapAttr];
            return lapAttrs.filter(attr => newSelected.includes(attr));
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedLapAttrs.length == lapAttrs.length) {
            setSelectedLapAttrs([]);
        } else {
            setSelectedLapAttrs(lapAttrs);
        }
    };

    return (
        <div className="div-selection">
            {lapAttrs.map(lapAttr => (
                <label key={lapAttr}>
                    <input
                        type="checkbox"
                        checked={selectedLapAttrs.includes(lapAttr)}
                        onChange={() => handleLapAttrChange(lapAttr)}
                    />
                    {lapAttrToTitle[lapAttr]}
                </label>
            ))}
            <label>
                <input
                    type="checkbox"
                    checked={selectedLapAttrs.length == lapAttrs.length}
                    onChange={handleToggleSelectAll}
                />
                Select All
            </label>
        </div>
    )
}