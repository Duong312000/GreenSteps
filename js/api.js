// Presets recommendations and destinations mock data
const sampleRecs = {
    "Phú Yên": {
        stay: [
            { id: "py_stay_1", name: "Eco Beach Resort Phú Yên", rating: 4.8, price: 1500000, carbon: 8, icon: "🏨", badges: ["green", "best seller"] },
            { id: "py_stay_2", name: "Homestay Hoa Vàng Trên Cỏ Xanh", rating: 4.6, price: 400000, carbon: 3, icon: "🏡", badges: ["green", "budget"] }
        ],
        food: [
            { id: "py_food_1", name: "Quán Hải Sản Đầm Ô Loan", rating: 4.7, price: 250000, carbon: 2, icon: "🍲", badges: ["budget"] },
            { id: "py_food_2", name: "Bánh Hỏi Lòng Heo Bà Năm", rating: 4.5, price: 60000, carbon: 1, icon: "🍲", badges: ["best seller"] }
        ],
        explore: [
            { id: "py_exp_1", name: "Trekking Gành Đá Đĩa hoang sơ", rating: 4.9, price: 150000, carbon: 0, icon: "🏞️", badges: ["green", "best seller"] },
            { id: "py_exp_2", name: "Tham quan Tháp Nhạn buổi tối", rating: 4.4, price: 50000, carbon: 0.5, icon: "🏞️", badges: ["budget"] }
        ],
        transport: [
            { id: "py_trans_1", name: "Thuê xe máy điện VinFast", rating: 4.8, price: 120000, carbon: 0.1, icon: "🛵", badges: ["green"] },
            { id: "py_trans_2", name: "Xe ghép đưa đón sân bay Tuy Hòa", rating: 4.6, price: 100000, carbon: 2, icon: "🚗", badges: ["budget"] }
        ]
    },
    "Đà Lạt": {
        stay: [
            { id: "dl_stay_1", name: "Khách sạn Dahlia Đà Lạt", rating: 4.7, price: 850000, carbon: 5, icon: "🏨", badges: ["best seller"] },
            { id: "dl_stay_2", name: "Dalat Palace Heritage Hotel", rating: 4.9, price: 3500000, carbon: 15, icon: "🏨", badges: ["luxury"] },
            { id: "dl_stay_3", name: "Homestay Green Valley", rating: 4.8, price: 500000, carbon: 2, icon: "🏡", badges: ["green", "budget"] }
        ],
        food: [
            { id: "dl_food_1", name: "Lẩu gà lá é Tao Ngộ", rating: 4.6, price: 80000, carbon: 1.5, icon: "🍲", badges: ["best seller"] },
            { id: "dl_food_2", name: "Cafe Săn Mây Đà Lạt", rating: 4.8, price: 80000, carbon: 0.5, icon: "☕", badges: ["green"] }
        ],
        explore: [
            { id: "dl_exp_1", name: "Dạo chơi Thung lũng Tình Yêu", rating: 4.5, price: 150000, carbon: 3, icon: "🏞️", badges: [] },
            { id: "dl_exp_2", name: "Ghé Vườn hoa thành phố", rating: 4.4, price: 50000, carbon: 1, icon: "🏞️", badges: ["budget"] },
            { id: "dl_exp_3", name: "Trượt máng Thác Datanla", rating: 4.8, price: 170000, carbon: 1.2, icon: "🏞️", badges: ["green", "best seller"] },
            { id: "dl_exp_4", name: "Khám phá Làng Cù Lần", rating: 4.6, price: 200000, carbon: 2, icon: "🏞️", badges: ["green"] }
        ],
        transport: [
            { id: "dl_trans_1", name: "Xe bus du lịch Đà Lạt", rating: 4.7, price: 100000, carbon: 2, icon: "🚌", badges: ["green"] },
            { id: "dl_trans_2", name: "Thuê xe máy tự lái Đà Lạt", rating: 4.5, price: 150000, carbon: 5, icon: "🏍️", badges: [] }
        ]
    },
    "Đà Nẵng - Hội An": {
        stay: [
            { id: "dn_stay_1", name: "Intercontinental Resort Đà Nẵng", rating: 5.0, price: 7990000, carbon: 25, icon: "🏨", badges: ["luxury", "best seller"] },
            { id: "dn_stay_2", name: "Ninh Binh Eco Lodge Homestay", rating: 4.8, price: 650000, carbon: 3, icon: "🏡", badges: ["green"] }
        ],
        food: [
            { id: "dn_food_1", name: "Hội An Riverside Restaurant", rating: 4.8, price: 350000, carbon: 3, icon: "🍲", badges: ["best seller"] },
            { id: "dn_food_2", name: "Bánh mì Phượng Hội An", rating: 4.7, price: 40000, carbon: 0.8, icon: "🍲", badges: ["budget"] }
        ],
        explore: [
            { id: "dn_exp_1", name: "Check-in Cầu Vàng Bà Nà Hills", rating: 4.9, price: 900000, carbon: 6, icon: "🏞️", badges: ["best seller"] },
            { id: "dn_exp_2", name: "Trải nghiệm Phố cổ Hội An", rating: 4.8, price: 120000, carbon: 0, icon: "🏞️", badges: ["green", "best seller"] }
        ],
        transport: [
            { id: "dn_trans_1", name: "Thuê xe đạp khám phá Hội An", rating: 4.9, price: 50000, carbon: 0, icon: "🚲", badges: ["green"] },
            { id: "dn_trans_2", name: "Xe đưa đón limousine Đà Nẵng", rating: 4.7, price: 150000, carbon: 4, icon: "🚌", badges: ["green"] }
        ]
    }
};

