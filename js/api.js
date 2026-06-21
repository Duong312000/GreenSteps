// Presets recommendations and destinations mock data
const sampleRecs = {
    "Phú Yên": {
        stay: [
            { id: "py_stay_1", name: "Eco Beach Resort Phú Yên", rating: 4.8, price: 1500000, carbon: 8, icon: "bi-building-fill", badges: ["green", "best seller"] },
            { id: "py_stay_2", name: "Homestay Hoa Vàng Trên Cỏ Xanh", rating: 4.6, price: 400000, carbon: 3, icon: "bi-house-door-fill", badges: ["green", "budget"] }
        ],
        food: [
            { id: "py_food_1", name: "Quán Hải Sản Đầm Ô Loan", rating: 4.7, price: 250000, carbon: 2, icon: "bi-cup-hot-fill", badges: ["budget"] },
            { id: "py_food_2", name: "Bánh Hỏi Lòng Heo Bà Năm", rating: 4.5, price: 60000, carbon: 1, icon: "bi-cup-hot-fill", badges: ["best seller"] }
        ],
        explore: [
            { id: "py_exp_1", name: "Trekking Gành Đá Đĩa hoang sơ", rating: 4.9, price: 150000, carbon: 0, icon: "bi-tree-fill", badges: ["green", "best seller"] },
            { id: "py_exp_2", name: "Tham quan Tháp Nhạn buổi tối", rating: 4.4, price: 50000, carbon: 0.5, icon: "bi-tree-fill", badges: ["budget"] }
        ],
        transport: [
            { id: "py_trans_1", name: "Thuê xe máy điện VinFast", rating: 4.8, price: 120000, carbon: 0.1, icon: "bi-scooter", badges: ["green"] },
            { id: "py_trans_2", name: "Xe ghép đưa đón sân bay Tuy Hòa", rating: 4.6, price: 100000, carbon: 2, icon: "bi-car-front-fill", badges: ["budget"] }
        ]
    },
    "Đà Lạt": {
        stay: [
            { id: "dl_stay_1", name: "Khách sạn Dahlia Đà Lạt", rating: 4.7, price: 850000, carbon: 5, icon: "bi-building-fill", badges: ["best seller"] },
            { id: "dl_stay_2", name: "Dalat Palace Heritage Hotel", rating: 4.9, price: 3500000, carbon: 15, icon: "bi-building-fill", badges: ["luxury"] },
            { id: "dl_stay_3", name: "Homestay Green Valley", rating: 4.8, price: 500000, carbon: 2, icon: "bi-house-door-fill", badges: ["green", "budget"] }
        ],
        food: [
            { id: "dl_food_1", name: "Lẩu gà lá é Tao Ngộ", rating: 4.6, price: 80000, carbon: 1.5, icon: "bi-cup-hot-fill", badges: ["best seller"] },
            { id: "dl_food_2", name: "Cafe Săn Mây Đà Lạt", rating: 4.8, price: 80000, carbon: 0.5, icon: "bi-cup-hot-fill", badges: ["green"] }
        ],
        explore: [
            { id: "dl_exp_1", name: "Dạo chơi Thung lũng Tình Yêu", rating: 4.5, price: 150000, carbon: 3, icon: "bi-tree-fill", badges: [] },
            { id: "dl_exp_2", name: "Ghé Vườn hoa thành phố", rating: 4.4, price: 50000, carbon: 1, icon: "bi-tree-fill", badges: ["budget"] },
            { id: "dl_exp_3", name: "Trượt máng Thác Datanla", rating: 4.8, price: 170000, carbon: 1.2, icon: "bi-tree-fill", badges: ["green", "best seller"] },
            { id: "dl_exp_4", name: "Khám phá Làng Cù Lần", rating: 4.6, price: 200000, carbon: 2, icon: "bi-tree-fill", badges: ["green"] }
        ],
        transport: [
            { id: "dl_trans_1", name: "Xe bus du lịch Đà Lạt", rating: 4.7, price: 100000, carbon: 2, icon: "bi-bus-front-fill", badges: ["green"] },
            { id: "dl_trans_2", name: "Thuê xe máy tự lái Đà Lạt", rating: 4.5, price: 150000, carbon: 5, icon: "bi-motorcycle", badges: [] }
        ]
    },
    "Đà Nẵng - Hội An": {
        stay: [
            { id: "dn_stay_1", name: "Intercontinental Resort Đà Nẵng", rating: 5.0, price: 7990000, carbon: 25, icon: "bi-building-fill", badges: ["luxury", "best seller"] },
            { id: "dn_stay_2", name: "Ninh Binh Eco Lodge Homestay", rating: 4.8, price: 650000, carbon: 3, icon: "bi-house-door-fill", badges: ["green"] }
        ],
        food: [
            { id: "dn_food_1", name: "Hội An Riverside Restaurant", rating: 4.8, price: 350000, carbon: 3, icon: "bi-cup-hot-fill", badges: ["best seller"] },
            { id: "dn_food_2", name: "Bánh mì Phượng Hội An", rating: 4.7, price: 40000, carbon: 0.8, icon: "bi-cup-hot-fill", badges: ["budget"] }
        ],
        explore: [
            { id: "dn_exp_1", name: "Check-in Cầu Vàng Bà Nà Hills", rating: 4.9, price: 900000, carbon: 6, icon: "bi-tree-fill", badges: ["best seller"] },
            { id: "dn_exp_2", name: "Trải nghiệm Phố cổ Hội An", rating: 4.8, price: 120000, carbon: 0, icon: "bi-tree-fill", badges: ["green", "best seller"] }
        ],
        transport: [
            { id: "dn_trans_1", name: "Thuê xe đạp khám phá Hội An", rating: 4.9, price: 50000, carbon: 0, icon: "bi-bicycle", badges: ["green"] },
            { id: "dn_trans_2", name: "Xe đưa đón limousine Đà Nẵng", rating: 4.7, price: 150000, carbon: 4, icon: "bi-bus-front-fill", badges: ["green"] }
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
                { time: "08:00", name: "Đón khách - Khách sạn Dahlia", cost: 0, carbon: 0, icon: "bi-building-fill", id: "t_dl_1" },
                { time: "10:00", name: "Dạo chơi Thung lũng Tình Yêu", cost: 150000, carbon: 3, icon: "bi-tree-fill", id: "t_dl_2" },
                { time: "12:00", name: "Ăn trưa lẩu gà lá é Tao Ngộ", cost: 80000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_dl_3" },
                { time: "14:00", name: "Ghé Vườn hoa thành phố", cost: 50000, carbon: 1, icon: "bi-tree-fill", id: "t_dl_4" }
            ],
            [
                { time: "08:00", name: "Ăn sáng tại khách sạn", cost: 0, carbon: 0, icon: "bi-cup-hot-fill", id: "t_dl_5" },
                { time: "10:00", name: "Trượt máng Thác Datanla", cost: 170000, carbon: 1.2, icon: "bi-tree-fill", id: "t_dl_6" },
                { time: "14:00", name: "Khám phá Làng Cù Lần", cost: 200000, carbon: 2, icon: "bi-tree-fill", id: "t_dl_7" }
            ],
            [
                { time: "08:00", name: "Cafe Săn Mây Đà Lạt", cost: 80000, carbon: 0.5, icon: "bi-cup-hot-fill", id: "t_dl_8" },
                { time: "11:00", name: "Mua sắm đặc sản chợ Đà Lạt", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_dl_9" }
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
                { time: "08:00", name: "Xe limousine đưa đón Tuy Hòa", cost: 150000, carbon: 8, icon: "bi-bus-front-fill", id: "t_py_1" },
                { time: "12:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "bi-house-door-fill", id: "t_py_2" },
                { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "bi-cup-hot-fill", id: "t_py_3" }
            ],
            [
                { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "bi-tree-fill", id: "t_py_4" },
                { time: "14:00", name: "Tham quan Tháp Nhạn", cost: 50000, carbon: 0.5, icon: "bi-tree-fill", id: "t_py_5" }
            ],
            [
                { time: "09:00", name: "Mua sắm đặc sản Tuy Hòa", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_py_6" }
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
                { time: "09:00", name: "Xe limousine đưa đón Đà Nẵng", cost: 150000, carbon: 4, icon: "bi-bus-front-fill", id: "t_dn_1" },
                { time: "13:00", name: "Check-in khách sạn Hội An", cost: 800000, carbon: 5, icon: "bi-building-fill", id: "t_dn_2" },
                { time: "18:00", name: "Ẩm thực phố cổ Hội An", cost: 200000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_dn_3" }
            ],
            [
                { time: "08:00", name: "Check-in Cầu Vàng Bà Nà Hills", cost: 900000, carbon: 6, icon: "bi-tree-fill", id: "t_dn_4" },
                { time: "18:00", name: "Lẩu hải sản Đà Nẵng", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", id: "t_dn_5" }
            ],
            [
                { time: "09:00", name: "Trải nghiệm Phố cổ Hội An", cost: 120000, carbon: 0, icon: "bi-tree-fill", id: "t_dn_6" },
                { time: "15:00", name: "Thuê xe đạp khám phá Hội An", cost: 50000, carbon: 0, icon: "bi-bicycle", id: "t_dn_7" }
            ],
            [
                { time: "09:00", name: "Mua quà lưu niệm & tiễn khách", cost: 100000, carbon: 1, icon: "bi-bag-fill", id: "t_dn_8" }
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
                    { time: "08:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "bi-house-door-fill", id: "sample1" },
                    { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "bi-cup-hot-fill", id: "sample2" }
                ],
                [
                    { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "bi-tree-fill", id: "sample3" },
                    { time: "15:00", name: "Thuê xe máy điện VinFast", cost: 120000, carbon: 0.1, icon: "bi-scooter", id: "sample4" }
                ],
                [
                    { time: "10:00", name: "Bánh Hỏi Lòng Heo Bà Năm", cost: 80000, carbon: 1, icon: "bi-cup-hot-fill", id: "sample5" }
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
            text: "Chuyến đi Phú Yên 3 ngày 2 đêm của mình siêu xanh và đáng nhớ! Nhờ thuê xe điện VinFast mà mình vi vu khắp Tuy Hòa hết rất ít tiền, lại không ồn ào. Các bạn nên ghé qua homestay Hoa Vàng nhé, cực kỳ xinh xắn và chủ nhà thân thiện lắm. Đặc biệt là ngắm bình minh ở Mũi Điện thực sự rất xúc động.",
            tripName: "Tour Phú Yên Biển Xanh 3N2Đ",
            dest: "Phú Yên",
            days: 3,
            likes: 24,
            comments: 8,
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_2",
            author: "Trần Hải Vân",
            avatar: "V",
            time: "Hôm qua",
            rating: 5,
            text: "Tính năng customize lịch trình của GreenSteps rất tiện lợi. Mình có thể thêm bớt địa điểm theo ý thích và hệ thống tự động tính toán lại chi phí. Đáng đồng tiền bát gạo! Chùa Cầu Hội An lúc hoàng hôn cực kỳ lung linh. Mình cũng đã thử tour xe đạp quanh phố cổ, rất thư giãn và bảo vệ môi trường.",
            tripName: "Đà Nẵng - Hội An Văn Hóa 4N3Đ",
            dest: "Đà Nẵng - Hội An",
            days: 4,
            likes: 45,
            comments: 12,
            image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_3",
            author: "Phạm Hoàng Nam",
            avatar: "N",
            time: "3 ngày trước",
            rating: 4,
            text: "Đà Lạt mùa này săn mây siêu đẹp mọi người ơi! Mình vừa hoàn thành chuyến đi xanh 3 ngày không rác thải nhựa. Mình tự mang bình nước cá nhân và nghỉ tại homestay sử dụng năng lượng mặt trời. Mọi người nên thử trekking đỉnh Langbiang thay vì đi xe jeep nhé, mệt nhưng ngắm cảnh đỉnh lắm!",
            tripName: "Đà Lạt Săn Mây & Trekking 3N2Đ",
            dest: "Đà Lạt",
            days: 3,
            likes: 32,
            comments: 5,
            image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_4",
            author: "Lê Minh Thư",
            avatar: "T",
            time: "4 ngày trước",
            rating: 5,
            text: "Gành Đá Đĩa thực sự là một kiệt tác của thiên nhiên. Mình đi vào sáng sớm nên rất vắng, chụp hình thỏa thích. Bữa trưa ăn hải sản ở đầm Ô Loan cực kỳ tươi ngon, nhà hàng ở đây cam kết không dùng đồ nhựa một lần. Ủng hộ lối sống xanh!",
            tripName: "Phú Yên Xanh Mát 3N2Đ",
            dest: "Phú Yên",
            days: 3,
            likes: 18,
            comments: 3,
            image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_5",
            author: "Hoàng Đức Trung",
            avatar: "T",
            time: "5 ngày trước",
            rating: 4,
            text: "Ghé một chiếc quán cà phê nhỏ ở Trại Mát, nhâm nhi tách trà nóng giữa không khí se lạnh. Mình rất vui vì quán tự trồng rau hữu cơ và phân loại rác rất tốt. Một trải nghiệm chữa lành đúng nghĩa sau những ngày làm việc căng thẳng ở Sài Gòn.",
            tripName: "Đà Lạt Chill & Eco-living 2N1Đ",
            dest: "Đà Lạt",
            days: 2,
            likes: 15,
            comments: 2,
            image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_6",
            author: "Đỗ Phương Vy",
            avatar: "V",
            time: "1 tuần trước",
            rating: 5,
            text: "Bán đảo Sơn Trà là lá phổi xanh của Đà Nẵng. Mình đã may mắn nhìn thấy voọc chà vá chân nâu - nữ hoàng linh trưởng ở đây. Nhắc nhở các bạn khi đi nhớ giữ trật tự, không xả rác và tuyệt đối không cho khỉ ăn nhé. Hãy là những du khách văn minh!",
            tripName: "Đà Nẵng Xanh Sơn Trà 3N2Đ",
            dest: "Đà Nẵng - Hội An",
            days: 3,
            likes: 52,
            comments: 14,
            image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_7",
            author: "Ngô Quốc Khánh",
            avatar: "K",
            time: "1 tuần trước",
            rating: 5,
            text: "Ngắm san hô lộ thiên ở Hòn Yến khi thủy triều xuống là trải nghiệm độc nhất vô nhị. Tuy nhiên, san hô rất nhạy cảm nên mọi người tuyệt đối không giẫm đạp hay bẻ san hô mang về nhé. Hãy chỉ để lại những dấu chân và mang đi những bức ảnh đẹp thôi.",
            tripName: "Hành trình biển xanh Hòn Yến 2N1Đ",
            dest: "Phú Yên",
            days: 2,
            likes: 29,
            comments: 6,
            image: "https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=1200&q=80"
        },
        {
            id: "post_8",
            author: "Vũ Mai Chi",
            avatar: "C",
            time: "2 tuần trước",
            rating: 5,
            text: "Một đêm cắm trại bên bờ hồ Tuyền Lâm, không wifi, không khói bụi thành phố. Sáng thức dậy thấy sương mù bảng lảng trên mặt hồ đẹp như tranh vẽ. Trước khi về nhóm mình đã dọn dẹp sạch sẽ toàn bộ khu vực cắm trại, trả lại vẻ đẹp hoang sơ vốn có.",
            tripName: "Camping Hồ Tuyền Lâm Bình Yên 2N1Đ",
            dest: "Đà Lạt",
            days: 2,
            likes: 63,
            comments: 21,
            image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
        }
    ],
    myServices: [
        { id: "ser_1", name: "Homestay Xanh Đà Lạt", type: "stay", dest: "Đà Lạt", cost: 850000, status: "active", bookingsCount: 42 },
        { id: "ser_2", name: "Cafe Săn Mây Đà Lạt", type: "food", dest: "Đà Lạt", cost: 80000, status: "active", bookingsCount: 25 },
        { id: "ser_3", name: "Tour Phú Yên Biển Xanh 3N2Đ", type: "tour", dest: "Phú Yên", cost: 1890000, status: "active", bookingsCount: 16 }
    ],
    bookings: [
        { id: "BK-1042", customer: "Nguyễn Văn A", service: "Tour Phú Yên Biển Xanh 3N2Đ", date: "12/10/2026", guests: 2, value: 4500000, status: "deposit" },
        { id: "BK-1041", customer: "Trần Thị B", service: "Homestay Xanh Đà Lạt", date: "15/10/2026", guests: 4, value: 8200000, status: "pending" },
        { id: "BK-1040", customer: "Lê Hoàng C", service: "Cafe Săn Mây Đà Lạt", date: "20/10/2026", guests: 1, value: 1200000, status: "deposit" },
        { id: "BK-1039", customer: "Phạm Văn D", service: "Homestay Xanh Đà Lạt", date: "10/10/2026", guests: 2, value: 3400000, status: "deposit" },
        { id: "BK-1038", customer: "Hoàng Thị E", service: "Cafe Săn Mây Đà Lạt", date: "09/10/2026", guests: 2, value: 160000, status: "deposit" },
        { id: "BK-1037", customer: "Đỗ Minh F", service: "Tour Phú Yên Biển Xanh 3N2Đ", date: "08/10/2026", guests: 3, value: 5670000, status: "deposit" },
        { id: "BK-1036", customer: "Ngô Quốc G", service: "Homestay Xanh Đà Lạt", date: "05/10/2026", guests: 1, value: 850000, status: "completed" },
        { id: "BK-1035", customer: "Vũ Tuấn H", service: "Cafe Săn Mây Đà Lạt", date: "02/10/2026", guests: 4, value: 320000, status: "deposit" }
    ],
    transactions: [
        { id: "GD-2026060101", type: "deposit", desc: "Nạp tiền ví du lịch", date: "01/06/2026", amount: 2000000, status: "success" },
        { id: "GD-2026060202", type: "payment", desc: "Đặt cọc Tour Phú Yên", date: "02/06/2026", amount: -1200000, status: "success" },
        { id: "GD-2026060403", type: "refund", desc: "Hoàn tiền dịch vụ xe điện", date: "04/06/2026", amount: 300000, status: "success" }
    ]
};

// Database APIs
function getDbState() {
    let state = localStorage.getItem('greensteps_state_v4');
    if (!state) {
        localStorage.setItem('greensteps_state_v4', JSON.stringify(defaultState));
        return defaultState;
    }
    try {
        return JSON.parse(state);
    } catch(e) {
        localStorage.setItem('greensteps_state_v4', JSON.stringify(defaultState));
        return defaultState;
    }
}

function saveDbState(state) {
    localStorage.setItem('greensteps_state_v4', JSON.stringify(state));
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
            booking.status = "deposit";
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
