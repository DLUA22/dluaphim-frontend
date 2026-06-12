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
// NÂNG CẤP 1: CÀO PHIM THEO TÊN (Tìm Nhiều Phim - Chọn Lọc)
// ====================================================
const btnLeechSearch = document.getElementById('btn-leech-search');
if (btnLeechSearch) {
    btnLeechSearch.addEventListener('click', () => {
        // Mở Modal
        document.getElementById('scrape-modal').style.display = 'flex';
        document.getElementById('scrape-results').innerHTML = '<p style="color:#888; text-align:center; padding: 20px;">Nhập từ khóa và bấm Tìm kiếm...</p>';
        document.getElementById('scrape-keyword').value = '';
        document.getElementById('scrape-keyword').focus();
    });
}

// Gọi API KKPhim để tìm danh sách phim
async function executeSearchToScrape() {
    const kw = document.getElementById('scrape-keyword').value;
    const resBox = document.getElementById('scrape-results');
    
    if(!kw.trim()) { alert("Vui lòng nhập tên phim!"); return; }
    
    resBox.innerHTML = '<p style="color:#ffda76; text-align:center; padding: 20px;">⏳ Đang tìm kiếm...</p>';
    
    try {
        // Tìm kiếm với limit 20
        const response = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&limit=20`);
        const data = await response.json();
        
        if (!data.data || !data.data.items || data.data.items.length === 0) {
            resBox.innerHTML = `<p style="color:#ff5555; text-align:center; padding: 20px;">Không tìm thấy phim nào có tên "${kw}"</p>`;
            return;
        }

        let html = '';
        data.data.items.forEach(movie => {
            // Hiển thị danh sách kết quả kèm checkbox. 
            // Quan trọng: Sử dụng "slug" làm giá trị (value) của ô checkbox
            html += `
                <div style="display:flex; align-items:center; gap:15px; padding:10px; border-bottom:1px solid #444;">
                    <input type="checkbox" class="scrape-checkbox" value="${movie.slug}" style="width:20px; height:20px; cursor:pointer;">
                    <img src="https://phimimg.com/${movie.thumb_url}" style="width:50px; height:70px; object-fit:cover; border-radius:4px; border: 1px solid #666;">
                    <div>
                        <strong style="color:white; font-size:15px;">${movie.name}</strong><br>
                        <small style="color:#aaa;">${movie.origin_name} (${movie.year})</small>
                    </div>
                </div>
            `;
        });
        resBox.innerHTML = html;
    } catch (e) {
        resBox.innerHTML = '<p style="color:#ff5555; text-align:center; padding: 20px;">Lỗi kết nối tới KKPhim API!</p>';
    }
}

// Xử lý gửi các phim đã tick chọn lên Backend
async function importSelectedMovies() {
    const checkboxes = document.querySelectorAll('.scrape-checkbox:checked');
    if(checkboxes.length === 0) return alert("Vui lòng tick chọn ít nhất 1 phim!");
    
    document.getElementById('scrape-modal').style.display='none';
    
    let successCount = 0;
    
    // Gửi từng slug lên API cào phim (Do API hiện tại của bạn lấy 1 phim, ta gửi lần lượt)
    for(let box of checkboxes) {
        const slug = box.value;
        try {
            // Lưu ý: API leech-search hiện tại của bạn đang nhận vào "keyword" là tên. 
            // Để dùng với slug chính xác, bạn cần tạo thêm 1 API bên Backend nhận "slug" (xem mục 3 bên dưới)
            const res = await fetch('https://dluaphim-api.onrender.com/api/movies/leech-by-slug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: slug })
            });
            
            if(res.ok) successCount++;
        } catch(e) { console.error("Lỗi cào phim", slug); }
    }
    sessionStorage.removeItem('dluaphim_allMovies');
    alert(`Đã cào thành công ${successCount}/${checkboxes.length} phim được chọn!`);
    loadMoviesToTable();
}

// ====================================================
// NÂNG CẤP 2: CÔNG TẮC BẢO TRÌ SERVER VIDEO
// ====================================================
async function togglePlayerServer() {
    const isChecked = document.getElementById('player-toggle').checked;
    const statusText = document.getElementById('player-status-text');
    
    try {
        await fetch('https://dluaphim-api.onrender.com/api/movies/settings/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: isChecked })
        });
        
        if (isChecked) {
            statusText.innerText = "Hoạt Động";
            statusText.style.color = "#28a745";
            alert("Đã MỞ hệ thống phát video! Người dùng có thể xem phim bình thường.");
        } else {
            statusText.innerText = "Đang Tắt";
            statusText.style.color = "#ff5555";
            alert("Đã TẮT hệ thống phát video! Màn hình xem phim sẽ hiển thị thông báo bảo trì.");
        }
    } catch(err) {
        alert("Không thể lưu trạng thái. Kiểm tra Backend!");
    }
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
async function loadPlayerSetting() {
    try {
        const res = await fetch('https://dluaphim-api.onrender.com/api/movies/settings/player');
        const data = await res.json();
        
        const checkbox = document.getElementById('player-toggle');
        const statusText = document.getElementById('player-status-text');
        
        if (checkbox && statusText) {
            checkbox.checked = data.enabled; // Cập nhật đúng trạng thái
            if (data.enabled) {
                statusText.innerText = "Hoạt Động";
                statusText.style.color = "#28a745";
            } else {
                statusText.innerText = "Đang Tắt";
                statusText.style.color = "#ff5555";
            }
        }
    } catch(e) { console.log("Lỗi tải cài đặt"); }
}
// Chạy lần đầu khi load trang
loadPlayerSetting();
loadMoviesToTable();