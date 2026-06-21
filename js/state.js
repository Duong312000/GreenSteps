// User session & authentication state management
const Session = {
    getCurrentUser: () => {
        let user = localStorage.getItem('greensteps_user');
        if (!user) return null;
        try {
            return JSON.parse(user);
        } catch (e) {
            return null;
        }
    },
    setCurrentUser: (user) => {
        localStorage.setItem('greensteps_user', JSON.stringify(user));
        // Update role in DB state
        let dbState = localStorage.getItem('greensteps_state_v4');
        if (dbState) {
            try {
                let parsed = JSON.parse(dbState);
                parsed.role = user.role;
                localStorage.setItem('greensteps_state_v4', JSON.stringify(parsed));
            } catch(e) {}
        }
    },
    logout: () => {
        localStorage.removeItem('greensteps_user');
    },
    login: (username, password) => {
        if (username === 'traveler' && password === '123456') {
            const user = {
                username: 'traveler',
                fullname: 'Nguyễn Minh Anh',
                email: 'minhanh.greentravel@gmail.com',
                phone: '0901 234 567',
                dob: '12/08/1996',
                gender: 'Nữ',
                address: 'Quận 1, TP. Hồ Chí Minh',
                role: 'traveler'
            };
            Session.setCurrentUser(user);
            return { success: true, user };
        } else if (username === 'partner' && password === '123456') {
            const user = {
                username: 'partner',
                fullname: 'Trần Văn A',
                companyName: 'Green Valley Travel',
                email: 'partner.greentravel@gmail.com',
                phone: '0902 987 654',
                address: 'Quận 3, TP. Hồ Chí Minh',
                role: 'provider'
            };
            Session.setCurrentUser(user);
            return { success: true, user };
        }
        return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' };
    },
    toggleRole: () => {
        let user = Session.getCurrentUser();
        if (!user) return null;
        user.role = (user.role === 'traveler') ? 'provider' : 'traveler';
        Session.setCurrentUser(user);
        return user.role;
    }
};

window.Session = Session;
