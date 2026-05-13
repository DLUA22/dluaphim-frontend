let allMovies = [];
let userFavorites = [];
const MOVIES_PER_PAGE = 28;
let currentDisplayMovies = [];

async function fetchMovies() {
    try {
        const username = sessionStorage.getItem('username');
        if (username) {
            const userRes = await fetch(`https://dluaphim-api.onrender.com/api/users/${username}`);
            const userData = await userRes.json();
            if (userData.favorites) {
                userFavorites = userData.favorites;
            }
        }
        const response = await fetch('https://dluaphim-api.onrender.com/api/movies');
        allMovies = await response.json();      
        renderMovies(allMovies); 
        fetchTopMovies();    
    } catch (error) {
        console.error('Lỗi tải phim:', error);
    }
}

function renderMovies(moviesArray, page = 1) {
    currentDisplayMovies = moviesArray; // Lưu lại để dùng lúc chuyển trang
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = ''; 

    if (moviesArray.length === 0) {
        movieList.innerHTML = '<h3 style="color:white; padding: 20px; width: 100%; text-align: center;">Không tìm thấy phim nào!</h3>';
        document.getElementById('pagination').innerHTML = ''; // Ẩn luôn phân trang
        return;
    }

    // --- THUẬT TOÁN CẮT MẢNG LẤY 28 PHIM ---
    const startIndex = (page - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;
    const moviesToRender = moviesArray.slice(startIndex, endIndex);

    moviesToRender.forEach(movie => {
        const genresDisplay = movie.genres && movie.genres.length > 0 ? movie.genres.join(' • ') : 'Đang cập nhật';
        const typeDisplay = movie.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ';

        const isFavorited = userFavorites.includes(movie._id);
        const heartIcon = isFavorited ? '💖' : '🤍';
        const heartStyle = isFavorited 
            ? 'border-color: #ff4d4d; background-color: rgba(255, 77, 77, 0.1);' 
            : 'border-color: #555; background-color: transparent;';

        const movieCard = `
            <div class="movie-card" onclick="window.location.href='detail.html?slug=${movie.slug}'">
                <div class="image-container">
                    <img src="${movie.thumbnail}" alt="${movie.title}">
                    <div class="badge">${movie.status || 'Đang cập nhật'}</div>
                </div>
                <h3 class="title">${movie.title}</h3>
                <p class="subtitle">DLUAPHIM</p>
                
                <div class="hover-card">
                    <div class="hover-image"><img src="${movie.thumbnail}"></div>
                    <div class="hover-content">
                        <h3 class="hover-title">${movie.title}</h3>
                        <div class="hover-actions">
                            <button class="btn-play" onclick="event.stopPropagation(); window.location.href='detail.html?slug=${movie.slug}'">▶ Chi tiết</button>
                            <button class="btn-icon" style="${heartStyle}" onclick="toggleHeart(event, this, '${movie._id}')">${heartIcon}</button>
                        </div>
                        <div class="hover-tags">
                            <span class="tag-imdb">IMDb 8.0</span><span>${typeDisplay}</span><span>2026</span>
                        </div>
                        <p class="hover-genres">${genresDisplay}</p>
                    </div>
                </div>
            </div>
        `;
        movieList.innerHTML += movieCard;
    });

    renderPagination(moviesArray.length, page);
}

// ==========================================
// HÀM TẠO NÚT BẤM PHÂN TRANG
// ==========================================
function renderPagination(totalMovies, currentPage) {
    const totalPages = Math.ceil(totalMovies / MOVIES_PER_PAGE);
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    if (totalPages <= 1) return; 

    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    paginationDiv.innerHTML += `<button class="page-btn" ${prevDisabled} onclick="changePage(${currentPage - 1})">«</button>`;

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationDiv.innerHTML += `<button class="page-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }

    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    paginationDiv.innerHTML += `<button class="page-btn" ${nextDisabled} onclick="changePage(${currentPage + 1})">»</button>`;
}

function changePage(newPage) {
    renderMovies(currentDisplayMovies, newPage);
    document.querySelector('.filter-bar').scrollIntoView({ behavior: 'smooth' });
}

function filterMovies(criteria, value) {
    let filteredMovies = [];
    
    if (criteria === 'genre') {
        filteredMovies = allMovies.filter(movie => movie.genres && movie.genres.includes(value));
        document.querySelector('.filter-bar span').innerText = `🔽 Thể loại: ${value}`;
    } 
    else if (criteria === 'type') {
        if (value === 'single') {
            filteredMovies = allMovies.filter(movie => movie.type === 'single');
            document.querySelector('.filter-bar span').innerText = `🔽 Danh sách: Phim Lẻ`;
        } else {
            filteredMovies = allMovies.filter(movie => movie.type !== 'single');
            document.querySelector('.filter-bar span').innerText = `🔽 Danh sách: Phim Bộ`;
        }
    }

    document.getElementById('movie-list').scrollIntoView({ behavior: 'smooth' });
    renderMovies(filteredMovies);
}

let topMovies = [];
let currentSlideIndex = 0;
let slideInterval;

async function fetchTopMovies() {
    try {
        const res = await fetch('https://dluaphim-api.onrender.com/api/movies/top-views');
        topMovies = await res.json();
        
        if(topMovies.length > 0) {
            renderSlider(0); 
            startAutoSlide(); 
        }
    } catch (err) {
        console.error('Lỗi tải banner:', err);
    }
}

function renderSlider(index) {
    currentSlideIndex = index;
    const movie = topMovies[index];
    const slider = document.getElementById('hero-slider');
    
    slider.style.backgroundImage = `url('${movie.thumbnail}')`;

    const typeDisplay = movie.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ';
    
    let genresHTML = '';
    if(movie.genres && movie.genres.length > 0) {
        movie.genres.slice(0, 4).forEach(g => { 
            genresHTML += `<span class="genre-box">${g}</span>`;
        });
    }

    const contentHTML = `
        <div class="slider-main-content" style="animation: fadeIn 0.5s;">
            <h1 class="slider-title">${movie.title}</h1>
            <p class="slider-subtitle">DLUAPHIM Exclusive</p>
            
            <div class="slider-meta">
                <span class="meta-tag meta-imdb">IMDb 8.5</span>
                <span class="meta-tag">T16</span>
                <span class="meta-tag">2026</span>
                <span class="meta-tag">${typeDisplay}</span>
                <span class="meta-tag">${movie.status || 'Tập Hoàn Tất'}</span>
            </div>
            
            <div class="slider-genres">
                ${genresHTML}
            </div>

            <p class="slider-desc">Cùng đón xem những tình tiết hấp dẫn và kịch tính nhất trong bộ phim "${movie.title}". Một tác phẩm không thể bỏ lỡ trên hệ thống của chúng tôi.</p>
            
            <div class="slider-actions">
                <button class="btn-play-circle" onclick="window.location.href='detail.html?slug=${movie.slug}'">▶</button>
                <button class="btn-icon-circle" onclick="toggleHeart(event, this, '${movie._id}')">🤍</button>
                <button class="btn-icon-circle">❕</button>
            </div>
        </div>
    `;
    document.getElementById('slider-content').innerHTML = contentHTML;

    const thumbContainer = document.getElementById('slider-thumbnails');
    thumbContainer.innerHTML = '';
    topMovies.forEach((m, i) => {
        const activeClass = i === index ? 'active' : '';
        thumbContainer.innerHTML += `
            <div class="thumb-item ${activeClass}" onclick="changeSlide(${i})">
                <img src="${m.thumbnail}" alt="${m.title}">
            </div>
        `;
    });
}

function changeSlide(index) {
    renderSlider(index);
    clearInterval(slideInterval);
    startAutoSlide();
}

function startAutoSlide() {
    slideInterval = setInterval(() => {
        let nextIndex = (currentSlideIndex + 1) % topMovies.length;
        renderSlider(nextIndex);
    }, 5000); 
}

// THANH TÌM KIẾM
document.querySelector('.search-bar input').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    const filteredMovies = allMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm)
    );
    renderMovies(filteredMovies);
});

// =========================================================================
// PHẦN ĐƯỢC NÂNG CẤP: QUẢN LÝ ĐĂNG NHẬP, ĐỒNG BỘ TÊN VÀ CHUÔNG THÔNG BÁO
// =========================================================================
async function checkLogin() {
    const username = sessionStorage.getItem('username');
    const userContainer = document.querySelector('.user-account');

    if (username) {
        let avatarSrc = "https://i.pravatar.cc/150?img=11";
        let displayName = username;
        let userRole = 'user'; 

        // 1. Lấy thông tin user (Avatar, Tên chém gió, Quyền Admin)
        try {
            const res = await fetch(`https://dluaphim-api.onrender.com/api/users/${username}`);
            const userData = await res.json();
            
            if (userData.avatar) avatarSrc = userData.avatar;
            if (userData.fullName) displayName = userData.fullName; 
            if (userData.role) userRole = userData.role; 

            sessionStorage.setItem('role', userRole);
            sessionStorage.setItem('displayName', displayName);
            sessionStorage.setItem('userAvatar', avatarSrc);
        } catch (error) {
            console.error('Lỗi lấy thông tin user:', error);
        }

        // Tạo nút Admin nếu có quyền
        let adminButton = '';
        if (userRole === 'admin') {
            adminButton = `<a href="../admin/index.html" style="color: #00d2ff; font-weight: bold;">🛠️ Tới Trang Quản Trị</a>`;
        }

        // 2. Tải dữ liệu Chuông thông báo
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
                        // Thêm nút X ở góc phải mỗi thông báo
                        notiHtml += `
                            <div style="position: relative; border-bottom: 1px solid #444;">
                                <a href="watch.html?slug=${noti.movieId}#comment-${noti._id}" style="display: block; padding: 10px 30px 10px 10px; text-decoration: none; color: white;">
                                    <div style="font-size: 13px; color: #ffda76;">💬 <strong>${noti.fullName || noti.username}</strong> đã trả lời bạn</div>
                                    <div style="font-size: 12px; color: #ccc; margin-top: 3px;">"${noti.content.substring(0, 30)}..."</div>
                                    <div style="font-size: 10px; color: #888; margin-top: 5px;">🕒 ${date}</div>
                                </a>
                                <button onclick="deleteNoti('${noti._id}', event)" style="position: absolute; top: 10px; right: 5px; background: transparent; border: none; color: #888; font-size: 12px; cursor: pointer; padding: 5px;" title="Xóa thông báo">✖</button>
                            </div>
                        `;
                    });
                    
                    // Thêm nút Xóa Tất Cả ở dưới cùng
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

        // 3. Render giao diện Chuông & Avatar lên Header
        userContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <!-- Khu Vực Chuông -->
                <div style="position: relative; cursor: pointer;" onclick="document.getElementById('noti-menu').classList.toggle('show')">
                    <span style="font-size: 24px;">🔔</span>
                    ${unreadCount > 0 ? `<span style="position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 11px; font-weight: bold; border: 2px solid #1c1c1f;">${unreadCount}</span>` : ''}
                    
                    <div id="noti-menu" class="user-dropdown-menu" style="width: 280px; right: -20px; max-height: 350px; overflow-y: auto; background: #1c1c1f; border: 1px solid #444; box-shadow: 0 5px 15px rgba(0,0,0,0.8); z-index: 9999;">
                        <h4 style="margin: 0; padding: 12px; border-bottom: 1px solid #444; color: white; background: #2a2a2f;">Thông báo của bạn</h4>
                        ${notiHtml}
                    </div>
                </div>

                <!-- Khu Vực Avatar -->
                <div style="position: relative; display: inline-block;">
                    <div class="avatar-btn" onclick="document.getElementById('user-menu').classList.toggle('show')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <img src="${avatarSrc}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid #ffda76;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">${displayName} ▾</span>
                    </div>
                    
                    <div id="user-menu" class="user-dropdown-menu">
                        ${adminButton} 
                        <a href="profile.html">⚙️ Đổi thông tin & Avatar</a>
                        <a href="favorites.html" style="color: #ffda76;">💖 Phim đã tim</a>
                        <a href="history.html">🕒 Lịch sử xem</a>
                        <hr style="border-color: #444; margin: 5px 0;">
                        <a href="#" onclick="logout()" style="color: #ff4d4d;">👋 Đăng xuất</a>
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

