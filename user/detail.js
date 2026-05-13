const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");
let globalMovieData = null; 

// ==========================================
// 1. TẢI CHI TIẾT PHIM (CÓ ĐA SERVER)
// ==========================================
async function loadMovieDetail() {
    try {
        const response = await fetch(`https://phimapi.com/phim/${slug}`);
        const data = await response.json();
        
        if (data.status) {
            const movie = data.movie;
            globalMovieData = data; 

            document.getElementById("d-backdrop").style.backgroundImage = `url('${movie.poster_url}')`;
            document.getElementById("d-poster").src = movie.thumb_url;
            document.getElementById("d-name").innerText = movie.name;
            document.getElementById("d-origin-name").innerText = movie.origin_name;
            
            document.getElementById("d-quality").innerText = movie.quality + ' ' + movie.lang;
            document.getElementById("d-year").innerText = movie.year;
            document.getElementById("d-time").innerText = movie.time;
            document.getElementById("d-status").innerText = movie.episode_current;
            
            let genresHtml = '';
            movie.category.forEach(cat => genresHtml += `<span>${cat.name}</span>`);
            document.getElementById("d-genres").innerHTML = genresHtml;
            document.getElementById("d-content").innerHTML = movie.content;
            document.title = `${movie.name} - DLUAPHIM`;

            const episodes = data.episodes; 
            if (episodes && episodes.length > 0) {
                renderServers(episodes, slug);
                renderEpisodes(episodes[0].server_data, slug, 0); 
            }

            document.getElementById("btn-play-now").addEventListener("click", () => {
                if(episodes.length > 0 && episodes[0].server_data.length > 0) {
                    const firstEpSlug = episodes[0].server_data[0].slug;
                    window.location.href = `watch.html?slug=${slug}&server=0&tap=${firstEpSlug}`;
                }
            });
        }
    } catch (error) { console.error("Lỗi:", error); }
}

function renderServers(episodesArray, movieSlug) {
    const serverListDiv = document.getElementById("server-list");
    let html = '<strong style="margin-right: 15px;">Mạng:</strong>';
    episodesArray.forEach((serverItem, index) => {
        const activeClass = index === 0 ? 'active' : ''; 
        html += `<button class="server-btn ${activeClass}" onclick="changeServer(${index}, '${movieSlug}')">📺 ${serverItem.server_name}</button>`;
    });
    serverListDiv.innerHTML = html;
}

