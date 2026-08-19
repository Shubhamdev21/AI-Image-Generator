// ================================
// FREE IMAGE GENERATOR (PUTER AI)
// ================================
const generateForm = document.querySelector(".generate-form");
const galleryGrid = document.querySelector(".gallery-grid");
const generateBtn = document.querySelector(".generate-btn");
const promptInput = document.querySelector(".prompt-input");
const quantitySelect = document.querySelector(".img-quantity");
const modelSelect = document.querySelector(".model-select");
const aspectRatioSelect = document.querySelector(".aspect-ratio");

let isGenerating = false;

// Map HTML model values to Puter AI model names
const modelMapping = {
    'flux1-dev': 'black-forest-labs/flux-1-dev',
    'flux1-schnell': 'black-forest-labs/flux-1-schnell',
    'stable-diffusion-xl': 'stability-ai/stable-diffusion-xl',
    'stable-diffusion-v15': 'gpt-image-2',
    'stable-diffusion-3': 'stability-ai/stable-diffusion-3',
    'openjourney': 'gpt-image-2'
};

// ================================
// GENERATE IMAGES
// ================================
async function generateImages(prompt, quantity, model, aspectRatio) {
    if (isGenerating) return;
    isGenerating = true;
    updateButton(true);
    galleryGrid.innerHTML = "";

    // Enhance prompt with aspect ratio description since Puter applies aspect ratios textually
    let enhancedPrompt = prompt;
    if (aspectRatio && aspectRatio !== "1:1") {
        enhancedPrompt += `, aspect ratio ${aspectRatio}`;
    }

    // Create all loading cards upfront
    for (let i = 0; i < quantity; i++) {
        createLoadingCard(i);
    }

    // Generate all images concurrently in parallel for maximum speed
    const promises = Array.from({ length: quantity }).map(async (_, i) => {
        try {
            // Stagger the calls slightly to play nice
            await sleep(i * 100);

            let imageElement;
            const puterModel = modelMapping[model];

            try {
                if (puterModel) {
                    imageElement = await puter.ai.txt2img(enhancedPrompt, { model: puterModel });
                } else {
                    imageElement = await puter.ai.txt2img(enhancedPrompt);
                }
            } catch (err) {
                // Fallback to default high-speed model if specific model fails
                imageElement = await puter.ai.txt2img(enhancedPrompt);
            }

            const imageUrl = imageElement.src;
            updateCardWithImage(i, imageUrl);
        } catch (err) {
            updateCardWithError(i);
        }
    });

    await Promise.all(promises);

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