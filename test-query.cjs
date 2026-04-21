const { db } = require('./server/db.cjs');

async function test() {
    console.log("Connecting...");
    const query = "SELECT * FROM bugs WHERE 1=1";
    console.time("query");
    const [rows] = await db.query(query);
    console.timeEnd("query");
    console.log("Rows:", rows.length);
    process.exit(0);
}
test().catch(console.error);
