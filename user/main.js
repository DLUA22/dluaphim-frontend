let allMovies = [];
let userFavorites = [];
const MOVIES_PER_PAGE = 28;
let currentDisplayMovies = [];

async function fetchMovies() {
    try {
        const username = localStorage.getItem('username');
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
            <div class="movie-card" onclick="window.location.href='watch.html?id=${movie._id}'">
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
                            <button class="btn-play">▶ Xem ngay</button>
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

    // Vẽ thanh nút bấm phân trang ở dưới đáy
    renderPagination(moviesArray.length, page);
}

// ==========================================
// HÀM TẠO NÚT BẤM PHÂN TRANG (MỚI)
// ==========================================
function renderPagination(totalMovies, currentPage) {
    const totalPages = Math.ceil(totalMovies / MOVIES_PER_PAGE);
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    // Nếu chỉ có 1 trang (dưới 28 phim) thì không cần hiện nút chuyển trang
    if (totalPages <= 1) return; 

    // Nút "Lùi lại" («)
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    paginationDiv.innerHTML += `<button class="page-btn" ${prevDisabled} onclick="changePage(${currentPage - 1})">«</button>`;

    // Các nút số 1, 2, 3...
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationDiv.innerHTML += `<button class="page-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }

    // Nút "Tiến tới" (»)
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    paginationDiv.innerHTML += `<button class="page-btn" ${nextDisabled} onclick="changePage(${currentPage + 1})">»</button>`;
}

// Xử lý sự kiện khi bấm đổi trang
function changePage(newPage) {
    renderMovies(currentDisplayMovies, newPage);
    
    // Tự động cuộn màn hình lên đầu danh sách phim để người xem không phải lướt tay lên lại
    document.querySelector('.filter-bar').scrollIntoView({ behavior: 'smooth' });
}
function filterMovies(criteria, value) {
    let filteredMovies = [];
    
    if (criteria === 'genre') {
        // Lọc phim có chứa Thể loại được chọn
        filteredMovies = allMovies.filter(movie => movie.genres && movie.genres.includes(value));
        document.querySelector('.filter-bar span').innerText = `🔽 Thể loại: ${value}`;
    } 
    else if (criteria === 'type') {
        // Lọc phim Lẻ (single) hoặc Phim Bộ (series, hoathinh, tvshows...)
        if (value === 'single') {
            filteredMovies = allMovies.filter(movie => movie.type === 'single');
            document.querySelector('.filter-bar span').innerText = `🔽 Danh sách: Phim Lẻ`;
        } else {
            // Gom tất cả những phim không phải 'single' vào Phim Bộ
            filteredMovies = allMovies.filter(movie => movie.type !== 'single');
            document.querySelector('.filter-bar span').innerText = `🔽 Danh sách: Phim Bộ`;
        }
    }

    // Cuộn màn hình xuống khu vực danh sách phim cho người dùng dễ nhìn
    document.getElementById('movie-list').scrollIntoView({ behavior: 'smooth' });
    
    // In lại danh sách phim đã lọc
    renderMovies(filteredMovies);
}
let topMovies = [];
let currentSlideIndex = 0;
let slideInterval;

// 1. Tải 5 phim top views từ Backend
async function fetchTopMovies() {
    try {
        const res = await fetch('https://dluaphim-api.onrender.com/api/movies/top-views');
        topMovies = await res.json();
        
        if(topMovies.length > 0) {
            renderSlider(0); // Hiển thị phim đầu tiên
            startAutoSlide(); // Bật chạy tự động
        }
    } catch (err) {
        console.error('Lỗi tải banner:', err);
    }
}

// 2. Render nội dung Slider theo Index
function renderSlider(index) {
    currentSlideIndex = index;
    const movie = topMovies[index];
    const slider = document.getElementById('hero-slider');
    
    // Đổi ảnh nền to
    slider.style.backgroundImage = `url('${movie.thumbnail}')`;

    // Render thông tin
    const typeDisplay = movie.type === 'single' ? 'Phim Lẻ' : 'Phim Bộ';
    
    // Render các cục thể loại
    let genresHTML = '';
    if(movie.genres && movie.genres.length > 0) {
        movie.genres.slice(0, 4).forEach(g => { // Lấy tối đa 4 thể loại
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
                <button class="btn-play-circle" onclick="window.location.href='watch.html?id=${movie._id}'">▶</button>
                <button class="btn-icon-circle" onclick="toggleHeart(event, this, '${movie._id}')">🤍</button>
                <button class="btn-icon-circle">❕</button>
            </div>
        </div>
    `;
    document.getElementById('slider-content').innerHTML = contentHTML;

    // Render 5 ảnh thu nhỏ (Thumbnails)
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

// 3. Xử lý khi bấm vào ảnh thu nhỏ
function changeSlide(index) {
    renderSlider(index);
    // Reset bộ đếm thời gian để không bị chuyển hình đột ngột khi người dùng vừa bấm
    clearInterval(slideInterval);
    startAutoSlide();
}

// 4. Chạy tự động chuyển cảnh (5 giây 1 lần)
function startAutoSlide() {
    slideInterval = setInterval(() => {
        let nextIndex = (currentSlideIndex + 1) % topMovies.length;
        renderSlider(nextIndex);
    }, 5000); 
}

// 4. LOGIC THANH TÌM KIẾM
document.querySelector('.search-bar input').addEventListener('input', (event) => {
    // Lấy chữ người dùng gõ, chuyển về chữ thường
    const searchTerm = event.target.value.toLowerCase().trim();
    
    // Lọc ra những phim có tên chứa chữ vừa gõ
    const filteredMovies = allMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm)
    );

    // In lại danh sách phim đã lọc
    renderMovies(filteredMovies);
});

