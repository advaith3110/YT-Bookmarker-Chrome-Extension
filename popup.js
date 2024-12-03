const bookmarkBtn = document.getElementById("bookmark-btn");
const bookmarksList = document.getElementById("bookmarks-list");

// Save a bookmark
bookmarkBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);

  if (url.hostname === "www.youtube.com" && url.searchParams.has("v")) {
    const videoId = url.searchParams.get("v");

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return document.querySelector("video").currentTime;
        },
      });

      const timestamp = Math.floor(result.result);
      const bookmark = { videoId, timestamp };

      chrome.storage.sync.get({ bookmarks: [] }, (data) => {
        const updatedBookmarks = [...data.bookmarks, bookmark];
        chrome.storage.sync.set({ bookmarks: updatedBookmarks }, renderBookmarks);
      });
    } catch (error) {
      console.error("Error accessing YouTube video:", error);
      alert("Failed to get the current timestamp.");
    }
  } else {
    alert("Please use this on a YouTube video!");
  }
});

// Load bookmarks
function renderBookmarks() {
  bookmarksList.innerHTML = "";
  chrome.storage.sync.get({ bookmarks: [] }, (data) => {
    data.bookmarks.forEach((bookmark, index) => {
      const li = document.createElement("li");
      li.textContent = `Video: ${bookmark.videoId} - Time: ${formatTimestamp(bookmark.timestamp)}`;
      li.addEventListener("click", () => openBookmark(bookmark));
      bookmarksList.appendChild(li);
    });
  });
}

// Open a bookmark
function openBookmark({ videoId, timestamp }) {
  const url = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}`;
  chrome.tabs.create({ url });
}

// Format timestamp to HH:MM:SS
function formatTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Initial render
renderBookmarks();
