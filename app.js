// Spotify API credentials (you should use environment variables in a real application)
const CLIENT_ID = config.CLIENT_ID;
const CLIENT_SECRET = config.CLIENT_SECRET;

// Global variables
let accessToken;
let trackData = [];
let charts = {};

// Fetch access token
async function getAccessToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Access Token received successfully");
        return data.access_token;
    } catch (error) {
        console.error("Error getting access token:", error);
        throw error;
    }
}

// Fetch track data from Spotify API
async function fetchTrackData() {
    const searchParams = new URLSearchParams({
        q: 'year:2023',
        type: 'track',
        market: 'IN',
        limit: 50
    });

    console.log("Fetching from URL:", `https://api.spotify.com/v1/search?${searchParams}`);

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?${searchParams}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            throw new Error('Failed to fetch track data');
        }

        const data = await response.json();
        console.log("Received data:", data);
        return data.tracks.items;
    } catch (error) {
        console.error("Error fetching track data:", error);
        throw error;
    }
}

// Process and format track data
function processTrackData(tracks) {
    return tracks.map(track => ({
        name: track.name,
        artist: track.artists[0].name,
        popularity: track.popularity,
        releaseDate: new Date(track.album.release_date),
        genre: track.artists[0].genres && track.artists[0].genres.length > 0 ? track.artists[0].genres[0] : 'Unknown'
    }));
}

// Create charts
function createCharts() {
    Chart.defaults.color = '#ffffff';
    Chart.defaults.borderColor = '#444';

    // Popularity Chart (Bar Chart)
    const popularityCtx = document.getElementById('popularity-chart').getContext('2d');
    charts.popularity = new Chart(popularityCtx, {
        type: 'bar',
        data: {
            labels: trackData.map(track => track.name),
            datasets: [{
                label: 'Popularity',
                data: trackData.map(track => track.popularity),
                backgroundColor: 'rgba(29, 185, 84, 0.6)',
                borderColor: 'rgba(29, 185, 84, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Track Popularity',
                    font: {
                        size: 18
                    }
                },
                legend: {
                    display: false
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });

    // Genre Distribution Chart (Pie Chart)
    const genreDistributionCtx = document.getElementById('genre-distribution-chart').getContext('2d');
    const genreCounts = trackData.reduce((acc, track) => {
        acc[track.genre] = (acc[track.genre] || 0) + 1;
        return acc;
    }, {});

    charts.genreDistribution = new Chart(genreDistributionCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(genreCounts),
            datasets: [{
                data: Object.values(genreCounts),
                backgroundColor: [
                    'rgba(29, 185, 84, 0.8)',
                    'rgba(30, 215, 96, 0.8)',
                    'rgba(245, 115, 160, 0.8)',
                    'rgba(80, 155, 245, 0.8)',
                    'rgba(255, 205, 86, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Genre Distribution',
                    font: {
                        size: 18
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });

    // Monthly Releases Chart (Line Chart)
    const monthlyReleasesCtx = document.getElementById('monthly-releases-chart').getContext('2d');
    const monthlyCounts = trackData.reduce((acc, track) => {
        const month = track.releaseDate.getMonth();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    charts.monthlyReleases = new Chart(monthlyReleasesCtx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Number of Releases',
                data: monthLabels.map((_, index) => monthlyCounts[index] || 0),
                borderColor: 'rgba(29, 185, 84, 1)',
                backgroundColor: 'rgba(29, 185, 84, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Releases',
                    font: {
                        size: 18
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Update charts based on filters
function updateCharts() {
    const genreFilter = document.getElementById('genre-filter').value;
    const monthFilter = document.getElementById('month-filter').value;

    const filteredData = trackData.filter(track => {
        return (
            (genreFilter === '' || track.genre.toLowerCase() === genreFilter) &&
            (monthFilter === '' || track.releaseDate.getMonth() === parseInt(monthFilter))
        );
    });

    // Update Popularity Chart
    charts.popularity.data.labels = filteredData.map(track => track.name);
    charts.popularity.data.datasets[0].data = filteredData.map(track => track.popularity);
    charts.popularity.update();

    // Update Genre Distribution Chart
    const genreCounts = filteredData.reduce((acc, track) => {
        acc[track.genre] = (acc[track.genre] || 0) + 1;
        return acc;
    }, {});
    charts.genreDistribution.data.labels = Object.keys(genreCounts);
    charts.genreDistribution.data.datasets[0].data = Object.values(genreCounts);
    charts.genreDistribution.update();

    // Update Monthly Releases Chart
    const monthlyCounts = filteredData.reduce((acc, track) => {
        const month = track.releaseDate.getMonth();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});
    charts.monthlyReleases.data.datasets[0].data = Array(12).fill(0).map((_, index) => monthlyCounts[index] || 0);
    charts.monthlyReleases.update();
}

// Populate filter options
function populateFilters() {
    const genreFilter = document.getElementById('genre-filter');
    const monthFilter = document.getElementById('month-filter');

    // Add predefined genre options
    const predefinedGenres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 'Classical', 'Jazz', 'Country', 'Folk', 'Metal'];
    predefinedGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.toLowerCase();
        option.textContent = genre;
        genreFilter.appendChild(option);
    });

    // Add genres from track data
    const trackGenres = [...new Set(trackData.map(track => track.genre))];
    trackGenres.forEach(genre => {
        if (!predefinedGenres.includes(genre)) {
            const option = document.createElement('option');
            option.value = genre.toLowerCase();
            option.textContent = genre;
            genreFilter.appendChild(option);
        }
    });

    const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthLabels.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthFilter.appendChild(option);
    });

    genreFilter.addEventListener('change', updateCharts);
    monthFilter.addEventListener('change', updateCharts);

    // Add animation to filters
    anime({
        targets: [genreFilter, monthFilter],
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        easing: 'easeOutQuad',
        duration: 800
    });
}

// Adjust chart sizes
function adjustChartSizes() {
    Object.values(charts).forEach(chart => {
        chart.resize();
    });
}

// Initialize the dashboard
async function initDashboard() {
    try {
        accessToken = await getAccessToken();
        console.log("Access token obtained successfully");

        const tracks = await fetchTrackData();
        console.log("Track data fetched successfully");

        trackData = processTrackData(tracks);
        console.log("Track data processed:", trackData);

        createCharts();
        populateFilters();
        adjustChartSizes();
        console.log("Charts created and sized successfully");
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Failed to initialize dashboard. Please check the console for more details.');
    }
}

// Start the application
initDashboard();

// Resize charts when window size changes
window.addEventListener('resize', adjustChartSizes);