// --- QUẢN LÝ ĐĂNG NHẬP VÀ ĐỒNG BỘ AVATAR ---
async function checkLogin() {
    const username = localStorage.getItem('username');
    const userContainer = document.querySelector('.user-account');

    if (username) {
        let avatarSrc = "https://i.pravatar.cc/150?img=11";
        let displayName = username;
        let userRole = 'user'; // Biến lưu quyền

        try {
            const res = await fetch(`https://dluaphim-api.onrender.com/api/users/${username}`);
            const userData = await res.json();
            
            if (userData.avatar) avatarSrc = userData.avatar;
            if (userData.fullName) displayName = userData.fullName; 
            if (userData.role) userRole = userData.role; // Lấy quyền từ Database

            // Lưu quyền vào bộ nhớ đệm để các trang khác dùng ké
            localStorage.setItem('role', userRole);

        } catch (error) {
            console.error('Lỗi lấy thông tin user:', error);
        }

        // KIỂM TRA: Nếu là admin thì tạo thêm 1 nút màu xanh lam cực ngầu
        let adminButton = '';
        if (userRole === 'admin') {
            adminButton = `<a href="../admin/index.html" style="color: #00d2ff; font-weight: bold;">🛠️ Tới Trang Quản Trị</a>`;
        }

        userContainer.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <div class="avatar-btn" onclick="toggleUserMenu()" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <img src="${avatarSrc}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid #ffda76;">
                    <span style="color: white; font-weight: bold; font-size: 14px;">${displayName} ▾</span>
                </div>
                
                <div id="user-menu" class="user-dropdown-menu">
                    ${adminButton} <!-- Nút Admin sẽ chui vào đây nếu có quyền -->
                    <a href="profile.html">⚙️ Đổi thông tin & Avatar</a>
                    <a href="favorites.html" style="color: #ffda76;">💖 Phim đã tim</a>
                    <a href="history.html">🕒 Lịch sử xem</a>
                    <hr style="border-color: #444; margin: 5px 0;">
                    <a href="#" onclick="logout()" style="color: #ff4d4d;">👋 Đăng xuất</a>
                </div>
            </div>
        `;
    }
}

// Hàm bật/tắt menu Avatar
function toggleUserMenu() {
    document.getElementById('user-menu').classList.toggle('show');
}

// Bấm ra ngoài khoảng trống thì tự động đóng menu Avatar lại
window.addEventListener('click', function(event) {
    if (!event.target.closest('.avatar-btn')) {
        const dropdowns = document.getElementsByClassName("user-dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
    }
});

function logout() {
    localStorage.clear(); window.location.reload();
}
// Hàm thả tim phim
async function toggleHeart(event, btn, movieId) {
    event.stopPropagation(); // Ngăn không cho click nhầm vào ảnh phim
    
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Bạn cần đăng nhập để thả tim phim nhé!');
        window.location.href = 'login.html';
        return;
    }

    // Hiệu ứng tải tạm thời để người dùng biết đang xử lý
    const originalText = btn.innerText;
    btn.innerText = '⏳';

    try {
        // Gửi yêu cầu thả/bỏ tim xuống Backend
        const response = await fetch('https://dluaphim-api.onrender.com/api/users/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, movieId: movieId })
        });
        
        const data = await response.json();

        // Thay đổi giao diện tim theo kết quả trả về từ Backend
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
        btn.innerText = originalText; // Trả lại tim cũ nếu bị lỗi mạng
        alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
}
// ==========================================
// XỬ LÝ CHATBOT AI
// ==========================================
function toggleChat() {
    const chatWin = document.getElementById('chat-window');
    // Bật tắt mượt mà
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

    // 1. In tin nhắn của User (Bong bóng bên phải)
    msgBox.innerHTML += `
        <div style="background: #ffda76; color: black; padding: 10px 15px; border-radius: 15px 15px 0 15px; max-width: 85%; align-self: flex-end; font-size: 14px;">
            ${userText}
        </div>
    `;
    inputField.value = '';
    msgBox.scrollTop = msgBox.scrollHeight; // Cuộn xuống đáy

    // 2. In bong bóng "Đang gõ chữ..." của AI
    const loadingId = 'loading-' + Date.now();
    msgBox.innerHTML += `
        <div id="${loadingId}" style="background: #333; color: #888; padding: 10px 15px; border-radius: 15px 15px 15px 0; max-width: 85%; align-self: flex-start; font-size: 14px; font-style: italic;">
            Bot đang suy nghĩ...
        </div>
    `;
    msgBox.scrollTop = msgBox.scrollHeight;

    // 3. Gọi API sang Node.js
    try {
        const response = await fetch('https://dluaphim-api.onrender.com/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });
        
        const data = await response.json();
        
        // 4. Xóa bong bóng "đang gõ" và in câu trả lời thật của AI ra
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

document.getElementById('chat-window').style.display = 'none';
// Chạy khởi tạo
fetchMovies();
checkLogin();