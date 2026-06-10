const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");
let globalMovieData = null; 

if (!slug) window.location.href = 'index.html';

// ==========================================
// 1. TẢI CHI TIẾT PHIM
// ==========================================
async function loadMovieDetail() {
    try {
        const response = await fetch(`https://phimapi.com/phim/${slug}`);
        const data = await response.json();
        
        if (data.status) {
            const movie = data.movie;
            globalMovieData = data; 

            const backdropEl = document.getElementById("d-backdrop");
            if (backdropEl) backdropEl.style.backgroundImage = `url('${movie.poster_url}')`;

            const posterEl = document.getElementById("d-poster");
            if (posterEl) posterEl.src = movie.thumb_url;

            const titleEl = document.getElementById("d-name");
            if (titleEl) titleEl.innerText = movie.name;

            const originEl = document.getElementById("d-origin-name");
            if (originEl) originEl.innerText = movie.origin_name;
            
            const qualityEl = document.getElementById("d-quality");
            if (qualityEl) qualityEl.innerText = movie.quality + ' ' + movie.lang;

            const yearEl = document.getElementById("d-year");
            if (yearEl) yearEl.innerText = movie.year;

            const timeEl = document.getElementById("d-time");
            if (timeEl) timeEl.innerText = movie.time;

            const statusEl = document.getElementById("d-status");
            if (statusEl) statusEl.innerText = movie.episode_current;
            
            let genresHtml = '';
            if (movie.category) {
                movie.category.forEach(cat => genresHtml += `<span>${cat.name}</span>`);
            }
            const genreEl = document.getElementById("d-genres");
            if (genreEl) genreEl.innerHTML = genresHtml;

            const contentEl = document.getElementById("d-content");
            if (contentEl) contentEl.innerHTML = movie.content || 'Chưa có thông tin.';

            document.title = `${movie.name} - DLUAPHIM`;

            const episodes = data.episodes; 
            if (episodes && episodes.length > 0) {
                renderServers(episodes, slug);
                renderEpisodeButtons(episodes[0].server_data, slug, 0); 
            }

            const playBtn = document.getElementById("btn-play-now");
            if (playBtn) {
                playBtn.addEventListener("click", () => {
                    if(episodes.length > 0 && episodes[0].server_data.length > 0) {
                        const firstEpSlug = episodes[0].server_data[0].slug;
                        window.location.href = `watch.html?slug=${slug}&server=0&tap=${firstEpSlug}`;
                    }
                });
            }
        }
    } catch (error) { console.error("Lỗi:", error); }
}

function renderServers(episodesArray, movieSlug) {
    const serverListDiv = document.getElementById("server-list");
    if(!serverListDiv) return;
    let html = '<strong style="margin-right: 15px; color: white;">Mạng:</strong>';
    episodesArray.forEach((serverItem, index) => {
        const activeClass = index === 0 ? 'active' : ''; 
        html += `<button class="server-btn ${activeClass}" onclick="changeServer(${index}, '${movieSlug}')">📺 ${serverItem.server_name}</button>`;
    });
    serverListDiv.innerHTML = html;
}

window.changeServer = function(serverIndex, movieSlug) {
    const btns = document.querySelectorAll('.server-btn');
    btns.forEach((btn, idx) => {
        if(idx === serverIndex) {
            btn.classList.add('active');
            btn.style.background = "rgba(255, 218, 118, 0.1)";
            btn.style.color = "#ffda76";
            btn.style.borderColor = "#ffda76";
        } else {
            btn.classList.remove('active');
            btn.style.background = "#252730";
            btn.style.color = "#aaa";
            btn.style.borderColor = "#444";
        }
    });

    if(globalMovieData) {
        const selectedServerData = globalMovieData.episodes[serverIndex].server_data;
        renderEpisodeButtons(selectedServerData, movieSlug, serverIndex);
    }
}

// ==========================================
// 2. TẠO TAB VÀ LƯỚI TẬP PHIM (CHO TRANG DETAIL)
// ==========================================
let currentServerEpisodes = []; 
const CHUNK_SIZE = 100;

