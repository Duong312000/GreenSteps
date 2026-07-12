const { Schedule } = require('../src/models/index');
const { sequelize } = require('../src/config/db.config');

async function test() {
  try {
    await sequelize.authenticate();
    const schedules = await Schedule.findAll();
    console.log(JSON.stringify(schedules.map(s => ({ id: s.id, tour_name: s.tour_name, image_url: s.image_url })), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test().catch(console.error);
