const currentUserRole = sessionStorage.getItem('role');
if (currentUserRole !== 'admin') {
    alert('Cảnh báo: Bạn không có quyền truy cập vào khu vực quản trị!');
    window.location.href = '../user/index.html';
}
const API_URL = 'https://dluaphim-api.onrender.com/api/movies';
let editingId = null;

// Hàm mở Popup
function openModal() {
    document.getElementById('movieModal').style.display = 'block';
}

// Hàm tắt Popup và xóa trắng form
function closeModal() {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('add-title').value = '';
    document.getElementById('add-thumbnail').value = '';
    document.getElementById('modal-title').innerText = 'Thêm phim mới';
    document.getElementById('btn-save-movie').innerText = 'Lưu Phim';
    
    // Đã sửa lại thành add-episodes cho đúng với HTML mới
    document.getElementById('add-episodes').value = ''; 
    document.getElementById('add-type').value = 'single';
    document.getElementById('add-genres').value = '';
    
    editingId = null;
}

// Load danh sách phim 
async function loadMoviesToTable() {
    try {
        const response = await fetch(API_URL);
        const movies = await response.json();
        
        const tbody = document.getElementById('admin-movie-list');
        tbody.innerHTML = ''; 

        movies.forEach(movie => {
            const statusClass = movie.status === 'Đang chiếu' ? 'active' : 'pending';
            tbody.innerHTML += `
                <tr>
                    <td><img src="${movie.thumbnail}" width="60" style="border-radius: 5px; object-fit: cover; height: 80px;"></td>
                    <td>${movie.title}</td>
                    <td><span class="status-badge ${statusClass}">${movie.status}</span></td>
                    <td>
                        <button class="btn-edit" onclick="editMovie('${movie._id}', '${movie.title}', '${movie.thumbnail}', '${movie.status}', '${movie.episodes.map(e => e.url).join('\\n')}')">Sửa</button>
                        <button class="btn-delete" onclick="deleteMovie('${movie._id}')">Xóa</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Lỗi tải phim:', error);
    }
}

// Lưu phim (Thêm/Sửa)
document.getElementById('btn-save-movie').addEventListener('click', async () => {
    const title = document.getElementById('add-title').value;
    const thumbnail = document.getElementById('add-thumbnail').value;
    const status = document.getElementById('add-status').value;
    const type = document.getElementById('add-type').value;
    
    const genresText = document.getElementById('add-genres').value;
    const genres = genresText.split(',').map(g => g.trim()).filter(g => g !== '');
    
    const episodesText = document.getElementById('add-episodes').value.trim();
    const episodes = episodesText.split('\n')
        .filter(link => link.trim() !== '') 
        .map((link, index) => {
            return { name: `Tập ${index + 1}`, url: link.trim() }; 
        });

    if (!title || !thumbnail || episodes.length === 0) {
        alert('Vui lòng nhập đủ tên, ảnh bìa và ít nhất 1 link tập phim!');
        return;
    }

    try {
        const bodyData = { title, thumbnail, episodes, status, type, genres };
        if (editingId) {
            await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
        }
        closeModal();
        loadMoviesToTable();
    } catch (error) { console.error(error); }
});

// Xóa phim 
async function deleteMovie(id) {
    if (confirm('Bạn có chắc chắn muốn xóa bộ phim này không?')) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            loadMoviesToTable();
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
        }
    }
}

// Sửa phim
function editMovie(id, title, thumbnail, status, episodesStr) { 
    document.getElementById('add-title').value = title;
    document.getElementById('add-thumbnail').value = thumbnail;
    document.getElementById('add-status').value = status;
    document.getElementById('add-episodes').value = episodesStr;
    
    editingId = id;
    document.getElementById('modal-title').innerText = 'Chỉnh sửa phim';
    document.getElementById('btn-save-movie').innerText = 'Cập Nhật';
    openModal();
}

// ====================================================
// TÍNH NĂNG 1: AUTO CÀO 5 PHIM MỚI
// ====================================================
document.getElementById('btn-leech-movie').addEventListener('click', async () => {
    const btn = document.getElementById('btn-leech-movie');
    
    if(confirm('Hệ thống sẽ tự động lấy 5 phim mới nhất từ KKPhim. Quá trình này mất khoảng 5-10 giây. Bạn có muốn tiếp tục?')) {
        btn.innerText = '⏳ Đang xử lý...';
        btn.disabled = true;

        try {
            const response = await fetch('https://dluaphim-api.onrender.com/api/movies/leech', { method: 'POST' });
            const data = await response.json();
            
            alert(data.message);
            loadMoviesToTable(); 
        } catch (error) {
            alert('Có lỗi xảy ra khi cào phim!');
        } finally {
            btn.innerText = '⚡ Auto Cào Phim';
            btn.disabled = false;
        }
    }
});
const btnLeechGenre = document.getElementById('btn-leech-genre');
if (btnLeechGenre) {
    btnLeechGenre.addEventListener('click', async () => {
        // Lấy thể loại đang được chọn trong ô Dropdown
        const selectedGenre = document.getElementById('leech-genre-select').value;
        const genreName = document.getElementById('leech-genre-select').options[document.getElementById('leech-genre-select').selectedIndex].text;
        
        if(confirm(`Hệ thống sẽ trộn ngẫu nhiên và bốc 5 phim thuộc thể loại "${genreName}". Bạn có muốn tiếp tục?`)) {
            btnLeechGenre.innerText = '⏳ Đang đào phim...';
            btnLeechGenre.disabled = true;

            try {
                // Gửi tên thể loại (slug) xuống API mới
                const response = await fetch('https://dluaphim-api.onrender.com/api/movies/leech-genre', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ genre: selectedGenre }) 
                });
                
                const data = await response.json();
                
                alert(data.message);
                loadMoviesToTable(); // Tải lại bảng để ngắm phim mới
            } catch (error) {
                alert('Có lỗi xảy ra khi cào phim!');
                console.error(error);
            } finally {
                btnLeechGenre.innerText = '⚡ Đào 5 Phim Ngẫu Nhiên';
                btnLeechGenre.disabled = false;
            }
        }
    });
}
// ====================================================
// TÍNH NĂNG 2: CÀO PHIM THEO TÊN (ĐOẠN NÀY BẠN BỊ THIẾU NÈ)
// ====================================================
const btnLeechSearch = document.getElementById('btn-leech-search');
if (btnLeechSearch) {
    btnLeechSearch.addEventListener('click', async () => {
        const keyword = prompt('Nhập tên phim bạn muốn tìm (Ví dụ: doraemon, deadpool, lật mặt...):');
        
        if (!keyword || keyword.trim() === '') return;

        btnLeechSearch.innerText = '⏳ Đang tìm và tải...';
        btnLeechSearch.disabled = true;

        try {
            const response = await fetch('https://dluaphim-api.onrender.com/api/movies/leech-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: keyword })
            });
            const data = await response.json();
            
            alert(data.message); 
            loadMoviesToTable(); 
        } catch (error) {
            alert('Lỗi khi gọi API tìm kiếm phim!');
            console.error(error);
        } finally {
            btnLeechSearch.innerText = '🔍 Cào Phim Theo Tên';
            btnLeechSearch.disabled = false;
        }
    });
}
async function syncAllMovies() {
    const btn = document.getElementById('btn-sync');
    const statusText = document.getElementById('sync-status');
    
    // Hiệu ứng loading
    btn.disabled = true;
    btn.innerText = '⏳ Đang đồng bộ... Vui lòng không đóng trang';
    btn.style.background = '#555';
    statusText.innerText = 'Quá trình này có thể mất 1-2 phút tùy số lượng phim...';

    try {
        const response = await fetch('https://dluaphim-api.onrender.com/api/movies/sync-all', { method: 'POST' });
        const data = await response.json();

        alert(data.message); // Báo popup thành công
        statusText.innerText = `✅ Đã xong lúc ${new Date().toLocaleTimeString()}`;
        
        // Load lại danh sách phim (Nếu bạn có hàm load phim ở admin thì gọi ở đây)
        // loadAdminMovies(); 
    } catch (error) {
        alert('Lỗi đồng bộ!');
        statusText.innerText = '❌ Đồng bộ thất bại!';
    } finally {
        // Trả lại nút như cũ
        btn.disabled = false;
        btn.innerText = '▶ Bắt đầu đồng bộ tất cả';
        btn.style.background = '#00d2ff';
    }
}
// Chạy lần đầu khi load trang
loadMoviesToTable();