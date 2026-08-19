// ================================
// FREE IMAGE GENERATOR (POLLINATIONS AI)
// ================================
const generateForm = document.querySelector(".generate-form");
const galleryGrid = document.querySelector(".gallery-grid");
const generateBtn = document.querySelector(".generate-btn");
const promptInput = document.querySelector(".prompt-input");
const quantitySelect = document.querySelector(".img-quantity");
const modelSelect = document.querySelector(".model-select");
const aspectRatioSelect = document.querySelector(".aspect-ratio");

let isGenerating = false;

// Map HTML model values to Pollinations AI model names
const modelMapping = {
    'flux1-dev': 'flux',
    'flux1-schnell': 'flux',
    'stable-diffusion-xl': 'flux',
    'stable-diffusion-v15': 'dreamshaper',
    'stable-diffusion-3': 'flux',
    'openjourney': 'midijourney'
};

// Calculate pixel dimensions from aspect ratio options (optimized for speed and rate limits)
function getDimensions(aspectRatio) {
    switch (aspectRatio) {
        case "1:1":
            return { width: 512, height: 512 };
        case "16:9":
            return { width: 768, height: 432 };
        case "9:16":
            return { width: 432, height: 768 };
        case "4:3":
            return { width: 640, height: 480 };
        case "3:4":
            return { width: 480, height: 640 };
        case "21:9":
            return { width: 800, height: 340 };
        case "3:2":
            return { width: 768, height: 512 };
        case "2:3":
            return { width: 512, height: 768 };
        default:
            return { width: 512, height: 512 };
    }
}

// ================================
// GENERATE IMAGES
// ================================
async function generateImages(prompt, quantity, model, aspectRatio) {
    if (isGenerating) return;
    isGenerating = true;
    updateButton(true);
    galleryGrid.innerHTML = "";

    const { width, height } = getDimensions(aspectRatio);
    const apiModel = modelMapping[model] || "flux";

    // Create all loading cards upfront
    for (let i = 0; i < quantity; i++) {
        createLoadingCard(i);
    }

    // Stagger setting the image src so they generate in parallel but start 1 second apart.
    // This allows the browser to show loading progress natively and display images instantly as they load.
    for (let i = 0; i < quantity; i++) {
        if (i > 0) await sleep(1000); // 1-second delay to stagger requests and avoid rate limits

        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${apiModel}&seed=${seed}&nologo=true`;
        
        updateCardWithImage(i, imageUrl);
    }

    updateButton(false);
    isGenerating = false;
}

// Small delay utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================================
// UI FUNCTIONS
// ================================
function createLoadingCard(index) {
    const card = document.createElement("div");
    card.className = "img-card loading";
    card.id = `img-${index}`;
    card.innerHTML = `<div class="status-text">Loading image ${index + 1}...</div>`;
    galleryGrid.appendChild(card);
}

function updateCardWithImage(index, url) {
    const card = document.getElementById(`img-${index}`);
    // Keep the "loading" class on the card so it continues shimmering in the UI.
    // We remove the class inside the onload event of the image element as soon as it's fully rendered by the browser!
    card.innerHTML = `
        <img src="${url}" alt="Generated image ${index + 1}" loading="lazy" onload="document.getElementById('img-${index}').classList.remove('loading')" onerror="updateCardWithError(${index})" />
        <button onclick="downloadImage('${url}', ${index})">Download</button>
    `;
}

function updateCardWithError(index) {
    const card = document.getElementById(`img-${index}`);
    card.classList.remove("loading");
    card.innerHTML = `<div class="status-text" style="color: red;">Failed to load image ${index + 1}. Please try again.</div>`;
}

function updateButton(state) {
    generateBtn.disabled = state;
    generateBtn.querySelector("span").innerText = state ? "Generating..." : "Generate Images";
}

// ================================
// DOWNLOAD (blob fetch for cross-origin)
// ================================
async function downloadImage(url, index) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `ai-image-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        alert("Download failed. Please right-click the image and save manually.");
    }
}

// ================================
// FORM SUBMIT
// ================================
generateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    const quantity = parseInt(quantitySelect.value);
    const model = modelSelect.value;
    const aspectRatio = aspectRatioSelect.value;

    if (!prompt || prompt.length < 2) {
        alert("Please enter a valid prompt (at least 2 characters).");
        return;
    }

    generateImages(prompt, quantity, model, aspectRatio);
});