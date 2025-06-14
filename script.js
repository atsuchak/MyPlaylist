// Playlist data (persisted in localStorage, initially empty)
let playlists = JSON.parse(localStorage.getItem("playlists")) || [];

const playlistCardsContainer = document.getElementById("playlist-cards");
const modalPlaylistCardsContainer = document.getElementById(
  "modal-playlist-cards"
);
const playlistPlayer = document.getElementById("playlist-player");
const seeMoreLink = document.getElementById("see-more");
const modalBackdrop = document.getElementById("modal-backdrop");
const closeModalButton = document.getElementById("close-modal");
const playlistNameInput = document.getElementById("playlist-name");
const playlistLinkInput = document.getElementById("playlist-link");
const savePlaylistButton = document.getElementById("save-playlist");
const searchInput = document.getElementById("search-playlists");
const nowPlayingTitle = document.getElementById("now-playing-title");
const modalTitle = document.getElementById("modal-title");

// Function to convert YouTube share link to embed URL with logging
function convertToEmbedUrl(shareLink) {
  try {
    const url = new URL(shareLink);
    const hostname = url.hostname.toLowerCase();
    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
      throw new Error("Invalid YouTube link");
    }

    let videoId = url.searchParams.get("v");
    let playlistId = url.searchParams.get("list");

    // Handle youtu.be short links
    if (hostname.includes("youtu.be")) {
      videoId = url.pathname.slice(1);
    }

    if (playlistId) {
      const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
      console.log(`Converted playlist link to: ${embedUrl}`);
      return embedUrl;
    } else if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      console.log(`Converted video link to: ${embedUrl}`);
      return embedUrl;
    } else {
      throw new Error("No video or playlist ID found in the link");
    }
  } catch (e) {
    console.error(`Error converting link: ${e.message}`);
    alert(`Error converting link: ${e.message}`);
    return null;
  }
}

// Function to generate unique ID
function generateId() {
  return "PL" + Math.random().toString(36).substr(2, 9);
}

// Function to create a playlist card
function createPlaylistCard(playlist, isModal = false) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-lg shadow-md p-4 relative";
  card.innerHTML = `
            <h3 class="text-lg font-medium">${playlist.title}</h3>
            <p class="text-gray-500">Click to play</p>
            ${
              isModal
                ? `<button class="delete-playlist absolute top-2 right-2 text-red-500 hover:text-red-700" data-id="${playlist.id}">×</button>`
                : ""
            }
        `;
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("delete-playlist")) {
      playlistPlayer.innerHTML = `<iframe src="${playlist.embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen onload="this.onerror=null" onerror="this.parentElement.innerHTML='<p class=\'text-gray-500 text-center\'>Video unavailable. Check the link or try another. <br> Error details in console.</p>'"></iframe>`;
      nowPlayingTitle.textContent = playlist.title;
      modalBackdrop.classList.add("hidden");
    }
  });
  if (isModal) {
    card.querySelector(".delete-playlist").addEventListener("click", () => {
      playlists = playlists.filter((p) => p.id !== playlist.id);
      renderPlaylists();
    });
  }
  return card;
}

// Function to render playlist cards
function renderPlaylists(filteredPlaylists = playlists) {
  playlistCardsContainer.innerHTML = "";
  modalPlaylistCardsContainer.innerHTML = "";

  // Determine number of cards to show based on screen size
  const isMobile = window.innerWidth < 640;
  const maxCards = isMobile ? 2 : 3;

  // Show "See More" link if needed
  seeMoreLink.classList.toggle(
    "hidden",
    playlists.length <= (isMobile ? 2 : 5)
  );

  // Render main playlist cards
  if (filteredPlaylists.length === 0 && playlists.length === 0) {
    playlistCardsContainer.innerHTML =
      '<p class="text-gray-500 text-center col-span-full">No playlists or videos added yet</p>';
  } else if (filteredPlaylists.length === 0) {
    playlistCardsContainer.innerHTML =
      '<p class="text-gray-500 text-center col-span-full">No matching playlists or videos found</p>';
  } else {
    filteredPlaylists.slice(0, maxCards).forEach((playlist) => {
      playlistCardsContainer.appendChild(createPlaylistCard(playlist));
    });
  }

  // Render playlists in modal
  if (filteredPlaylists.length === 0) {
    modalPlaylistCardsContainer.innerHTML =
      '<p class="text-gray-500 text-center col-span-full">No matching playlists or videos found</p>';
  } else {
    filteredPlaylists.forEach((playlist) => {
      modalPlaylistCardsContainer.appendChild(
        createPlaylistCard(playlist, true)
      );
    });
  }

  // Update player with error handling
  if (playlists.length > 0) {
    const latestPlaylist = playlists[playlists.length - 1];
    playlistPlayer.innerHTML = `<iframe src="${latestPlaylist.embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen onload="this.onerror=null" onerror="this.parentElement.innerHTML='<p class=\'text-gray-500 text-center\'>Video unavailable. Check the link or try another. <br> Error details in console.</p>'"></iframe>`;
    nowPlayingTitle.textContent = latestPlaylist.title;
  } else {
    playlistPlayer.innerHTML = `<p class="text-gray-500 text-center">Select a playlist or video to play</p>`;
    nowPlayingTitle.textContent = "Now Playing";
  }

  // Save to localStorage
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

// Event listener for saving new playlist/video
savePlaylistButton.addEventListener("click", () => {
  const name = playlistNameInput.value.trim();
  const shareLink = playlistLinkInput.value.trim();

  if (!name || !shareLink) {
    alert("Please enter both a name and a share link");
    return;
  }

  const embedUrl = convertToEmbedUrl(shareLink);
  if (embedUrl) {
    playlists.push({
      id: generateId(),
      title: name,
      embedUrl: embedUrl,
    });
    playlistNameInput.value = "";
    playlistLinkInput.value = "";
    renderPlaylists();
  }
});

// Event listener for search
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    const filteredPlaylists = playlists.filter((playlist) =>
      playlist.title.toLowerCase().includes(query)
    );
    modalTitle.textContent = "Search Results";
    renderPlaylists(filteredPlaylists);
    modalBackdrop.classList.remove("hidden");
  } else {
    modalTitle.textContent = "All Playlists";
    renderPlaylists();
    modalBackdrop.classList.add("hidden");
  }
});

// Event listeners for modal
seeMoreLink.addEventListener("click", (e) => {
  e.preventDefault();
  modalTitle.textContent = "All Playlists";
  renderPlaylists();
  modalBackdrop.classList.remove("hidden");
});

closeModalButton.addEventListener("click", () => {
  modalBackdrop.classList.add("hidden");
  searchInput.value = ""; // Clear search input
  modalTitle.textContent = "All Playlists";
  renderPlaylists();
});

// Close modal when clicking outside
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) {
    modalBackdrop.classList.add("hidden");
    searchInput.value = ""; // Clear search input
    modalTitle.textContent = "All Playlists";
    renderPlaylists();
  }
});

// Initial render
renderPlaylists();

// Re-render on window resize to handle responsiveness
window.addEventListener("resize", () => renderPlaylists());
