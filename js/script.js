// Find the controls and gallery on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Find the modal elements
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');

// Set up the date inputs with NASA's valid date range and default dates
setupDateInputs(startInput, endInput);

const API_KEY = "jrRmc7CTBzF9PtGFwTfnnNt9FNjdzr6LwkkKBmz8";
const API_URL = "https://api.nasa.gov/planetary/apod";

// Fetch the photos for the selected date range
async function getSpaceImages() {
    const url = `${API_URL}?api_key=${API_KEY}&start_date=${startInput.value}&end_date=${endInput.value}`;

    try {
        gallery.innerHTML = '<div class="placeholder"><p>Loading space images...</p></div>';
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch NASA images");
        }

        const data = await response.json();
        const hasRealPhotos = displayImages(Array.isArray(data) ? data : [data]);

       
    } catch (error) {
        gallery.innerHTML = `<div class="placeholder"><p>We could not load the images. Please try again.</p></div>`;
        console.error("Error loading NASA images:", error);
    }
}

// Use NASA's image library when APOD returns a generic placeholder record.
async function getNASAImageLibraryPhotos() {
    const url = `${IMAGE_LIBRARY_URL}?q=space&media_type=image&page_size=9`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch NASA image library photos");
    }

    const result = await response.json();
    const photos = result.collection.items.map((item) => {
        const details = item.data[0];
        const imageLink = item.links?.find((link) => link.render === 'image');

        return {
            date: details.date_created?.split('T')[0] || 'NASA image',
            title: details.title,
            explanation: getReadableDescription(details.description),
            media_type: 'image',
            url: imageLink?.href
        };
    });

    displayImages(photos);
}

// Remove HTML markup so descriptions appear as readable text.
function getReadableDescription(description) {
    if (!description) {
        return 'NASA image from the space image library.';
    }

    const textContainer = document.createElement('div');
    textContainer.innerHTML = description;
    return textContainer.textContent.trim();
}

// Create a card for every photo returned by NASA
function displayImages(images) {
    gallery.innerHTML = '';

    const realImages = images.filter((image) => {
        const isNASAPlaceholder = image.url?.includes('nasa-logo');
        return image.media_type === 'image' && image.url && !isNASAPlaceholder;
    });

    realImages.forEach((image) => {

        const card = document.createElement('article');
        card.className = 'gallery-item';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${image.title}`);

        const thumbnail = document.createElement('img');
        thumbnail.src = image.hdurl || image.url;
        thumbnail.alt = image.title;

        const title = document.createElement('h2');
        title.textContent = image.title;

        const date = document.createElement('p');
        date.className = 'image-date';
        date.textContent = image.date;

        const explanation = document.createElement('p');
        explanation.className = 'image-explanation';
        explanation.textContent = image.explanation;

        card.append(thumbnail, title, date, explanation);
        card.addEventListener('click', () => openModal(image));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openModal(image);
            }
        });
        gallery.appendChild(card);
    });

    if (!realImages.length) {
        gallery.innerHTML = `
            <div class="placeholder">
                <p>No space photos were found. Please try again.</p>
            </div>
        `;
    }

    return realImages.length > 0;
}

// Show the selected image and its full NASA explanation
function openModal(image) {
    modalImage.src = image.hdurl || image.url;
    modalImage.alt = image.title;
    modalDate.textContent = image.date;
    modalTitle.textContent = image.title;
    modalExplanation.textContent = image.explanation;
    imageModal.hidden = false;
    document.body.classList.add('modal-open');
    closeModalButton.focus();
}

// Close the modal and clear its image
function closeModal() {
    imageModal.hidden = true;
    modalImage.src = '';
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