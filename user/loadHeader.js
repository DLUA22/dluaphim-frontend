document.addEventListener("DOMContentLoaded", function() {
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            if (typeof checkLogin === 'function') {
                checkLogin();
            }
            const searchInput = document.querySelector('.search-bar input');
            if (searchInput) {
                searchInput.addEventListener('input', (event) => {
                    const searchTerm = event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                    if (typeof allMovies !== 'undefined') {
                        const filteredMovies = allMovies.filter(movie => {
                            const normalizedTitle = movie.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                            return normalizedTitle.includes(searchTerm);
                        });
                        if (typeof renderMovies === 'function') {
                            renderMovies(filteredMovies);
                        }
                    }
                });
            }
        })
        .catch(error => console.error('Lỗi tải Header:', error));
});