const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");
let globalMovieData = null; 

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
                renderEpisodeButtons(episodes[0].server_data, slug, 0);
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
        renderEpisodeButtons(selectedServerData, movieSlug, serverIndex);
    }
}

let currentServerEpisodes = []; 

        function renderEpisodeButtons(serverData, movieSlug, serverIndex) {
            currentServerEpisodes = serverData; 
            const epGrid = document.getElementById("episode-grid") || document.getElementById("episode-list");
            if(!epGrid) return;
            epGrid.innerHTML = ''; 

            const CHUNK_SIZE = 100;

            if (serverData.length <= CHUNK_SIZE) {
                renderChunk(0, serverData.length, movieSlug, serverIndex, epGrid);
            } else {
                let rangeHTML = `<div id="ep-range-bar" style="display: flex; gap: 8px; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px; width: 100%; scrollbar-width: thin;">`;
                const totalChunks = Math.ceil(serverData.length / CHUNK_SIZE);
                let activeChunk = 0;
                if (typeof tapSlug !== 'undefined' && tapSlug) {
                    const activeIndex = serverData.findIndex(ep => ep.slug === tapSlug);
                    if (activeIndex !== -1) activeChunk = Math.floor(activeIndex / CHUNK_SIZE);
                }
                for (let i = 0; i < totalChunks; i++) {
                    const start = i * CHUNK_SIZE + 1;
                    const end = Math.min((i + 1) * CHUNK_SIZE, serverData.length);
                    const bg = i === activeChunk ? '#ffda76' : '#2a2a2f';
                    const color = i === activeChunk ? '#000' : '#fff';     
                    rangeHTML += `<button onclick="changeEpChunk(${i}, ${CHUNK_SIZE}, '${movieSlug}', ${serverIndex})" style="background: ${bg}; color: ${color}; border: 1px solid #444; padding: 6px 12px; border-radius: 4px; cursor: pointer; white-space: nowrap; font-size: 13px; font-weight: bold; transition: 0.2s;">Tập ${start}-${end}</button>`;
                }
                rangeHTML += `</div><div id="ep-buttons-container" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>`;
                
                epGrid.innerHTML = rangeHTML;
                const container = document.getElementById('ep-buttons-container');
                renderChunk(activeChunk * CHUNK_SIZE, Math.min((activeChunk + 1) * CHUNK_SIZE, serverData.length), movieSlug, serverIndex, container);
            }
        }
        window.changeEpChunk = function(chunkIndex, chunkSize, movieSlug, serverIndex) {
            const tabs = document.getElementById('ep-range-bar').children;
            for(let i = 0; i < tabs.length; i++) {
                tabs[i].style.background = (i === chunkIndex) ? '#ffda76' : '#2a2a2f';
                tabs[i].style.color = (i === chunkIndex) ? '#000' : '#fff';
            }
            const container = document.getElementById('ep-buttons-container');
            container.innerHTML = '';
            renderChunk(chunkIndex * chunkSize, Math.min((chunkIndex + 1) * chunkSize, currentServerEpisodes.length), movieSlug, serverIndex, container);
        }
        function renderChunk(startIndex, endIndex, movieSlug, serverIndex, container) {
            for (let i = startIndex; i < endIndex; i++) {
                const ep = currentServerEpisodes[i];
                const currentTapSlug = typeof tapSlug !== 'undefined' ? tapSlug : '';
                const isActive = ep.slug === currentTapSlug ? 'active' : ''; 
                const btn = document.createElement('button');
                btn.className = `episode-btn ${isActive}`;
                btn.style.padding = "10px 15px";
                btn.style.background = isActive === 'active' ? "#ffda76" : "#333";
                btn.style.color = isActive === 'active' ? "#000" : "#fff";
                btn.style.border = "none";
                btn.style.borderRadius = "5px";
                btn.style.cursor = "pointer";
                btn.style.fontWeight = isActive === 'active' ? "bold" : "normal";
                btn.innerText = ep.name;
                btn.onclick = () => window.location.href = `watch.html?slug=${movieSlug}&server=${serverIndex}&tap=${ep.slug}`;
                container.appendChild(btn);
            }
        }

function renderCommentBox() {
    const commentFormArea = document.getElementById('comment-form-area');
    const username = sessionStorage.getItem('username');
    
    if (username && commentFormArea) {
        // Lấy thông tin có sẵn trong máy do loadHeader.js đã lưu
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

document.addEventListener("DOMContentLoaded", () => {
    if (!slug) {
        window.location.href = "index.html";
        return;
    }
    loadMovieDetail();
    renderCommentBox();
    loadComments();
});