window.changeServer = function(serverIndex, movieSlug) {
    const btns = document.querySelectorAll('.server-btn');
    btns.forEach((btn, idx) => {
        if(idx === serverIndex) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    if(globalMovieData) {
        const selectedServerData = globalMovieData.episodes[serverIndex].server_data;
        renderEpisodes(selectedServerData, movieSlug, serverIndex);
    }
}

function renderEpisodes(serverData, movieSlug, serverIndex) {
    const epGrid = document.getElementById("episode-grid");
    epGrid.innerHTML = ''; 
    serverData.forEach(ep => {
        const linkWatch = `watch.html?slug=${movieSlug}&server=${serverIndex}&tap=${ep.slug}`;
        epGrid.innerHTML += `<button class="ep-btn" onclick="window.location.href='${linkWatch}'">▶ ${ep.name}</button>`;
    });
}

// ==========================================
// 2. CHUÔNG THÔNG BÁO, TÊN HIỂN THỊ & BÌNH LUẬN
// ==========================================
async function checkLoginState() {
    const username = sessionStorage.getItem('username');
    const userContainer = document.querySelector('.user-account');
    const commentFormArea = document.getElementById('comment-form-area');

    if (username) {
        let avatarSrc = "https://i.pravatar.cc/150?img=11";
        let displayName = username; 
        
        try {
            const res = await fetch(`https://dluaphim-api.onrender.com/api/users/${username}`);
            const userData = await res.json();
            if (userData.avatar) avatarSrc = userData.avatar;
            if (userData.fullName) displayName = userData.fullName; 
        } catch (e) {}

        sessionStorage.setItem('displayName', displayName);
        sessionStorage.setItem('userAvatar', avatarSrc);

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

        if(userContainer) {
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
                        <div class="avatar-btn" onclick="document.getElementById('user-menu').classList.toggle('show')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <img src="${avatarSrc}" alt="Avatar" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid #ffda76;">
                            <span style="color: white; font-weight: bold; font-size: 14px;">${displayName} ▾</span>
                        </div>
                        <div id="user-menu" class="user-dropdown-menu">
                            <a href="profile.html">⚙️ Đổi thông tin</a>
                            <a href="#" onclick="sessionStorage.clear(); window.location.reload();" style="color: #ff4d4d;">👋 Đăng xuất</a>
                        </div>
                    </div>
                </div>
            `;
        }

        if(commentFormArea) {
            commentFormArea.innerHTML = `
                <div style="display: flex; gap: 15px; align-items: flex-start;">
                    <img src="${avatarSrc}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 1px solid #444;">
                    <div style="flex: 1;">
                        <textarea id="comment-input" placeholder="${displayName} ơi, bạn nghĩ sao về phim này?..." style="width: 100%; height: 60px; background: #1c1c1f; border: 1px solid #444; border-radius: 8px; padding: 12px; color: white; font-family: inherit; resize: none;"></textarea>
                        <button onclick="submitComment()" style="background: #ffda76; color: black; padding: 8px 20px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; float: right; margin-top: 10px;">Gửi Bình Luận</button>
                    </div>
                </div>
                <div style="clear: both;"></div>
            `;
        }
    } else {
        if(commentFormArea) {
            commentFormArea.innerHTML = `<p style="color: #888; font-size: 14px;">Vui lòng <a href="login.html" style="color: #ffda76; font-weight: bold;">đăng nhập</a> để bình luận.</p>`;
        }
    }
}

window.submitComment = async function() {
    sendCommentData(document.getElementById('comment-input').value, null, null);
};

window.submitReply = async function(parentId, replyToUsername) {
    sendCommentData(document.getElementById(`reply-input-${parentId}`).value, parentId, replyToUsername);
};

async function sendCommentData(content, parentId, replyToUsername) {
    const username = sessionStorage.getItem('username');
    const fullName = sessionStorage.getItem('displayName') || username; 
    const avatar = sessionStorage.getItem('userAvatar') || 'https://i.pravatar.cc/150?img=11';

    if (!content.trim()) return;

    try {
        const res = await fetch(`https://dluaphim-api.onrender.com/api/movies/${slug}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, fullName, avatar, content: content.trim(), parentId, replyToUser: replyToUsername })
        });
        if (res.ok) loadComments(); 
    } catch (err) { alert('Lỗi mạng!'); }
}

async function loadComments() {
    try {
        const res = await fetch(`https://dluaphim-api.onrender.com/api/movies/${slug}/comments`);
        const comments = await res.json();
        
        const listDiv = document.getElementById('comments-list');
        if (!Array.isArray(comments)) return;
        
        document.getElementById('comment-count').innerText = comments.length || 0;
        if(comments.length === 0) {
            listDiv.innerHTML = '<div style="color: #888; text-align: center;">Chưa có bình luận nào!</div>';
            return;
        }

        const parents = comments.filter(c => !c.parentId);
        const replies = comments.filter(c => c.parentId);

        listDiv.innerHTML = '';
        
        parents.forEach(cmt => {
            const date = new Date(cmt.createdAt).toLocaleString('vi-VN');
            const displayCmtName = cmt.fullName || cmt.username; 
            
            const childReplies = replies.filter(r => r.parentId === cmt._id);
            let repliesHtml = '';
            
            childReplies.forEach(reply => {
                const rDate = new Date(reply.createdAt).toLocaleString('vi-VN');
                const displayRepName = reply.fullName || reply.username;
                
                repliesHtml += `
                    <div id="comment-${reply._id}" style="display: flex; gap: 10px; margin-top: 15px; margin-left: 50px; background: #1c1c1f; padding: 10px; border-radius: 8px; border-left: 2px solid #555; transition: 1s;">
                        <img src="${reply.avatar}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0; color: #fff; font-size: 14px;">${displayRepName} <span style="color: #888; font-size: 11px; margin-left: 10px;">🕒 ${rDate}</span></h4>
                            <p style="margin: 5px 0 0 0; color: #ccc; font-size: 13px;">
                                <span style="color: #00d2ff; font-weight: bold;">@${reply.replyToUser}</span> ${reply.content}
                            </p>
                        </div>
                    </div>
                `;
            });

            listDiv.innerHTML += `
                <div style="margin-bottom: 25px;">
                    <div id="comment-${cmt._id}" style="display: flex; gap: 15px; background: #2a2a2f; padding: 15px; border-radius: 8px; border-left: 3px solid #ffda76; transition: 1s;">
                        <img src="${cmt.avatar}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 1px solid #444;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0; color: #fff; font-size: 15px;">${displayCmtName} <span style="color: #888; font-size: 12px; font-weight: normal; margin-left: 10px;">🕒 ${date}</span></h4>
                            <p style="margin: 8px 0; color: #ccc; font-size: 14px; line-height: 1.5;">${cmt.content}</p>
                            <button onclick="showReplyForm('${cmt._id}', '${cmt.username}', '${displayCmtName}')" style="background: transparent; border: none; color: #ffda76; cursor: pointer; font-size: 13px; font-weight: bold; padding: 0;">↪ Trả lời</button>
                            <div id="reply-form-${cmt._id}" style="display: none; margin-top: 10px;"></div>
                        </div>
                    </div>
                    ${repliesHtml}
                </div>
            `;
        });

        // TỰ ĐỘNG CUỘN KHI BẤM CHUÔNG TỪ NƠI KHÁC
        if (window.location.hash) {
            const targetCmt = document.querySelector(window.location.hash);
            if (targetCmt) {
                setTimeout(() => {
                    targetCmt.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCmt.style.backgroundColor = 'rgba(255, 218, 118, 0.3)';
                    setTimeout(() => targetCmt.style.backgroundColor = '', 3000); 
                }, 500); 
            }
        }
    } catch (err) {}
}

window.showReplyForm = function(parentId, replyToUsername, displayCmtName) {
    document.querySelectorAll('[id^="reply-form-"]').forEach(el => el.style.display = 'none');
    const formDiv = document.getElementById(`reply-form-${parentId}`);
    formDiv.style.display = 'block';
    formDiv.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: flex-start;">
            <textarea id="reply-input-${parentId}" placeholder="Trả lời ${displayCmtName}..." style="flex: 1; height: 40px; background: #1c1c1f; border: 1px solid #444; border-radius: 6px; padding: 10px; color: white; resize: none; font-size: 13px; font-family: inherit;"></textarea>
            <button onclick="submitReply('${parentId}', '${replyToUsername}')" style="background: #00d2ff; color: black; border: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Gửi</button>
        </div>
    `;
    document.getElementById(`reply-input-${parentId}`).focus();
}

// 3. KHỞI CHẠY TẤT CẢ
document.addEventListener("DOMContentLoaded", () => {
    if (!slug) {
        window.location.href = "index.html";
        return;
    }
    loadMovieDetail();
    checkLoginState();
    loadComments();
});

window.addEventListener('click', function(event) {
    if (!event.target.closest('.avatar-btn') && !event.target.closest('.user-dropdown-menu') && !event.target.closest('[onclick*="noti-menu"]')) {
        document.querySelectorAll('.user-dropdown-menu').forEach(menu => menu.classList.remove('show'));
    }
});
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