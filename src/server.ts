import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import neo4j from 'neo4j-driver';
import { LAP_ATTRS } from './components/Leaderboards/LeaderboardSelection';
import { fetchLapsByAttrs } from './services/LapService';
import {
    fetchCompleteWeekendByKey,
    fetchSessionsWithCars,
    fetchSessionsWithLapsByKey,
    fetchTeamSeriesRacesByAttrs,
    fetchWeekendByKey
} from './services/SessionService';
import { BasicDriver, DriverLapCount } from './types/BasicDriver';
import { CarDriver } from './types/CarDriver';
import { DriverHistory } from './types/DriverHistory';
import { Lap } from './types/Lap';
import { Season } from './types/Season';
import { Session } from './types/Session';
import { Weekend } from './types/Weekend';
import { SeriesRound, TEAM_SERIES_SCHEDULE } from './utils/Schedules';

const app = express();
const port = process.env.PORT || 5000; // You can change this

app.use(cors());  // This allows all origins, which is fine for development
// app.use(cors({ origin: `${process.env.REACT_APP_API_URL}` }));  // This is more secure for production

dotenv.config();

const neoDriver = neo4j.driver(
    `bolt://${process.env.REACT_APP_NEO_DB_HOST}:7687`,
    neo4j.auth.basic("", ""),
    { disableLosslessIntegers: true }
);

async function runQuery(query: string, message: string, params: any = {}) {
    const session = neoDriver.session();
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

const stringToArray = (str: string, toType: any) => {
    if (!str) {
        return [];
    }
    return str.split(',').map(toType);
}

//////////      Car Driver      //////////
app.get('/api/car-drivers/complete', async (req, res) => {
    const result = await runQuery(
        `MATCH (d:Driver)-[:DRIVER_TO_CAR_DRIVER]->(cd:CarDriver)-[:CAR_DRIVER_TO_CAR]->(c:Car)
        RETURN d, cd, c`,
        "Fetching complete car driver details"
    )

    const carDriversJSON = result.records.map(record =>
        CarDriver.fromRecord(record, {
            getBasicDriver: true,
            getSessionCar: true
        })?.toJSON()
    );
    res.json(carDriversJSON);
});

app.get('/api/car-drivers/team-series', async (req, res) => {
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

    const carDriversJSON = result.records.map(record =>
        CarDriver.fromRecord(record, {
            getBasicDriver: true,
            getSessionCar: true,
            getSession: true,
            getSessionTeamSeriesSession: true
        })?.toJSON()
    );
    res.json(carDriversJSON);
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

    const driversJSON = result.records
        .map((record) => BasicDriver.fromRecord(record)?.toJSON())
    res.json(driversJSON);
});

//////////      Lap      //////////
app.get('/api/laps', async (req, res) => {
    const afterDate = req.query.afterDate || '1970-01-01';
    const beforeDate = req.query.beforeDate || '9999-12-31';
    const trackName = req.query.trackName || '';
    const carGroups = stringToArray(req.query.carGroups as string, String);
    const sessionTypes = stringToArray(req.query.sessionTypes as string, String);
    const sessionKeys = stringToArray(req.query.sessionKeys as string, String);

    const result = await runQuery(`
        MATCH (s:Session)
        WITH s, datetime($afterDate) as afterDate, datetime($beforeDate) as beforeDate
        WHERE TRUE
            AND s.track_name = $trackName 
            AND (size($sessionTypes) = 0 OR s.session_type IN $sessionTypes)
            AND (size($sessionKeys) = 0 OR s.key_ IN $sessionKeys)
            AND datetime(s.finish_time) >= datetime({year: afterDate.year, month: afterDate.month, day: afterDate.day, timezone: 'America/New_York'})
            AND datetime(s.finish_time) < datetime({year: beforeDate.year, month: beforeDate.month, day: beforeDate.day, timezone: 'America/New_York'})
        WITH s

        MATCH (l:Lap)-[:LAP_TO_SESSION]->(s)
        WITH l, s

        MATCH (l)-[:LAP_TO_CAR]->(c:Car)
        WHERE TRUE
            AND (size($carGroups) = 0 OR c.car_group IN $carGroups)
        WITH l, s, c

        MATCH (cd:CarDriver)-[:CAR_DRIVER_TO_CAR]->(c)
        MATCH (d:Driver)-[:DRIVER_TO_CAR_DRIVER]->(cd)
        RETURN l, s, c, cd, d
        ORDER BY s.finish_time ASC, l.lap_number ASC
        LIMIT 10000`, // we handle this in the useLaps hook where we loop until we get less than 10000 laps
        `Fetching laps after \`${afterDate}\`, before \`${beforeDate}\`, at track \`${trackName}\`, with car groups \`${carGroups}\`, and session types \`${sessionTypes}\``,
        { afterDate, beforeDate, trackName, carGroups, sessionTypes, sessionKeys }
    );

    const lapsJSON = result.records.map(record =>
        Lap.fromRecord(record, {
            getSession: true,
            getSessionCar: true,
            getCarDriver: true,
            getBasicDriver: true
        })?.toJSON()
    );
    res.json(lapsJSON);
});


//////////      Session      //////////
app.get('/api/sessions/complete', async (req, res) => {
    const sessionKey = req.query.sessionKey || '';

    if (!sessionKey) {
        res.status(400).send("Missing sessionKey parameter");
        return;
    }

    const result = await runQuery(`
        MATCH (s:Session { key_: $sessionKey })<-[:CAR_TO_SESSION]-(c:Car)
        MATCH (cd:CarDriver)-[:CAR_DRIVER_TO_CAR]->(c)
        MATCH (d:Driver)-[:DRIVER_TO_CAR_DRIVER]->(cd)
        MATCH (l:Lap)-[:LAP_TO_CAR]->(c)
        WITH s, c, cd, d, l
        ORDER BY c.finish_position ASC, l.lap_number ASC
        RETURN s, c, cd, d, COLLECT(l) as laps`,
        `Fetching complete session with key ${sessionKey}`,
        { sessionKey }
    );

    const sessionJSON = Session.fromRecordsWithCarDrivers(result.records)?.toJSON();
    res.json(sessionJSON);
});

app.get('/api/sessions/recent', async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const result = await runQuery(`
        MATCH (s:Session)
        RETURN s
        ORDER BY s.finish_time DESC
        LIMIT $limit`,
        `Fetching ${limit} most recent sessions`,
        { limit: neo4j.int(limit) }
    );

    const sessions = result.records.map(record => Session.fromRecord(record)).filter(s => s != undefined);
    const completeSessions = await Promise.all(sessions.map(session => fetchCompleteSessionByKey(session.key_)));
    res.json(completeSessions);
});

