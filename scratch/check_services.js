const { GreenService } = require('../src/models/index');

async function check() {
  try {
    const services = await GreenService.findAll();
    console.log(`Found ${services.length} services:`);
    services.forEach(s => {
      console.log(`ID: ${s.id}, Name: ${s.name_service}, Type: ${s.type}, Dest: ${s.destination}, Image: ${s.image_url}, Vender: ${s.vender_id}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
