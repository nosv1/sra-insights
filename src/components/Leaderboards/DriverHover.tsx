import { BasicDriver } from "../../types/BasicDriver"

interface DriverHoverProps {
    driver?: BasicDriver
}

export const DriverHover: React.FC<DriverHoverProps> = ({ driver }) => {
    return (
        <div className="driver-hover-dropdown">
            {driver && (
                <div className="dropdown-content">
                    <ul>
                        <li>
                            <a href={driver.sraInsightsURL} target="_blank" rel="noreferrer">SRA Insights</a>
                        </li>
                        <li>
                            <a href={driver.sraMemberStatsURL} target="_blank" rel="noreferrer">SRA Member Stats</a>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    )
}