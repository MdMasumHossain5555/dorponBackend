const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");

connectDB();


app.listen(env.port, () => {
  console.log(`Example app listening on port ${env.port}`);
});
