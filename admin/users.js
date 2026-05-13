const API_URL_USERS = 'https://dluaphim-api.onrender.com/api/users';

// Hàm lấy danh sách thành viên và vẽ ra bảng
async function loadUsersToTable() {
    try {
        const response = await fetch(API_URL_USERS);
        const users = await response.json();
        
        const tbody = document.getElementById('admin-user-list');
        tbody.innerHTML = ''; 

        users.forEach(user => {
            // Check quyền để tô màu cho nhãn
            const roleBadge = user.role === 'admin' 
                ? '<span class="status-badge active" style="background-color: #dc3545;">Admin</span>' 
                : '<span class="status-badge active" style="background-color: #007bff;">User</span>';
            
            // Ẩn nút Xóa nếu người đó là Admin (để tránh lỡ tay xóa nhầm trùm cuối)
            const deleteButton = user.role === 'admin' 
                ? '' 
                : `<button class="btn-delete" onclick="deleteUser('${user._id}')">Xóa</button>`;

            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: bold; font-size: 16px;">${user.username}</td>
                    <td style="color: #666; font-style: italic;">${user.password}</td>
                    <td>${roleBadge}</td>
                    <td>${deleteButton}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Lỗi tải danh sách người dùng:', error);
    }
}

// Hàm Xóa thành viên
async function deleteUser(id) {
    if (confirm('Bạn có chắc chắn muốn xóa thành viên này không?')) {
        try {
            await fetch(`${API_URL_USERS}/${id}`, { method: 'DELETE' });
            loadUsersToTable(); // Load lại bảng cho nó biến mất luôn
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
        }
    }
}

// Chạy hàm khi mở trang
loadUsersToTable();