const { Op } = require('sequelize');
const { 
  sequelize, 
  Schedule, 
  ScheduleSample, 
  ScheduleCustom, 
  ScheduleActivity, 
  BadgeSchedule, 
  BadgeUser, 
  User, 
  CommentPost, 
  CPSS,
  Wallet,
  Provider
} = require('../models/index');
const bcrypt = require('bcrypt');

// 1. Get All Preset Tours
exports.getPresetTours = async (req, res, next) => {
  try {
    const { userId } = req.query;
    let whereClause = {};
    if (userId) {
      const user = await User.findByPk(userId);
      if (user && user.company_name) {
        const provider = await Provider.findOne({ where: { name_provider: user.company_name } });
        if (provider) {
          whereClause = { provider_id: provider.id };
        } else {
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }
    const samples = await ScheduleSample.findAll({ where: whereClause });
    const tours = [];

    for (const s of samples) {
      const base = await Schedule.findByPk(s.id);
      if (!base) continue;

      const activities = await ScheduleActivity.findAll({
        where: { schedule_id: s.id },
        order: [['day_number', 'ASC'], ['time', 'ASC']]
      });

      const data = Array.from({ length: base.days }, () => []);
      activities.forEach(act => {
        const dIdx = act.day_number - 1;
        if (dIdx >= 0 && dIdx < base.days) {
          data[dIdx].push({
            id: act.id,
            time: act.time,
            name: act.activity_name || '[Địa điểm tự do]',
            cost: act.activity_cost,
            carbon: act.carbon,
            icon: act.icon,
            type: act.type,
            lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
            lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null
          });
        }
      });

      const badgeSchedules = await BadgeSchedule.findAll({ where: { schedule_id: s.id } });
      const badges = badgeSchedules.map(bs => bs.badge_name);

      tours.push({
        id: s.id,
        title: base.tour_name,
        destination: base.destination || 'Việt Nam',
        days: base.days,
        cost: s.cost,
        oldCost: s.old_cost,
        carbon: base.carbon,
        image: base.image_url,
        description: base.tour_description,
        rating: s.rating,
        votes_count: s.votes_count,
        tags: badges,
        data: data
      });
    }

    res.json(tours);
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Preset Tour
exports.getPresetTourById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const s = await ScheduleSample.findByPk(id);
    if (!s) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour du lịch này!' });
    }
    const base = await Schedule.findByPk(id);
    if (!base) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour!' });
    }

    const activities = await ScheduleActivity.findAll({
      where: { schedule_id: id },
      order: [['day_number', 'ASC'], ['time', 'ASC']]
    });

    const data = Array.from({ length: base.days }, () => []);
    activities.forEach(act => {
      const dIdx = act.day_number - 1;
      if (dIdx >= 0 && dIdx < base.days) {
        data[dIdx].push({
          id: act.id,
          time: act.time,
          name: act.activity_name || '[Địa điểm tự do]',
          cost: act.activity_cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
          lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null
        });
      }
    });

    const badgeSchedules = await BadgeSchedule.findAll({ where: { schedule_id: id } });
    const badges = badgeSchedules.map(bs => bs.badge_name);

    res.json({
      id: s.id,
      title: base.tour_name,
      destination: base.destination || 'Việt Nam',
      days: base.days,
      cost: s.cost,
      oldCost: s.old_cost,
      carbon: base.carbon,
      image: base.image_url,
      description: base.tour_description,
      rating: s.rating,
      votes_count: s.votes_count,
      tags: badges,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Personalized Tour Recommendations
exports.getRecommendations = async (req, res, next) => {
  const { userId } = req.params;
  try {
    // Priority 1: Check user last interest destination
    const user = await User.findByPk(userId);
    let matchedTours = [];

    if (user && user.last_interest) {
      const matchedSchedules = await Schedule.findAll({
        where: { destination: { [Op.iLike]: `%${user.last_interest}%` } }
      });
      const scheduleIds = matchedSchedules.map(s => s.id);
      if (scheduleIds.length > 0) {
        matchedTours = await ScheduleSample.findAll({
          where: { id: { [Op.in]: scheduleIds } }
        });
      }
    }

    // Priority 2: Match user badges
    if (matchedTours.length === 0) {
      const userBadges = await BadgeUser.findAll({ where: { user_id: userId } });
      const badgeNames = userBadges.map(ub => ub.badge_name);
      if (badgeNames.length > 0) {
        const badgeSchedules = await BadgeSchedule.findAll({
          where: { badge_name: { [Op.in]: badgeNames } }
        });
        const tourIds = [...new Set(badgeSchedules.map(bs => bs.schedule_id))];
        if (tourIds.length > 0) {
          matchedTours = await ScheduleSample.findAll({
            where: { id: { [Op.in]: tourIds } }
          });
        }
      }
    }

    // Fallback: highest rated tours
    if (matchedTours.length === 0) {
      matchedTours = await ScheduleSample.findAll({
        order: [['rating', 'DESC']],
        limit: 3
      });
    }

    const tours = [];
    for (const s of matchedTours) {
      const base = await Schedule.findByPk(s.id);
      if (!base) continue;
      const badgeSchedules = await BadgeSchedule.findAll({ where: { schedule_id: s.id } });
      tours.push({
        id: s.id,
        title: base.tour_name,
        destination: base.destination,
        days: base.days,
        cost: s.cost,
        oldCost: s.old_cost,
        carbon: base.carbon,
        image: base.image_url,
        description: base.tour_description,
        rating: s.rating,
        votes_count: s.votes_count,
        tags: badgeSchedules.map(bs => bs.badge_name)
      });
    }

    res.json(tours);
  } catch (error) {
    next(error);
  }
};

// 4. Custom Itineraries: Save or Update Itinerary (calculates carbon footprint)
exports.saveCustomItinerary = async (req, res, next) => {
  const { id, name, user_id, destination, days, totalCost, daysData } = req.body;

  try {
    // Sum carbon emissions from activities
    let computedCarbon = 0;
    if (daysData && daysData.length > 0) {
      daysData.forEach(day => {
        day.forEach(act => {
          computedCarbon += parseFloat(act.carbon || 0);
        });
      });
    }

    // SQL Transaction
    await sequelize.transaction(async (t) => {
      // Self-healing check: if the user does not exist in DB, auto-create them and their wallet
      const userExists = await User.findByPk(user_id, { transaction: t });
      if (!userExists) {
        const hashedPwd = await bcrypt.hash('123456', 10);
        await User.create({
          id: user_id,
          username: `recovered_${user_id}`,
          password_hash: hashedPwd,
          fullname: 'Khách hàng phục hồi',
          email: `${user_id}@greensteps.vn`,
          role: 'traveler'
        }, { transaction: t });
      }

      await Schedule.upsert({
        id: id,
        tour_name: name,
        destination: destination,
        days: days,
        discount: 0,
        carbon: computedCarbon,
        image_url: 'image/Viet Nam.png',
        tour_description: `Hành trình tự thiết kế đi ${destination}`
      }, { transaction: t });

      await ScheduleCustom.upsert({
        id: id,
        user_id: user_id,
        total_cost: totalCost
      }, { transaction: t });

      // Destroy old activities
      await ScheduleActivity.destroy({ where: { schedule_id: id }, transaction: t });

      // Save new activities
      const activitiesToSave = [];
      if (daysData && daysData.length > 0) {
        daysData.forEach((day, dIdx) => {
          day.forEach((act, aIdx) => {
            const actId = `act_${id}_${dIdx + 1}_${aIdx + 1}_${Math.random().toString(36).substring(2, 7)}`;
            activitiesToSave.push({
              id: actId,
              schedule_id: id,
              day_number: dIdx + 1,
              time: act.time || '08:00',
              activity_name: act.name || act.title || '[Địa điểm tự do]',
              activity_cost: act.cost || 0,
              carbon: act.carbon || 0,
              icon: act.icon || 'bi-tree-fill',
              type: act.type || 'attraction',
              coordinates: act.lat && act.lng ? `${act.lat}, ${act.lng}` : null
            });
          });
        });
        await ScheduleActivity.bulkCreate(activitiesToSave, { transaction: t });
      }
    });

    res.json({ success: true, message: 'Đã lưu lịch trình thành công và đồng bộ carbon!' });
  } catch (error) {
    next(error);
  }
};

// 5. Get All Custom Itineraries for a User
exports.getUserCustomItineraries = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const customs = await ScheduleCustom.findAll({ where: { user_id: userId } });
    const result = [];

    for (const c of customs) {
      const base = await Schedule.findByPk(c.id);
      if (!base) continue;

      const activities = await ScheduleActivity.findAll({
        where: { schedule_id: c.id },
        order: [['day_number', 'ASC'], ['time', 'ASC']]
      });

      const daysData = Array.from({ length: base.days }, () => []);
      activities.forEach(act => {
        const dIdx = act.day_number - 1;
        if (dIdx >= 0 && dIdx < base.days) {
          daysData[dIdx].push({
            id: act.id,
            time: act.time,
            name: act.activity_name || '[Địa điểm tự do]',
            cost: act.activity_cost,
            carbon: act.carbon,
            icon: act.icon,
            type: act.type,
            lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
            lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null
          });
        }
      });

      result.push({
        id: c.id,
        name: base.tour_name,
        destination: base.destination || 'Việt Nam',
        days: base.days,
        totalCost: c.total_cost,
        totalCarbon: base.carbon,
        daysData: daysData
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 6. Get Single Custom Itinerary
exports.getCustomItineraryById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const c = await ScheduleCustom.findByPk(id);
    if (!c) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình!' });
    }
    const base = await Schedule.findByPk(id);
    if (!base) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình!' });
    }

    const activities = await ScheduleActivity.findAll({
      where: { schedule_id: id },
      order: [['day_number', 'ASC'], ['time', 'ASC']]
    });

    const daysData = Array.from({ length: base.days }, () => []);
    activities.forEach(act => {
      const dIdx = act.day_number - 1;
      if (dIdx >= 0 && dIdx < base.days) {
        daysData[dIdx].push({
          id: act.id,
          time: act.time,
          name: act.activity_name || '[Địa điểm tự do]',
          cost: act.activity_cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
          lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null
        });
      }
    });

    res.json({
      id: c.id,
      name: base.tour_name,
      destination: base.destination || 'Việt Nam',
      days: base.days,
      totalCost: c.total_cost,
      totalCarbon: base.carbon,
      daysData: daysData
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete Custom Itinerary
exports.deleteCustomItinerary = async (req, res, next) => {
  const { id } = req.params;
  try {
    await sequelize.transaction(async (t) => {
      await ScheduleActivity.destroy({ where: { schedule_id: id }, transaction: t });
      await ScheduleCustom.destroy({ where: { id }, transaction: t });
      await Schedule.destroy({ where: { id }, transaction: t });
    });
    res.json({ success: true, message: 'Đã xóa lịch trình thành công!' });
  } catch (error) {
    next(error);
  }
};

// 8. Get Distinct Destinations List
exports.getDestinations = async (req, res, next) => {
  try {
    const schedules = await Schedule.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('destination')), 'destination']]
    });
    const destinations = schedules.map(s => s.destination).filter(Boolean);
    res.json(destinations);
  } catch (error) {
    next(error);
  }
};

// 9. Post Tour Review
exports.postTourReview = async (req, res, next) => {
  const { userId, tourId, rating, text } = req.body;
  if (!userId || !tourId || !rating || !text) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá!' });
  }

  try {
    const commentId = 'CEPtra' + Date.now().toString().slice(-8);

    const comment = await CommentPost.create({
      id: commentId,
      user_id: userId,
      rating: rating,
      text: text,
      tour_id: tourId
    });

    await CPSS.create({
      comment_id: commentId,
      schedule_sample_id: tourId
    });

    // Rating hooks inside CommentPost automatically update ScheduleSample rating in DB.
    // Fetch newly updated rating to return to client.
    const updatedSample = await ScheduleSample.findByPk(tourId);

    res.json({
      success: true,
      comment,
      rating: updatedSample ? updatedSample.rating : rating,
      votes_count: updatedSample ? updatedSample.votes_count : 1
    });
  } catch (error) {
    next(error);
  }
};

// 10. Get Tour Reviews
exports.getTourReviews = async (req, res, next) => {
  const { tourId } = req.params;
  try {
    const cpssList = await CPSS.findAll({ where: { schedule_sample_id: tourId } });
    const commentIds = cpssList.map(c => c.comment_id);
    const comments = await CommentPost.findAll({
      where: { id: { [Op.in]: commentIds } },
      order: [['createdAt', 'DESC']]
    });

    const reviews = [];
    for (let c of comments) {
      const user = await User.findByPk(c.user_id);
      reviews.push({
        id: c.id,
        user: user ? {
          id: user.id,
          fullname: user.fullname,
          role: user.role
        } : { fullname: 'Người dùng ẩn danh' },
        rating: c.rating,
        text: c.text,
        createdAt: c.createdAt
      });
    }

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};
