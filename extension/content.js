function injectSaveButton(tweetElement) {
    if (tweetElement.querySelector('.thread-reader-save-btn')) return;

    const actionBar = tweetElement.querySelector('[role="group"][aria-label]');
    if (!actionBar) return;

    const saveBtn = document.createElement('div');
    saveBtn.className = 'thread-reader-save-btn';
    saveBtn.role = 'button';
    saveBtn.setAttribute('aria-label', 'Save to Thread Reader');
    saveBtn.innerHTML = `
        <div class="icon-container">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xvli5t r-1hdv0qi">
                <g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42z"></path></g>
            </svg>
        </div>
    `;

    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Find the status URL for this tweet
        const links = tweetElement.querySelectorAll('a');
        let statusUrl = '';
        for (const link of links) {
            if (link.href.includes('/status/')) {
                statusUrl = link.href.split('?')[0];
                break;
            }
        }

        if (!statusUrl) {
            // Fallback for current page if clicking main tweet
            if (window.location.href.includes('/status/')) {
                statusUrl = window.location.href.split('?')[0];
            }
        }

        if (statusUrl) {
            saveBtn.classList.add('loading');
            chrome.runtime.sendMessage({ action: 'save_thread', url: statusUrl }, (response) => {
                saveBtn.classList.remove('loading');
                if (response && response.success) {
                    saveBtn.classList.add('success');
                    setTimeout(() => saveBtn.classList.remove('success'), 3000);
                } else {
                    saveBtn.classList.add('error');
                    setTimeout(() => saveBtn.classList.remove('error'), 3000);
                    if (response && response.error) {
                        console.error('Save failed:', response.error);
                    }
                }
            });
        }
    });

    actionBar.appendChild(saveBtn);
}

// Observe for new tweets
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tweets = node.querySelectorAll('[data-testid="tweet"]');
                    tweets.forEach(injectSaveButton);
                    if (node.getAttribute('data-testid') === 'tweet') {
                        injectSaveButton(node);
                    }
                }
            });
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan
document.querySelectorAll('[data-testid="tweet"]').forEach(injectSaveButton);
