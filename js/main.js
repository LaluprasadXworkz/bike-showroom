// ===== GLOBAL VARIABLES =====
let currentPage = 1;
let currentFilters = {
  search: '',
  category: 'all',
  sort: 'default'
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS (already in HTML)
  
  // Load bikes on bikes page
  if (document.getElementById("bikes-container")) {
    loadBikes(true);
  }
  
  // Load featured bikes on homepage
  if (document.getElementById("featured-bikes")) {
    loadFeaturedBikes();
  }
  
  // Load bike details on details page
  if (document.getElementById("bike-detail")) {
    loadBikeDetails();
  }
  
  // Setup search and filters
  setupSearchAndFilters();
  
  // Setup load more button
  const loadMore = document.getElementById("load-more");
  if (loadMore) {
    loadMore.addEventListener("click", () => {
      currentPage++;
      loadBikes(false);
    });
  }
});

// ===== LOADING STATES =====
function showLoading(show, element = null) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = show ? 'block' : 'none';
  }
  
  if (element && show) {
    element.style.opacity = '0.5';
    element.style.pointerEvents = 'none';
  } else if (element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
  }
}

// ===== LOAD BIKES (with pagination) =====
async function loadBikes(reset = true) {
  const container = document.getElementById("bikes-container");
  const resultsCount = document.getElementById("results-count");
  const loadMore = document.getElementById("load-more");
  
  if (!container) return;
  
  try {
    showLoading(true);
    
    const result = await getAllBikes(currentPage);
    
    // Update results count
    if (resultsCount) {
      resultsCount.innerHTML = `Showing <strong>${result.bikes.length}</strong> of <strong>${result.total}</strong> premium bikes`;
    }
    
    // Update load more button
    if (loadMore) {
      loadMore.disabled = !result.hasMore;
    }
    
    // Render bikes
    if (reset) {
      container.innerHTML = renderBikes(result.bikes);
    } else {
      container.insertAdjacentHTML('beforeend', renderBikes(result.bikes.slice(-BIKES_PER_PAGE)));
    }
    
  } catch (error) {
    console.error('Error loading bikes:', error);
    container.innerHTML = '<p class="text-center" style="color: #ff6b6b; padding: 50px;">Error loading bikes. Please refresh the page.</p>';
  } finally {
    showLoading(false);
  }
}

// ===== LOAD FEATURED BIKES (for homepage) =====
async function loadFeaturedBikes() {
  const container = document.getElementById('featured-bikes');
  if (!container) return;
  
  try {
    showLoading(true);
    
    const result = await getAllBikes(1);
    const featured = result.bikes.slice(0, 3); // Show first 3 bikes
    
    container.innerHTML = renderBikes(featured);
    
  } catch (error) {
    console.error('Error loading featured bikes:', error);
    container.innerHTML = '<p class="text-center" style="color: #999; padding: 50px;">Unable to load featured bikes</p>';
  } finally {
    showLoading(false);
  }
}

