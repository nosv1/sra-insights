export const LAP_ATTRS = ['lapTime', 'split1', 'split2', 'split3'];
export const SPLIT_ATTRS = ['split1', 'split2', 'split3'];
export const LAP_ATTR_TO_TITLE: { [key: string]: string } = {
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
            return LAP_ATTRS.filter(attr => newSelected.includes(attr));
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedLapAttrs.length == LAP_ATTRS.length) {
            setSelectedLapAttrs([]);
        } else {
            setSelectedLapAttrs(LAP_ATTRS);
        }
    };

    const handleToggleSelectSplits = () => {
        const allSplitsSelected = SPLIT_ATTRS.every(split => selectedLapAttrs.includes(split));
        if (allSplitsSelected) {
            setSelectedLapAttrs(prev => prev.filter(attr => !SPLIT_ATTRS.includes(attr)));
        } else {
            setSelectedLapAttrs(prev => [...new Set([...prev, ...SPLIT_ATTRS])]);
        }
    };

    return (
        <div className="div-selection">
            {LAP_ATTRS.map(lapAttr => (
                <label key={lapAttr}>
                    <input
                        type="checkbox"
                        checked={selectedLapAttrs.includes(lapAttr)}
                        onChange={() => handleLapAttrChange(lapAttr)}
                    />
                    {LAP_ATTR_TO_TITLE[lapAttr]}
                </label>
            ))}
            <label>
                <input
                    type="checkbox"
                    checked={SPLIT_ATTRS.every(split => selectedLapAttrs.includes(split))}
                    onChange={handleToggleSelectSplits}
                />
                Select All Splits
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={selectedLapAttrs.length == LAP_ATTRS.length}
                    onChange={handleToggleSelectAll}
                />
                Select All
            </label>
        </div>
    )
}