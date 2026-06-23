const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
async function test() {
  const db = await open({ filename: path.resolve(__dirname, 'database.sqlite'), driver: sqlite3.Database });
  const schema = await db.all("SELECT name, sql FROM sqlite_master WHERE type='table'");
  console.log(schema);
}
test().catch(console.error);
