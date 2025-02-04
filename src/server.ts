import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import neo4j from 'neo4j-driver';
import { BasicDriver } from './types/BasicDriver';
import { CarDriver } from './types/CarDriver';
import { Lap } from './types/Lap';
import { Season } from './types/Season';

const app = express();
const port = process.env.PORT || 5000; // You can change this

app.use(cors());  // This allows all origins, which is fine for development
// app.use(cors({ origin: `${process.env.REACT_APP_API_BASE_URL}` }));  // This is more secure for production

dotenv.config();

const driver = neo4j.driver(
    `bolt://${process.env.NEO_DB_HOST}:7687`,
    neo4j.auth.basic("", ""),
    { disableLosslessIntegers: true }
);

async function runQuery(query: string, message: string, params: any = {}) {
    const session = driver.session();
    let result;
    try {
        console.log(`${message}...`);
        const start = Date.now();
        result = await session.run(query, params);
        const end = Date.now();
        console.log(`\t\tcompleted in ${end - start}ms with ${result.records.length} records`);
    } finally {
        await session.close();
    }
    return result;
}

//////////      Car Driver      //////////
app.get('/api/car-drivers/complete', async (req, res) => {
    const result = await runQuery(
        `MATCH (d:Driver)-[:DRIVER_TO_CAR_DRIVER]->(cd:CarDriver)-[:CAR_DRIVER_TO_CAR]->(c:Car)
        RETURN d, cd, c`,
        "Fetching complete car driver details"
    )

    const carDrivers = result.records.map(record => CarDriver.fromRecord(record));
    res.json(carDrivers);
});

app.get('/api/car-drivers', async (req, res) => {
    const stringToArray = (str: string, toType: any) => {
        if (!str) {
            return [];
        }
        return str.split(',').map(toType);
    }

    const trackNames = stringToArray(req.query.trackNames as string, String);
    const divisions = stringToArray(req.query.divisions as string, Number);
    const seasons = stringToArray(req.query.seasons as string, Number);
    const sessionTypes = stringToArray(req.query.sessionTypes as string, String);
    const pastNumSessions = Number(req.query.pastNumSessions) || null; // this is the number of recent sessions to return per driver
    const result = await runQuery(`        
        MATCH (ts:TeamSeriesSession)-[:TEAM_SERIES_SESSION_TO_SESSION]->(s)
        MATCH (d:Driver)-[:DRIVER_TO_SESSION]->(s)
        WHERE TRUE
            AND (size($sessionTypes) = 0 OR s.session_type IN $sessionTypes)
            AND (size($trackNames) = 0 OR s.track_name IN $trackNames)
            AND (size($seasons) = 0 OR ts.season IN $seasons)
            AND (size($divisions) = 0 OR ts.division IN $divisions)
        WITH d, s, ts
        ORDER BY s.session_file DESC
        with d, COLLECT({s: s, ts: ts})[0..$pastNumSessions] as ts_sessions

        UNWIND ts_sessions as ts_session
        with d, ts_session.s as s, ts_session.ts as ts
        MATCH (cd:CarDriver)-[:CAR_DRIVER_TO_SESSION]->(s)
        MATCH (d)-[:DRIVER_TO_CAR_DRIVER]->(cd)
        MATCH (cd)-[:CAR_DRIVER_TO_CAR]->(c)
        RETURN d, cd, c, s, ts
        ORDER BY d.division, d.last_name, d.first_name`,
        "Fetching filtered car drivers",
        { trackNames, divisions, seasons, sessionTypes, pastNumSessions }
    )

    const carDrivers = result.records.map(record => CarDriver.fromRecord(record));
    res.json(carDrivers);
});

//////////      Driver      //////////
app.get('/api/driver/basic', async (req, res) => {
    const driverId = req.query.driverId;
    if (!driverId) {
        res.status(400).send("Missing driverId parameter");
        return;
    }
    const result = await runQuery(
        `MATCH(d: Driver { driver_id: $driverId })
        RETURN d`,
        `Fetching driver with ID ${driverId} `,
        { driverId }
    )

    if (result.records.length === 0) {
        res.status(404).send("Driver not found");
    } else {
        const driver = BasicDriver.fromRecord(result.records[0]);
        res.json(driver?.toJSON());
    }
});

app.get('/api/drivers/basic', async (req, res) => {
    const result = await runQuery(`
    MATCH(d: Driver)
        RETURN d
        ORDER BY d.first_name ASC, d.last_name ASC`,
        `Fetching all drivers`
    )

    const drivers: BasicDriver[] = result.records
        .map((record) => BasicDriver.fromRecord(record))
        .filter((driver) => driver !== undefined);
    res.json(drivers.map(driver => driver.toJSON()));
});

//////////      Lap      //////////
app.get('/api/laps', async (req, res) => {
    const afterDate = req.query.afterDate || '1970-01-01';
    const beforeDate = req.query.beforeDate || '9999-12-31';
    const trackName = req.query.trackName || '';

    const result = await runQuery(`
        MATCH (l:Lap)-[:LAP_TO_SESSION]->(s:Session)
        MATCH (l)-[:LAP_TO_CAR]->(c:Car)
        MATCH (cd:CarDriver)-[:CAR_DRIVER_TO_CAR]->(c)
        MATCH (d:Driver)-[:DRIVER_TO_CAR_DRIVER]->(cd)
        WHERE TRUE
            AND s.finish_time >= datetime($afterDate)
            AND s.finish_time < datetime($beforeDate)
            AND s.track_name CONTAINS $trackName
        RETURN l, s, c, cd, d
        ORDER BY s.finish_time ASC, l.lap_number ASC`,
        `Fetching laps after \`${afterDate}\`, before \`${beforeDate}\`, at track \`${trackName}\``,
        { afterDate, beforeDate, trackName }
    );

    const laps = result.records.map(record => Lap.fromRecord(record));
    res.json(laps);
});


//////////      Session      //////////



//////////      Season      //////////
app.get('/api/seasons/points-reference', async (req, res) => {
    const season = req.query.season || '';
    const result = await runQuery(`
        MATCH (tss:TeamSeriesSeason)<-[:POINTS_REFERENCE]-(tspr:TeamSeriesPointsReference)
        WHERE tss.season = toInteger($season)
        RETURN tss, tspr`,
        `Fetching points reference for season ${season}`,
        { season }
    );

    const seasons = Season.fromRecords(result.records);
    res.json(seasons);
});


app.listen(port, () => {
    console.log(`Backend server running at ${process.env.REACT_APP_API_BASE_URL}`);
});
