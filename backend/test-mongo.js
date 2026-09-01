const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.DATABASE_URL;
  console.log("Connecting to", uri);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (e) {
    console.error("Connection failed", e);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
