const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/data/database.sqlite');
db.serialize(() => {
  db.all("SELECT * FROM cases WHERE function_category LIKE '%手机APP%'", (err, rows) => {
    if (err) console.error(err);
    console.log('Total APP cases:', rows.length);
    console.log('Sample IOS:', rows.filter(r => r.function_category === '手机APP-IOS').slice(0, 2));
    console.log('Sample Android:', rows.filter(r => r.function_category === '手机APP-android').slice(0, 2));
  });
  db.all("SELECT * FROM case_orders WHERE tester_name = '施雯'", (err, rows) => {
    if (err) console.error(err);
    console.log('Order counts:', rows.length);
    if(rows.length > 0) {
      console.log('Case order array length:', JSON.parse(rows[0].case_ids).length);
    }
  });
});
