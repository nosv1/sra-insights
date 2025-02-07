export interface DivSelectionProps {
    selectedDivisions: (number)[];
    setSelectedDivisions: React.Dispatch<React.SetStateAction<(number)[]>>;
    uniqueDivisions: (number)[];
}

export const DivSelection: React.FC<DivSelectionProps> = ({
    selectedDivisions,
    setSelectedDivisions,
    uniqueDivisions
}: DivSelectionProps) => {
    const handleDivisionChange = (division: number) => {
        setSelectedDivisions(prev =>
            prev.includes(division) ? prev.filter(d => d !== division) : [...prev, division]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedDivisions.length >= uniqueDivisions.length - 1) {
            setSelectedDivisions([]);
        } else {
            setSelectedDivisions(uniqueDivisions.filter(d => d !== 0));
        }
    };

    return (
        <div className="div-selection">
            {uniqueDivisions.map(division => (
                <label key={division}>
                    <input
                        type="checkbox"
                        checked={selectedDivisions.includes(division)}
                        onChange={() => handleDivisionChange(division)}
                    />
                    {division ? `Division ${division}` : 'Unclassified'}
                </label>
            ))}
            <label>
                <input
                    type="checkbox"
                    checked={selectedDivisions.length >= uniqueDivisions.length - 1}
                    onChange={handleToggleSelectAll}
                />
                Select All
            </label>
        </div>
    )
}