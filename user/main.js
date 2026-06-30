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
            if (userData.favorites) userFavorites = userData.favorites;
        }
        const cachedMovies = sessionStorage.getItem('dluaphim_allMovies');
        if (cachedMovies) {
            allMovies = JSON.parse(cachedMovies);
            const randomMovies = shuffleArray(allMovies);
            renderMovies(randomMovies);
            
            handleGlobalSearch();
        } else {
            const response = await fetch('https://dluaphim-api.onrender.com/api/movies');
            allMovies = await response.json();      
            sessionStorage.setItem('dluaphim_allMovies', JSON.stringify(allMovies));
            const randomMovies = shuffleArray(allMovies);
            renderMovies(randomMovies); 
            handleGlobalSearch();
        }
        fetchTopMovies();    
    } catch (error) {
        console.error('Lỗi tải phim:', error);
    }
}

function handleGlobalSearch() {
    const urlParamsSearch = new URLSearchParams(window.location.search);
    const searchKeyword = urlParamsSearch.get('search');
    
    if (searchKeyword) {
        const searchTerm = searchKeyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const filteredMovies = allMovies.filter(movie => {
            const normalizedTitle = movie.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            return normalizedTitle.includes(searchTerm);
        });
        renderMovies(filteredMovies);
        setTimeout(() => {
            const listEl = document.getElementById('movie-list');
            if(listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const headerInput = document.querySelector('.search-bar input');
            if(headerInput) headerInput.value = searchKeyword;
        }, 800); 
    }
}

function renderMovies(moviesArray, page = 1) {
    currentDisplayMovies = moviesArray;
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = ''; 

    if (moviesArray.length === 0) {
        movieList.innerHTML = '<h3 style="color:white; padding: 20px; width: 100%; text-align: center;">Không tìm thấy phim nào!</h3>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
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
            <div class="movie-card" tabindex="0" onclick="window.location.href='detail.html?slug=${movie.slug}'">
                <div class="image-container">
                    <img src="${movie.thumbnail}" alt="${movie.title}" loading="lazy">
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
function shuffleArray(array) {
    let shuffled = [...array]; // Tạo một bản sao để không làm ảnh hưởng đến mảng gốc
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Đổi chỗ 2 phần tử
    }
    return shuffled;
}
document.getElementById('chat-window').style.display = 'none';
fetchMovies();