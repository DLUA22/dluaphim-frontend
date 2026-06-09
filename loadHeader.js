document.addEventListener("DOMContentLoaded", function() {
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            checkLoginSync();
        })
        .catch(error => console.error('Lỗi tải Header:', error));
});

function checkLoginSync() {
    const username = sessionStorage.getItem('username');
    const userArea = document.getElementById('user-account-area');
    if (username && userArea) {
        const avatarSrc = sessionStorage.getItem('userAvatar') || 'https://i.pravatar.cc/150?img=11';
        const displayName = sessionStorage.getItem('displayName') || username;
        userArea.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <div class="avatar-btn" onclick="document.getElementById('user-menu-global').classList.toggle('show')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <img src="${avatarSrc}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid #ffda76;">
                    <span style="color: white; font-weight: bold; font-size: 14px;">${displayName} ▾</span>
                </div>
                <div id="user-menu-global" class="user-dropdown-menu" style="display: none; position: absolute; right: 0; background: #1c1c1f; padding: 10px; border-radius: 8px; z-index: 9999; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                    <a href="profile.html" style="color: white; display: block; padding: 8px; text-decoration: none;">⚙️ Đổi thông tin</a>
                    <a href="#" onclick="logoutUser()" style="color: #ff4d4d; display: block; padding: 8px; text-decoration: none;">👋 Đăng xuất</a>
                </div>
            </div>
        `;
    }
}
function logoutUser() {
    sessionStorage.clear();
    window.location.reload();
}
window.addEventListener('click', function(event) {
    if (!event.target.closest('.avatar-btn') && !event.target.closest('#user-menu-global')) {
        const menu = document.getElementById('user-menu-global');
        if (menu) menu.classList.remove('show');
    }
});