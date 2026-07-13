const { Op } = require('sequelize');
const { 
  sequelize, 
  User, 
  Wallet, 
  WalletTransaction, 
  ServiceBooking, 
  TourBooking, 
  GreenService, 
  Schedule, 
  ScheduleSample, 
  ScheduleCustom,
  ScheduleActivity,
  Vender, 
  Voucher,
  Notification
} = require('../models/index');

// Helper for terminal interactive transaction approval (preserving original codebase prompt)
function promptTerminalApproval(message) {
  return new Promise((resolve) => {
    console.log('\n==================================================');
    console.log(`[GREENSTEPS ADMIN APPROVAL REQUEST]`);
    console.log(message);
    console.log('Nhấn "y" (và Enter) để DUYỆT, hoặc phím khác để TỪ CHỐI.');
    console.log('==================================================');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Duyệt giao dịch? (y/n): ', (answer) => {
      rl.close();
      const approved = answer.trim().toLowerCase() === 'y';
      resolve(approved);
    });
  });
}

async function syncCustomItineraryStatus(itineraryId, transaction = null) {
  try {
    const opts = transaction ? { transaction } : {};
    const scheduleCustom = await ScheduleCustom.findOne({
      where: { id: itineraryId },
      ...opts
    });
    if (scheduleCustom) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + 7);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      
      scheduleCustom.status = 'deposited';
      scheduleCustom.deposit_deadline = `${yyyy}-${mm}-${dd}`;
      await scheduleCustom.save(opts);
    }
  } catch (err) {
    console.error('Failed to sync custom itinerary status:', err);
  }
}