// ===== RENDER BIKE CARDS (MATCHES CSS PERFECTLY) =====
function renderBikes(bikes) {
  if (!bikes || !bikes.length) {
    return '<p class="text-center" style="color: #999; padding: 50px;">No bikes found</p>';
  }
  
  let html = '<div class="bike-grid">';
  
  bikes.forEach((bike) => {
    const engine = getEngineSize(bike.specs);
    const power = getPower(bike.specs);
    const weight = getWeight(bike.specs);
    const year = getYear(bike.specs);
    const image = getImage(bike.images);
    
    html += `
      <div class="bike-card" onclick="viewBike('${bike.id}')">
        <div class="card-image">
          <img src="${image}" alt="${bike.brand} ${bike.model}">
          <span class="card-badge">${year}</span>
        </div>
        <div class="card-content">
          <h3>${bike.brand} ${bike.model}</h3>
          <span class="card-brand">${bike.brand}</span>
          <div class="card-specs">
            <div class="spec-item">
              <i class="fas fa-engine"></i>
              <span class="spec-value">${engine}</span>
            </div>
            <div class="spec-item">
              <i class="fas fa-horse-head"></i>
              <span class="spec-value">${power}</span>
            </div>
            <div class="spec-item">
              <i class="fas fa-weight-hanging"></i>
              <span class="spec-value">${weight}</span>
            </div>
          </div>
          <button class="btn-view">VIEW DETAILS</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// ===== VIEW BIKE (navigate to details page) =====
function viewBike(id) {
  const bike = getBikeById(id);
  if (bike) {
    sessionStorage.setItem("bike", JSON.stringify(bike));
    window.location.href = "bike-details.html";
  }
}

// ===== LOAD BIKE DETAILS (with full CSS styling) =====
function loadBikeDetails() {
  const container = document.getElementById("bike-detail");
  if (!container) return;
  
  // Try to get bike from sessionStorage
  let bike = JSON.parse(sessionStorage.getItem("bike"));
  
  // Also check URL parameters (for direct links)
  const urlParams = new URLSearchParams(window.location.search);
  const bikeId = urlParams.get('id');
  
  if (!bike && bikeId) {
    bike = getBikeById(bikeId);
  }
  
  if (!bike) {
    container.innerHTML = `
      <div style="text-align: center; padding: 100px 20px;">
        <i class="fas fa-motorcycle" style="font-size: 5rem; color: #FFD700; margin-bottom: 20px;"></i>
        <h2 style="color: #fff; margin-bottom: 20px;">Bike Not Found</h2>
        <p style="color: #999; margin-bottom: 30px;">The motorcycle you're looking for doesn't exist or has been removed.</p>
        <a href="bikes.html" class="btn-premium">BROWSE COLLECTION</a>
      </div>
    `;
    return;
  }

  const images = getImages(bike.images);
  const engine = getEngineSize(bike.specs);
  const power = getPower(bike.specs);
  const weight = getWeight(bike.specs);
  const year = getYear(bike.specs);
  
  // Generate thumbnail gallery
  let thumbnails = '';
  images.forEach((img, index) => {
    thumbnails += `
      <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">
        <img src="${img}" alt="Thumbnail ${index + 1}">
      </div>
    `;
  });

  // Generate specs table
  let specsRows = '';
  if (bike.specs) {
    Object.entries(bike.specs).forEach(([key, value]) => {
      if (value && key !== 'id') {
        specsRows += `
          <div class="spec-row">
            <span class="spec-label">${key}</span>
            <span class="spec-value">${value}</span>
          </div>
        `;
      }
    });
  }

  container.innerHTML = `
    <div class="detail-grid">
      <div class="detail-gallery">
        <div class="main-image" id="main-image">
          <img src="${images[0]}" alt="${bike.brand} ${bike.model}">
        </div>
        <div class="thumbnail-grid">
          ${thumbnails}
        </div>
      </div>
      
      <div class="detail-info">
        <h1 class="detail-title">${bike.brand} ${bike.model}</h1>
        <span class="detail-year">${year} Model</span>
        
        <div class="specs-highlight">
          <div class="highlight-box">
            <i class="fas fa-engine"></i>
            <span class="label">Engine</span>
            <span class="value">${engine}</span>
          </div>
          <div class="highlight-box">
            <i class="fas fa-horse-head"></i>
            <span class="label">Power</span>
            <span class="value">${power}</span>
          </div>
          <div class="highlight-box">
            <i class="fas fa-weight-hanging"></i>
            <span class="label">Weight</span>
            <span class="value">${weight}</span>
          </div>
        </div>
        
        <div class="specs-table">
          ${specsRows}
        </div>
        
        <button class="btn-book" onclick="inquireAboutBike('${bike.id}')">
          <i class="fas fa-envelope"></i> INQUIRE ABOUT THIS BIKE
        </button>
        
        <a href="bikes.html" style="display: block; text-align: center; margin-top: 20px; color: #999; text-decoration: none;">
          ← Back to Collection
        </a>
      </div>
    </div>
  `;
}

// ===== CHANGE MAIN IMAGE (for details page) =====
function changeMainImage(thumbnail, imageSrc) {
  const mainImage = document.getElementById('main-image');
  if (mainImage) {
    mainImage.innerHTML = `<img src="${imageSrc}" alt="Bike">`;
  }
  
  // Update active thumbnail
  document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.classList.remove('active');
  });
  thumbnail.classList.add('active');
}

// ===== INQUIRE ABOUT BIKE (pre-fill contact form) =====
function inquireAboutBike(bikeId) {
  const bike = getBikeById(bikeId);
  if (bike) {
    sessionStorage.setItem('inquiryBike', JSON.stringify(bike));
    window.location.href = 'contact.html';
  }
}

// ===== SETUP SEARCH AND FILTERS =====
function setupSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sortSelect = document.getElementById('sort-select');
  const resetBtn = document.getElementById('reset-filters');
  
  // Search input (Enter key)
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        currentFilters.search = e.target.value;
        applyFiltersAndSearch();
      }
    });
  }
  
  // Search button click
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentFilters.search = searchInput.value;
      applyFiltersAndSearch();
    });
  }
  
  // Filter buttons
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentFilters.category = btn.dataset.filter;
        applyFiltersAndSearch();
      });
    });
  }
  
  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentFilters.sort = sortSelect.value;
      applyFiltersAndSearch();
    });
  }
  
  // Reset button (optional - add to HTML if needed)
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reset search
      if (searchInput) searchInput.value = '';
      currentFilters.search = '';
      
      // Reset category
      filterBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-filter="all"]')?.classList.add('active');
      currentFilters.category = 'all';
      
      // Reset sort
      if (sortSelect) sortSelect.value = 'default';
      currentFilters.sort = 'default';
      
      applyFiltersAndSearch();
    });
  }
}

// ===== APPLY FILTERS AND SEARCH =====
function applyFiltersAndSearch() {
  const container = document.getElementById('bikes-container');
  const resultsCount = document.getElementById('results-count');
  
  if (!container) return;
  
  // Show loading
  showLoading(true);
  
  // Use setTimeout to prevent UI freeze
  setTimeout(() => {
    const filtered = filterBikes(currentFilters);
    
    container.innerHTML = renderBikes(filtered.bikes);
    
    if (resultsCount) {
      resultsCount.innerHTML = `Showing <strong>${filtered.bikes.length}</strong> of <strong>${filtered.total}</strong> premium bikes`;
    }
    
    showLoading(false);
  }, 100);
}

// ===== FIX CONTACT FORM (add to contact.html if not already there) =====
// This function should be called from contact.html
function handleContactSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('name')?.value;
  const email = document.getElementById('email')?.value;
  const subject = document.getElementById('subject')?.value || 'Bike Inquiry';
  const message = document.getElementById('message')?.value;
  
  // Check if there's a bike inquiry
  const inquiryBike = JSON.parse(sessionStorage.getItem('inquiryBike') || 'null');
  
  if (!name || !email || !message) {
    alert('Please fill in all required fields');
    return false;
  }
  
  // Here you would normally send to your backend
  // For now, show a nice message
  let successMessage = `✨ Thank you ${name}! `;
  
  if (inquiryBike) {
    successMessage += `Your inquiry about the ${inquiryBike.brand} ${inquiryBike.model} has been sent. `;
    sessionStorage.removeItem('inquiryBike');
  } else {
    successMessage += `Your message has been sent. `;
  }
  
  successMessage += `Our premium team will respond within 24 hours.`;
  
  alert(successMessage);
  document.getElementById('contactForm')?.reset();
  
  return false;
}