import { BasicDriver } from "../../types/BasicDriver"

interface DriverHoverProps {
    driver?: BasicDriver
}

export const DriverHover: React.FC<DriverHoverProps> = ({ driver }) => {
    return (
        <div className="driver-hover-dropdown">
            {driver && (
                <div className="dropdown-content">
                    <a href={driver.sraInsightsURL} target="_blank" rel="noreferrer">SRA Insights</a>
                    <a href={driver.sraMemberStatsURL} target="_blank" rel="noreferrer">SRA Member Stats</a>
                    <a href={driver.cjaURL} target="_blank" rel="noreferrer">CJA</a>
                </div>
            )}
        </div>
    )
}