app.get('/api/sessions/basic-weekend', async (req, res) => {
    const sessionKey = req.query.sessionKey || '';

    if (!sessionKey) {
        res.status(400).send("Missing sessionKey parameter");
        return;
    }

    const result = await runQuery(`
        MATCH (q:Session)-[:QUALI_TO_RACE]->(r:Session)
        WHERE q.key_ = $sessionKey OR r.key_ = $sessionKey
        RETURN q, r`,
        `Fetching weekend for session ${sessionKey}`,
        { sessionKey }
    );

    const weekend = Weekend.fromRecord(result.records[0]);
    res.json(weekend.toJSON());
});

app.get('/api/sessions/complete-weekend', async (req, res) => {
    const sessionKey = req.query.sessionKey || '';

    if (!sessionKey) {
        res.status(400).send("Missing sessionKey parameter");
        return;
    }

    let weekend = await fetchWeekendByKey(sessionKey as string);
    weekend.qualifying = await fetchCompleteSessionByKey(weekend.qualifying.key_);
    weekend.race = await fetchCompleteSessionByKey(weekend.race.key_);

    res.json(weekend);
});

app.get('/api/sessions/team-series-tracks', async (req, res) => {
    const season = req.query.season || '';
    const limit = Number(req.query.limit) || 12;

    const result = await runQuery(`
        MATCH (tsr:TeamSeriesRound)-[:TEAM_SERIES_ROUND_TO_TEAM_SERIES_SESSION]->(ts:TeamSeriesSession)
        MATCH (ts)-[:TEAM_SERIES_SESSION_TO_SESSION]->(s:Session)
        WHERE $season = '' OR tsr.season = toInteger($season)
        WITH tsr, s
        ORDER BY s.session_file DESC
        // RETURN tsr, s
        RETURN DISTINCT s.track_name as track_name, tsr.season as season
        LIMIT toInteger($limit)`,
        `Fetching team series tracks for season ${season}`,
        { season, limit }
    );

    const tracks = result.records.map(r => ({
        track: r.get('track_name'),
        season: r.get('season')
    })).filter(t => t.track != undefined);
    return res.json(tracks);
});

