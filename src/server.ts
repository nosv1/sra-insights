import express from 'express';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import cors from 'cors';
import { BasicDriver } from './types/BasicDriver';

const app = express();
const port = process.env.PORT || 5000; // You can change this

app.use(cors());  // This allows all origins, which is fine for development

dotenv.config();

const driver = neo4j.driver(
    `bolt://${process.env.NEO_DB_HOST}:7687`,
    neo4j.auth.basic("", "")
);

async function runQuery(query: string, message: string, params: any = {}) {
    const session = driver.session();
    let result;
    try {
        console.log(`${message}...`);
        const start = Date.now();
        result = await session.run(query, params);
        const end = Date.now();
        console.log(`\t\tcompleted in ${end - start}ms`);
    } finally {
        await session.close();
    }
    return result;
}

//////////      Driver      //////////
app.get('/api/driver/basic', async (req, res) => {
    const driverID = req.query.driverID;
    const result = await runQuery(
        `MATCH (d:Driver {driver_id: $driverID})
        RETURN d`,
        `Fetching driver with ID ${driverID}`,
        { driverID }
    )

    if (result.records.length === 0) {
        res.status(404).send("Driver not found");
    } else {
        const driver = BasicDriver.fromRecord(result.records[0]);
        res.json(driver.toJSON());
    }
});

app.get('/api/drivers/basic', async (req, res) => {
    const result = await runQuery(`
        MATCH (d:Driver)
        RETURN d
        ORDER BY d.first_name ASC, d.last_name ASC`,
        `Fetching all drivers`
    )

    const drivers: BasicDriver[] = result.records.map((record) => BasicDriver.fromRecord(record))
    res.json(drivers.map(driver => driver.toJSON()));
});


app.listen(port, () => {
    console.log(`Backend server running at http://${process.env.REACT_APP_API_BASE_URL}`);
});