const presetTours = [
    {
        id: "preset_dl",
        title: "Tour Đà Lạt Gia Đình 3N2Đ",
        destination: "Đà Lạt",
        days: 3,
        cost: 1890000,
        carbon: 45,
        image: "image/1dc8619487310884c9d631d689ece1e7.jpg",
        badges: ["Gia đình", "Phổ biến"],
        description: "Trải nghiệm 3 ngày 2 đêm tuyệt vời tại thành phố ngàn hoa Đà Lạt cùng gia đình. Tour được thiết kế đặc biệt cho các gia đình có trẻ nhỏ.",
        data: [
            [
                { time: "08:00", name: "Đón khách - Khách sạn Dahlia", cost: 0, carbon: 0, icon: "🏨", id: "t_dl_1" },
                { time: "10:00", name: "Dạo chơi Thung lũng Tình Yêu", cost: 150000, carbon: 3, icon: "🏞️", id: "t_dl_2" },
                { time: "12:00", name: "Ăn trưa lẩu gà lá é Tao Ngộ", cost: 80000, carbon: 1.5, icon: "🍲", id: "t_dl_3" },
                { time: "14:00", name: "Ghé Vườn hoa thành phố", cost: 50000, carbon: 1, icon: "🏞️", id: "t_dl_4" }
            ],
            [
                { time: "08:00", name: "Ăn sáng tại khách sạn", cost: 0, carbon: 0, icon: "🍲", id: "t_dl_5" },
                { time: "10:00", name: "Trượt máng Thác Datanla", cost: 170000, carbon: 1.2, icon: "🏞️", id: "t_dl_6" },
                { time: "14:00", name: "Khám phá Làng Cù Lần", cost: 200000, carbon: 2, icon: "🏞️", id: "t_dl_7" }
            ],
            [
                { time: "08:00", name: "Cafe Săn Mây Đà Lạt", cost: 80000, carbon: 0.5, icon: "☕", id: "t_dl_8" },
                { time: "11:00", name: "Mua sắm đặc sản chợ Đà Lạt", cost: 100000, carbon: 1, icon: "🍲", id: "t_dl_9" }
            ]
        ]
    },
    {
        id: "preset_py",
        title: "Tour Phú Yên Biển Xanh 3N2Đ",
        destination: "Phú Yên",
        days: 3,
        cost: 2490000,
        carbon: 25,
        image: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg",
        badges: ["Xanh lá", "Bán chạy"],
        description: "Nghỉ dưỡng 3 ngày tại Eco Beach Resort, khám phá gành Đá Đĩa hoang sơ, đầm Ô Loan và di chuyển bằng xe máy điện.",
        data: [
            [
                { time: "08:00", name: "Xe limousine đưa đón Tuy Hòa", cost: 150000, carbon: 8, icon: "🚌", id: "t_py_1" },
                { time: "12:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "🏡", id: "t_py_2" },
                { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "🍲", id: "t_py_3" }
            ],
            [
                { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "🏞️", id: "t_py_4" },
                { time: "14:00", name: "Tham quan Tháp Nhạn", cost: 50000, carbon: 0.5, icon: "🏞️", id: "t_py_5" }
            ],
            [
                { time: "09:00", name: "Mua sắm đặc sản Tuy Hòa", cost: 100000, carbon: 1, icon: "🍲", id: "t_py_6" }
            ]
        ]
    },
    {
        id: "preset_dn",
        title: "Đà Nẵng - Hội An Văn Hóa 4N3Đ",
        destination: "Đà Nẵng - Hội An",
        days: 4,
        cost: 3990000,
        carbon: 32,
        image: "image/Viet Nam.png",
        badges: ["Văn hóa", "Trải nghiệm"],
        description: "Cầu Vàng nổi tiếng thế giới, phố cổ Hội An lung linh đèn lồng, chùa Cầu và những công trình kiến trúc độc đáo.",
        data: [
            [
                { time: "09:00", name: "Xe limousine đưa đón Đà Nẵng", cost: 150000, carbon: 4, icon: "🚌", id: "t_dn_1" },
                { time: "13:00", name: "Check-in khách sạn Hội An", cost: 800000, carbon: 5, icon: "🏨", id: "t_dn_2" },
                { time: "18:00", name: "Ẩm thực phố cổ Hội An", cost: 200000, carbon: 1.5, icon: "🍲", id: "t_dn_3" }
            ],
            [
                { time: "08:00", name: "Check-in Cầu Vàng Bà Nà Hills", cost: 900000, carbon: 6, icon: "🏞️", id: "t_dn_4" },
                { time: "18:00", name: "Lẩu hải sản Đà Nẵng", cost: 300000, carbon: 3, icon: "🍲", id: "t_dn_5" }
            ],
            [
                { time: "09:00", name: "Trải nghiệm Phố cổ Hội An", cost: 120000, carbon: 0, icon: "🏞️", id: "t_dn_6" },
                { time: "15:00", name: "Thuê xe đạp khám phá Hội An", cost: 50000, carbon: 0, icon: "🚲", id: "t_dn_7" }
            ],
            [
                { time: "09:00", name: "Mua quà lưu niệm & tiễn khách", cost: 100000, carbon: 1, icon: "🛍️", id: "t_dn_8" }
            ]
        ]
    }
];

const defaultState = {
    role: 'traveler', // traveler | provider
    walletRegistered: false,
    walletBalance: 0,
    itineraries: [
        {
            id: "iti_sample",
            name: "Lịch trình Phú Yên của tôi",
            destination: "Phú Yên",
            days: 3,
            totalCost: 1000000,
            totalCarbon: 13,
            daysData: [
                [
                    { time: "08:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "🏡", id: "sample1" },
                    { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "🍲", id: "sample2" }
                ],
                [
                    { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "🏞️", id: "sample3" },
                    { time: "15:00", name: "Thuê xe máy điện VinFast", cost: 120000, carbon: 0.1, icon: "🛵", id: "sample4" }
                ],
                [
                    { time: "10:00", name: "Bánh Hỏi Lòng Heo Bà Năm", cost: 80000, carbon: 1, icon: "🍲", id: "sample5" }
                ]
            ]
        }
    ],
    activeItineraryId: null,
    activeDayIndex: 0,
    theme: 'light',
    communityPosts: [
        {
            id: "post_1",
            author: "Nguyễn Minh Anh",
            avatar: "A",
            time: "2 giờ trước",
            rating: 5,
            text: "Chuyến đi Phú Yên 3 ngày 2 đêm của mình siêu xanh và đáng nhớ! Nhờ thuê xe điện VinFast mà mình vi vu khắp Tuy Hòa hết rất ít tiền, lại không ồn ào. Các bạn nên ghé qua homestay Hoa Vàng nhé, cực kỳ xinh xắn và chủ nhà thân thiện lắm.",
            tripName: "Tour Phú Yên Biển Xanh 3N2Đ",
            dest: "Phú Yên",
            days: 3,
            likes: 24,
            comments: 8
        },
        {
            id: "post_2",
            author: "Trần Hải Vân",
            avatar: "V",
            time: "Hôm qua",
            rating: 5,
            text: "Tính năng customize lịch trình của GreenSteps rất tiện lợi. Mình có thể thêm bớt địa điểm theo ý thích và hệ thống tự động tính toán lại chi phí. Đáng đồng tiền bát gạo! Chùa Cầu Hội An lúc hoàng hôn cực kỳ lung linh.",
            tripName: "Đà Nẵng - Hội An Văn Hóa 4N3Đ",
            dest: "Đà Nẵng - Hội An",
            days: 4,
            likes: 45,
            comments: 12
        }
    ],
    myServices: [
        { id: "ser_1", name: "Homestay Xanh Đà Lạt", type: "stay", dest: "Đà Lạt", cost: 850000, status: "active", bookingsCount: 42 },
        { id: "ser_2", name: "Cafe Săn Mây Đà Lạt", type: "food", dest: "Đà Lạt", cost: 80000, status: "active", bookingsCount: 25 },
        { id: "ser_3", name: "Tour Phú Yên Biển Xanh 3N2Đ", type: "tour", dest: "Phú Yên", cost: 1890000, status: "active", bookingsCount: 16 }
    ],
    bookings: [
        { id: "BK-1042", customer: "Nguyễn Văn A", service: "Tour Phú Yên Biển Xanh 3N2Đ", date: "12/10/2026", guests: 2, value: 4500000, status: "approved" },
        { id: "BK-1041", customer: "Trần Thị B", service: "Homestay Xanh Đà Lạt", date: "15/10/2026", guests: 4, value: 8200000, status: "pending" },
        { id: "BK-1040", customer: "Lê Hoàng C", service: "Cafe Săn Mây Đà Lạt", date: "20/10/2026", guests: 1, value: 1200000, status: "approved" }
    ],
    transactions: [
        { id: "GD-2026060101", type: "deposit", desc: "Nạp tiền ví du lịch", date: "01/06/2026", amount: 2000000, status: "success" },
        { id: "GD-2026060202", type: "payment", desc: "Đặt cọc Tour Phú Yên", date: "02/06/2026", amount: -1200000, status: "success" },
        { id: "GD-2026060403", type: "refund", desc: "Hoàn tiền dịch vụ xe điện", date: "04/06/2026", amount: 300000, status: "success" }
    ]
};

// Database APIs
function getDbState() {
    let state = localStorage.getItem('greensteps_state_v3');
    if (!state) {
        localStorage.setItem('greensteps_state_v3', JSON.stringify(defaultState));
        return defaultState;
    }
    try {
        return JSON.parse(state);
    } catch(e) {
        localStorage.setItem('greensteps_state_v3', JSON.stringify(defaultState));
        return defaultState;
    }
}

function saveDbState(state) {
    localStorage.setItem('greensteps_state_v3', JSON.stringify(state));
}

// Exportable functions
const API = {
    getItineraries: () => {
        return getDbState().itineraries;
    },
    getItinerary: (id) => {
        return getDbState().itineraries.find(iti => iti.id === id) || null;
    },
    saveItinerary: (itinerary) => {
        let state = getDbState();
        let idx = state.itineraries.findIndex(iti => iti.id === itinerary.id);
        if (idx !== -1) {
            state.itineraries[idx] = itinerary;
        } else {
            state.itineraries.push(itinerary);
        }
        saveDbState(state);
    },
    deleteItinerary: (id) => {
        let state = getDbState();
        state.itineraries = state.itineraries.filter(iti => iti.id !== id);
        saveDbState(state);
    },
    getWalletInfo: () => {
        let state = getDbState();
        return {
            registered: state.walletRegistered,
            balance: state.walletBalance
        };
    },
    registerWallet: () => {
        let state = getDbState();
        state.walletRegistered = true;
        state.walletBalance = 5000000; // Gift balance 5,000,000đ
        state.transactions.unshift({
            id: "GD-" + Date.now().toString().slice(-10),
            type: "deposit",
            desc: "Quà tặng kích hoạt ví du lịch",
            date: new Date().toLocaleDateString('vi-VN'),
            amount: 5000000,
            status: "success"
        });
        saveDbState(state);
        return { balance: state.walletBalance };
    },
    depositWallet: (amount) => {
        let state = getDbState();
        state.walletBalance += amount;
        state.transactions.unshift({
            id: "GD-" + Date.now().toString().slice(-10),
            type: "deposit",
            desc: "Nạp tiền vào ví du lịch",
            date: new Date().toLocaleDateString('vi-VN'),
            amount: amount,
            status: "success"
        });
        saveDbState(state);
        return state.walletBalance;
    },
    payItinerary: (id, amount) => {
        let state = getDbState();
        if (state.walletBalance < amount) {
            return { success: false, message: "Số dư ví không đủ để thanh toán!" };
        }
        state.walletBalance -= amount;
        state.transactions.unshift({
            id: "GD-" + Date.now().toString().slice(-10),
            type: "payment",
            desc: `Thanh toán gộp lịch trình #${id}`,
            date: new Date().toLocaleDateString('vi-VN'),
            amount: -amount,
            status: "success"
        });
        saveDbState(state);
        return { success: true, balance: state.walletBalance };
    },
    getTransactions: () => {
        return getDbState().transactions;
    },
    getCommunityPosts: () => {
        return getDbState().communityPosts;
    },
    addCommunityPost: (post) => {
        let state = getDbState();
        const newPost = {
            id: "post_" + Date.now(),
            author: post.author || "Nguyễn Minh Anh",
            avatar: post.avatar || "A",
            time: "Vừa xong",
            rating: post.rating || 5,
            text: post.text,
            tripName: post.tripName || "",
            dest: post.dest || "",
            days: post.days || 1,
            likes: 0,
            comments: 0
        };
        state.communityPosts.unshift(newPost);
        saveDbState(state);
        return newPost;
    },
    getMyServices: () => {
        return getDbState().myServices;
    },
    addMyService: (service) => {
        let state = getDbState();
        const newService = {
            id: "ser_" + Date.now(),
            name: service.name,
            type: service.type,
            dest: service.dest,
            cost: service.cost,
            status: "active",
            bookingsCount: 0
        };
        state.myServices.push(newService);
        saveDbState(state);
        return newService;
    },
    getBookings: () => {
        return getDbState().bookings;
    },
    approveBooking: (id) => {
        let state = getDbState();
        let booking = state.bookings.find(bk => bk.id === id);
        if (booking) {
            booking.status = "approved";
            // Mock transaction refund or balance logic if supplier
            saveDbState(state);
        }
    },
    rejectBooking: (id) => {
        let state = getDbState();
        let booking = state.bookings.find(bk => bk.id === id);
        if (booking) {
            booking.status = "rejected";
            saveDbState(state);
        }
    }
};

window.API = API;
