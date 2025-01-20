import express from 'express';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import cors from 'cors';


const app = express();
const port = 5000; // You can change this

app.use(cors());  // This allows all origins, which is fine for development

dotenv.config();

const driver = neo4j.driver(
    `bolt://${process.env.NEO_DB_HOST}:7687`,
    neo4j.auth.basic("", "")
);

app.get('/api/data', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run('MATCH (n) RETURN n LIMIT 10');
        res.json(result.records.map((record) => record.get('n').properties));
    } finally {
        await session.close();
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
