const { 
  sequelize, 
  User, 
  Provider, 
  Vender, 
  GreenService, 
  ServiceBooking, 
  Schedule,
  ScheduleSample, 
  ScheduleCustom,
  UserSchedule,
  ScheduleActivity 
} = require('../src/models/index');

async function seed() {
  console.log("=== SEEDING MORE DATA FOR USER DUONG ===");
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // 1. Find user Duong
    const user = await User.findOne({ where: { username: 'Duong' } });
    if (!user) {
      console.error("User Duong not found!");
      process.exit(1);
    }
    const userId = user.id;
    console.log("Found User Duong ID:", userId);

    // 2. Find provider record for Duong
    const provider = await Provider.findOne({ where: { name_provider: 'Duong' } });
    if (!provider) {
      console.error("Provider record for Duong not found!");
      process.exit(1);
    }
    const providerId = provider.id;
    console.log("Found Provider ID:", providerId);

    // Clear previous custom itineraries and preset tours we will recreate
    const customItiIds = ['iti_duong_1', 'iti_duong_2', 'iti_duong_3', 'iti_duong_4'];
    const presetTourIds = ['tour_duong_1', 'tour_duong_2', 'tour_duong_3', 'tour_duong_4', 'tour_duong_5'];

    console.log("Cleaning up old custom itineraries...");
    await ScheduleActivity.destroy({ where: { schedule_id: customItiIds } });
    await UserSchedule.destroy({ where: { schedule_id: customItiIds } });
    await ScheduleCustom.destroy({ where: { id: customItiIds } });
    await Schedule.destroy({ where: { id: customItiIds } });

    console.log("Cleaning up old preset tours...");
    await ScheduleActivity.destroy({ where: { schedule_id: presetTourIds } });
    await ScheduleSample.destroy({ where: { id: presetTourIds } });
    await Schedule.destroy({ where: { id: presetTourIds } });

    // ==========================================
    // 3. SEEDING 5 PRESET TOURS (PROV-260002)
    // ==========================================
    console.log("Seeding preset tours for Duong...");

    const toursData = [
      {
        id: 'tour_duong_1',
        tour_name: 'Tour Sinh Thái Đà Lạt Lãng Mạn 3N2Đ',
        destination: 'Đà Lạt',
        days: 3,
        discount: 10,
        carbon: -15.5,
        image_url: 'image/cb4fbf769d60d911e13c255f7fb39dcc.jpg',
        tour_description: 'Trải nghiệm không gian lãng mạn, nghỉ dưỡng homestay rừng thông sinh thái và thưởng thức rau củ quả organic tại thung lũng Đà Lạt.',
        cost: 1950000,
        old_cost: 2200000,
        rating: 4.8,
        votes_count: 18,
        activities: [
          { day: 1, time: '08:00', name: 'Đón khách tại sân bay Liên Khương bằng xe điện', cost: 0, carbon: 0.2, icon: 'bi-bus-front-fill', type: 'transport', coordinates: '11.7505,108.3700' },
          { day: 1, time: '10:30', name: 'Nhận phòng Homestay Rừng Thông Eco', cost: 450000, carbon: -2.0, icon: 'bi-house-heart-fill', type: 'lodging', coordinates: '11.9404,108.4583' },
          { day: 1, time: '14:00', name: 'Tản bộ ngắm cảnh Hồ Xuân Hương trong lành', cost: 0, carbon: 0, icon: 'bi-tree-fill', type: 'attraction', coordinates: '11.9425,108.4447' },
          { day: 2, time: '08:30', name: 'Tham quan và hái dâu tại vườn sinh học hữu cơ', cost: 150000, carbon: -1.5, icon: 'bi-flower1', type: 'experience', coordinates: '11.9680,108.4720' },
          { day: 2, time: '12:00', name: 'Ăn trưa cơm chay thực dưỡng Đà Lạt', cost: 120000, carbon: -0.8, icon: 'bi-cup-hot-fill', type: 'food', coordinates: '11.9380,108.4410' },
          { day: 2, time: '15:00', name: 'Khám phá KDL Thác Datanla & trượt máng sinh thái', cost: 250000, carbon: 0.5, icon: 'bi-geo-alt-fill', type: 'attraction', coordinates: '11.9015,108.4490' },
          { day: 3, time: '09:00', name: 'Săn mây đồi chè Cầu Đất organic', cost: 80000, carbon: -1.2, icon: 'bi-cloud-sun-fill', type: 'attraction', coordinates: '11.8540,108.5670' },
          { day: 3, time: '14:30', name: 'Tiễn khách ra sân bay / Bến xe', cost: 0, carbon: 0.2, icon: 'bi-arrow-right-circle-fill', type: 'transport', coordinates: '11.7505,108.3700' }
        ]
      },
      {
        id: 'tour_duong_2',
        tour_name: 'Tour Phú Yên Hoang Sơ Gành Đá Đĩa 3N2Đ',
        destination: 'Phú Yên',
        days: 3,
        discount: 12,
        carbon: -22.4,
        image_url: 'image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg',
        tour_description: 'Khám phá xứ Nẫu mộc mạc hoang sơ, ngắm hoàng hôn đầm Ô Loan và chiêm ngưỡng cấu trúc địa chất độc đáo của Gành Đá Đĩa.',
        cost: 2450000,
        old_cost: 2800000,
        rating: 4.7,
        votes_count: 22,
        activities: [
          { day: 1, time: '09:00', name: 'Đón khách tại sân bay Tuy Hòa', cost: 0, carbon: 0.3, icon: 'bi-bus-front-fill', type: 'transport', coordinates: '13.0483,109.3400' },
          { day: 1, time: '11:00', name: 'Nhận phòng Bungalow Tre Việt sát biển', cost: 600000, carbon: -3.0, icon: 'bi-house-heart-fill', type: 'lodging', coordinates: '13.0880,109.3020' },
          { day: 1, time: '16:00', name: 'Check-in Tháp Nhạn cổ kính', cost: 20000, carbon: 0.1, icon: 'bi-geo-alt-fill', type: 'attraction', coordinates: '13.0895,109.2965' },
          { day: 2, time: '04:30', name: 'Săn bình minh đầu tiên tại Mũi Điện cực Đông', cost: 120000, carbon: 0.2, icon: 'bi-sun-fill', type: 'attraction', coordinates: '12.8878,109.4536' },
          { day: 2, time: '12:00', name: 'Ăn trưa hải sản tươi sống Đầm Ô Loan sinh thái', cost: 350000, carbon: 1.5, icon: 'bi-egg-fried', type: 'food', coordinates: '13.2642,109.2811' },
          { day: 2, time: '14:30', name: 'Khám phá danh thắng quốc gia Gành Đá Đĩa', cost: 100000, carbon: 0, icon: 'bi-geo-alt-fill', type: 'attraction', coordinates: '13.3644,109.3039' },
          { day: 3, time: '08:30', name: 'Trải nghiệm chèo thuyền kayak sinh thái Bãi Xép', cost: 150000, carbon: 0, icon: 'bi-water', type: 'experience', coordinates: '13.1970,109.2995' },
          { day: 3, time: '14:00', name: 'Mua sắm đặc sản Tuy Hòa & Tiễn sân bay', cost: 0, carbon: 0.3, icon: 'bi-airplane-fill', type: 'transport', coordinates: '13.0483,109.3400' }
        ]
      },
      {
        id: 'tour_duong_3',
        tour_name: 'Tour Hà Giang Khám Phá Vòng Cung Kỳ Vĩ 4N3Đ',
        destination: 'Hà Giang',
        days: 4,
        discount: 15,
        carbon: -28.6,
        image_url: 'image/41a413334d9e3753b26c50f3a3921309.jpg',
        tour_description: 'Hành trình trọn vẹn khám phá cao nguyên đá Đồng Văn, chinh phục đèo Mã Pí Lèng huyền thoại và đi thuyền trên sông Nho Quế.',
        cost: 3850000,
        old_cost: 4500000,
        rating: 4.9,
        votes_count: 35,
        activities: [
          { day: 1, time: '08:00', name: 'Đón khách tại TP Hà Giang, di chuyển lên Quản Bạ', cost: 0, carbon: 0.8, icon: 'bi-bus-front-fill', type: 'transport', coordinates: '22.8233,104.9833' },
          { day: 1, time: '11:30', name: 'Chiêm ngưỡng Núi Đôi Quản Bạ', cost: 0, carbon: 0, icon: 'bi-geo-alt-fill', type: 'attraction', coordinates: '23.0180,104.9820' },
          { day: 1, time: '17:00', name: 'Nhận phòng Homestay nhà trình tường người Mông', cost: 300000, carbon: -2.5, icon: 'bi-house-heart-fill', type: 'lodging', coordinates: '23.2789,105.2811' },
          { day: 2, time: '09:00', name: 'Tham quan Dinh thự vua Mèo cổ kính', cost: 50000, carbon: 0.1, icon: 'bi-geo-alt-fill', type: 'attraction', coordinates: '23.2625,105.2530' },
          { day: 2, time: '14:00', name: 'Khám phá phố cổ Đồng Văn nhộn nhịp', cost: 0, carbon: 0, icon: 'bi-shop', type: 'attraction', coordinates: '23.2789,105.2811' },
          { day: 3, time: '08:30', name: 'Chinh phục Đèo Mã Pí Lèng đệ nhất hùng vĩ', cost: 0, carbon: 0.2, icon: 'bi-compass', type: 'attraction', coordinates: '23.2450,105.3950' },
          { day: 3, time: '10:30', name: 'Đi thuyền sinh thái trên Sông Nho Quế qua hẻm Tu Sản', cost: 180000, carbon: -1.0, icon: 'bi-water', type: 'experience', coordinates: '23.2505,105.4120' },
          { day: 4, time: '09:00', name: 'Gặp gỡ trẻ em bản cao tại thung lũng Sủng Là', cost: 50000, carbon: 0, icon: 'bi-heart-fill', type: 'experience', coordinates: '23.2420,105.2010' },
          { day: 4, time: '16:00', name: 'Tiễn khách tại TP Hà Giang', cost: 0, carbon: 0.8, icon: 'bi-arrow-right-circle-fill', type: 'transport', coordinates: '22.8233,104.9833' }
        ]
      },
      {
        id: 'tour_duong_4',
        tour_name: 'Tour Sapa Mùa Lúa Chín Vàng Ruộm 3N2Đ',
        destination: 'Sapa',
        days: 3,
        discount: 8,
        carbon: -18.2,
        image_url: 'image/581559b0ca4ebbb8ec09d933fc7bff3d.jpg',
        tour_description: 'Tận hưởng mùa lúa chín vàng óng trên các thửa ruộng bậc thang kỳ vĩ tại thung lũng Mường Hoa Sapa, kết hợp lưu trú bản làng.',
        cost: 2150000,
        old_cost: 2350000,
        rating: 4.6,
        votes_count: 14,
        activities: [
          { day: 1, time: '09:30', name: 'Đón khách tại ga Sapa / Bến xe', cost: 0, carbon: 0.2, icon: 'bi-bus-front-fill', type: 'transport', coordinates: '22.3364,103.8438' },
          { day: 1, time: '11:00', name: 'Check-in Sapa Eco Homestay Bản Tả Van', cost: 380000, carbon: -1.8, icon: 'bi-house-heart-fill', type: 'lodging', coordinates: '22.2980,103.8890' },
          { day: 1, time: '15:00', name: 'Trekking bản Cát Cát tìm hiểu nghề dệt thổ cẩm', cost: 100000, carbon: 0, icon: 'bi-tree-fill', type: 'experience', coordinates: '22.3310,103.8290' },
          { day: 2, time: '08:30', name: 'Trekking thung lũng lúa chín Mường Hoa', cost: 150000, carbon: -0.5, icon: 'bi-compass-fill', type: 'experience', coordinates: '22.3080,103.8650' },
          { day: 2, time: '12:30', name: 'Thưởng thức lẩu cá hồi organic đặc sản Sapa', cost: 300000, carbon: 1.2, icon: 'bi-egg-fried', type: 'food', coordinates: '22.3364,103.8438' },
          { day: 3, time: '08:30', name: 'Chinh phục đỉnh Fansipan bằng cáp treo leo núi', cost: 850000, carbon: 1.5, icon: 'bi-cloud-fill', type: 'attraction', coordinates: '22.3033,103.7750' },
          { day: 3, time: '15:00', name: 'Checkout & Tiễn khách bến xe Sapa', cost: 0, carbon: 0.2, icon: 'bi-arrow-right-circle-fill', type: 'transport', coordinates: '22.3364,103.8438' }
        ]
      },
      {
        id: 'tour_duong_5',
        tour_name: 'Tour Khám Phá Đảo Ngọc Phú Quốc Xanh 3N2Đ',
        destination: 'Phú Quốc',
        days: 3,
        discount: 10,
        carbon: -20.0,
        image_url: 'image/52627caa0015b2f833fbdc632d37dc82.jpg',
        tour_description: 'Du ngoạn Nam Đảo Ngọc hoang sơ, câu cá lặn ngắm san hô bảo tồn và nghỉ dưỡng sang trọng thân thiện môi trường.',
        cost: 3200000,
        old_cost: 3600000,
        rating: 4.8,
        votes_count: 29,
        activities: [
          { day: 1, time: '10:00', name: 'Đón khách tại sân bay Phú Quốc', cost: 0, carbon: 0.4, icon: 'bi-airplane-fill', type: 'transport', coordinates: '10.1691,104.0040' },
          { day: 1, time: '11:30', name: 'Nhận phòng Resort Eco-Friendly Bãi Trường', cost: 1200000, carbon: -4.0, icon: 'bi-house-heart-fill', type: 'lodging', coordinates: '10.1420,103.9680' },
          { day: 1, time: '15:30', name: 'Tham quan vườn tiêu Phú Quốc organic', cost: 50000, carbon: -0.8, icon: 'bi-flower1', type: 'experience', coordinates: '10.2310,103.9780' },
          { day: 2, time: '08:00', name: 'Cáp treo Hòn Thơm vượt biển dài nhất thế giới', cost: 650000, carbon: 1.0, icon: 'bi-compass-fill', type: 'attraction', coordinates: '9.9880,104.0080' },
          { day: 2, time: '12:00', name: 'Ăn trưa gỏi cá trích đặc sản đảo Ngọc', cost: 250000, carbon: 0.6, icon: 'bi-egg-fried', type: 'food', coordinates: '10.2230,103.9610' },
          { day: 2, time: '14:00', name: 'Lặn ngắm rặng san hô tự nhiên quần đảo An Thới', cost: 350000, carbon: -0.2, icon: 'bi-water', type: 'experience', coordinates: '9.9630,104.0150' },
          { day: 3, time: '09:00', name: 'Check-in Bãi Sao cát trắng như kem', cost: 0, carbon: 0, icon: 'bi-tree-fill', type: 'attraction', coordinates: '10.0540,104.0370' },
          { day: 3, time: '15:30', name: 'Tiễn khách sân bay Phú Quốc', cost: 0, carbon: 0.4, icon: 'bi-arrow-right-circle-fill', type: 'transport', coordinates: '10.1691,104.0040' }
        ]
      }
    ];

    for (const tour of toursData) {
      await Schedule.create({
        id: tour.id,
        tour_name: tour.tour_name,
        destination: tour.destination,
        days: tour.days,
        discount: tour.discount,
        carbon: tour.carbon,
        image_url: tour.image_url,
        tour_description: tour.tour_description
      });

      await ScheduleSample.create({
        id: tour.id,
        provider_id: providerId,
        cost: tour.cost,
        old_cost: tour.old_cost,
        rating: tour.rating,
        votes_count: tour.votes_count
      });

      for (const act of tour.activities) {
        await ScheduleActivity.create({
          id: `act_${tour.id}_d${act.day}_${act.time.replace(':', '')}`,
          schedule_id: tour.id,
          day_number: act.day,
          time: act.time,
          activity_name: act.name,
          activity_cost: act.cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          coordinates: act.coordinates
        });
      }
    }
    console.log("Successfully seeded 5 Preset Tours for provider Duong.");

    // ==========================================
    // 4. SEEDING 4 CUSTOM ITINERARIES FOR DUONG
    // ==========================================
    console.log("Seeding custom itineraries for Duong...");

    const customsData = [
      {
        id: 'iti_duong_1',
        name: 'Lịch trình tự thiết kế Đà Lạt Tránh Nóng',
        destination: 'Đà Lạt',
        days: 2,
        status: 'draft',
        deposit_deadline: null,
        totalCost: 650000,
        carbon: -4.5,
        image_url: 'image/1dc8619487310884c9d631d689ece1e7.jpg',
        tour_description: 'Kế hoạch cá nhân 2 ngày trốn nắng Hà Nội tại Đà Lạt của Dương. Đi thong thả ăn uống và nghỉ ngơi.',
        activities: [
          { day: 1, time: '09:00', name: 'Đón sân bay về trung tâm Đà Lạt', cost: 150000, carbon: 0.5, icon: 'bi-scooter', type: 'transport', coordinates: '11.7505,108.3700' },
          { day: 1, time: '12:00', name: 'Thưởng thức bánh căn Đà Lạt nóng hổi', cost: 50000, carbon: 0.2, icon: 'bi-cup-hot-fill', type: 'dining', coordinates: '11.9412,108.4385' },
          { day: 1, time: '14:00', name: 'Uống trà chiều ven hồ Xuân Hương', cost: 80000, carbon: -0.5, icon: 'bi-cup-hot-fill', type: 'dining', coordinates: '11.9425,108.4447' },
          { day: 2, time: '08:30', name: 'Thuê xe máy điện dạo quanh Thung Lũng Tình Yêu', cost: 120000, carbon: -1.2, icon: 'bi-scooter', type: 'transport', coordinates: '11.9750,108.4520' },
          { day: 2, time: '14:00', name: 'Sắm hoa khô & Trà atiso làm quà', cost: 250000, carbon: -3.5, icon: 'bi-bag-fill', type: 'experience', coordinates: '11.9420,108.4410' }
        ]
      },
      {
        id: 'iti_duong_2',
        name: 'Hành trình Phú Yên Về Với Xứ Nẫu 3N2Đ',
        destination: 'Phú Yên',
        days: 3,
        status: 'deposited',
        deposit_deadline: '2026-07-25', // Future deadline (cancellable)
        totalCost: 1850000,
        carbon: -10.2,
        image_url: 'image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg',
        tour_description: 'Chuyến đi nghỉ ngơi tại bãi biển Phú Yên hoang sơ của Dương, đã hoàn thành đặt cọc đảm bảo.',
        activities: [
          { day: 1, time: '08:00', name: 'Xe đưa đón ga Tuy Hòa về homestay', cost: 100000, carbon: 0.2, icon: 'bi-scooter', type: 'transport', coordinates: '13.0880,109.3020' },
          { day: 1, time: '12:00', name: 'Ăn trưa đặc sản cơm gà Tuy Hòa', cost: 60000, carbon: 0.3, icon: 'bi-cup-hot-fill', type: 'dining', coordinates: '13.0890,109.3000' },
          { day: 1, time: '14:00', name: 'Nhận phòng Homestay Biển Xanh', cost: 400000, carbon: -2.5, icon: 'bi-house-door-fill', type: 'lodging', coordinates: '13.0880,109.3020' },
          { day: 2, time: '05:00', name: 'Chinh phục cực Đông Mũi Điện đón bình minh sớm', cost: 150000, carbon: 0.1, icon: 'bi-tree-fill', type: 'experience', coordinates: '12.8878,109.4536' },
          { day: 2, time: '12:00', name: 'Ăn trưa hải sản tươi Đầm Ô Loan', cost: 350000, carbon: 1.2, icon: 'bi-cup-hot-fill', type: 'dining', coordinates: '13.2642,109.2811' },
          { day: 2, time: '15:00', name: 'Chiêm ngưỡng Gành Đá Đĩa kỳ vĩ', cost: 80000, carbon: 0, icon: 'bi-tree-fill', type: 'experience', coordinates: '13.3644,109.3039' },
          { day: 3, time: '09:00', name: 'Tự do tắm biển Bãi Xép hoang sơ', cost: 0, carbon: -0.5, icon: 'bi-water', type: 'experience', coordinates: '13.1970,109.2995' },
          { day: 3, time: '14:30', name: 'Xe đưa tiễn ga Tuy Hòa', cost: 100000, carbon: 0.2, icon: 'bi-scooter', type: 'transport', coordinates: '13.0880,109.3020' }
        ]
      },
      {
        id: 'iti_duong_3',
        name: 'Trekking Hà Giang Cực Đông Bắc Hùng Vĩ 4N3Đ',
        destination: 'Hà Giang',
        days: 4,
        status: 'deposited',
        deposit_deadline: '2026-07-08', // Past deadline (non-cancellable, local time is July 12)
        totalCost: 2400000,
        carbon: -15.8,
        image_url: 'image/41a413334d9e3753b26c50f3a3921309.jpg',
        tour_description: 'Tour phượt xe máy điện Hà Giang vượt đèo Mã Pí Lèng ngắm sông Nho Quế của Dương, lịch trình đã chính thức khóa hoàn toàn.',
        activities: [
          { day: 1, time: '08:30', name: 'Thuê xe máy điện bảo vệ môi trường tại TP Hà Giang', cost: 180000, carbon: -1.2, icon: 'bi-scooter', type: 'transport', coordinates: '22.8233,104.9833' },
          { day: 1, time: '11:00', name: 'Vượt cổng trời Quản Bạ chụp hình', cost: 0, carbon: 0, icon: 'bi-tree-fill', type: 'experience', coordinates: '23.0180,104.9820' },
          { day: 1, time: '18:00', name: 'Nghỉ đêm tại Lô Lô Chải Homestay chân cột cờ Lũng Cú', cost: 350000, carbon: -2.0, icon: 'bi-house-door-fill', type: 'lodging', coordinates: '23.3712,105.3120' },
          { day: 2, time: '09:00', name: 'Trekking chinh phục Cột cờ quốc gia Lũng Cú', cost: 40000, carbon: 0.2, icon: 'bi-tree-fill', type: 'experience', coordinates: '23.3801,105.3160' },
          { day: 2, time: '13:00', name: 'Ăn trưa phở gà tráng kìm đặc sản', cost: 50000, carbon: 0.4, icon: 'bi-cup-hot-fill', type: 'dining', coordinates: '23.0810,105.0230' },
          { day: 3, time: '08:30', name: 'Vượt đèo Mã Pí Lèng đệ nhất hùng vĩ', cost: 0, carbon: 0.1, icon: 'bi-scooter', type: 'transport', coordinates: '23.2450,105.3950' },
          { day: 3, time: '10:30', name: 'Đi thuyền gỗ sinh thái ngắm dòng Nho Quế xanh biếc', cost: 150000, carbon: -0.8, icon: 'bi-water', type: 'experience', coordinates: '23.2505,105.4120' },
          { day: 4, time: '09:00', name: 'Ghé chợ phiên Đồng Văn tìm hiểu bản sắc Lô Lô', cost: 0, carbon: 0, icon: 'bi-shop', type: 'experience', coordinates: '23.2789,105.2811' },
          { day: 4, time: '16:00', name: 'Trả xe máy điện tại TP Hà Giang & kết thúc hành trình', cost: 0, carbon: 0.4, icon: 'bi-scooter', type: 'transport', coordinates: '22.8233,104.9833' }
        ]
      },
      {
        id: 'iti_duong_4',
        name: 'Nghỉ Dưỡng Eco Lodge Sapa Cổ Kính 3N2Đ',
        destination: 'Sapa',
        days: 3,
        status: 'cancelled',
        deposit_deadline: '2026-07-08',
        totalCost: 3200000,
        carbon: -5.0,
        image_url: 'image/4302842f8d693c25238f2141964a64b2.jpg',
        tour_description: 'Kế hoạch nghỉ dưỡng Sapa tại Topas Eco Lodge đã bị hủy cọc để hoàn tiền do lịch trình bận đột xuất.',
        activities: [
          { day: 1, time: '10:00', name: 'Nhận phòng tại Topas Eco Lodge biệt lập', cost: 2200000, carbon: -4.0, icon: 'bi-house-door-fill', type: 'lodging', coordinates: '22.2510,103.9510' },
          { day: 1, time: '18:30', name: 'Ăn tối lẩu rau củ rừng organic tại lodge', cost: 400000, carbon: -0.5, icon: 'bi-cup-hot-fill', type: 'dining', coordinates: '22.2510,103.9510' },
          { day: 2, time: '09:00', name: 'Tắm lá thuốc người Dao Đỏ thư giãn sâu', cost: 350000, carbon: -0.8, icon: 'bi-heart-fill', type: 'experience', coordinates: '22.2510,103.9510' },
          { day: 3, time: '11:00', name: 'Trả phòng & Di chuyển về trung tâm Sapa', cost: 250000, carbon: 0.3, icon: 'bi-scooter', type: 'transport', coordinates: '22.3364,103.8438' }
        ]
      }
    ];

    for (const custom of customsData) {
      // 1. Create Base Schedule
      await Schedule.create({
        id: custom.id,
        tour_name: custom.name,
        destination: custom.destination,
        days: custom.days,
        discount: 0,
        carbon: custom.carbon,
        image_url: custom.image_url,
        tour_description: custom.tour_description
      });

      // 2. Create ScheduleCustom
      await ScheduleCustom.create({
        id: custom.id,
        user_id: userId,
        total_cost: custom.totalCost,
        status: custom.status,
        deposit_deadline: custom.deposit_deadline
      });

      // 3. Create UserSchedule Junction
      await UserSchedule.create({
        user_id: userId,
        schedule_id: custom.id
      });

      // 4. Create Activities
      for (const act of custom.activities) {
        await ScheduleActivity.create({
          id: `act_${custom.id}_d${act.day}_${act.time.replace(':', '')}`,
          schedule_id: custom.id,
          day_number: act.day,
          time: act.time,
          activity_name: act.name,
          activity_cost: act.cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          coordinates: act.coordinates
        });
      }
    }

    console.log("Successfully seeded 4 Custom Itineraries for user Duong.");

    console.log("=== ALL DONE SUCCESSFULLY ===");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