function renderEpisodeButtons(serverData, movieSlug, currentServerIdx) {
    currentServerEpisodes = serverData; 
    const epListDiv = document.getElementById("episode-grid");
    if(!epListDiv) return;
    
    epListDiv.innerHTML = ''; 
    epListDiv.style.display = "block"; 

    if (serverData.length <= CHUNK_SIZE) {
        const container = document.createElement('div');
        epListDiv.appendChild(container);
        renderChunk(0, serverData.length, movieSlug, currentServerIdx, container);
    } else {
        let rangeHTML = `<div class="ep-tabs-wrapper" style="display: flex; flex-wrap: nowrap; gap: 8px; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; -ms-overflow-style: none; width: 100%;">`;
        const totalChunks = Math.ceil(serverData.length / CHUNK_SIZE);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE + 1;
            const end = Math.min((i + 1) * CHUNK_SIZE, serverData.length);
            const bg = i === 0 ? '#ffda76' : '#2a2a2f'; 
            const color = i === 0 ? '#000' : '#fff';    
            rangeHTML += `<button class="ep-tab-btn" onclick="changeEpChunk(${i}, '${movieSlug}', ${currentServerIdx})" style="background: ${bg}; color: ${color}; border: 1px solid #444; padding: 8px 15px; border-radius: 4px; cursor: pointer; white-space: nowrap; font-size: 13px; font-weight: bold; transition: 0.2s; flex: 0 0 auto;">Tập ${start}-${end}</button>`;
        }
        rangeHTML += `</div><div id="ep-buttons-container"></div>`;

        epListDiv.innerHTML = rangeHTML;
        const slider = epListDiv.querySelector('.ep-tabs-wrapper');
        let isDown = false; let startX; let scrollLeft;
        slider.addEventListener('mousedown', (e) => {
            isDown = true; slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'pointer'; });
        slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'pointer'; });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; 
            slider.scrollLeft = scrollLeft - walk;
        });
        const container = document.getElementById('ep-buttons-container');
        renderChunk(0, Math.min(CHUNK_SIZE, serverData.length), movieSlug, currentServerIdx, container);
    }
}

window.changeEpChunk = function(chunkIndex, movieSlug, currentServerIdx) {
    const tabs = document.querySelectorAll('.ep-tab-btn');
    tabs.forEach((tab, i) => {
        tab.style.background = (i === chunkIndex) ? '#ffda76' : '#2a2a2f';
        tab.style.color = (i === chunkIndex) ? '#000' : '#fff';
    });
    const container = document.getElementById('ep-buttons-container');
    container.innerHTML = '';
    renderChunk(chunkIndex * CHUNK_SIZE, Math.min((chunkIndex + 1) * CHUNK_SIZE, currentServerEpisodes.length), movieSlug, currentServerIdx, container);
}

function renderChunk(startIndex, endIndex, movieSlug, currentServerIdx, container) {
    // Ép CSS Grid thông minh cho các nút tập phim
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(80px, 1fr))";
    container.style.gap = "8px";

    for (let i = startIndex; i < endIndex; i++) {
        const ep = currentServerEpisodes[i];
        
        const btn = document.createElement('button');
        btn.style.padding = "10px 5px";
        btn.style.background = "#252730";
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "13px";
        btn.style.width = "100%";
        btn.innerText = ep.name;
        
        // Hiệu ứng hover cho nút
        btn.onmouseover = () => { btn.style.background = "#ffda76"; btn.style.color = "#000"; btn.style.fontWeight = "bold"; };
        btn.onmouseout = () => { btn.style.background = "#252730"; btn.style.color = "#fff"; btn.style.fontWeight = "normal"; };
        
        btn.onclick = () => window.location.href = `watch.html?slug=${movieSlug}&server=${currentServerIdx}&tap=${ep.slug}`;
        container.appendChild(btn);
    }
}

// ==========================================
// 3. HỆ THỐNG BÌNH LUẬN (DÀNH CHO DETAIL)
// ==========================================
function renderCommentBox() {
    const commentFormArea = document.getElementById('comment-form-area');
    const username = sessionStorage.getItem('username');
    
    if (username && commentFormArea) {
        const avatarSrc = sessionStorage.getItem('userAvatar') || 'https://i.pravatar.cc/150?img=11';
        const displayName = sessionStorage.getItem('displayName') || username; 
        
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
    } else if(commentFormArea) {
        commentFormArea.innerHTML = `<p style="color: #888; font-size: 14px;">Vui lòng <a href="login.html" style="color: #ffda76; font-weight: bold;">đăng nhập</a> để bình luận.</p>`;
    }
}

window.submitComment = async function() { sendCommentData(document.getElementById('comment-input').value, null, null); };
window.submitReply = async function(parentId, replyToUsername) { sendCommentData(document.getElementById(`reply-input-${parentId}`).value, parentId, replyToUsername); };

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
        if(!listDiv) return;

        if (!Array.isArray(comments)) return;
        
        const countEl = document.getElementById('comment-count');
        if(countEl) countEl.innerText = comments.length || 0;

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

document.addEventListener("DOMContentLoaded", () => {
    loadMovieDetail();
    renderCommentBox();
    loadComments();
});