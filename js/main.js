// Global Navigation and Header/Footer dynamic loader
document.addEventListener('DOMContentLoaded', () => {
    initGlobalUI();
});

function initGlobalUI() {
    // 1. Inject Header if container exists
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();
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
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function getHeaderHTML() {
    const user = window.Session ? window.Session.getCurrentUser() : null;
    const isPartner = user && user.role === 'provider';
    const currentPath = window.location.pathname;

    let navLinksHTML = `
        <a href="index.html" class="nav-link-item ${currentPath.includes('index.html') ? 'active' : ''}">Điểm đến</a>
        <a href="tours.html" class="nav-link-item ${currentPath.includes('tours.html') || currentPath.includes('tour_detail.html') ? 'active' : ''}">Tour du lịch</a>
        <a href="schedule_editor.html" class="nav-link-item ${currentPath.includes('schedule_editor.html') ? 'active' : ''}">Lịch trình AI</a>
        <a href="community.html" class="nav-link-item ${currentPath.includes('community.html') ? 'active' : ''}">Cộng đồng</a>
    `;

    if (isPartner) {
        navLinksHTML += `
            <a href="partner_dashboard.html" class="nav-link-item partner-only ${currentPath.includes('partner_dashboard.html') ? 'active' : ''}">Thống kê đối tác</a>
            <a href="partner_services.html" class="nav-link-item partner-only ${currentPath.includes('partner_services.html') ? 'active' : ''}">Quản lý dịch vụ</a>
        `;
    }

    let authButtonHTML = '';
    if (user) {
        const wallet = window.API ? window.API.getWalletInfo() : { registered: false, balance: 0 };
        const walletText = wallet.registered ? `<span class="header-wallet-bal">💳 ${wallet.balance.toLocaleString('vi-VN')}đ</span>` : '';
        
        authButtonHTML = `
            <div class="user-session-header">
                ${walletText}
                <a href="profile.html" class="header-username-btn" title="Quản lý tài khoản">👤 ${user.fullname}</a>
                <button onclick="handleHeaderRoleToggle()" class="header-role-toggle-btn" title="Chuyển vai trò">
                    ${isPartner ? '🔄 Traveler Mode' : '🔄 Partner Mode'}
                </button>
                <button onclick="handleHeaderLogout()" class="header-logout-btn">Đăng xuất</button>
            </div>
        `;
    } else {
        authButtonHTML = `
            <a href="auth.html" class="header-login-btn">Đăng nhập</a>
        `;
    }

    return `
        <div class="header-container">
            <a href="index.html" class="logo">
                <div class="logo-leaf-icon">🍃</div>
                <span>GreenSteps</span>
            </a>
            <nav class="nav-links">
                ${navLinksHTML}
            </nav>
            <div class="header-actions">
                <button class="action-btn" title="Tìm kiếm"><i data-lucide="search"></i></button>
                <button class="action-btn" title="Yêu thích"><i data-lucide="heart"></i></button>
                <button class="action-btn" title="Ngôn ngữ"><i data-lucide="globe"></i></button>
                <button class="action-btn theme-toggle" id="themeToggleBtn" title="Đổi theme">
                    <i data-lucide="moon" id="themeIcon"></i>
                </button>
                ${authButtonHTML}
            </div>
        </div>
    `;
}

function getFooterHTML() {
    return `
        <div class="footer-container">
            <div class="footer-brand">
                <div class="logo">
                    <div class="logo-leaf-icon">🍃</div>
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
    updateThemeIcon(currentTheme);

    btn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('greensteps_theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (theme === 'dark') {
        icon.setAttribute('data-lucide', 'sun');
    } else {
        icon.setAttribute('data-lucide', 'moon');
    }
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.endsWith(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function updateSessionUI() {
    // Dynamic callback placeholder if pages need to update content after header load
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
