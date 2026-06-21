// Global Navigation and Header/Footer dynamic loader
document.addEventListener('DOMContentLoaded', () => {
    initGlobalUI();
});

function initGlobalUI() {
    // 1. Inject Header if container exists
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();
        setupSmartSearch();
        setupNavbarOverflow();
    }

    // 2. Inject Footer if container exists
    const footerContainer = document.getElementById('app-footer');
    if (footerContainer) {
        footerContainer.innerHTML = getFooterHTML();
    }

    // 3. Setup Theme Switcher
    setupThemeToggle();

    // 4. Highlight Active Navigation Link
    highlightActiveLink();

    // 5. Update UI elements based on Session State
    updateSessionUI();

    // 6. Initialize Lucide Icons if available
    
}

function getHeaderHTML() {
    const user = window.Session ? window.Session.getCurrentUser() : null;
    const isPartner = user && user.role === 'provider';
    const currentPath = window.location.pathname;

    let tabsHTML = `
        <li class="menubar-tab ${currentPath.includes('index.html') || currentPath.endsWith('/') ? 'active' : ''}" onclick="window.location.href='index.html'">Trang chủ</li>
        <li class="menubar-tab ${currentPath.includes('community.html') ? 'active' : ''}" onclick="window.location.href='community.html'">Cộng đồng</li>
        <li class="menubar-tab ${currentPath.includes('tours.html') || currentPath.includes('tour_detail.html') || currentPath.includes('schedule_editor.html') ? 'active' : ''}" onclick="window.location.href='tours.html'">Lịch trình</li>
        <li class="menubar-tab" onclick="alert('Tính năng Cẩm Nang Xanh đang phát triển!')">Cẩm nang Xanh</li>
    `;

    if (isPartner) {
        tabsHTML += `
            <li class="menubar-tab partner-only-tab ${currentPath.includes('partner_dashboard.html') ? 'active' : ''}" onclick="window.location.href='partner_dashboard.html'">Thống kê Hiệu quả</li>
            <li class="menubar-tab partner-only-tab ${currentPath.includes('partner_services.html') ? 'active' : ''}" onclick="window.location.href='partner_services.html'">Dịch vụ của tôi</li>
            <li class="menubar-tab partner-only-tab ${currentPath.includes('partner_bookings.html') ? 'active' : ''}" onclick="window.location.href='partner_bookings.html'">Đơn hàng của tôi</li>
            <li class="menubar-tab partner-only-tab ${currentPath.includes('partner_ads.html') ? 'active' : ''}" onclick="window.location.href='partner_ads.html'">Chiến dịch Quảng bá</li>
        `;
    }

    // Account / Auth tab at the rightmost of the navbar
    let accountTabHTML = '';
    if (user) {
        // Logged in: display avatar + username
        const firstLetter = user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U';
        const avatarHTML = user.avatarUrl 
            ? `<img src="${user.avatarUrl}" class="menubar-user-avatar" alt="Avatar">`
            : `<div class="menubar-user-avatar-placeholder">${firstLetter}</div>`;
            
        accountTabHTML = `
            <div class="menubar-tab menubar-account-tab ${currentPath.includes('profile.html') ? 'active' : ''}" onclick="window.location.href='profile.html'" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                ${avatarHTML}
                <span class="menubar-username-text">${user.fullname}</span>
            </div>
        `;
    } else {
        // Not logged in: display Login tab
        accountTabHTML = `
            <div class="menubar-tab menubar-account-tab ${currentPath.includes('auth.html') ? 'active' : ''}" onclick="window.location.href='auth.html'" style="margin-left: auto; display: flex; align-items: center; gap: 6px;">
                <i class="bi bi-person-circle" style="font-size: 16px;"></i>
                <span>Đăng nhập</span>
            </div>
        `;
    }

    return `
        <!-- 1. Header Logo Area (ONLY logo and site name) -->
        <div class="logo-header">
            <a href="index.html" class="logo-container" style="text-decoration:none;">
                <img src="image/greensteps_logo.png" class="logo-icon-img" alt="GreenSteps Travel Logo">
                <span class="logo-text">GreenSteps Travel</span>
            </a>
        </div>

        <!-- 2. Apple-style Navbar Menubar -->
        <nav class="menubar-navbar" id="menubar">
            <ul class="menubar-nav-list" id="menubarTabs">
                ${tabsHTML}
            </ul>
            
            <!-- Smart Search integrated inside Menubar -->
            <div class="menubar-search-container">
                <input type="text" class="menubar-search-input" id="smartSearchInput" placeholder="Tìm Phú Yên, cắm trại..." style="padding-left: 15px;">
                
                <!-- Expandable Smart Filter Dropdown -->
                <div class="search-filter-dropdown" id="searchFilterDropdown">
                    <h4>Bộ lọc hành trình thông minh</h4>
                    <div class="filter-row">
                        <label for="filterDest">Điểm đến</label>
                        <select id="filterDest">
                            <option value="Đà Lạt">Đà Lạt (Cao nguyên & Lâm viên)</option>
                            <option value="Phú Yên">Phú Yên (Biển hoang sơ & Ghềnh đá)</option>
                            <option value="Đà Nẵng - Hội An">Đà Nẵng - Hội An (Di sản & Biển xanh)</option>
                        </select>
                    </div>
                    <div class="filter-row">
                        <label for="filterBudget">Ngân sách dự kiến</label>
                        <select id="filterBudget">
                            <option value="3">Dưới 3 Triệu (Tiết kiệm)</option>
                            <option value="6">3 - 6 Triệu (Tiêu chuẩn)</option>
                            <option value="12">Trên 6 Triệu (Cao cấp)</option>
                        </select>
                    </div>
                    <div class="filter-row">
                        <label for="filterStyle">Phong cách du lịch</label>
                        <select id="filterStyle">
                            <option value="eco">Du lịch xanh (Eco-friendly)</option>
                            <option value="adventure">Khám phá, phượt</option>
                            <option value="relax">Nghỉ dưỡng thuần túy</option>
                        </select>
                    </div>
                    <button class="filter-btn" id="smartFilterApplyBtn">Tìm kiếm đề xuất AI</button>
                </div>
            </div>
            
            <!-- Account Tab -->
            ${accountTabHTML}

            <!-- Dropdown Menu for Overflowing Tabs (Slide down on hover) -->
            <div class="menubar-overflow-panel" id="menubarOverflowPanel"></div>
        </nav>
    `;
}

