
document.addEventListener("DOMContentLoaded", function() {
    // 1. Tải giao diện Header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) {
                placeholder.innerHTML = data;
            }
            checkLogin();
            const searchInput = document.querySelector('.search-bar input');
            const searchBarContainer = document.querySelector('.search-bar');

            if (searchInput && searchBarContainer) {
                searchBarContainer.style.position = 'relative';
                const suggestionBox = document.createElement('div');
                suggestionBox.id = 'search-suggestions';
                suggestionBox.style.cssText = 'position: absolute; top: 110%; left: 0; right: 0; background: #1c1c1f; border-radius: 8px; max-height: 450px; overflow-y: auto; z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.9); display: none; border: 1px solid #444;';
                searchBarContainer.appendChild(suggestionBox);

                let searchTimeout = null;
                let globalSearchMovies = [];

                searchInput.addEventListener('input', async (event) => {
                    const searchTerm = event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                    
                    if (!searchTerm) {
                        suggestionBox.style.display = 'none';
                        if (typeof allMovies !== 'undefined' && typeof renderMovies === 'function') renderMovies(allMovies);
                        return;
                    }
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(async () => {
                        if (globalSearchMovies.length === 0) {
                            if (typeof allMovies !== 'undefined' && allMovies.length > 0) {
                                globalSearchMovies = allMovies; 
                            } else {
                                try {
                                    const res = await fetch('https://dluaphim-api.onrender.com/api/movies');
                                    globalSearchMovies = await res.json();
                                } catch(e) { console.error("Lỗi lấy dữ liệu tìm kiếm"); }
                            }
                        }
                        const results = globalSearchMovies.filter(movie => {
                            const normalizedTitle = movie.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                            return normalizedTitle.includes(searchTerm);
                        });
                        if (results.length > 0) {
                            const top5Results = results.slice(0, 5);
                            
                            suggestionBox.innerHTML = top5Results.map(m => `
                                <a href="detail.html?slug=${m.slug}" style="display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-bottom: 1px solid #333; text-decoration: none; color: white; transition: 0.2s;" onmouseover="this.style.background='#2a2a2f'" onmouseout="this.style.background='transparent'">
                                    <img src="${m.thumbnail}" style="width: 45px; height: 65px; object-fit: cover; border-radius: 4px;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: bold; font-size: 15px; margin-bottom: 5px;">${m.title}</div>
                                        <div style="font-size: 12px; color: #888;">
                                            <span style="color: #ffda76; border: 1px solid #ffda76; padding: 1px 4px; border-radius: 3px; margin-right: 5px;">${m.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ'}</span> 
                                            ⭐ ${m.status || 'Đang cập nhật'}
                                        </div>
                                    </div>
                                </a>
                            `).join('') + `
                                <div style="text-align: center; padding: 12px; font-size: 14px; color: #ffda76; cursor: pointer; background: #111; font-weight: bold;" onclick="window.location.href='index.html?search=${encodeURIComponent(event.target.value)}'">
                                    🔍 Xem tất cả ${results.length} kết quả ➔
                                </div>
                            `;
                            suggestionBox.style.display = 'block';
                        } else {
                            suggestionBox.innerHTML = `
                                <div style="padding: 20px; text-align: center; color: #888; font-size: 15px;">
                                    <div style="font-size: 30px; margin-bottom: 10px;">📭</div>
                                    Không tìm thấy phim "<span style="color: white;">${event.target.value}</span>"
                                </div>
                            `;
                            suggestionBox.style.display = 'block';
                        }
                    }, 300);
                });

                // Bấm Enter thì bay về trang chủ tìm
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const term = e.target.value.trim();
                        if(term) window.location.href = `index.html?search=${encodeURIComponent(term)}`;
                    }
                });

                // Click ra ngoài thì đóng hộp thoại
                document.addEventListener('click', (e) => {
                    if (!searchBarContainer.contains(e.target)) {
                        suggestionBox.style.display = 'none';
                    }
                });
            }
        })
        .catch(error => console.error('Lỗi tải Header:', error));
});

