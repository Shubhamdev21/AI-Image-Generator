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
    'stable-diffusion-3': 'flux', // Grok is cool but Flux is highly reliable and high quality
    'openjourney': 'midijourney'
};

// Calculate pixel dimensions from aspect ratio options
function getDimensions(aspectRatio) {
    switch (aspectRatio) {
        case "1:1":
            return { width: 1024, height: 1024 };
        case "16:9":
            return { width: 1280, height: 720 };
        case "9:16":
            return { width: 720, height: 1280 };
        case "4:3":
            return { width: 1024, height: 768 };
        case "3:4":
            return { width: 768, height: 1024 };
        case "21:9":
            return { width: 1280, height: 540 };
        case "3:2":
            return { width: 1080, height: 720 };
        case "2:3":
            return { width: 720, height: 1080 };
        default:
            return { width: 1024, height: 1024 };
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

    for (let i = 0; i < quantity; i++) {
        createLoadingCard(i);

        try {
            // Generate a random seed for each image in the set so they are all different and unique
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${apiModel}&seed=${seed}&nologo=true`;

            await preloadImage(imageUrl);
            updateCardWithImage(i, imageUrl);

            // Small delay between images to avoid rate limits
            if (i < quantity - 1) await sleep(300);

        } catch (err) {
            updateCardWithError(i);
        }
    }

    updateButton(false);
    isGenerating = false;
}

// Small delay utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================================
// PRELOAD IMAGE
// ================================
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
    });
}

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
    card.classList.remove("loading");
    card.innerHTML = `
        <img src="${url}" alt="Generated image ${index + 1}" loading="lazy" />
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