function getFooterHTML() {
    return `
        <div class="footer-container">
            <div class="footer-brand">
                <div class="logo">
                    <div class="logo-leaf-icon"><i class="bi bi-leaf-fill"></i></div>
                    <span>GreenSteps Travel</span>
                </div>
                <p>Tiên phong trong lĩnh vực du lịch bền vững tại Việt Nam. Khám phá thiên nhiên, bảo vệ môi trường.</p>
                <p class="footer-copyright">© 2026 GreenSteps Travel. All rights reserved.</p>
            </div>
            <div class="footer-links-grid">
                <div class="footer-col">
                    <h4>KHÁM PHÁ</h4>
                    <a href="index.html">Điểm đến</a>
                    <a href="tours.html">Tour du lịch</a>
                    <a href="schedule_editor.html">Lịch trình AI</a>
                </div>
                <div class="footer-col">
                    <h4>DỊCH VỤ</h4>
                    <a href="partner_services.html">Nhà cung cấp dịch vụ</a>
                    <a href="partner_register.html">Hợp tác đối tác</a>
                </div>
                <div class="footer-col">
                    <h4>HỖ TRỢ</h4>
                    <a href="profile.html">Tài khoản của tôi</a>
                    <a href="#">Trung tâm trợ giúp</a>
                </div>
                <div class="footer-col">
                    <h4>PHÁP LÝ</h4>
                    <a href="#">Chính sách bảo mật</a>
                    <a href="#">Điều khoản sử dụng</a>
                    <a href="#">Cookie Settings</a>
                </div>
            </div>
        </div>
    `;
}

function setupThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    let currentTheme = localStorage.getItem('greensteps_theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    btn.innerHTML = currentTheme === 'dark' ? 'Tối' : 'Sáng';

    btn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('greensteps_theme', newTheme);
        btn.innerHTML = newTheme === 'dark' ? 'Tối' : 'Sáng';
    });
}

