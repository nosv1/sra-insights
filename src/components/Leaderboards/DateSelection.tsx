export interface DateSelectionProps {
    beforeDate: string;
    afterDate: string;
    onBeforeDateChange: (date: string) => void;
    onAfterDateChange: (date: string) => void;
}

export const DateSelection: React.FC<DateSelectionProps> = ({
    beforeDate,
    afterDate,
    onBeforeDateChange: setBeforeDate,
    onAfterDateChange: setAfterDate
}: DateSelectionProps) => {
    return (
        <div className="date-selection">
            <label>
                After Date:
                <input
                    type="date"
                    value={afterDate}
                    onChange={(e) => setAfterDate(e.target.value)}
                />
            </label>
            <label>
                Before Date:
                <input
                    type="date"
                    value={beforeDate}
                    onChange={(e) => setBeforeDate(e.target.value)}
                />
            </label>
        </div>
    )
}