function logout() {
    sessionStorage.clear(); window.location.reload();
}

// ==========================================
// HÀM THẢ TIM & CHATBOT AI (GIỮ NGUYÊN)
// ==========================================
async function toggleHeart(event, btn, movieId) {
    event.stopPropagation(); 
    
    const username = sessionStorage.getItem('username');
    if (!username) {
        alert('Bạn cần đăng nhập để thả tim phim nhé!');
        window.location.href = 'login.html';
        return;
    }

    const originalText = btn.innerText;
    btn.innerText = '⏳';

    try {
        const response = await fetch('https://dluaphim-api.onrender.com/api/users/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, movieId: movieId })
        });
        
        const data = await response.json();

        if (data.isFavorited) {
            btn.innerText = '💖';
            btn.style.borderColor = '#ff4d4d';
            btn.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
        } else {
            btn.innerText = '🤍';
            btn.style.borderColor = '#555';
            btn.style.backgroundColor = 'transparent';
        }
    } catch (error) {
        console.error('Lỗi khi thả tim:', error);
        btn.innerText = originalText; 
        alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
}

function toggleChat() {
    const chatWin = document.getElementById('chat-window');
    if (chatWin.style.display === 'none' || chatWin.style.display === '') {
        chatWin.style.display = 'flex';
        document.getElementById('chat-input').focus();
    } else {
        chatWin.style.display = 'none';
    }
}