function setupSmartSearch() {
    const input = document.getElementById('smartSearchInput');
    const dropdown = document.getElementById('searchFilterDropdown');
    const applyBtn = document.getElementById('smartFilterApplyBtn');
    const icon = document.getElementById('smartSearchIcon');

    if (!input || !dropdown) return;

    input.addEventListener('focus', () => {
        dropdown.classList.add('active');
    });

    document.addEventListener('mousedown', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const dest = document.getElementById('filterDest').value;
            const budget = document.getElementById('filterBudget').value;
            const style = document.getElementById('filterStyle').value;
            dropdown.classList.remove('active');
            window.location.href = `tours.html?dest=${encodeURIComponent(dest)}&budget=${budget}&style=${style}`;
        });
    }

    const performSearch = () => {
        const query = input.value.trim();
        if (query) {
            window.location.href = `tours.html?search=${encodeURIComponent(query)}`;
        }
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    if (icon) {
        icon.addEventListener('click', performSearch);
    }
}

function highlightActiveLink() {
    // Active tabs are highlighted dynamically within getHeaderHTML()
}

function updateSessionUI() {
    if (window.onSessionUpdate) {
        window.onSessionUpdate();
    }
}

function handleHeaderLogout() {
    if (window.Session) {
        window.Session.logout();
        window.location.href = 'index.html';
    }
}

function handleHeaderRoleToggle() {
    if (window.Session) {
        const newRole = window.Session.toggleRole();
        if (newRole === 'provider') {
            window.location.href = 'partner_dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

function setupNavbarOverflow() {
    const menubar = document.getElementById('menubar');
    const tabsContainer = document.getElementById('menubarTabs');
    const overflowPanel = document.getElementById('menubarOverflowPanel');
    if (!menubar || !tabsContainer || !overflowPanel) return;

    const checkNavbarOverflow = () => {
        const user = window.Session ? window.Session.getCurrentUser() : null;
        const role = user ? user.role : 'traveler';

        // 1. Reset tabs to default display state
        const tabs = Array.from(tabsContainer.children);
        tabs.forEach(t => {
            // Apply standard display rules based on role
            if (t.classList.contains('partner-only-tab')) {
                t.style.display = (role === 'provider') ? '' : 'none';
            } else {
                t.style.display = '';
            }
        });
        overflowPanel.innerHTML = '';

        // 2. Measure widths
        const menubarWidth = menubar.clientWidth;
        const searchContainer = menubar.querySelector('.menubar-search-container');
        const profileTab = menubar.querySelector('.menubar-tab[onclick*="profile.html"], .menubar-tab[data-tab="profile"]');
        
        const searchWidth = searchContainer ? searchContainer.offsetWidth : 0;
        const profileWidth = profileTab ? profileTab.offsetWidth : 0;
        
        // Available space for header tabs with buffer
        const availableWidth = menubarWidth - searchWidth - profileWidth - 60;
        let currentWidth = 0;
        let overflowHTML = '';

        tabs.forEach(t => {
            // Check only active/visible tabs for the role
            if (t.style.display !== 'none') {
                const itemWidth = t.offsetWidth;
                currentWidth += itemWidth + 8; // Including gap

                if (currentWidth > availableWidth) {
                    // Hide overflow item from primary bar
                    t.style.display = 'none';

                    // Re-render item in overflow dropdown panel
                    const onclickAttr = t.getAttribute('onclick') || '';
                    const dataTabAttr = t.getAttribute('data-tab') || '';
                    const isActive = t.classList.contains('active') ? 'active' : '';

                    overflowHTML += `
                        <div class="menubar-tab ${isActive}" 
                             ${onclickAttr ? `onclick="${onclickAttr}"` : ''} 
                             ${dataTabAttr ? `data-tab="${dataTabAttr}"` : ''}>
                             ${t.innerHTML}
                        </div>
                    `;
                }
            }
        });

        overflowPanel.innerHTML = overflowHTML;
    };

    window.addEventListener('resize', checkNavbarOverflow);
    // Add brief delay to ensure DOM is fully painted before measuring
    setTimeout(checkNavbarOverflow, 50);

    // Hover mouse enter/leave listeners
    menubar.addEventListener('mouseenter', () => {
        if (overflowPanel.innerHTML.trim() !== "") {
            overflowPanel.classList.add('active');
        }
    });

    document.addEventListener('mouseover', (e) => {
        if (!menubar.contains(e.target) && !overflowPanel.contains(e.target)) {
            overflowPanel.classList.remove('active');
        }
    });
}
