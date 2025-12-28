// DailyMotivationAgent - Modern Frontend JavaScript

// DOM Elements
const elements = {
    // Main content
    motivationCard: document.getElementById('motivationCard'),
    bgImage: document.getElementById('bgImage'),
    loadingState: document.getElementById('loadingState'),
    quoteContent: document.getElementById('quoteContent'),
    quoteText: document.getElementById('quoteText'),
    messageText: document.getElementById('messageText'),

    // Buttons
    newQuoteBtn: document.getElementById('newQuoteBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    copyBtn: document.getElementById('copyBtn'),
    shareBtn: document.getElementById('shareBtn'),
    aboutBtn: document.getElementById('aboutBtn'),

    // Language & Category
    languageSelect: document.getElementById('languageSelect'),
    categorySelect: document.getElementById('categorySelect'),
    welcomeCategorySelect: document.getElementById('welcomeCategorySelect'),

    // Audio
    audioContainer: document.getElementById('audioContainer'),
    audioPlayer: document.getElementById('audioPlayer'),

    // Welcome Modal
    welcomeModal: document.getElementById('welcomeModal'),
    generateFromWelcome: document.getElementById('generateFromWelcome'),
    closeWelcome: document.getElementById('closeWelcome'),

    // About Modal
    aboutModal: document.getElementById('aboutModal'),
    aboutContent: document.getElementById('aboutContent'),
    aboutOverlay: document.getElementById('aboutOverlay'),
    closeAbout: document.getElementById('closeAbout'),

    // Error Modal
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    closeError: document.getElementById('closeError'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// State
let currentAudioUrl = null;
let isLoading = false;
let quoteCount = parseInt(localStorage.getItem('quoteCount') || '0');

// Initialize markdown-it
const md = window.markdownit ? window.markdownit() : null;

// =====================
// API Functions
// =====================

async function fetchMotivation(language = 'English', category = 'general') {
    const response = await fetch(`/api/motivation?language=${encodeURIComponent(language)}&category=${encodeURIComponent(category)}`);
    if (!response.ok) {
        throw new Error('Failed to fetch motivation');
    }
    return response.json();
}

async function fetchAboutContent() {
    const response = await fetch('/api/about');
    if (!response.ok) {
        throw new Error('Failed to fetch about content');
    }
    return response.json();
}

// =====================
// UI Functions
// =====================

function showLoading() {
    isLoading = true;
    elements.loadingState.classList.remove('hidden');
    elements.quoteContent.classList.add('hidden');
    elements.newQuoteBtn.disabled = true;
}

function hideLoading() {
    isLoading = false;
    elements.loadingState.classList.add('hidden');
    elements.quoteContent.classList.remove('hidden');
    elements.newQuoteBtn.disabled = false;
}

function updateBackground() {
    const randomId = Math.floor(Math.random() * 1000);
    const bgImage = elements.bgImage;
    bgImage.style.opacity = '0';

    setTimeout(() => {
        bgImage.style.backgroundImage = `url('https://picsum.photos/1200/800?random=${randomId}')`;
        bgImage.style.opacity = '1';
    }, 300);
}

function displayMotivation(data) {
    // Update text with animation
    elements.quoteText.style.opacity = '0';
    elements.messageText.style.opacity = '0';

    setTimeout(() => {
        elements.quoteText.textContent = data.quote;
        elements.messageText.textContent = data.message;

        elements.quoteText.style.opacity = '1';
        elements.messageText.style.opacity = '1';

        elements.quoteText.classList.add('animate-fade-in');
        elements.messageText.classList.add('animate-fade-in');
    }, 200);

    // Update audio
    if (data.audio_url) {
        currentAudioUrl = data.audio_url;
        elements.audioPlayer.src = data.audio_url;
        elements.audioContainer.classList.remove('hidden');
        elements.downloadBtn.disabled = false;

        // Auto-play audio
        elements.audioPlayer.play().catch(() => {
            console.log('Auto-play blocked by browser');
        });
    }

    // Update background
    updateBackground();

    // Update quote count
    quoteCount++;
    localStorage.setItem('quoteCount', quoteCount.toString());
    updateQuoteCounter();
}

function updateQuoteCounter() {
    const counter = document.getElementById('totalQuotes');
    if (counter) {
        counter.textContent = `${1000 + quoteCount}+`;
    }
}

function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('show');

    if (type === 'error') {
        elements.toast.style.background = 'var(--error)';
    } else {
        elements.toast.style.background = 'var(--success)';
    }

    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.remove('hidden');
}

function hideError() {
    elements.errorModal.classList.add('hidden');
}

function showWelcomeModal() {
    elements.welcomeModal.classList.remove('hidden');
}

function hideWelcomeModal() {
    elements.welcomeModal.classList.add('hidden');
}

function showAboutModal() {
    elements.aboutModal.classList.remove('hidden');
}

function hideAboutModal() {
    elements.aboutModal.classList.add('hidden');
}

// =====================
// Action Handlers
// =====================

async function generateMotivation() {
    if (isLoading) return;

    const language = elements.languageSelect.value;
    const category = elements.categorySelect.value;
    showLoading();

    try {
        const data = await fetchMotivation(language, category);

        if (data.success) {
            displayMotivation(data);
        } else {
            throw new Error(data.error || 'Failed to generate motivation');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to load motivation. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadAboutContent() {
    try {
        const data = await fetchAboutContent();
        if (data.success && md) {
            elements.aboutContent.innerHTML = md.render(data.content);
        } else if (data.success) {
            elements.aboutContent.innerHTML = `<pre style="white-space: pre-wrap;">${data.content}</pre>`;
        } else {
            elements.aboutContent.innerHTML = '<p>Failed to load about content.</p>';
        }
    } catch (error) {
        elements.aboutContent.innerHTML = '<p>Failed to load about content.</p>';
    }
}

function copyText() {
    const quote = elements.quoteText.textContent;
    const message = elements.messageText.textContent;
    const fullText = `"${quote}"\n\n${message}\n\n- Generated by DailyMotivationAgent`;

    navigator.clipboard.writeText(fullText).then(() => {
        // Visual feedback
        elements.copyBtn.classList.add('success');
        elements.copyBtn.querySelector('i').className = 'fas fa-check';
        showToast('Copied to clipboard!');

        setTimeout(() => {
            elements.copyBtn.classList.remove('success');
            elements.copyBtn.querySelector('i').className = 'fas fa-copy';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy text', 'error');
    });
}

function downloadAudio() {
    if (!currentAudioUrl) return;

    const link = document.createElement('a');
    link.href = currentAudioUrl;
    link.download = 'motivation.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Visual feedback
    elements.downloadBtn.classList.add('success');
    elements.downloadBtn.querySelector('i').className = 'fas fa-check';
    showToast('Audio downloaded!');

    setTimeout(() => {
        elements.downloadBtn.classList.remove('success');
        elements.downloadBtn.querySelector('i').className = 'fas fa-download';
    }, 2000);
}

function shareQuote() {
    const quote = elements.quoteText.textContent;
    const message = elements.messageText.textContent;
    const shareText = `"${quote}"\n\n${message}\n\n- Generated by DailyMotivationAgent`;

    if (navigator.share) {
        navigator.share({
            title: 'Daily Motivation',
            text: shareText,
            url: window.location.href
        }).then(() => {
            showToast('Shared successfully!');
        }).catch(err => {
            console.log('Share cancelled:', err);
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Link copied for sharing!');
        });
    }
}

// =====================
// Event Listeners
// =====================

// New Quote button
elements.newQuoteBtn.addEventListener('click', generateMotivation);

// Copy button
elements.copyBtn.addEventListener('click', copyText);

// Download button
elements.downloadBtn.addEventListener('click', downloadAudio);

// Share button
if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', shareQuote);
}

// About button
elements.aboutBtn.addEventListener('click', () => {
    loadAboutContent();
    showAboutModal();
});

// Welcome modal buttons
elements.generateFromWelcome.addEventListener('click', () => {
    // Sync the selected category from welcome modal to main navbar
    const welcomeCategory = elements.welcomeCategorySelect.value;
    elements.categorySelect.value = welcomeCategory;

    hideWelcomeModal();
    generateMotivation();
});

elements.closeWelcome.addEventListener('click', hideWelcomeModal);

// About modal close
elements.closeAbout.addEventListener('click', hideAboutModal);
elements.aboutOverlay.addEventListener('click', hideAboutModal);

// Error modal close
elements.closeError.addEventListener('click', () => {
    hideError();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideAboutModal();
        hideError();
        hideWelcomeModal();
    }

    // Generate new quote with 'G' key
    if (e.key === 'g' || e.key === 'G') {
        if (!isLoading && elements.welcomeModal.classList.contains('hidden')) {
            generateMotivation();
        }
    }

    // Copy with 'C' key
    if (e.key === 'c' || e.key === 'C') {
        if (e.ctrlKey || e.metaKey) return; // Don't override Ctrl+C
        if (elements.welcomeModal.classList.contains('hidden')) {
            copyText();
        }
    }
});

// Audio player events
elements.audioPlayer.addEventListener('play', () => {
    const visualizer = document.querySelector('.audio-visualizer');
    if (visualizer) {
        visualizer.style.opacity = '1';
    }
});

elements.audioPlayer.addEventListener('pause', () => {
    const visualizer = document.querySelector('.audio-visualizer');
    if (visualizer) {
        visualizer.style.opacity = '0.5';
    }
});

elements.audioPlayer.addEventListener('ended', () => {
    const visualizer = document.querySelector('.audio-visualizer');
    if (visualizer) {
        visualizer.style.opacity = '0.5';
    }
});

// =====================
// Initialization
// =====================

document.addEventListener('DOMContentLoaded', () => {
    // Update quote counter
    updateQuoteCounter();

    // Always show welcome modal for permission (removed localStorage check)
    showWelcomeModal();

    // Preload background image
    updateBackground();

    // Add smooth transitions to quote text
    elements.quoteText.style.transition = 'opacity 0.3s ease';
    elements.messageText.style.transition = 'opacity 0.3s ease';

    // Add hover effect to card
    elements.motivationCard.addEventListener('mouseenter', () => {
        const bgImage = elements.bgImage;
        bgImage.style.transform = 'scale(1.05)';
    });

    elements.motivationCard.addEventListener('mouseleave', () => {
        const bgImage = elements.bgImage;
        bgImage.style.transform = 'scale(1)';
    });

    console.log('DailyMotivationAgent initialized successfully!');
});

// Add resize handler for responsive adjustments
window.addEventListener('resize', () => {
    // Any responsive adjustments can go here
});

// Service Worker registration (optional, for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