// =========================================================================
// HÀM XỬ LÝ GIAO DIỆN TÀI KHOẢN (AVATAR, CHUÔNG, ADMIN)
// =========================================================================
async function checkLogin() {
    const username = sessionStorage.getItem('username');
    const userContainer = document.querySelector('.user-account');

    if (username && userContainer) {
        let avatarSrc = "https://i.pravatar.cc/150?img=11";
        let displayName = username;
        let userRole = 'user'; 

        // Lấy thông tin user
        try {
            const res = await fetch(`https://dluaphim-api.onrender.com/api/users/${username}`);
            const userData = await res.json();
            
            if (userData.avatar) avatarSrc = userData.avatar;
            if (userData.fullName) displayName = userData.fullName; 
            if (userData.role) userRole = userData.role; 

            sessionStorage.setItem('role', userRole);
            sessionStorage.setItem('displayName', displayName);
            sessionStorage.setItem('userAvatar', avatarSrc);
        } catch (error) {}

        let adminButton = '';
        if (userRole === 'admin') {
            adminButton = `<a href="../admin/index.html" style="color: #00d2ff; font-weight: bold; display: block; padding: 8px;">🛠️ Tới Trang Quản Trị</a>`;
        }

        // Tải dữ liệu Chuông thông báo
        let notiHtml = '';
        let unreadCount = 0;
        try {
            const notiRes = await fetch(`https://dluaphim-api.onrender.com/api/movies/notifications/${username}`);
            const notifications = await notiRes.json();
            
            if (Array.isArray(notifications)) {
                unreadCount = notifications.length; 
                
                if(unreadCount > 0) {
                    notifications.forEach(noti => {
                        const date = new Date(noti.createdAt).toLocaleString('vi-VN');
                        notiHtml += `
                            <div style="position: relative; border-bottom: 1px solid #444;">
                                <a href="detail.html?slug=${noti.movieSlug || noti.movieId}#comment-${noti._id}" style="display: block; padding: 10px 30px 10px 10px; text-decoration: none; color: white;">
                                    <div style="font-size: 13px; color: #ffda76;">💬 <strong>${noti.fullName || noti.username}</strong> đã trả lời bạn</div>
                                    <div style="font-size: 12px; color: #ccc; margin-top: 3px;">"${noti.content.substring(0, 30)}..."</div>
                                    <div style="font-size: 10px; color: #888; margin-top: 5px;">🕒 ${date}</div>
                                </a>
                                <button onclick="deleteNoti('${noti._id}', event)" style="position: absolute; top: 10px; right: 5px; background: transparent; border: none; color: #888; font-size: 12px; cursor: pointer; padding: 5px;" title="Xóa thông báo">✖</button>
                            </div>
                        `;
                    });
                    
                    notiHtml += `
                        <div style="text-align: center; padding: 10px; background: #2a2a2f;">
                            <button onclick="clearAllNoti(event)" style="background: #ff4d4d; color: white; border: none; padding: 5px 15px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: bold;">🗑 Xóa tất cả</button>
                        </div>
                    `;
                } else {
                    notiHtml = `<div style="padding: 10px; color: #888; text-align: center; font-size: 13px;">Không có thông báo mới</div>`;
                }
            }
        } catch(e){}

        // Render lên màn hình
        userContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <div style="position: relative; cursor: pointer;" onclick="document.getElementById('noti-menu').classList.toggle('show')">
                    <span style="font-size: 24px;">🔔</span>
                    ${unreadCount > 0 ? `<span style="position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 11px; font-weight: bold; border: 2px solid #1c1c1f;">${unreadCount}</span>` : ''}
                    
                    <div id="noti-menu" class="user-dropdown-menu" style="width: 280px; right: -20px; max-height: 350px; overflow-y: auto; background: #1c1c1f; border: 1px solid #444; box-shadow: 0 5px 15px rgba(0,0,0,0.8); z-index: 9999;">
                        <h4 style="margin: 0; padding: 12px; border-bottom: 1px solid #444; color: white; background: #2a2a2f;">Thông báo của bạn</h4>
                        ${notiHtml}
                    </div>
                </div>

                <div style="position: relative; display: inline-block;">
                    <div class="avatar-btn" onclick="document.getElementById('user-menu-global').classList.toggle('show')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <img src="${avatarSrc}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid #ffda76;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">${displayName} ▾</span>
                    </div>
                    
                    <div id="user-menu-global" class="user-dropdown-menu" style="position: absolute; right: 0; background: #1c1c1f; padding: 10px; border-radius: 8px; z-index: 9999; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                        ${adminButton} 
                        <a href="profile.html" style="color: white; display: block; padding: 8px; text-decoration: none;">⚙️ Đổi thông tin & Avatar</a>
                        <a href="favorites.html" style="color: #ffda76; display: block; padding: 8px; text-decoration: none;">💖 Phim đã tim</a>
                        <a href="history.html" style="color: white; display: block; padding: 8px; text-decoration: none;">🕒 Lịch sử xem</a>
                        <hr style="border-color: #444; margin: 5px 0;">
                        <a href="#" onclick="logout()" style="color: #ff4d4d; display: block; padding: 8px; text-decoration: none;">👋 Đăng xuất</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Bấm ra ngoài khoảng trống thì tự động đóng menu Avatar VÀ menu Chuông
window.addEventListener('click', function(event) {
    if (!event.target.closest('.avatar-btn') && !event.target.closest('.user-dropdown-menu') && !event.target.closest('[onclick*="noti-menu"]')) {
        const dropdowns = document.querySelectorAll(".user-dropdown-menu");
        dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
    }
});

// Các hàm bổ trợ
window.logout = function() {
    sessionStorage.clear(); window.location.reload();
}

window.deleteNoti = async function(notiId, event) {
    event.stopPropagation(); 
    try {
        await fetch(`https://dluaphim-api.onrender.com/api/movies/notifications/${notiId}/read`, { method: 'PUT' });
        checkLogin();
        setTimeout(() => {
            const notiMenu = document.getElementById('noti-menu');
            if(notiMenu) notiMenu.classList.add('show');
        }, 100);
    } catch(e) {}
}

window.clearAllNoti = async function(event) {
    event.stopPropagation();
    const username = sessionStorage.getItem('username');
    if(!username) return;
    try {
        await fetch(`https://dluaphim-api.onrender.com/api/movies/notifications/clear-all/${username}`, { method: 'PUT' });
        checkLogin();
        setTimeout(() => {
            const notiMenu = document.getElementById('noti-menu');
            if(notiMenu) notiMenu.classList.add('show');
        }, 100);
    } catch(e) {}
}