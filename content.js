const DEBOUNCE_DELAY = 300;
let fetchedTitles = new Set();

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
              console.error("Error fetching IMDb rating:", data.Error);
            }
          })
          .catch((error) => {
            console.error("Error fetching IMDb rating:", error);
          });
      } else {
        console.error("Error fetching IMDb rating: No search results found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching IMDb rating:", error);
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
      });
  }
}

function createBorderElement() {
  const borderElement = document.createElement('div');
  borderElement.classList.add('border-highlight');
  return borderElement;
}

function processPosters() {
  const posterLinks = document.querySelectorAll('.slider-item');
  posterLinks.forEach((poster) => {
    const titleElement = poster.querySelector('.slider-refocus');
    if (titleElement) {
      const title = titleElement.getAttribute('aria-label');
      if (!fetchedTitles.has(title)) {
        fetchedTitles.add(title);
        fetchIMDbRating(title, (rating) => {
          if (rating >= 0 && rating < 5) {
            poster.appendChild(createOverlayElement(0.8));
            poster.appendChild(createEmojiElement("💩"));
          } else if (rating >= 5 && rating < 6) {
            poster.appendChild(createOverlayElement(0.65));
            poster.appendChild(createEmojiElement("👎"));
          } else if (rating >= 6 && rating < 7) {
            poster.appendChild(createOverlayElement(0.5));
            poster.appendChild(createEmojiElement("😐"));
          } else if (rating >= 7 && rating < 8) {
            poster.appendChild(createEmojiElement("👍"));
          } else if (rating >= 9) {
            poster.appendChild(createEmojiElement("🔥"));
            poster.appendChild(createBorderElement());
          }
        });
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
document.addEventListener("DOMContentLoaded", processPostersDebounced);

processPosters();
