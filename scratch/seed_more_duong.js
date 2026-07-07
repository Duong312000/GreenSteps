const { 
  sequelize, 
  User, 
  Provider, 
  Vender, 
  GreenService, 
  ServiceBooking, 
  Schedule,
  ScheduleSample, 
  ScheduleActivity 
} = require('../src/models/index');

async function run() {
  console.log("Syncing database schema...");
  await sequelize.sync({ alter: true });
  console.log("Database schema synced!");

  const t = await sequelize.transaction();
  try {
    // 1. Find user Duong
    const user = await User.findOne({ where: { username: 'Duong' } });
    if (!user) {
      console.error("User Duong not found!");
      return;
    }
    const userId = user.id;
    console.log("Found User Duong with ID:", userId);

    // 2. Find Vender and Provider records
    const vender = await Vender.findOne({ where: { user_id: userId } });
    if (!vender) {
      console.error("Vender record for Duong not found!");
      return;
    }

    const provider = await Provider.findOne({ where: { name_provider: 'Duong' } });
    if (!provider) {
      console.error("Provider record for Duong not found!");
      return;
    }

    // 3. Create more Green Services for Duong's Vender
    // (We keep the existing srv_duong_1 and srv_duong_2, and add new ones)
    const newServices = [
      {
        id: 'srv_duong_3',
        name_service: 'Cắm Trại Đồi Mây Đà Lạt',
        type: 'attraction',
        destination: 'Đà Lạt',
        cost: 250000,
        carbon: -8.0,
        image_url: 'image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg',
        status: 'active',
        views_count: 2400
      },
      {
        id: 'srv_duong_4',
        name_service: 'Thuê Xe Đạp Điện Đà Lạt Xanh',
        type: 'transport',
        destination: 'Đà Lạt',
        cost: 120000,
        carbon: -1.5,
        image_url: 'image/cb4fbf769d60d911e13c255f7fb39dcc.jpg',
        status: 'active',
        views_count: 1500
      },
      {
        id: 'srv_duong_5',
        name_service: 'Trà Chiều Hữu Cơ Cầu Đất',
        type: 'food',
        destination: 'Đà Lạt',
        cost: 95000,
        carbon: -2.0,
        image_url: 'image/e8b896896439701c1ff79d65290703b0.jpg',
        status: 'inactive',
        views_count: 1200
      }
    ];

    // Update srv_duong_1 and srv_duong_2
    await GreenService.update({ status: 'active', views_count: 3200 }, { where: { id: 'srv_duong_1' }, transaction: t });
    await GreenService.update({ status: 'sold_out', views_count: 1800 }, { where: { id: 'srv_duong_2' }, transaction: t });

    for (const svc of newServices) {
      const existing = await GreenService.findByPk(svc.id, { transaction: t });
      if (existing) {
        await existing.update({
          name_service: svc.name_service,
          type: svc.type,
          destination: svc.destination,
          cost: svc.cost,
          carbon: svc.carbon,
          image_url: svc.image_url,
          status: svc.status,
          views_count: svc.views_count
        }, { transaction: t });
      } else {
        await GreenService.create({
          id: svc.id,
          vender_id: vender.id,
          name_service: svc.name_service,
          type: svc.type,
          destination: svc.destination,
          cost: svc.cost,
          carbon: svc.carbon,
          image_url: svc.image_url,
          status: svc.status,
          views_count: svc.views_count
        }, { transaction: t });
      }
    }
    console.log("Added 3 additional green services with statuses and views.");

    // 4. Create more Service Bookings
    const newBookings = [
      {
        id: 'BKG_D_4',
        user_id: 'UG99217188', // Lê Linh
        fullname: 'Lê Linh',
        service_id: 'srv_duong_3',
        name_service: 'Cắm Trại Đồi Mây Đà Lạt',
        booking_date: '2026-07-22',
        guests: 2,
        value: 500000,
        status: 'pending',
        evoucher_code: 'EV-DUONG-4444',
        escrow_status: 'holding'
      },
      {
        id: 'BKG_D_5',
        user_id: 'UG26583138', // Nguyễn Minh Anh
        fullname: 'Nguyễn Minh Anh',
        service_id: 'srv_duong_4',
        name_service: 'Thuê Xe Đạp Điện Đà Lạt Xanh',
        booking_date: '2026-07-25',
        guests: 2,
        value: 240000,
        status: 'completed',
        evoucher_code: 'EV-DUONG-5555',
        escrow_status: 'released'
      },
      {
        id: 'BKG_D_6',
        user_id: 'UG99217188', // Lê Linh
        fullname: 'Lê Linh',
        service_id: 'srv_duong_5',
        name_service: 'Trà Chiều Hữu Cơ Cầu Đất',
        booking_date: '2026-07-26',
        guests: 3,
        value: 285000,
        status: 'rejected',
        evoucher_code: 'EV-DUONG-6666',
        escrow_status: 'refunded'
      },
      {
        id: 'BKG_D_7',
        user_id: 'UG26583138', // Nguyễn Minh Anh
        fullname: 'Nguyễn Minh Anh',
        service_id: 'srv_duong_1', // Homestay Rừng Thông
        name_service: 'Homestay Rừng Thông Đèo Cậu',
        booking_date: '2026-07-20',
        guests: 2,
        value: 1600000,
        status: 'deposit',
        evoucher_code: 'EV-DUONG-7777',
        escrow_status: 'holding'
      }
    ];

    for (const bkg of newBookings) {
      await ServiceBooking.destroy({ where: { id: bkg.id }, transaction: t });
      await ServiceBooking.create({
        id: bkg.id,
        user_id: bkg.user_id,
        fullname: bkg.fullname,
        service_id: bkg.service_id,
        name_service: bkg.name_service,
        booking_date: bkg.booking_date,
        guests: bkg.guests,
        value: bkg.value,
        status: bkg.status,
        evoucher_code: bkg.evoucher_code,
        escrow_status: bkg.escrow_status
      }, { transaction: t });
    }
    console.log("Added 4 additional bookings.");

    // 5. Create more Preset Tours for Provider 'Duong'
    // --- TOUR 2: Phú Yên Biển Xanh 3N2Đ ---
    const tourId2 = 'tour_duong_2';
    await ScheduleActivity.destroy({ where: { schedule_id: tourId2 }, transaction: t });
    await ScheduleSample.destroy({ where: { id: tourId2 }, transaction: t });
    await Schedule.destroy({ where: { id: tourId2 }, transaction: t });

    await Schedule.create({
      id: tourId2,
      tour_name: 'Tour Phú Yên Biển Xanh Cát Trắng 3N2Đ',
      destination: 'Phú Yên',
      days: 3,
      discount: 10,
      carbon: -12.4,
      image_url: 'image/phuyen_cover.png',
      tour_description: 'Hành trình chinh phục cực Đông Tổ Quốc, ngắm bình minh Mũi Điện, check-in di tích quốc gia Gành Đá Đĩa và thưởng thức hải sản Ô Loan.'
    }, { transaction: t });

    await ScheduleSample.create({
      id: tourId2,
      provider_id: provider.id,
      cost: 2850000,
      old_cost: 3200000,
      rating: 4.8,
      votes_count: 24
    }, { transaction: t });

    // Day 1 Activities - Phú Yên
    const t2Day1 = [
      { time: '08:00', name: 'Đón khách tại sân bay Tuy Hòa', cost: 0, carbon: 0.5, icon: 'bi-bus-front-fill', type: 'transport', id: 't2_d1_1', lat: 13.0483, lng: 109.3400 },
      { time: '09:30', name: 'Check-in Homestay Biển Xanh', cost: 350000, carbon: 1.0, icon: 'bi-house-heart-fill', type: 'lodging', id: 't2_d1_2', lat: 13.0880, lng: 109.3020 },
      { time: '14:00', name: 'Trekking Gành Đá Đĩa kỳ vĩ', cost: 150000, carbon: 0, icon: 'bi-geo-alt-fill', type: 'attraction', id: 't2_d1_3', lat: 13.3644, lng: 109.3039 }
    ];
    // Day 2 Activities - Phú Yên
    const t2Day2 = [
      { time: '04:30', name: 'Chinh phục Hải Đăng Mũi Điện ngắm bình minh', cost: 120000, carbon: 0.2, icon: 'bi-sun-fill', type: 'attraction', id: 't2_d2_1', lat: 12.8878, lng: 109.4536 },
      { time: '12:00', name: 'Thưởng thức hải sản hữu cơ Đầm Ô Loan', cost: 400000, carbon: 2.5, icon: 'bi-egg-fried', type: 'food', id: 't2_d2_2', lat: 13.2642, lng: 109.2811 }
    ];
    // Day 3 Activities - Phú Yên
    const t2Day3 = [
      { time: '08:30', name: 'Trải nghiệm chèo kayak sinh thái Bãi Xép', cost: 200000, carbon: 0, icon: 'bi-water', type: 'experience', id: 't2_d3_1', lat: 13.1970, lng: 109.2995 },
      { time: '15:00', name: 'Mua sắm đặc sản Tuy Hòa & Tiễn khách', cost: 0, carbon: 0.4, icon: 'bi-bag-check-fill', type: 'experience', id: 't2_d3_2', lat: 13.0880, lng: 109.3020 }
    ];

    const t2Acts = [
      { day: 1, list: t2Day1 },
      { day: 2, list: t2Day2 },
      { day: 3, list: t2Day3 }
    ];

    for (const d of t2Acts) {
      for (const act of d.list) {
        await ScheduleActivity.create({
          id: act.id,
          schedule_id: tourId2,
          day_number: d.day,
          time: act.time,
          activity_name: act.name,
          activity_cost: act.cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          coordinates: `${act.lat},${act.lng}`
        }, { transaction: t });
      }
    }
    console.log("Added Phú Yên preset tour.");

    // --- TOUR 3: Đà Nẵng - Hội An 4N3Đ ---
    const tourId3 = 'tour_duong_3';
    await ScheduleActivity.destroy({ where: { schedule_id: tourId3 }, transaction: t });
    await ScheduleSample.destroy({ where: { id: tourId3 }, transaction: t });
    await Schedule.destroy({ where: { id: tourId3 }, transaction: t });

    await Schedule.create({
      id: tourId3,
      tour_name: 'Hành Trình Di Sản Đà Nẵng - Hội An 4N3Đ',
      destination: 'Đà Nẵng - Hội An',
      days: 4,
      discount: 15,
      carbon: -18.6,
      image_url: 'image/danang_cover.png',
      tour_description: 'Kết hợp hoàn hảo giữa du lịch nghỉ dưỡng bờ biển Mỹ Khê và tìm hiểu nét văn hóa cổ kính thương cảng Hội An.'
    }, { transaction: t });

    await ScheduleSample.create({
      id: tourId3,
      provider_id: provider.id,
      cost: 3500000,
      old_cost: 4200000,
      rating: 4.9,
      votes_count: 31
    }, { transaction: t });

    // Day 1 Activities - Đà Nẵng
    const t3Day1 = [
      { time: '09:00', name: 'Đón khách tại sân bay Đà Nẵng', cost: 0, carbon: 0.6, icon: 'bi-airplane', type: 'transport', id: 't3_d1_1', lat: 16.0440, lng: 108.2022 },
      { time: '14:30', name: 'Bách bộ khám phá bán đảo Sơn Trà & Chùa Linh Ứng', cost: 100000, carbon: 0, icon: 'bi-tree', type: 'attraction', id: 't3_d1_2', lat: 16.0988, lng: 108.2743 }
    ];
    // Day 2 Activities - Hội An
    const t3Day2 = [
      { time: '09:00', name: 'Tham quan làng rau Trà Quế hữu cơ', cost: 150000, carbon: -1.2, icon: 'bi-flower1', type: 'experience', id: 't3_d2_1', lat: 15.9015, lng: 108.3440 },
      { time: '18:00', name: 'Đi thuyền thả hoa đăng trên sông Hoài', cost: 200000, carbon: 0.1, icon: 'bi-stars', type: 'experience', id: 't3_d2_2', lat: 15.8801, lng: 108.3380 }
    ];
    // Day 3 Activities - Bà Nà
    const t3Day3 = [
      { time: '08:00', name: 'Cáp treo lên đỉnh Bà Nà Hills & Cầu Vàng', cost: 950000, carbon: 2.0, icon: 'bi-pentagon-fill', type: 'attraction', id: 't3_d3_1', lat: 15.9989, lng: 107.9968 },
      { time: '12:00', name: 'Ăn buffet sinh thái trên đỉnh Bà Nà', cost: 350000, carbon: 1.8, icon: 'bi-egg-fried', type: 'food', id: 't3_d3_2', lat: 15.9989, lng: 107.9968 }
    ];
    // Day 4 Activities - Mỹ Khê / Tiễn khách
    const t3Day4 = [
      { time: '08:30', name: 'Tự do tắm biển & dọn rác bãi biển Mỹ Khê', cost: 0, carbon: -0.5, icon: 'bi-heart-fill', type: 'experience', id: 't3_d4_1', lat: 16.0544, lng: 108.2022 },
      { time: '12:00', name: 'Checkout khách sạn & Tiễn khách', cost: 0, carbon: 0.5, icon: 'bi-box-arrow-right', type: 'transport', id: 't3_d4_2', lat: 16.0440, lng: 108.2022 }
    ];

    const t3Acts = [
      { day: 1, list: t3Day1 },
      { day: 2, list: t3Day2 },
      { day: 3, list: t3Day3 },
      { day: 4, list: t3Day4 }
    ];

    for (const d of t3Acts) {
      for (const act of d.list) {
        await ScheduleActivity.create({
          id: act.id,
          schedule_id: tourId3,
          day_number: d.day,
          time: act.time,
          activity_name: act.name,
          activity_cost: act.cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          coordinates: `${act.lat},${act.lng}`
        }, { transaction: t });
      }
    }
    console.log("Added Đà Nẵng - Hội An preset tour.");

    await t.commit();
    console.log("Seeding more data for Duong completed successfully!");
  } catch (e) {
    await t.rollback();
    console.error("Failed to seed more data:", e);
  }
}

run();