exports.createBooking = async (req, res, next) => {
  const { type, targetId, bookingDate, guests, paymentMethod, voucherCode } = req.body;
  const userId = req.user ? req.user.id : req.body.customerId;
  const fullname = req.user ? req.user.fullname : (req.body.customerName || 'Khách hàng');

  try {
    let bookingId;
    let totalValue = 0;
    let tourNameOrServiceName = '';
    let discount = 0;

    // 1. Calculate prices, validate availability and vouchers
    if (type === 'service') {
      const service = await GreenService.findByPk(targetId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Dịch vụ xanh không tồn tại!' });
      }

      // Check capacity in CSDL
      const bookedGuests = await ServiceBooking.sum('guests', {
        where: {
          service_id: targetId,
          booking_date: bookingDate,
          status: { [Op.in]: ['deposit', 'completed'] }
        }
      }) || 0;

      if (service.max_capacity - bookedGuests < guests) {
        return res.status(400).json({
          success: false,
          message: `Dịch vụ chỉ còn ${service.max_capacity - bookedGuests} chỗ trống cho ngày ${bookingDate}.`
        });
      }

      totalValue = service.cost * guests;
      tourNameOrServiceName = service.name_service;
      bookingId = 'BKS-' + Date.now();
    } else if (type === 'tour' || type === 'itinerary') {
      const baseTour = await Schedule.findByPk(targetId);
      if (!baseTour) {
        return res.status(404).json({ success: false, message: 'Lịch trình hoặc Tour không tồn tại!' });
      }

      const sampleTour = await ScheduleSample.findOne({ where: { id: targetId } });
      if (sampleTour) {
        totalValue = sampleTour.cost * guests;
      } else {
        // It's a custom itinerary! Fetch costs of activities
        const activities = await ScheduleActivity.findAll({ where: { schedule_id: targetId } });
        let perPersonCost = 0;
        let flatCost = 0;
        activities.forEach(act => {
          if (act.cost) {
            if (act.is_shared || act.type === 'lodging') {
              flatCost += act.cost;
            } else {
              perPersonCost += act.cost;
            }
          }
        });
        totalValue = (perPersonCost * guests) + flatCost;
      }
      tourNameOrServiceName = baseTour.tour_name || 'Lịch trình tự chọn';
      bookingId = 'BKT-' + Date.now();
    } else {
      return res.status(400).json({ success: false, message: 'Loại đặt chỗ không hợp lệ (yêu cầu service hoặc tour/itinerary)!' });
    }

    // 2. Validate voucher if applied
    if (voucherCode) {
      const voucher = await Voucher.findOne({
        where: { code: voucherCode, user_id: userId, status: 'active' }
      });
      if (voucher) {
        discount = totalValue * (voucher.discount_percent / 100);
        totalValue -= discount;
      }
    }

    // 3. Process Payment based on paymentMethod
    if (paymentMethod === 'wallet') {
      // Wallet balance deduction with Admin Terminal Check
      const wallet = await Wallet.findOne({ where: { user_id: userId } });
      if (!wallet || wallet.balance < totalValue) {
        return res.status(400).json({ success: false, message: 'Số dư ví không đủ để thanh toán cọc đơn đặt!' });
      }

      const msg = `Khách hàng #${userId} yêu cầu THANH TOÁN VÍ cho #${bookingId} - SỐ TIỀN: ${totalValue.toLocaleString('vi-VN')} đ`;
      const approved = await promptTerminalApproval(msg);

      if (!approved) {
        return res.status(400).json({ success: false, message: 'Giao dịch thanh toán bị quản trị viên từ chối ở terminal.' });
      }

      // Start transaction to execute payment and book
      await sequelize.transaction(async (t) => {
        const lockedWallet = await Wallet.findOne({
          where: { user_id: userId },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        lockedWallet.balance -= totalValue;
        await lockedWallet.save({ transaction: t });

        const evoucherCode = 'EV-' + Math.floor(1000000000 + Math.random() * 9000000000);

        let bookingRecord;
        if (type === 'service') {
          bookingRecord = await ServiceBooking.create({
            id: bookingId,
            user_id: userId,
            service_id: targetId,
            fullname: fullname,
            name_service: tourNameOrServiceName,
            booking_date: bookingDate,
            guests: guests,
            value: totalValue,
            status: 'deposit',
            evoucher_code: evoucherCode,
            escrow_status: 'holding',
            voucher_code: voucherCode || null
          }, { transaction: t });
        } else {
          bookingRecord = await TourBooking.create({
            id: bookingId,
            user_id: userId,
            schedule_id: targetId,
            fullname: fullname,
            tour_name: tourNameOrServiceName,
            booking_date: bookingDate,
            guests: guests,
            value: totalValue,
            payment_method: 'wallet',
            evoucher_code: evoucherCode,
            status: 'deposit',
            escrow_status: 'holding',
          }, { transaction: t });
        }

        await syncCustomItineraryStatus(targetId, t);

        // Set voucher status to used
        if (voucherCode) {
          await Voucher.update(
            { status: 'used' },
            { where: { code: voucherCode, user_id: userId }, transaction: t }
          );
        }

        // Save wallet transaction
        await WalletTransaction.create({
          id: 'GD-' + Date.now(),
          wallet_id: lockedWallet.id,
          type: 'escrow_hold',
          amount: totalValue,
          description: `Thanh toán cọc ví cho đơn #${bookingId}`,
          status: 'success',
          reference_id: bookingId
        }, { transaction: t });
      });

    } else if (paymentMethod === 'card') {
      // Direct Credit Card payment (success without OTP simulator)
      await sequelize.transaction(async (t) => {
        const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
        const evoucherCode = 'EV-' + Math.floor(1000000000 + Math.random() * 9000000000);

        if (type === 'service') {
          await ServiceBooking.create({
            id: bookingId,
            user_id: userId,
            service_id: targetId,
            fullname: fullname,
            name_service: tourNameOrServiceName,
            booking_date: bookingDate,
            guests: guests,
            value: totalValue,
            status: 'deposit',
            evoucher_code: evoucherCode,
            escrow_status: 'holding',
            voucher_code: voucherCode || null
          }, { transaction: t });
        } else {
          await TourBooking.create({
            id: bookingId,
            user_id: userId,
            schedule_id: targetId,
            fullname: fullname,
            tour_name: tourNameOrServiceName,
            booking_date: bookingDate,
            guests: guests,
            value: totalValue,
            payment_method: 'card',
            evoucher_code: evoucherCode,
            status: 'deposit',
            escrow_status: 'holding',
          }, { transaction: t });
        }

        await syncCustomItineraryStatus(targetId, t);

        // Set voucher status to used
        if (voucherCode) {
          await Voucher.update(
            { status: 'used' },
            { where: { code: voucherCode, user_id: userId }, transaction: t }
          );
        }

        // Record successful transaction in wallet if it exists
        if (wallet) {
          await WalletTransaction.create({
            id: 'GD-' + Date.now(),
            wallet_id: wallet.id,
            type: 'payment',
            amount: totalValue,
            description: `Thanh toán cọc bằng Thẻ Tín Dụng cho đơn #${bookingId}`,
            status: 'success',
            reference_id: bookingId
          }, { transaction: t });
        }
      });
    } else if (paymentMethod === 'bank_transfer') {
      // Direct QR transfer (Pending admin verification, no terminal block)
      await sequelize.transaction(async (t) => {
        const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction: t });
        const evoucherCode = 'EV-' + Math.floor(1000000000 + Math.random() * 9000000000);

        if (type === 'service') {
          await ServiceBooking.create({
            id: bookingId,
            user_id: userId,
            service_id: targetId,
            fullname: fullname,
            name_service: tourNameOrServiceName,
            booking_date: bookingDate,
            guests: guests,
            value: totalValue,
            status: 'pending', // Pending admin approval
            evoucher_code: evoucherCode,
            escrow_status: 'none',
            voucher_code: voucherCode || null
          }, { transaction: t });
        } else {
          await TourBooking.create({
            id: bookingId,
            user_id: userId,
            schedule_id: targetId,
            fullname: fullname,
            tour_name: tourNameOrServiceName,
            booking_date: bookingDate,
            guests: guests,
            value: totalValue,
            payment_method: 'bank_transfer',
            evoucher_code: evoucherCode,
            status: 'pending', // Pending admin approval
            escrow_status: 'none',
            voucher_code: voucherCode || null
          }, { transaction: t });
        }

        // Set voucher status to used
        if (voucherCode) {
          await Voucher.update(
            { status: 'used' },
            { where: { code: voucherCode, user_id: userId }, transaction: t }
          );
        }

        // Record pending transaction in wallet if it exists
        if (wallet) {
          await WalletTransaction.create({
            id: 'GD-' + Date.now(),
            wallet_id: wallet.id,
            type: 'payment',
            amount: totalValue,
            description: `Thanh toán cọc QR trực tiếp cho đơn #${bookingId}`,
            status: 'pending', // Pending admin approval
            reference_id: bookingId
          }, { transaction: t });
        }

        // Create pending notification
        await Notification.create({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: userId,
          title: 'Đang chờ duyệt giao dịch',
          message: `Giao dịch chuyển khoản đặt cọc cho đơn ${bookingId} đang chờ quản trị viên phê duyệt.`,
          type: 'booking',
          read: false
        }, { transaction: t });
      });
    } else {
      // Just save booking as pending/unpaid
      const evoucherCode = 'EV-' + Math.floor(1000000000 + Math.random() * 9000000000);
      if (type === 'service') {
        await ServiceBooking.create({
          id: bookingId,
          user_id: userId,
          service_id: targetId,
          fullname: fullname,
          name_service: tourNameOrServiceName,
          booking_date: bookingDate,
          guests: guests,
          value: totalValue,
          status: 'pending',
          evoucher_code: evoucherCode,
          escrow_status: 'none',
          voucher_code: voucherCode || null
        });
      } else {
        await TourBooking.create({
          id: bookingId,
          user_id: userId,
          schedule_id: targetId,
          fullname: fullname,
          tour_name: tourNameOrServiceName,
          booking_date: bookingDate,
          guests: guests,
          value: totalValue,
          payment_method: paymentMethod || 'counter',
          evoucher_code: evoucherCode,
          status: 'pending',
          escrow_status: 'none',
          voucher_code: voucherCode || null
        });
      }
    }

    res.json({
      success: true,
      message: 'Đặt chỗ thành công!',
      bookingId
    });
  } catch (error) {
    next(error);
  }
};