app.get('/api/sessions/team-series-races', async (req, res) => {
    const trackName = req.query.trackName || '';
    const season = req.query.season || '';

    const result = await runQuery(`
        MATCH (ts:TeamSeriesSession)-[:TEAM_SERIES_SESSION_TO_SESSION]->(s:Session)
        WHERE TRUE 
            AND s.track_name CONTAINS $trackName 
            AND ts.season = toInteger($season) 
            AND s.session_type = 'R'
        RETURN s, ts
        ORDER BY s.track_name ASC, ts.division ASC`,
        `Fetching team series weekends for track ${trackName} in season ${season}`,
        { trackName, season }
    );

    const sessions = result.records.map(r => Session.fromRecord(r, { getTeamSeriesSession: true })).filter(s => s != undefined);
    return res.json(sessions.map(s => s?.toJSON()));
});

app.get('/api/sessions/team-series-weekends', async (req, res) => {
    const sessions = await fetchTeamSeriesRacesByAttrs(req.query.trackName as string, Number(req.query.season));
    const completeWeekends = await Promise.all(sessions.map(async session => {
        const weekend = await fetchCompleteWeekendByKey(session.key_);
        weekend.race.teamSeriesSession = session.teamSeriesSession;
        weekend.qualifying.teamSeriesSession = session.teamSeriesSession;
        return weekend;
    }));
    res.json(completeWeekends);
});

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
    res.json(seasons.map(season => season.toJSON()));
});

//////////      Misc      //////////
app.get('/api/misc/lap-counts', async (req, res) => {
    const afterDate = req.query.afterDate || '1970-01-01';
    const beforeDate = req.query.beforeDate || '9999-12-31';

    const result = await runQuery(`
        MATCH (s:Session)
        WITH s, datetime($afterDate) as afterDate, datetime($beforeDate) as beforeDate
        WHERE TRUE 
            // AND s.session_type = "FP"
            AND s.server_number IN ["1", "2", "3", "4"]
            AND datetime(s.finish_time) >= datetime({year: afterDate.year, month: afterDate.month, day: afterDate.day, timezone: 'America/New_York'})
            AND datetime(s.finish_time) <= datetime({year: beforeDate.year, month: beforeDate.month, day: beforeDate.day, timezone: 'America/New_York'})
        WITH s

        MATCH (l:Lap)-[:LAP_TO_SESSION]->(s)
        WITH l, s

        MATCH (l)-[:LAP_TO_CAR]->(c:Car)
        WHERE c.car_group in ["GT3"]
        WITH l, s, c

        MATCH (cd:CarDriver)-[:CAR_DRIVER_TO_CAR]->(c)
        MATCH (d:Driver)-[:DRIVER_TO_CAR_DRIVER]->(cd)
        WITH d, count(l) as lap_count

        RETURN d, lap_count
        ORDER BY lap_count DESC`,
        `Fetching lap counts between ${afterDate} and ${beforeDate}`,
        { afterDate, beforeDate }
    );

    const driverLapCounts: { [driverId: string]: DriverLapCount } = {}

    result.records.forEach(record => {
        let driver = BasicDriver.fromRecord(record)
        let lapCount = record.get('lap_count') as number
        if (driver !== undefined)
            driverLapCounts[driver?.driverId] = { basicDriver: driver, lapCount: lapCount };
    });
    res.json(driverLapCounts);
});

