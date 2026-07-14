const { GreenService } = require('../src/models/index');

const serviceImages = [
  // Lodging (Stay)
  {
    type: 'stay',
    dest: 'Đà Lạt',
    images: [
      'image/da-lat/da-lat-nghi-duong-ven-ho-01.jpg',
      'image/da-lat/da-lat-rung-thong-san-may-01.jpg',
      'image/da-lat/da-lat-hem-pho-01.jpg'
    ]
  },
  {
    type: 'stay',
    dest: 'Đà Nẵng - Hội An',
    images: [
      'image/da-nang-hoi-an/hoi-an-hem-pho-co-01.jpg',
      'image/da-nang-hoi-an/hoi-an-checkin-pho-co-01.jpg'
    ]
  },
  {
    type: 'stay',
    dest: 'Phú Yên',
    images: [
      'image/phu-yen/phu-yen-bai-bien-dua-01.jpg'
    ]
  },
  // Dining (Food)
  {
    type: 'food',
    dest: 'Đà Lạt',
    images: [
      'image/da-lat/da-lat-diem-ngam-thanh-pho-01.jpg'
    ]
  },
  {
    type: 'food',
    dest: 'Đà Nẵng - Hội An',
    images: [
      'image/da-nang-hoi-an/hoi-an-ca-phe-dia-phuong-01.jpg',
      'image/da-nang-hoi-an/hoi-an-lang-rau-tra-que-01.jpg'
    ]
  },
  {
    type: 'food',
    dest: 'Phú Yên',
    images: [
      'image/phu-yen/phu-yen-lang-chai-vung-ro-01.jpg'
    ]
  },
  // Transport
  {
    type: 'transport',
    dest: 'Đà Lạt',
    images: [
      'image/da-lat/da-lat-doc-pho-01.jpg'
    ]
  },
  {
    type: 'transport',
    dest: 'Đà Nẵng - Hội An',
    images: [
      'image/da-nang-hoi-an/hoi-an-pho-co-xe-dap-01.jpg'
    ]
  },
  {
    type: 'transport',
    dest: 'Phú Yên',
    images: [
      'image/phu-yen/phu-yen-duong-ven-bien-01.jpg'
    ]
  }
];

function getContextualImage(name, type, destination) {
  const normName = name.toLowerCase();
  const normDest = destination.toLowerCase();

  // Special attractions match
  if (type === 'attraction') {
    if (normDest.includes('đà lạt') || normDest.includes('dalat')) {
      if (normName.includes('tuyền lâm')) return 'image/da-lat/da-lat-ho-tuyen-lam-01.jpg';
      if (normName.includes('xuân hương')) return 'image/da-lat/da-lat-ho-xuan-huong-01.jpg';
      if (normName.includes('thác') || normName.includes('datanla')) return 'image/da-lat/da-lat-thac-nuoc-01.jpg';
      if (normName.includes('thông') || normName.includes('langbiang')) return 'image/da-lat/da-lat-rung-thong-01.jpg';
      if (normName.includes('chùa')) return 'image/da-lat/da-lat-chua-linh-phuoc-01.jpg';
      if (normName.includes('hoa')) return 'image/da-lat/da-lat-vuon-hoa-01.jpg';
      return 'image/da-lat/da-lat-quang-truong-lam-vien-01.jpg';
    }
    if (normDest.includes('đà nẵng') || normDest.includes('hội an') || normDest.includes('da nang') || normDest.includes('hoi an')) {
      if (normName.includes('cầu rồng')) return 'image/da-nang-hoi-an/da-nang-cau-rong-hoang-hon-01.jpg';
      if (normName.includes('cầu vàng') || normName.includes('bà nà') || normName.includes('bana')) return 'image/da-nang-hoi-an/da-nang-cau-vang-binh-minh-01.jpg';
      if (normName.includes('sơn trà') || normName.includes('linh ứng')) return 'image/da-nang-hoi-an/da-nang-son-tra-rung-xanh-01.jpg';
      if (normName.includes('hội an') || normName.includes('phố cổ') || normName.includes('old town')) return 'image/da-nang-hoi-an/hoi-an-pho-co-den-long-01.jpg';
      if (normName.includes('cù lao chàm') || normName.includes('snorkeling')) return 'image/da-nang-hoi-an/da-nang-bien-my-khe-01.jpg';
      if (normName.includes('thuyền thúng') || normName.includes('dừa')) return 'image/da-nang-hoi-an/hoi-an-song-hoai-hoa-dang-01.jpg';
      return 'image/da-nang-hoi-an/da-nang-cau-vang-ba-na-hills-01.jpg';
    }
    if (normDest.includes('phú yên') || normDest.includes('phu yen')) {
      if (normName.includes('mũi điện') || normName.includes('bãi môn')) return 'image/phu-yen/phu-yen-mui-dien-bai-mon-01.jpg';
      if (normName.includes('bãi xép') || normName.includes('ghềnh ông')) return 'image/phu-yen/phu-yen-bai-xep-checkin-01.jpg';
      if (normName.includes('đá đĩa')) return 'image/phu-yen/phu-yen-bai-da-ven-bien-01.jpg';
      return 'image/phu-yen/phu-yen-thap-nghinh-phong-01.jpg';
    }
  }

  // Find standard mapping
  const match = serviceImages.find(x => x.type === type && (x.dest.toLowerCase().includes(normDest) || normDest.includes(x.dest.toLowerCase())));
  if (match && match.images.length > 0) {
    // Pick an image based on hash of service name to keep it consistent but diverse
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % match.images.length;
    return match.images[idx];
  }

  // Fallbacks
  if (normDest.includes('phú yên') || normDest.includes('phu yen')) {
    return 'image/phu-yen/phu-yen-canh-quan-xanh-01.jpg';
  }
  if (normDest.includes('đà nẵng') || normDest.includes('hội an') || normDest.includes('da nang') || normDest.includes('hoi an')) {
    return 'image/da-nang-hoi-an/da-nang-cau-vang-ba-na-hills-01.jpg';
  }
  return 'image/da-lat/da-lat-ho-tuyen-lam-01.jpg';
}

async function update() {
  try {
    const services = await GreenService.findAll();
    console.log(`Updating ${services.length} services...`);
    
    let count = 0;
    for (const s of services) {
      // Map vender to Duong: vender_26duo01
      const mappedVender = 'vender_26duo01';
      
      // Determine correct contextual image
      const mappedImg = getContextualImage(s.name_service, s.type, s.destination);
      
      const oldImg = s.image_url;
      const oldVender = s.vender_id;
      
      // Update record
      s.vender_id = mappedVender;
      s.image_url = mappedImg;
      
      // Keep current_data sync if it exists
      if (s.current_data) {
        s.current_data = {
          ...s.current_data,
          img: mappedImg
        };
        s.changed('current_data', true);
      }
      
      await s.save();
      count++;
      console.log(`[${count}/${services.length}] ID: ${s.id} -> Name: "${s.name_service}"`);
      console.log(`   - Vender: ${oldVender} -> ${mappedVender}`);
      console.log(`   - Image: ${oldImg} -> ${mappedImg}`);
    }
    
    console.log('Update complete!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

update();
