const { Schedule, ScheduleSample, ScheduleCustom, ScheduleActivity, BadgeSchedule, UserSchedule, TourBooking } = require('../src/models/index');
const { sequelize } = require('../src/config/db.config');
const { Op } = require('sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database to delete non-target tours...');

    const allowedDestinations = ['Đà Lạt', 'Phú Yên', 'Đà Nẵng', 'Đà Nẵng - Hội An', 'Hội An'];
    
    // Find all schedules to be deleted
    const schedulesToDelete = await Schedule.findAll({
      where: {
        destination: {
          [Op.notIn]: allowedDestinations
        }
      }
    });

    console.log(`Found ${schedulesToDelete.length} schedules to delete.`);

    for (const schedule of schedulesToDelete) {
      console.log(`Deleting schedule: ${schedule.id} (${schedule.tour_name}) - Destination: ${schedule.destination}`);

      // Delete associated ScheduleActivity records
      await ScheduleActivity.destroy({ where: { schedule_id: schedule.id } });

      // Delete associated Junction entries
      await BadgeSchedule.destroy({ where: { schedule_id: schedule.id } });
      await UserSchedule.destroy({ where: { schedule_id: schedule.id } });

      // Delete associated bookings if any exist
      await TourBooking.destroy({ where: { schedule_id: schedule.id } });

      // Delete associated sample/custom models
      await ScheduleSample.destroy({ where: { id: schedule.id } });
      await ScheduleCustom.destroy({ where: { id: schedule.id } });

      // Delete the main Schedule entry
      await schedule.destroy();
    }

    console.log('Finished deleting all non-target tours!');
  } catch (err) {
    console.error('Error during deletion:', err);
  }
  process.exit(0);
}

run().catch(console.error);