app.get('/api/misc/division-times', async (req, res) => {
    const divisionTimesPerRound = await Promise.all(
        TEAM_SERIES_SCHEDULE.rounds.map(async (round: SeriesRound) => {
            const laps = await fetchLapsByAttrs({
                afterDate: new Date(round.date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                beforeDate: round.date.toISOString().split('T')[0],
                trackName: round.trackName,
                carGroups: []
            });
            const driverHistories = DriverHistory.fromLaps(laps, true);
            const divisionTimes = DriverHistory.divisionTimesFromDriverHistories(driverHistories, [1, 2, 3, 4, 5, 6])
            const medianDivisionTimes = divisionTimes.medianDivisionTimes;
            const averageDivisionTimes = divisionTimes.averageDivisionTimes;
            const bestTimes = divisionTimes.bestTimes;
            return { round, medianDivisionTimes, averageDivisionTimes, bestTimes };
        })
    );
    const csvHeaders = [
        'track_name',
        'division',
        ...LAP_ATTRS.map(attr => `median_${attr}`),
        'median_potentialBest',
        ...LAP_ATTRS.map(attr => `average_${attr}`),
        'average_potentialBest',
    ];
    const csvRows = divisionTimesPerRound.map(({ round, medianDivisionTimes, averageDivisionTimes }) => {
        return Object.entries(medianDivisionTimes).map(([division, medianTimes]) => {
            const averageTimes = averageDivisionTimes[division];
            return [
                round.trackName,
                division,
                ...LAP_ATTRS.map(attr => medianTimes[attr]),
                medianTimes.potentialBest,
                ...LAP_ATTRS.map(attr => averageTimes[attr]),
                averageTimes.potentialBest,
            ].join(',');
        });
    }).flat();

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('division_times.csv');
    res.send(csvContent);
});

const apiRoutes: { [key: string]: { params: { name: string, type: string }[], nodes: string[], returns: string, note?: string } } = {
    [`/api/car-drivers/complete`]: {
        params: [],
        nodes: ["Driver", "Car", "CarDriver"],
        returns: 'CarDriver[]'
    },
    [`/api/car-drivers/team-series`]: {
        params: [
            { name: 'trackNames', type: 'string[]' },
            { name: 'divisions', type: 'number[]' },
            { name: 'seasons', type: 'number[]' },
            { name: 'sessionTypes', type: 'string[]' },
            { name: 'pastNumSessions', type: 'number' }
        ],
        nodes: ["Driver", "Car", "CarDriver", "Session", "TeamSeriesSession"],
        returns: 'CarDriver[]'
    },
    [`/api/driver/basic`]: {
        params: [
            { name: 'driverId', type: 'string' }
        ],
        nodes: ["Driver"],
        returns: 'BasicDriver'
    },
    [`/api/drivers/basic`]: {
        params: [],
        nodes: ["Driver"],
        returns: 'BasicDriver[]'
    },
    [`/api/laps`]: {
        params: [
            { name: 'afterDate', type: 'string' },
            { name: 'beforeDate', type: 'string' },
            { name: 'trackName', type: 'string' },
            { name: 'carGroups', type: 'string[]' },
            { name: 'sessionTypes', type: 'string[]' },
            { name: 'sessionKeys', type: 'string[]' }
        ],
        nodes: ["Lap", "Session", "Car", "CarDriver", "Driver"],
        returns: 'Lap[]',
        note: 'Limit: 10000 laps per request'
    },
    [`/api/sessions/complete`]: {
        params: [
            { name: 'sessionKey', type: 'string' }
        ],
        nodes: ["Session", "Car", "CarDriver", "Driver", "Lap"],
        returns: 'Session'
    },
    [`/api/sessions/recent`]: {
        params: [
            { name: 'limit', type: 'number' }
        ],
        nodes: ["Session"],
        returns: 'Session[]'
    },
    [`/api/sessions/basic-weekend`]: {
        params: [
            { name: 'sessionKey', type: 'string' }
        ],
        nodes: ["Session"],
        returns: 'Weekend'
    },
    [`/api/sessions/complete-weekend`]: {
        params: [
            { name: 'sessionKey', type: 'string' }
        ],
        nodes: ["Session"],
        returns: 'Weekend'
    },
    [`/api/sessions/team-series-tracks`]: {
        params: [
            { name: 'season', type: 'number' },
            { name: 'limit', type: 'number' }
        ],
        nodes: ["Session", "TeamSeriesSession"],
        returns: 'string[]'
    },
    [`/api/sessions/team-series-races`]: {
        params: [
            { name: 'trackName', type: 'string' },
            { name: 'season', type: 'number' }
        ],
        nodes: ["Session", "TeamSeriesSession"],
        returns: 'Session[]'
    },
    [`/api/sessions/team-series-weekends`]: {
        params: [
            { name: 'trackName', type: 'string' },
            { name: 'season', type: 'number' }
        ],
        nodes: ["Session", "TeamSeriesSession"],
        returns: 'Weekend[]'
    },
    [`/api/seasons/points-reference`]: {
        params: [
            { name: 'season', type: 'number' }
        ],
        nodes: ["TeamSeriesSeason", "TeamSeriesPointsReference"],
        returns: 'Season[]'
    },
    [`/api/misc/division-times`]: {
        params: [],
        nodes: ["TeamSeriesRound", "Session", "Driver", "Car", "CarDriver", "Lap"],
        returns: 'string',
        note: 'CSV download'
    }
};

app.get('/', (req, res) => {
    res.json(apiRoutes);
});

app.get('/api', (req, res) => {
    res.json(apiRoutes);
});

app.listen(port, () => {
    console.log(`Backend server running at ${process.env.REACT_APP_API_URL}`);
});
