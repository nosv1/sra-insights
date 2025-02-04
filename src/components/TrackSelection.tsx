interface TrackSelectionProps {
    trackName: string;
    onTrackSelect: (trackName: string) => void;
}

export const TrackSelection: React.FC<TrackSelectionProps> = ({ trackName, onTrackSelect }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onTrackSelect(e.target.value);
    };

    return (
        <div className="track-selection">
            <label htmlFor="track_name">Select Track:
                <select id="track_name" name="track_name" required value={trackName} onChange={handleChange}>
                    <option value="barcelona">Barcelona</option>
                    <option value="brands_hatch">Brands Hatch</option>
                    <option value="cota">COTA</option>
                    <option value="donington">Donington</option>
                    <option value="hungaroring">Hungaroring</option>
                    <option value="imola">Imola</option>
                    <option value="indianapolis">Indianapolis</option>
                    <option value="kyalami">Kyalami</option>
                    <option value="laguna_seca">Laguna Seca</option>
                    <option value="misano">Misano</option>
                    <option value="monza">Monza</option>
                    <option value="mount_panorama">Mount Panorama</option>
                    <option value="nurburgring">Nurburgring</option>
                    <option value="nurburgring_24h">Nurburgring 24h</option>
                    <option value="oulton_park">Oulton Park</option>
                    <option value="paul_ricard">Paul Ricard</option>
                    <option value="red_bull_ring">Red Bull Ring</option>
                    <option value="silverstone">Silverstone</option>
                    <option value="snetterton">Snetterton</option>
                    <option value="spa">Spa</option>
                    <option value="suzuka">Suzuka</option>
                    <option value="valencia">Valencia</option>
                    <option value="watkins_glen">Watkins Glen</option>
                    <option value="zandvoort">Zandvoort</option>
                    <option value="zolder">Zolder</option>
                </select>
            </label>
        </div>
    );
};