exports.checkInEVoucher = async (req, res, next) => {
  const { evoucherCode } = req.body;
  const providerId = req.user ? req.user.id : (req.body.providerId || null);

  const t = await sequelize.transaction();
  try {
    // 1. Locate booking (Service or Tour Booking)
    let booking = await ServiceBooking.findOne({
      where: { evoucher_code: evoucherCode, status: 'deposit', escrow_status: 'holding' },
      transaction: t
    });
    let isService = true;

    if (!booking) {
      booking = await TourBooking.findOne({
        where: { evoucher_code: evoucherCode, status: 'deposit', escrow_status: 'holding' },
        transaction: t
      });
      isService = false;
    }

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'E-Voucher không tồn tại hoặc đã được check-in!' });
    }

    // 2. Locate Provider vender_id or details
    let vendorUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // fallback partner
    let carbonSaved = 1.0;

    if (isService) {
      const service = await GreenService.findByPk(booking.service_id, { transaction: t });
      if (service) {
        const vender = await Vender.findByPk(service.vender_id, { transaction: t });
        if (vender) vendorUserId = vender.user_id;
        carbonSaved = (service.carbon || 0.5) * booking.guests;
      }
    } else {
      const tour = await Schedule.findByPk(booking.schedule_id, { transaction: t });
      if (tour) carbonSaved = (tour.carbon || 5.0) * booking.guests;
    }

    // 3. Update booking status
    booking.status = 'completed';
    booking.escrow_status = 'released';
    await booking.save({ transaction: t });

    // 4. Distribute funds: 90% Provider, 10% Platform fee (EW26admin001)
    const providerWallet = await Wallet.findOne({
      where: { user_id: vendorUserId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    const adminWallet = await Wallet.findOne({
      where: { id: 'EW26admin001' },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    const netProfit = booking.value * 0.9;
    const platformFee = booking.value * 0.1;

    providerWallet.balance += netProfit;
    await providerWallet.save({ transaction: t });

    adminWallet.balance += platformFee;
    await adminWallet.save({ transaction: t });

    // 5. Add green points to traveler
    const travelerWallet = await Wallet.findOne({
      where: { user_id: booking.user_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    const earnedPoints = Math.round(carbonSaved * 10);
    travelerWallet.green_points += earnedPoints;
    await travelerWallet.save({ transaction: t });

    // 6. Record transactions
    await WalletTransaction.bulkCreate([
      {
        id: 'GD-P-' + Date.now(),
        wallet_id: providerWallet.id,
        type: 'escrow_release',
        amount: netProfit,
        description: `Check-in E-Voucher đơn #${booking.id}: Thực nhận 90%`,
        status: 'success',
        reference_id: booking.id
      },
      {
        id: 'GD-A-' + Date.now(),
        wallet_id: adminWallet.id,
        type: 'deposit',
        amount: platformFee,
        description: `Phí hoa hồng dịch vụ 10% từ đơn #${booking.id}`,
        status: 'success',
        reference_id: booking.id
      }
    ], { transaction: t });

    await t.commit();
    res.json({
      success: true,
      message: 'Check-in E-Voucher thành công! Tiền đã chuyển đối soát đối tác, điểm xanh đã cộng vào tài khoản khách hàng.'
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  const { bookingId } = req.body;
  const userId = req.user ? req.user.id : req.body.userId;

  const t = await sequelize.transaction();
  try {
    let booking = await ServiceBooking.findOne({
      where: { id: bookingId, user_id: userId },
      transaction: t
    });
    let isService = true;

    if (!booking) {
      booking = await TourBooking.findOne({
        where: { id: bookingId, user_id: userId },
        transaction: t
      });
      isService = false;
    }

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Đơn đặt chỗ không tồn tại!' });
    }

    if (booking.status === 'pending') {
      booking.status = 'rejected';
      booking.escrow_status = 'none';
      await booking.save({ transaction: t });

      await WalletTransaction.update(
        { status: 'failed' },
        { where: { reference_id: bookingId, status: 'pending' }, transaction: t }
      );

      await t.commit();
      return res.json({ success: true, message: 'Đã hủy đơn đặt chỗ thành công!' });
    }

    if (booking.status !== 'deposit' || booking.escrow_status !== 'holding') {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Chỉ đơn đặt ở trạng thái đặt cọc tạm giữ mới có thể hủy!' });
    }

    // Check cancellation deadline: free cancel if >= 3 days before booking_date
    const today = new Date();
    const tourDate = new Date(booking.booking_date);
    const diffTime = tourDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 3) {
      // 100% Refund to Traveler
      booking.status = 'rejected';
      booking.escrow_status = 'refunded';
      await booking.save({ transaction: t });

      const travelerWallet = await Wallet.findOne({
        where: { user_id: userId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      travelerWallet.balance += booking.value;
      await travelerWallet.save({ transaction: t });

      await WalletTransaction.create({
        id: 'GD-' + Date.now(),
        wallet_id: travelerWallet.id,
        type: 'refund',
        amount: booking.value,
        description: `Hoàn tiền đặt cọc 100% do hủy đơn trước hạn #${booking.id}`,
        status: 'success',
        reference_id: booking.id
      }, { transaction: t });

      await t.commit();
      res.json({ success: true, message: 'Đã hủy đơn thành công. Toàn bộ tiền cọc đã được hoàn về ví của bạn!' });
    } else {
      // Compensation penalty to Provider: escrow released to Provider
      booking.status = 'rejected';
      booking.escrow_status = 'released';
      await booking.save({ transaction: t });

      let providerId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      if (isService) {
        const service = await GreenService.findByPk(booking.service_id, { transaction: t });
        if (service) {
          const vender = await Vender.findByPk(service.vender_id, { transaction: t });
          if (vender) providerId = vender.user_id;
        }
      }

      const providerWallet = await Wallet.findOne({
        where: { user_id: providerId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      providerWallet.balance += booking.value;
      await providerWallet.save({ transaction: t });

      await WalletTransaction.create({
        id: 'GD-' + Date.now(),
        wallet_id: providerWallet.id,
        type: 'escrow_release',
        amount: booking.value,
        description: `Nhận 100% tiền bồi thường hủy đơn muộn #${booking.id}`,
        status: 'success',
        reference_id: booking.id
      }, { transaction: t });

      await t.commit();
      res.json({ success: true, message: 'Đã hủy đơn. Do đơn hủy muộn (dưới 3 ngày), tiền đặt cọc đã được chuyển làm bồi thường cho nhà cung cấp.' });
    }
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const { providerId, customerId } = req.query;
    let serviceBookings = [];
    let tourBookings = [];

    if (providerId) {
      const vender = await Vender.findOne({ where: { user_id: providerId } });
      const venderId = vender ? vender.id : '';

      const services = await GreenService.findAll({ where: { vender_id: venderId } });
      const serviceIds = services.map(s => s.id);

      serviceBookings = await ServiceBooking.findAll({
        where: { service_id: { [Op.in]: serviceIds } },
        order: [['createdAt', 'DESC']]
      });

      // TourBookings do not have vender/owner fields, so providers only manage their own green services
      tourBookings = [];
    } else if (customerId) {
      serviceBookings = await ServiceBooking.findAll({
        where: { user_id: customerId },
        order: [['createdAt', 'DESC']]
      });
      tourBookings = await TourBooking.findAll({
        where: { user_id: customerId },
        order: [['createdAt', 'DESC']]
      });
    } else {
      serviceBookings = await ServiceBooking.findAll({ order: [['createdAt', 'DESC']] });
      tourBookings = await TourBooking.findAll({ order: [['createdAt', 'DESC']] });
    }

    const mappedServices = serviceBookings.map(row => ({
      id: row.id,
      customer: row.fullname,
      service: row.name_service,
      date: row.booking_date,
      guests: row.guests,
      value: row.value,
      status: row.status,
      evoucher: row.evoucher_code,
      type: 'service',
      escrow: row.escrow_status
    }));

    const mappedTours = tourBookings.map(row => ({
      id: row.id,
      customer: row.fullname,
      service: row.tour_name,
      date: row.booking_date,
      guests: row.guests,
      value: row.value,
      status: row.status,
      evoucher: row.evoucher_code,
      type: 'tour',
      escrow: row.escrow_status
    }));

    res.json([...mappedServices, ...mappedTours]);
  } catch (error) {
    next(error);
  }
};

exports.approveBooking = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (id.startsWith('iti_') || id.startsWith('GD-')) {
      const tx = await WalletTransaction.findOne({
        where: {
          [Op.or]: [{ id: id }, { reference_id: id }],
          type: 'payment',
          status: 'pending'
        }
      });
      if (!tx) {
        return res.status(404).json({ success: false, message: 'Yêu cầu thanh toán lịch trình không tồn tại hoặc đã xử lý!' });
      }
      const itineraryId = tx.reference_id;
      const t = await sequelize.transaction();
      try {
        tx.status = 'success';
        await tx.save({ transaction: t });

        // Update custom itinerary status & deadline (+7 days)
        await ScheduleCustom.update(
          { 
            status: 'deposited',
            deposit_deadline: sequelize.literal("CURRENT_DATE + 7")
          },
          { where: { id: itineraryId }, transaction: t }
        );

        await t.commit();
        return res.json({ success: true, message: 'Đã phê duyệt đặt cọc lịch trình thành công!' });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    let booking = await ServiceBooking.findByPk(id);
    if (!booking) {
      booking = await TourBooking.findByPk(id);
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Đơn đặt chỗ không tồn tại!' });
    }
    booking.status = 'deposit';
    booking.escrow_status = 'holding';
    await booking.save();

    if (booking.schedule_id) {
      await syncCustomItineraryStatus(booking.schedule_id);
    }

    // Sync pending QR transfer transaction
    await WalletTransaction.update(
      { status: 'success' },
      { where: { reference_id: id, status: 'pending' } }
    );

    // Create success notification
    await Notification.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: booking.user_id,
      title: 'Giao dịch thành công',
      message: `Giao dịch chuyển khoản đặt cọc cho đơn ${id} đã được phê duyệt thành công!`,
      type: 'booking',
      read: false
    });

    res.json({ success: true, message: 'Đã phê duyệt đơn đặt chỗ thành công!' });
  } catch (error) {
    next(error);
  }
};

exports.rejectBooking = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (id.startsWith('iti_') || id.startsWith('GD-')) {
      const tx = await WalletTransaction.findOne({
        where: {
          [Op.or]: [{ id: id }, { reference_id: id }],
          type: 'payment',
          status: 'pending'
        }
      });
      if (!tx) {
        return res.status(404).json({ success: false, message: 'Yêu cầu thanh toán lịch trình không tồn tại hoặc đã xử lý!' });
      }
      tx.status = 'failed';
      await tx.save();
      return res.json({ success: true, message: 'Đã từ chối đặt cọc lịch trình!' });
    }

    let booking = await ServiceBooking.findByPk(id);
    if (!booking) {
      booking = await TourBooking.findByPk(id);
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Đơn đặt chỗ không tồn tại!' });
    }
    booking.status = 'rejected';
    booking.escrow_status = 'refunded';
    await booking.save();

    // Sync pending QR transfer transaction
    await WalletTransaction.update(
      { status: 'failed' },
      { where: { reference_id: id, status: 'pending' } }
    );

    res.json({ success: true, message: 'Đã từ chối đơn đặt chỗ thành công!' });
  } catch (error) {
    next(error);
  }
};

exports.getPendingBookings = async (req, res, next) => {
  try {
    const serviceBookings = await ServiceBooking.findAll({
      where: { status: 'pending' },
      include: [User],
      order: [['createdAt', 'DESC']]
    });

    const tourBookings = await TourBooking.findAll({
      where: { status: 'pending' },
      include: [User],
      order: [['createdAt', 'DESC']]
    });

    const itineraryPayments = await WalletTransaction.findAll({
      where: { type: 'payment', status: 'pending' },
      include: [{
        model: Wallet,
        include: [User]
      }],
      order: [['createdAt', 'DESC']]
    });

    const mappedServices = serviceBookings.map(row => ({
      id: row.id,
      customer: row.fullname,
      service: row.name_service,
      date: row.booking_date,
      guests: row.guests,
      value: row.value,
      status: row.status,
      type: 'service',
      escrow: row.escrow_status,
      createdAt: row.createdAt
    }));

    const mappedTours = tourBookings.map(row => ({
      id: row.id,
      customer: row.fullname,
      service: row.tour_name,
      date: row.booking_date,
      guests: row.guests,
      value: row.value,
      status: row.status,
      type: 'tour',
      escrow: row.escrow_status,
      createdAt: row.createdAt
    }));

    const mappedItineraries = itineraryPayments.map(row => ({
      id: row.id,
      itineraryId: row.reference_id,
      customer: row.Wallet?.User?.fullname || 'Khách hàng',
      service: `Đặt cọc Lịch trình tự chọn (#${row.reference_id ? row.reference_id.substring(4, 12) : ''})`,
      date: new Date(row.createdAt).toLocaleDateString('vi-VN'),
      guests: 1,
      value: Math.abs(row.amount),
      status: row.status,
      type: 'itinerary',
      escrow: 'none',
      createdAt: row.createdAt
    }));

    res.json([...mappedServices, ...mappedTours, ...mappedItineraries]);
  } catch (error) {
    next(error);
  }
};
