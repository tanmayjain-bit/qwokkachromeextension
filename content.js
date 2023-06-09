const DEBOUNCE_DELAY = 300;
let fetchedTitles = new Set();

const counts = {
  "💩": 0,
  "🔥": 0,
};

function createEmojiElement(emoji) {
  const emojiElement = document.createElement("span");
  emojiElement.classList.add("emoji");
  emojiElement.textContent = emoji;
  return emojiElement;
}

function createOverlayElement(opacity) {
  const overlayElement = document.createElement("div");
  overlayElement.classList.add("overlay");
  overlayElement.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
  return overlayElement;
}

function createBorderElement() {
  const borderElement = document.createElement("div");
  borderElement.classList.add("border-highlight");
  return borderElement;
}

function setupHeader() {
  const netflixHeader = document.querySelector(".pinning-header-container");
  const header = document.createElement("div");
  header.classList.add("qwokka-header");
  header.id = "qwokka-header";
  netflixHeader.insertBefore(header, netflixHeader.firstChild);
}

function updateHeader() {
  const total = Object.values(counts).reduce((acc, v) => acc + v, 0);
  if (total === 0) {
    return;
  }

  const header = document.querySelector("#qwokka-header");
  header.innerHTML = "";
  const intro = document.createElement("div");
  intro.classList.add("qwokka-header-intro");
  intro.innerText = "Netflix recommended you:"
  header.appendChild(intro);
  Object.keys(counts).forEach(key => {
    const element = document.createElement("div");
    const percent = ((counts[key] / total) * 100).toFixed();
    element.innerText = `${percent}% ${key}`;
    element.classList.add("qwokka-header-item");
    header.appendChild(element);
  });
}

function fetchIMDbRatingBySearch(title, callback) {
  const searchUrl = `https://www.omdbapi.com/?s=${encodeURIComponent(
    title
  )}&apikey=d30a342d`;
  fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.Response === "True" && data.Search.length > 0) {
        const firstResult = data.Search[0];
        const imdbID = firstResult.imdbID;
        const url = `https://www.omdbapi.com/?i=${imdbID}&apikey=d30a342d`;
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            if (data.Response === "True") {
              const rating = parseFloat(data.imdbRating);
              localStorage.setItem(title, rating);
              callback(rating);
            } else {
              console.error(`Error fetching IMDb rating for ${title}:`, data.Error);
              callback(null);
            }
          })
          .catch((error) => {
            console.error(`Error fetching IMDb rating for ${title}:`, error);
            callback(null);
          });
      } else {
        console.error(`Error fetching IMDb rating for ${title}: No search results found.`);
        callback(null);
      }
    })
    .catch((error) => {
      console.error(`Error fetching IMDb rating for ${title}:`, error);
      callback(null);
    });
}

function fetchIMDbRating(title, callback) {
  const cachedRating = localStorage.getItem(title);
  if (cachedRating) {
    callback(parseFloat(cachedRating));
  } else {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(
      title
    )}&apikey=d30a342d`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.Response === "True") {
          const rating = parseFloat(data.imdbRating);
          localStorage.setItem(title, rating);
          callback(rating);
        } else {
          fetchIMDbRatingBySearch(title, callback);
        }
      })
      .catch((error) => {
        console.error("Error fetching IMDb rating:", error);
        callback(null);
      });
  }
}

function setLoading(poster) {
  const overlayElement = document.createElement("div");
  overlayElement.classList.add("overlay");
  overlayElement.classList.add("loading-overlay");
  overlayElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  poster.appendChild(overlayElement);
}

function unsetLoading(poster) {
  poster.querySelectorAll(".loading-overlay").forEach(e => e.remove());
}

function createBorderElement() {
  const borderElement = document.createElement('div');
  borderElement.classList.add('border-highlight');
  return borderElement;
}

function processPosters() {
  const posterLinks = document.querySelectorAll('.slider-item');
  posterLinks.forEach((poster) => {
    setLoading(poster);
    const titleElement = poster.querySelector('.slider-refocus');
    if (titleElement) {
      const title = titleElement.getAttribute('aria-label');
      const match = poster.querySelector(".title-card").id.match(/title-card-([0-9]+)-([0-9]+)/);
      let row = 0;
      let col = 0;
      if (match) {
        row = match[1];
        col = match[2];
      }
      const slug = `${title}-${row}-${col}`;

      if (!fetchedTitles.has(slug)) {
        fetchedTitles.add(slug);
        fetchIMDbRating(title, (rating) => {
          unsetLoading(poster);
          if (isNaN(parseInt(rating))) {
            poster.appendChild(createOverlayElement(0.5));
            poster.appendChild(createEmojiElement("❔"));
          } else if (rating < 6) {
            poster.appendChild(createOverlayElement(0.8));
            poster.appendChild(createEmojiElement("💩"));
            counts["💩"] += 1;
          } else if (rating >= 6 && rating < 7) {
            poster.appendChild(createOverlayElement(0.65));
            poster.appendChild(createEmojiElement("👎"));
          } else if (rating >= 7 && rating < 8) {
            poster.appendChild(createOverlayElement(0.5));
            poster.appendChild(createEmojiElement("😐"));
          } else if (rating >= 8 && rating < 9) {
            poster.appendChild(createEmojiElement("👍"));
          } else if (rating >= 9) {
            poster.appendChild(createEmojiElement("🔥"));
            poster.appendChild(createBorderElement());
            counts["🔥"] += 1;
          }
          updateHeader(); 
        });
      } else {
        unsetLoading(poster);
      }
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

const processPostersDebounced = debounce(processPosters, DEBOUNCE_DELAY);
window.addEventListener("scroll", processPostersDebounced);
window.addEventListener("DOMContentLoaded", processPostersDebounced);

setupHeader();
processPosters();
