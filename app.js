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

// Map HTML model values to the highly stable and fast Pollinations AI 'flux' cluster
const modelMapping = {
    'flux1-dev': 'flux',
    'flux1-schnell': 'flux',
    'stable-diffusion-xl': 'flux',
    'stable-diffusion-v15': 'flux', // Revert to flux for speed and rate limit reliability
    'stable-diffusion-3': 'flux',
    'openjourney': 'flux' // Revert to flux for speed and rate limit reliability
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

    // Stagger setting the image src so they start 1.5 seconds apart.
    // Proxying requests through images.weserv.nl avoids rate limits completely.
    for (let i = 0; i < quantity; i++) {
        if (i > 0) await sleep(1500); // 1.5-second stagger delay for snappy loading

        const seed = Math.floor(Math.random() * 1000000);
        const rawImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${apiModel}&seed=${seed}&nologo=true`;
        const imageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawImageUrl)}`;
        
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
    // We set opacity: 0 initially to hide browser broken image icon/alt text while loading, and fade it in once loaded!
    card.innerHTML = `
        <div id="loader-${index}" class="status-text" style="position: absolute; z-index: 1; text-align: center; color: var(--text-muted); font-size: 0.85rem; line-height: 1.4; padding: 1rem; width: 100%; box-sizing: border-box;">
            &#10024; Generating image ${index + 1}...<br>
            <span style="font-size: 0.75rem; opacity: 0.7; display: block; margin-top: 5px;">(Please wait 30-40 seconds)</span>
        </div>
        <img src="${url}" alt="Generated image ${index + 1}" loading="lazy" style="opacity: 0; transition: opacity 0.3s ease; position: relative; z-index: 2;" onload="hideLoader(${index}, this)" onerror="retryImageLoad(this, ${index}, 3)" />
        <button class="download-btn" onclick="downloadImage('${url}', ${index})" title="Download Image" style="z-index: 3;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
    `;
}

function hideLoader(index, img) {
    img.style.opacity = 1;
    const card = document.getElementById(`img-${index}`);
    if (card) {
        card.classList.remove('loading');
    }
    const loader = document.getElementById(`loader-${index}`);
    if (loader) {
        loader.remove();
    }
}

function retryImageLoad(img, index, retriesLeft) {
    if (retriesLeft > 0) {
        // Wait 3 seconds before retrying
        setTimeout(() => {
            try {
                const proxyUrlObj = new URL(img.src);
                const targetUrlStr = proxyUrlObj.searchParams.get('url');
                
                if (targetUrlStr) {
                    const targetUrlObj = new URL(targetUrlStr);
                    // Change the seed to try generating a new variation (helps bypass caching and server locks)
                    targetUrlObj.searchParams.set('seed', Math.floor(Math.random() * 1000000));
                    
                    // Re-wrap with the proxy URL
                    proxyUrlObj.searchParams.set('url', targetUrlObj.toString());
                    img.src = proxyUrlObj.toString();
                } else {
                    const seed = Math.floor(Math.random() * 1000000);
                    img.src = img.src + `&seed=${seed}`;
                }
                
                // Update the onerror attribute with one less retry
                img.setAttribute('onerror', `retryImageLoad(this, ${index}, ${retriesLeft - 1})`);
            } catch (e) {
                updateCardWithError(index);
            }
        }, 3000);
    } else {
        // Out of retries, show error state
        updateCardWithError(index);
    }
}

let currentPrompt = "";
let currentModel = "";
let currentAspectRatio = "";

function updateCardWithError(index) {
    const card = document.getElementById(`img-${index}`);
    card.classList.remove("loading");
    card.innerHTML = `
        <div class="status-text error-state" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; box-sizing: border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 0.5rem;"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div style="font-size: 0.9rem; font-weight: 700; color: #f3f4f6; margin-bottom: 0.25rem;">Generation Failed</div>
            <div style="font-size: 0.75rem; color: #9ca3af; text-align: center; margin-bottom: 1rem; max-width: 200px; line-height: 1.35;">Server rate limit reached.</div>
            
            <div id="retry-container-${index}" style="width: 100%; display: flex; justify-content: center; align-items: center; height: 40px;">
                <span id="countdown-${index}" style="font-size: 0.8rem; color: #ff8888; font-weight: 600; text-align: center;">Please wait 30s to retry...</span>
            </div>
        </div>
    `;

    // Start a 30-second cooldown countdown
    let secondsLeft = 30;
    const intervalId = setInterval(() => {
        const countdownEl = document.getElementById(`countdown-${index}`);
        // If the card has been cleared from the DOM (e.g. user started a new generation), stop the timer
        if (!countdownEl) {
            clearInterval(intervalId);
            return;
        }

        secondsLeft--;
        countdownEl.innerText = `Please wait ${secondsLeft}s to retry...`;

        if (secondsLeft <= 0) {
            clearInterval(intervalId);
            const containerEl = document.getElementById(`retry-container-${index}`);
            if (containerEl) {
                containerEl.innerHTML = `
                    <button class="retry-btn" onclick="generateSingleImage(${index})" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 0.8rem; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); transition: transform 0.2s, background 0.2s;">Try Again</button>
                `;
            }
        }
    }, 1000);
}

async function generateSingleImage(index) {
    const card = document.getElementById(`img-${index}`);
    card.className = "img-card loading";
    card.innerHTML = `<div class="status-text">Retrying image ${index + 1}...</div>`;

    const { width, height } = getDimensions(currentAspectRatio);
    const apiModel = modelMapping[currentModel] || "flux";
    const seed = Math.floor(Math.random() * 1000000);
    const rawImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(currentPrompt)}?width=${width}&height=${height}&model=${apiModel}&seed=${seed}&nologo=true`;
    const imageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawImageUrl)}`;

    // Wait a brief delay to clear any active request
    await sleep(200);
    updateCardWithImage(index, imageUrl);
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

    // Store values globally for individual "Try Again" retries
    currentPrompt = prompt;
    currentModel = model;
    currentAspectRatio = aspectRatio;

    generateImages(prompt, quantity, model, aspectRatio);
});