// Find the controls and gallery on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Find the modal elements
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalSource = document.getElementById('modalSource');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');

// Set up the date inputs with NASA's valid date range and default dates
setupDateInputs(startInput, endInput);

const API_KEY = "jrRmc7CTBzF9PtGFwTfnnNt9FNjdzr6LwkkKBmz8";
const API_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/";
const GENERIC_APOD_TITLE = 'NASA Science';
const GENERIC_APOD_EXPLANATION = 'Discover the cosmos! Each day a different image';

// Fetch the photos for the selected date range
async function getSpaceImages() {
    // Read the values at click time so the request and filter use the same range.
    const selectedStartDate = startInput.value;
    const selectedEndDate = endInput.value;
    console.log('APOD date range selected:', selectedStartDate, selectedEndDate);

    const searchParams = new URLSearchParams({
        api_key: API_KEY,
        start_date: selectedStartDate,
        end_date: selectedEndDate
    });
    const url = `${API_URL}?${searchParams}`;

    try {
        gallery.innerHTML = '';
        gallery.innerHTML = '<div class="placeholder"><p>Loading space images...</p></div>';
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch NASA images");
        }

        const data = await response.json();
        displayImages(Array.isArray(data) ? data : [data], selectedStartDate, selectedEndDate);
    } catch (error) {
        gallery.innerHTML = `<div class="placeholder"><p>NASA's APOD service is unavailable right now. Please try again later.</p></div>`;
        console.error("Error loading NASA images:", error);
    }
}

// Create a card for every valid APOD image or video returned by NASA.
function displayImages(images, startDate, endDate) {
    gallery.innerHTML = '';

    const recordKeys = new Set();
    const validRecords = images.filter((image) => {
        const isInSelectedRange = image.date >= startDate && image.date <= endDate;
        const mediaUrl = getMediaUrl(image);
        const isGenericTitle = image.title === GENERIC_APOD_TITLE;
        const isGenericExplanation = image.explanation?.startsWith(GENERIC_APOD_EXPLANATION);
        const isNASAPlaceholder = mediaUrl?.toLowerCase().includes('nasa-logo');
        const recordKey = `${image.date}:${mediaUrl}`;
        const isUsable = isInSelectedRange
            && (image.media_type === 'image' || image.media_type === 'video')
            && image.title
            && image.explanation
            && /^https?:\/\//.test(mediaUrl || '')
            && !isGenericTitle
            && !isGenericExplanation
            && !isNASAPlaceholder
            && !recordKeys.has(recordKey);

        if (isUsable) {
            image.mediaUrl = mediaUrl;
            recordKeys.add(recordKey);
        }

        return isUsable;
    });

    validRecords.forEach((image) => {
        const card = document.createElement('article');
        card.className = 'gallery-item';

        if (image.media_type === 'image') {
            const thumbnail = document.createElement('img');
            thumbnail.src = image.mediaUrl;
            thumbnail.alt = image.title;
            thumbnail.tabIndex = 0;
            thumbnail.setAttribute('role', 'button');
            thumbnail.setAttribute('aria-label', `View details for ${image.title}`);
            thumbnail.addEventListener('error', () => removeInvalidCard(card));
            thumbnail.addEventListener('click', () => openModal(image));
            thumbnail.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openModal(image);
                }
            });
            card.appendChild(thumbnail);
        } else {
            const videoPreview = document.createElement('div');
            videoPreview.className = 'video-preview';
            videoPreview.textContent = 'Video APOD - click to view';
            videoPreview.tabIndex = 0;
            videoPreview.setAttribute('role', 'button');
            videoPreview.setAttribute('aria-label', `View details for ${image.title}`);
            videoPreview.addEventListener('click', () => openModal(image));
            videoPreview.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openModal(image);
                }
            });
            card.appendChild(videoPreview);
        }

        const title = document.createElement('h2');
        title.textContent = image.title;

        const date = document.createElement('p');
        date.className = 'image-date';
        date.textContent = image.date;

        card.append(title, date);
        gallery.appendChild(card);
    });

    if (!validRecords.length) {
        gallery.innerHTML = `
            <div class="placeholder">
                <p>NASA returned no usable APOD images or videos for these dates. Try another date range.</p>
            </div>
        `;
    }

    return validRecords.length > 0;
}

function getMediaUrl(image) {
    if (image.media_type === 'video') {
        return image.url;
    }

    return /^https?:\/\//.test(image.hdurl || '') ? image.hdurl : undefined;
}

function getReadableDescription(description) {
    const textContainer = document.createElement('div');
    textContainer.innerHTML = description || '';
    return textContainer.textContent.trim();
}

function removeInvalidCard(card) {
    card.remove();
    if (!gallery.querySelector('.gallery-item')) {
        gallery.innerHTML = '<div class="placeholder"><p>NASA returned no usable APOD images for these dates.</p></div>';
    }
}

// Show the selected image and its full NASA explanation
function openModal(image) {
    if (image.media_type === 'video') {
        modalImage.hidden = true;
        modalVideo.hidden = false;
        modalVideo.src = getVideoEmbedUrl(image.mediaUrl);
    } else {
        modalImage.hidden = false;
        modalVideo.hidden = true;
        modalVideo.src = '';
        modalImage.src = image.mediaUrl;
        modalImage.alt = image.title;
    }

    modalSource.textContent = 'NASA Astronomy Picture of the Day';
    modalDate.textContent = image.date;
    modalTitle.textContent = image.title;
    modalExplanation.textContent = getReadableDescription(image.explanation);
    imageModal.hidden = false;
    document.body.classList.add('modal-open');
    closeModalButton.focus();
}

function getVideoEmbedUrl(url) {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes('youtube.com')) {
            const videoId = parsedUrl.searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
        }

        if (parsedUrl.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed${parsedUrl.pathname}`;
        }
    } catch (error) {
        console.error('Unable to prepare APOD video:', error);
    }

    return url;
}

// Close the modal and clear its image
function closeModal() {
    imageModal.hidden = true;
    modalImage.src = '';
    modalImage.hidden = false;
    modalVideo.src = '';
    modalVideo.hidden = true;
    document.body.classList.remove('modal-open');
}

getImagesButton.addEventListener('click', getSpaceImages);
closeModalButton.addEventListener('click', closeModal);
imageModal.addEventListener('click', (event) => {
    if (event.target === imageModal) {
        closeModal();
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !imageModal.hidden) {
        closeModal();
    }
});