const { User } = require('../src/models/index');
const { sequelize } = require('../src/config/db.config');

async function test() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll();
    console.log(JSON.stringify(users.map(u => ({ id: u.id, fullname: u.fullname, email: u.email, role: u.role, avatarUrl: u.avatarUrl })), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test().catch(console.error);
