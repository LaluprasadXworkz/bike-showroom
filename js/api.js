// ===== API CONFIG =====
const API_BASE_URL = "https://www.bikespecs.org/api/v1";
const PROXY = "https://corsproxy.io/?";
const BIKES_PER_PAGE = 12;

let allBikes = [];
let totalBikes = 0;
let categories = [];

// ===== GET ALL BRANDS =====
async function getBrands() {
  try {
    const url = PROXY + encodeURIComponent(API_BASE_URL + "/brands");
    const res = await fetch(url);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

// ===== GET BIKES BY BRAND =====
async function getBikesByBrand(brand) {
  try {

    const api = `${API_BASE_URL}/search?brand=${encodeURIComponent(brand)}`;
    const url = PROXY + encodeURIComponent(api);

    const res = await fetch(url);
    const data = await res.json();

    return data.data || [];

  } catch (error) {

    console.error(`Error fetching bikes for ${brand}:`, error);
    return [];

  }
}

// ===== GET ALL BIKES =====
async function getAllBikes(page = 1) {
  try {

    if (page === 1 && allBikes.length === 0) {

      const brands = await getBrands();

      // IMPORTANT FIX: brands are objects -> use brand.brand
      const brandPromises = brands.map(b =>
        getBikesByBrand(b.brand).catch(() => [])
      );

      const results = await Promise.all(brandPromises);

      let bikes = results.flat();

      // remove duplicates
      const map = new Map();

      bikes.forEach(b => {
        if (b && b.id && !map.has(b.id)) {
          map.set(b.id, b);
        }
      });

      allBikes = Array.from(map.values());

      // sort by latest year
      allBikes.sort((a, b) => {
        const yearA = getYear(a.specs);
        const yearB = getYear(b.specs);
        return yearB - yearA;
      });

      totalBikes = allBikes.length;
    }

    return {
      bikes: allBikes.slice(0, page * BIKES_PER_PAGE),
      total: totalBikes,
      hasMore: allBikes.length > page * BIKES_PER_PAGE
    };

  } catch (err) {

    console.error("API ERROR", err);

    return {
      bikes: [],
      total: 0,
      hasMore: false
    };

  }
}

// ===== GET BIKE BY ID =====
function getBikeById(id) {
  return allBikes.find(b => b.id == id);
}

// ===== FILTER BIKES =====
function filterBikes(filters = {}) {

  let filtered = [...allBikes];

  if (filters.search) {

    const searchTerm = filters.search.toLowerCase();

    filtered = filtered.filter(bike =>
      bike.brand.toLowerCase().includes(searchTerm) ||
      bike.model.toLowerCase().includes(searchTerm)
    );
  }

  if (filters.category && filters.category !== "all") {

    filtered = filtered.filter(bike => {
      const category = mapBikeCategory(bike);
      return category === filters.category;
    });
  }

  if (filters.sort) {

    switch (filters.sort) {

      case "name-asc":
        filtered.sort((a, b) => a.model.localeCompare(b.model));
        break;

      case "name-desc":
        filtered.sort((a, b) => b.model.localeCompare(a.model));
        break;

      case "year-desc":
        filtered.sort((a, b) => getYear(b.specs) - getYear(a.specs));
        break;

      case "year-asc":
        filtered.sort((a, b) => getYear(a.specs) - getYear(b.specs));
        break;

    }
  }

  return {
    bikes: filtered,
    total: filtered.length
  };
}

// ===== MAP BIKE CATEGORY =====
function mapBikeCategory(bike) {

  const model = bike.model.toLowerCase();
  const specs = JSON.stringify(bike.specs || {}).toLowerCase();

  if (model.includes("sport") || model.includes("rr") || model.includes("r1") || specs.includes("sport"))
    return "sport";

  if (model.includes("cruiser") || specs.includes("cruiser"))
    return "cruiser";

  if (model.includes("adventure") || specs.includes("adventure"))
    return "adventure";

  if (model.includes("naked") || specs.includes("naked"))
    return "naked";

  return "sport";
}

// ===== HELPERS =====

function getEngineSize(specs) {

  if (!specs || !specs.Capacity) return "N/A";

  const match = specs.Capacity.match(/(\d+)/);

  return match ? match[1] + "cc" : specs.Capacity;
}

function getPower(specs) {

  if (!specs || !specs["Max Power"]) return "N/A";

  const match = specs["Max Power"].match(/(\d+\.?\d*)/);

  return match ? match[1] + "hp" : specs["Max Power"];
}

function getWeight(specs) {

  if (!specs || !specs["Wet Weight"]) return "N/A";

  const match = specs["Wet Weight"].match(/(\d+)/);

  return match ? match[1] + "kg" : specs["Wet Weight"];
}

function getYear(specs) {

  if (!specs || !specs.Year) return 0;

  const match = specs.Year.match(/\d{4}/);

  return match ? parseInt(match[0]) : 0;
}

function getImage(images) {

  if (images && images.length > 0)
    return images[0];

  return "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600";
}

function getImages(images) {

  if (images && images.length > 0)
    return images;

  return ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600"];
}