async function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const msgBox = document.getElementById('chat-messages');
    const userText = inputField.value.trim();

    if (!userText) return;

    msgBox.innerHTML += `
        <div style="background: #ffda76; color: black; padding: 10px 15px; border-radius: 15px 15px 0 15px; max-width: 85%; align-self: flex-end; font-size: 14px;">
            ${userText}
        </div>
    `;
    inputField.value = '';
    msgBox.scrollTop = msgBox.scrollHeight; 

    const loadingId = 'loading-' + Date.now();
    msgBox.innerHTML += `
        <div id="${loadingId}" style="background: #333; color: #888; padding: 10px 15px; border-radius: 15px 15px 15px 0; max-width: 85%; align-self: flex-start; font-size: 14px; font-style: italic;">
            Bot đang suy nghĩ...
        </div>
    `;
    msgBox.scrollTop = msgBox.scrollHeight;

    try {
        const response = await fetch('https://dluaphim-api.onrender.com/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });
        
        const data = await response.json();
        
        document.getElementById(loadingId).remove();
        msgBox.innerHTML += `
            <div style="background: #333; color: white; padding: 10px 15px; border-radius: 15px 15px 15px 0; max-width: 85%; align-self: flex-start; font-size: 14px; line-height: 1.5;">
                ${data.reply}
            </div>
        `;
        msgBox.scrollTop = msgBox.scrollHeight;
    } catch (err) {
        document.getElementById(loadingId).innerText = "Mạng bị lỗi, không kết nối được với AI!";
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}
// ================= HÀM XÓA THÔNG BÁO TỪ MENU CHUÔNG =================
window.deleteNoti = async function(notiId, event) {
    event.stopPropagation(); // Ngăn trình duyệt nhảy link sang trang phim
    try {
        await fetch(`https://dluaphim-api.onrender.com/api/movies/notifications/${notiId}/read`, { method: 'PUT' });
        
        // Gọi lại hàm để vẽ lại cái chuông
        if(typeof checkLogin === 'function') await checkLogin();
        if(typeof checkLoginState === 'function') await checkLoginState();
        
        // Mở lại menu chuông cho đỡ bị tắt đột ngột
        document.getElementById('noti-menu').classList.add('show');
    } catch(e) {}
}

window.clearAllNoti = async function(event) {
    event.stopPropagation();
    const username = sessionStorage.getItem('username');
    if(!username) return;
    try {
        await fetch(`https://dluaphim-api.onrender.com/api/movies/notifications/clear-all/${username}`, { method: 'PUT' });
        
        if(typeof checkLogin === 'function') await checkLogin();
        if(typeof checkLoginState === 'function') await checkLoginState();
        
        document.getElementById('noti-menu').classList.add('show');
    } catch(e) {}
}
document.getElementById('chat-window').style.display = 'none';
// Chạy khởi tạo
fetchMovies();
checkLogin();