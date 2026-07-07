const { Op } = require('sequelize');
const { 
  sequelize, 
  GreenService, 
  BadgeService, 
  Vender, 
  BadgeUser, 
  User, 
  CommentPost, 
  CPGS 
} = require('../models/index');

// 1. Get All Green Services (with optional destination filter)
exports.getServices = async (req, res, next) => {
  try {
    const { destination } = req.query;

    const query = {};
    if (destination) {
      query.destination = { [Op.iLike]: `%${destination}%` };
    }

    const services = await GreenService.findAll({ where: query });
    const formatted = [];

    for (const s of services) {
      const badgeServices = await BadgeService.findAll({ where: { service_id: s.id } });
      const badges = badgeServices.map(bs => bs.badge_name);
      
      const vender = await Vender.findByPk(s.vender_id);
      const providerId = vender ? vender.user_id : 'UG26pro0001';

      formatted.push({
        id: s.id,
        provider_id: providerId,
        name: s.name_service,
        type: s.type,
        destination: s.destination,
        cost: s.cost,
        carbon: s.carbon,
        icon: s.type === 'lodging' || s.type === 'stay' ? 'bi-house-door-fill' : (s.type === 'dining' || s.type === 'food' ? 'bi-cup-hot-fill' : 'bi-tree-fill'),
        status: 'active',
        rating: s.rating,
        bookings_count: s.bookings_count,
        max_capacity: s.max_capacity || 10,
        badges: badges,
        current_data: s.current_data || {}
      });
    }

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

// 2. Get My Services (for provider dashboard)
exports.getProviderServices = async (req, res, next) => {
  const { providerId } = req.params;
  try {
    const vender = await Vender.findOne({ where: { user_id: providerId } });
    const venderId = vender ? vender.id : '';

    const result = await GreenService.findAll({ where: { vender_id: venderId } });
    const mapped = result.map(s => ({
      id: s.id,
      name: s.name_service,
      type: s.type,
      dest: s.destination,
      cost: s.cost,
      status: 'active',
      bookingsCount: s.bookings_count
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

// 3. Add Service (creates Vender if not exists)
exports.addService = async (req, res, next) => {
  const { providerId, name, type, destination, cost, carbon, icon, lat, lng, category, badges, maxCapacity, address } = req.body;

  try {
    let vender = await Vender.findOne({ where: { user_id: providerId } });
    if (!vender) {
      vender = await Vender.create({
        id: 'vender_' + Date.now().toString().slice(-6),
        user_id: providerId,
        registration_date: new Date()
      });
    }

    const serviceId = 'ser_' + Date.now();
    const currentData = {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      address: address || null,
      category: category || (type === 'food' ? 'Ăn uống' : type === 'stay' ? 'Lưu trú' : 'Khám phá'),
      img: 'image/Viet Nam.png'
    };

    const service = await GreenService.create({
      id: serviceId,
      vender_id: vender.id,
      name_service: name,
      type: type,
      cost: cost,
      destination: destination,
      carbon: carbon || 0.5,
      image_url: 'image/Viet Nam.png',
      rating: 5.0,
      bookings_count: 0,
      current_data: currentData,
      max_capacity: maxCapacity || 10
    });

    const badgeList = badges && badges.length > 0 ? badges : ['green'];
    for (const b of badgeList) {
      await BadgeService.create({ badge_name: b, service_id: service.id });
    }

    res.json({
      id: service.id,
      provider_id: providerId,
      name: service.name_service,
      type: service.type,
      destination: service.destination,
      cost: service.cost,
      carbon: service.carbon,
      icon: icon || 'bi-tree-fill',
      status: 'active',
      badges: badgeList,
      current_data: currentData
    });
  } catch (error) {
    next(error);
  }
};

// 4. Personalized Green Service Recommendations
exports.getRecommendations = async (req, res, next) => {
  const { userId } = req.params;
  try {
    // Check traveler interest destination
    const user = await User.findByPk(userId);
    let recommendedServices = [];

    if (user && user.last_interest) {
      recommendedServices = await GreenService.findAll({
        where: { destination: { [Op.iLike]: `%${user.last_interest}%` } }
      });
    }

    // Match traveler badges
    if (recommendedServices.length === 0) {
      const userBadges = await BadgeUser.findAll({ where: { user_id: userId } });
      const badgeNames = userBadges.map(ub => ub.badge_name);
      
      if (badgeNames.length > 0) {
        const badgeServices = await BadgeService.findAll({
          where: { badge_name: { [Op.in]: badgeNames } }
        });
        const serviceIds = [...new Set(badgeServices.map(bs => bs.service_id))];
        if (serviceIds.length > 0) {
          recommendedServices = await GreenService.findAll({
            where: { id: { [Op.in]: serviceIds } }
          });
        }
      }
    }

    // Fallback: top selling services
    if (recommendedServices.length === 0) {
      recommendedServices = await GreenService.findAll({
        order: [['bookings_count', 'DESC']],
        limit: 4
      });
    }

    const formatted = [];
    for (const s of recommendedServices) {
      const badgeServices = await BadgeService.findAll({ where: { service_id: s.id } });
      const vender = await Vender.findByPk(s.vender_id);
      const providerId = vender ? vender.user_id : 'UG26pro0001';
      formatted.push({
        id: s.id,
        provider_id: providerId,
        name: s.name_service,
        type: s.type,
        destination: s.destination,
        cost: s.cost,
        carbon: s.carbon,
        icon: s.type === 'lodging' || s.type === 'stay' ? 'bi-house-door-fill' : (s.type === 'dining' || s.type === 'food' ? 'bi-cup-hot-fill' : 'bi-tree-fill'),
        status: 'active',
        rating: s.rating,
        bookings_count: s.bookings_count,
        max_capacity: s.max_capacity || 10,
        badges: badgeServices.map(bs => bs.badge_name),
        current_data: s.current_data || {}
      });
    }

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

// 5. Post Service Review
exports.postServiceReview = async (req, res, next) => {
  const { userId, serviceId, rating, text } = req.body;
  if (!userId || !serviceId || !rating || !text) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá!' });
  }

  try {
    const commentId = 'CEPser' + Date.now().toString().slice(-8);

    const comment = await CommentPost.create({
      id: commentId,
      user_id: userId,
      rating: rating,
      text: text,
      service_id: serviceId
    });

    await CPGS.create({
      comment_id: commentId,
      service_id: serviceId
    });

    // Recalculate
    const updatedService = await GreenService.findByPk(serviceId);

    res.json({
      success: true,
      comment,
      rating: updatedService ? updatedService.rating : rating
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get Service Reviews
exports.getServiceReviews = async (req, res, next) => {
  const { serviceId } = req.params;
  try {
    const cpgsList = await CPGS.findAll({ where: { service_id: serviceId } });
    const commentIds = cpgsList.map(c => c.comment_id);
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
