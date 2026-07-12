const { User } = require('../src/models/index');
const { sequelize } = require('../src/config/db.config');

async function run() {
  try {
    await sequelize.authenticate();
    
    // Update Kien (Lê Đức Vũ Kiên & KienNGoLinh)
    await User.update(
      { avatarUrl: 'image/khach-hang/avatar-linh-ngo.jpg' },
      { where: { fullname: ['Lê Đức Vũ Kiên', 'KienNGoLinh'] } }
    );
    console.log('Updated Kien avatar!');

    // Update Duong (Dương Văn Tiến)
    await User.update(
      { avatarUrl: 'image/khach-hang/avatar-pham-hoang-minh.jpg' },
      { where: { fullname: 'Dương Văn Tiến' } }
    );
    console.log('Updated Duong avatar!');

    // Update Cuong (Lê Cường)
    await User.update(
      { avatarUrl: 'image/khach-hang/avatar-vu-an-nhien.jpg' },
      { where: { fullname: 'Lê Cường' } }
    );
    console.log('Updated Cuong avatar!');

    console.log('Avatars seeded successfully!');
  } catch (err) {
    console.error('Failed to update avatars:', err);
  }
  process.exit(0);
}

run();
