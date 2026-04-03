// App State
const state = {
    user: null,
    emails: [],
    currentView: 'inbox',
    currentPriority: 'latest',
    selectedEmail: null,
    searchQuery: '',
    token: null,
    aiCategorized: false,
    pagination: {
        currentPage: 1,
        emailsPerPage: 50,
        totalEmails: 0,
        nextPageToken: null,
        hasMore: true,
        isLoadingMore: false
    },
    loading: {
        total: 0,
        loaded: 0,
        messageIndex: 0,
        intervalId: null
    }
};

const loadingMessages = [
    "Hang on tight...",
    "Fetching your emails...",
    "Almost there...",
    "Getting things ready...",
    "Just a moment..."
];

const API_URL = 'http://localhost:3000';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const emailList = document.getElementById('email-list');
const emailView = document.getElementById('email-view');
const composeModal = document.getElementById('compose-modal');
const composeForm = document.getElementById('compose-form');
const searchInput = document.getElementById('search-input');
const loadingBar = document.getElementById('loading-bar');
const loadingSpinner = document.getElementById('loading-spinner');

// Initialize App
function init() {
    setupEventListeners();
    checkAuthToken();
}

// Check for auth token in URL or localStorage
function checkAuthToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
        alert('Authentication failed. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (token) {
        state.token = token;
        localStorage.setItem('token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
        loadUserProfile();
    } else {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            state.token = savedToken;
            loadUserProfile();
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // CTA button
    const ctaBtn = document.querySelector('.btn-cta');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', handleGoogleLogin);
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Priority Tabs (both regular and AI)
    document.querySelectorAll('.priority-tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const priority = e.currentTarget.dataset.priority;
            switchPriority(priority);
        });
    });

    // Compose
    const composeBtn = document.querySelector('.btn-compose');
    const closeBtn = document.querySelector('.btn-close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const backBtn = document.querySelector('.btn-back');
    
    if (composeBtn) composeBtn.addEventListener('click', openComposeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeComposeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeComposeModal);
    if (composeForm) composeForm.addEventListener('submit', handleSendEmail);
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            emailView.classList.add('hidden');
            emailList.style.display = 'block';
        });
    }
    
    // Infinite scroll
    if (emailList) {
        emailList.addEventListener('scroll', handleScroll);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Authentication
async function handleGoogleLogin() {
    try {
        const response = await fetch(`${API_URL}/auth/google`);
        const data = await response.json();
        window.location.href = data.authUrl;
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}

async function loadUserProfile() {
    try {
        console.log('Loading user profile with token:', state.token);
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        console.log('Profile response status:', response.status);

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const user = await response.json();
        console.log('User loaded:', user);
        state.user = user;
        showMainScreen();
        await loadEmails();
        
        // Load more emails automatically after initial load
        while (state.pagination.hasMore && state.emails.length < 50) {
            await loadEmails(false, false);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        state.token = null;
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local state
        localStorage.removeItem('token');
        state.token = null;
        state.user = null;
        state.emails = [];
        
        // Show login screen
        mainScreen.classList.remove('active');
        loginScreen.classList.add('active');
    }
}

function showMainScreen() {
    console.log('showMainScreen called');
    console.log('User:', state.user);
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    console.log('Screen classes updated');
    
    // Update user info
    const avatar = state.user.picture || generateAvatar(state.user.name);
    document.getElementById('user-avatar').src = avatar;
    document.getElementById('user-email').textContent = state.user.email;
    console.log('User info updated');
}

function generateAvatar(name) {
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%2384A98C"/%3E%3Ctext x="20" y="26" font-size="18" fill="white" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600"%3E${initial}%3C/text%3E%3C/svg%3E`;
}

// Email Loading
async function loadEmails(reset = true, useAI = false) {
    try {
        if (reset) {
            console.log('loadEmails called');
            loadingBar.classList.remove('hidden');
            loadingSpinner.classList.remove('hidden');
            emailList.style.display = 'none';
            state.emails = [];
            state.pagination.nextPageToken = null;
            state.pagination.hasMore = true;
            
            // Start loading message rotation
            state.loading.messageIndex = 0;
            updateLoadingMessage();
            state.loading.intervalId = setInterval(updateLoadingMessage, 2000);
        }
        
        if (state.pagination.isLoadingMore || !state.pagination.hasMore) return;
        state.pagination.isLoadingMore = true;
        
        let url = `${API_URL}/emails?maxResults=10`;
        if (state.pagination.nextPageToken) {
            url += `&pageToken=${state.pagination.nextPageToken}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load emails');
        }

        const data = await response.json();
        console.log('Backend response:', data);
        console.log('Number of emails received:', data.emails.length);
        
        state.pagination.nextPageToken = data.nextPageToken || null;
        state.pagination.hasMore = !!data.nextPageToken;
        
        state.loading.total = data.emails.length;
        state.loading.loaded = 0;
        
        for (let i = 0; i < data.emails.length; i++) {
            const email = data.emails[i];
            console.log(`Email ${i}: subject="${email.subject}", priority="${email.priority}"`);
            const fromMatch = email.from.match(/(.+?)\s*<(.+)>/);
            const name = fromMatch ? fromMatch[1].trim().replace(/"/g, '') : email.from;
            const emailAddr = fromMatch ? fromMatch[2] : email.from;
            
            state.emails.push({
                id: email.id,
                from: { 
                    name: name,
                    email: emailAddr,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=84A98C&color=fff&size=128`
                },
                subject: email.subject || '(No Subject)',
                preview: email.snippet || '',
                body: email.body || email.snippet || '',
                htmlBody: email.htmlBody || '',
                date: new Date(email.date),
                unread: email.unread,
                priority: email.priority || 'later'
            });
            
            state.loading.loaded = i + 1;
            updateLoadingProgress();
        }
        
        state.pagination.totalEmails = state.emails.length;
        if (reset) state.pagination.currentPage = 1;
        
        console.log('Emails loaded:', state.emails.length);
        renderEmailList();
        console.log('Email list rendered');
    } catch (error) {
        console.error('Failed to load emails:', error);
    } finally {
        state.pagination.isLoadingMore = false;
        if (reset) {
            // Stop loading message rotation
            if (state.loading.intervalId) {
                clearInterval(state.loading.intervalId);
                state.loading.intervalId = null;
            }
            loadingBar.classList.add('hidden');
            loadingSpinner.classList.add('hidden');
            emailList.style.display = 'block';
        }
    }
}

function updateLoadingMessage() {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.style.opacity = '0';
        setTimeout(() => {
            state.loading.messageIndex = (state.loading.messageIndex + 1) % loadingMessages.length;
            loadingText.textContent = loadingMessages[state.loading.messageIndex];
            loadingText.style.opacity = '1';
        }, 300);
    }
}

function updateLoadingProgress() {
    const loadingBarFill = document.querySelector('.loading-progress');
    if (loadingBarFill && state.loading.total > 0) {
        const percentage = (state.loading.loaded / state.loading.total) * 100;
        loadingBarFill.style.width = `${percentage}%`;
    }
}

function getMockEmails() {
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%2352796F"/%3E%3Ctext x="20" y="26" font-size="18" fill="white" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600"%3E?%3C/text%3E%3C/svg%3E';
    
    return [
        {
            id: '1',
            from: { name: 'Priya Sharma', email: 'priya.sharma@techcorp.in', avatar: defaultAvatar },
            subject: 'Q4 Project Deadline',
            preview: 'Hi team, just a reminder that the Q4 project deadline is approaching...',
            body: 'Hi team,\n\nJust a reminder that the Q4 project deadline is approaching. Please ensure all deliverables are submitted by Friday.\n\nBest regards,\nPriya',
            date: new Date('2024-01-15T10:30:00'),
            unread: true,
            priority: 'focus'
        },
        {
            id: '2',
            from: { name: 'Rahul Verma', email: 'rahul.verma@company.com', avatar: defaultAvatar },
            subject: 'Meeting Tomorrow at 2 PM',
            preview: 'Don\'t forget about our meeting tomorrow at 2 PM...',
            body: 'Hi,\n\nDon\'t forget about our meeting tomorrow at 2 PM. I\'ll send the Zoom link shortly.\n\nThanks,\nRahul',
            date: new Date('2024-01-15T11:00:00'),
            unread: true,
            priority: 'focus'
        },
        {
            id: '3',
            from: { name: 'Ananya Reddy', email: 'ananya.reddy@startup.io', avatar: defaultAvatar },
            subject: 'Client Presentation Feedback',
            preview: 'Great job on the presentation! The client loved it...',
            body: 'Hi,\n\nGreat job on the presentation! The client loved it and wants to move forward with the proposal.\n\nBest,\nAnanya',
            date: new Date('2024-01-15T09:45:00'),
            unread: true,
            priority: 'focus'
        },
        {
            id: '4',
            from: { name: 'Vikram Patel', email: 'vikram@designstudio.com', avatar: defaultAvatar },
            subject: 'Design Review Scheduled',
            preview: 'The design review has been scheduled for next Monday...',
            body: 'Hi team,\n\nThe design review has been scheduled for next Monday at 10 AM. Please review the mockups beforehand.\n\nRegards,\nVikram',
            date: new Date('2024-01-15T08:20:00'),
            unread: false,
            priority: 'focus'
        },
        {
            id: '5',
            from: { name: 'Sneha Gupta', email: 'sneha.gupta@marketing.in', avatar: defaultAvatar },
            subject: 'Campaign Performance Report',
            preview: 'Here\'s the performance report for last month\'s campaign...',
            body: 'Hi,\n\nHere\'s the performance report for last month\'s campaign. Overall results exceeded our targets by 15%.\n\nBest,\nSneha',
            date: new Date('2024-01-14T16:30:00'),
            unread: false,
            priority: 'later'
        },
        {
            id: '6',
            from: { name: 'Arjun Mehta', email: 'arjun@consulting.com', avatar: defaultAvatar },
            subject: 'Invoice for December Services',
            preview: 'Please find attached the invoice for December consulting services...',
            body: 'Dear team,\n\nPlease find attached the invoice for December consulting services. Payment is due by the 30th.\n\nThank you,\nArjun',
            date: new Date('2024-01-14T14:15:00'),
            unread: false,
            priority: 'later'
        },
        {
            id: '7',
            from: { name: 'Kavya Iyer', email: 'kavya.iyer@hr.company.in', avatar: defaultAvatar },
            subject: 'Team Building Event Next Week',
            preview: 'We\'re organizing a team building event next Friday...',
            body: 'Hi everyone,\n\nWe\'re organizing a team building event next Friday. Please RSVP by Wednesday.\n\nLooking forward,\nKavya',
            date: new Date('2024-01-14T11:00:00'),
            unread: false,
            priority: 'later'
        },
        {
            id: '8',
            from: { name: 'Rohan Kumar', email: 'rohan.kumar@tech.io', avatar: defaultAvatar },
            subject: 'Code Review Request',
            preview: 'Could you please review my pull request when you get a chance?',
            body: 'Hey,\n\nCould you please review my pull request when you get a chance? It\'s for the authentication module.\n\nThanks,\nRohan',
            date: new Date('2024-01-15T07:30:00'),
            unread: true,
            priority: 'focus'
        },
        {
            id: '9',
            from: { name: 'Meera Nair', email: 'meera@finance.com', avatar: defaultAvatar },
            subject: 'Budget Approval Required',
            preview: 'The Q1 budget proposal needs your approval...',
            body: 'Hi,\n\nThe Q1 budget proposal needs your approval. Please review and sign off by end of day.\n\nRegards,\nMeera',
            date: new Date('2024-01-15T06:45:00'),
            unread: true,
            priority: 'focus'
        },
        {
            id: '10',
            from: { name: 'LinkedIn', email: 'notifications@linkedin.com', avatar: defaultAvatar },
            subject: 'You have 5 new connection requests',
            preview: 'Expand your professional network...',
            body: 'Expand your professional network by accepting these connection requests.',
            date: new Date('2024-01-14T16:45:00'),
            unread: false,
            priority: 'ignore'
        },
        {
            id: '11',
            from: { name: 'Amazon', email: 'shipment@amazon.in', avatar: defaultAvatar },
            subject: 'Your order has been shipped',
            preview: 'Your order #12345 has been shipped and will arrive by Friday...',
            body: 'Your order #12345 has been shipped and will arrive by Friday. Track your package using the link below.',
            date: new Date('2024-01-14T10:20:00'),
            unread: false,
            priority: 'ignore'
        },
        {
            id: '12',
            from: { name: 'Swiggy', email: 'offers@swiggy.com', avatar: defaultAvatar },
            subject: '50% off on your next order!',
            preview: 'Use code SAVE50 to get 50% off on orders above ₹299...',
            body: 'Use code SAVE50 to get 50% off on orders above ₹299. Valid till this weekend only!',
            date: new Date('2024-01-13T18:30:00'),
            unread: false,
            priority: 'ignore'
        },
        {
            id: '13',
            from: { name: 'Aditya Singh', email: 'aditya.singh@sales.com', avatar: defaultAvatar },
            subject: 'Sales Target Achievement',
            preview: 'Congratulations! We\'ve exceeded our monthly sales target...',
            body: 'Hi team,\n\nCongratulations! We\'ve exceeded our monthly sales target by 20%. Great work everyone!\n\nCheers,\nAditya',
            date: new Date('2024-01-13T15:00:00'),
            unread: false,
            priority: 'later'
        },
        {
            id: '14',
            from: { name: 'Divya Krishnan', email: 'divya@product.io', avatar: defaultAvatar },
            subject: 'Product Roadmap Q1 2024',
            preview: 'Sharing the updated product roadmap for Q1...',
            body: 'Hi everyone,\n\nSharing the updated product roadmap for Q1. Please review and share your feedback.\n\nThanks,\nDivya',
            date: new Date('2024-01-13T12:30:00'),
            unread: false,
            priority: 'later'
        },
        {
            id: '15',
            from: { name: 'Karthik Rao', email: 'karthik@support.com', avatar: defaultAvatar },
            subject: 'Customer Support Ticket #4567',
            preview: 'A high-priority customer issue needs immediate attention...',
            body: 'Hi,\n\nA high-priority customer issue needs immediate attention. Customer is facing login problems.\n\nUrgent,\nKarthik',
            date: new Date('2024-01-15T12:15:00'),
            unread: true,
            priority: 'focus'
        }
    ];
}

// Rendering
function renderEmailList() {
    console.log('renderEmailList called');
    console.log('Total emails in state:', state.emails.length);
    console.log('Current priority filter:', state.currentPriority);
    
    let filteredEmails = state.emails;
    
    // Filter by priority
    if (state.currentPriority === 'all') {
        // Show all emails
        filteredEmails = state.emails;
    } else if (state.currentPriority === 'latest') {
        // Show latest 50 emails sorted by date
        filteredEmails = [...state.emails].sort((a, b) => b.date - a.date).slice(0, 50);
    } else {
        // Filter by specific priority
        filteredEmails = filteredEmails.filter(email => 
            email.priority === state.currentPriority
        );
    }
    
    console.log('Filtered emails count:', filteredEmails.length);
    
    // Log priority distribution (only if not showing all or latest)
    if (state.currentPriority !== 'all' && state.currentPriority !== 'latest') {
        const priorityCounts = {};
        state.emails.forEach(email => {
            priorityCounts[email.priority] = (priorityCounts[email.priority] || 0) + 1;
        });
        console.log('Priority distribution:', priorityCounts);
    }

    // Apply search filter
    if (state.searchQuery) {
        filteredEmails = filteredEmails.filter(email => 
            email.from.name.toLowerCase().includes(state.searchQuery) ||
            email.from.email.toLowerCase().includes(state.searchQuery) ||
            email.subject.toLowerCase().includes(state.searchQuery) ||
            email.body.toLowerCase().includes(state.searchQuery)
        );
    }

    if (filteredEmails.length === 0) {
        const message = state.searchQuery 
            ? `No emails found for "${state.searchQuery}"`
            : 'No emails in this category';
        emailList.innerHTML = `<div class="email-list-container"><p style="color: var(--text-light); text-align: center; padding: 3rem;">${message}</p></div>`;
        return;
    }

    const emailItems = filteredEmails.map(email => `
        <div class="email-item ${email.unread ? 'unread' : ''}" data-id="${email.id}">
            <img src="${email.from.avatar}" alt="${email.from.name}" class="avatar-small">
            <div>
                <div class="email-sender">${email.from.name}</div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-preview">${email.preview}</div>
            </div>
            <div class="email-time">${formatDate(email.date)}</div>
        </div>
    `).join('');
    
    emailList.innerHTML = `<div class="email-list-container">${emailItems}</div>`;

    // Add click listeners for emails
    document.querySelectorAll('.email-item').forEach(item => {
        item.addEventListener('click', () => {
            const emailId = item.dataset.id;
            showEmail(emailId);
        });
    });
}

function handleScroll() {
    const container = emailList.querySelector('.email-list-container');
    if (!container) return;
    
    const scrollTop = emailList.scrollTop;
    const scrollHeight = emailList.scrollHeight;
    const clientHeight = emailList.clientHeight;
    
    console.log('Scroll event:', { scrollTop, scrollHeight, clientHeight, hasMore: state.pagination.hasMore, isLoadingMore: state.pagination.isLoadingMore });
    
    if (scrollTop + clientHeight >= scrollHeight - 100 && 
        state.pagination.hasMore && 
        !state.pagination.isLoadingMore) {
        console.log('Loading more emails...');
        loadEmails(false, false);
    }
}

function showEmail(emailId) {
    const email = state.emails.find(e => e.id === emailId);
    if (!email) return;

    state.selectedEmail = email;
    email.unread = false;

    document.getElementById('email-subject').textContent = email.subject;
    document.getElementById('sender-avatar').src = email.from.avatar;
    document.getElementById('sender-name').textContent = email.from.name;
    document.getElementById('sender-email').textContent = email.from.email;
    document.getElementById('email-date').textContent = formatDate(email.date);
    
    const emailBodyElement = document.getElementById('email-body');
    
    // Sanitize and render HTML emails properly
    if (email.htmlBody && email.htmlBody.trim()) {
        // Create iframe for safe HTML rendering
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.minHeight = '400px';
        
        emailBodyElement.innerHTML = '';
        emailBodyElement.appendChild(iframe);
        
        // Write HTML content to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        line-height: 1.6;
                        color: #1F2937;
                        margin: 0;
                        padding: 20px;
                        word-wrap: break-word;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                    a {
                        color: #52796F;
                        word-break: break-all;
                    }
                    table {
                        max-width: 100%;
                        border-collapse: collapse;
                    }
                </style>
            </head>
            <body>
                ${email.htmlBody}
            </body>
            </html>
        `);
        iframeDoc.close();
        
        // Auto-resize iframe based on content
        iframe.onload = function() {
            try {
                const iframeBody = iframe.contentDocument.body;
                const iframeHtml = iframe.contentDocument.documentElement;
                const height = Math.max(
                    iframeBody.scrollHeight,
                    iframeBody.offsetHeight,
                    iframeHtml.clientHeight,
                    iframeHtml.scrollHeight,
                    iframeHtml.offsetHeight
                );
                iframe.style.height = height + 'px';
            } catch (e) {
                iframe.style.height = '600px';
            }
        };
    } else {
        // Plain text email
        emailBodyElement.textContent = email.body || email.preview || 'No content';
        emailBodyElement.style.whiteSpace = 'pre-wrap';
    }

    emailList.style.display = 'none';
    emailView.classList.remove('hidden');
}

// Navigation
function switchView(view) {
    state.currentView = view;
    state.searchQuery = '';
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Show/hide tabs based on view
    const priorityTabs = document.querySelector('.priority-tabs');
    
    if (view === 'inbox') {
        priorityTabs.style.display = 'flex';
        
        // Only load emails if we don't have any yet
        if (state.emails.length === 0) {
            loadEmails();
        } else {
            renderEmailList();
        }
    } else {
        priorityTabs.style.display = 'none';
        showViewMessage(view);
    }
}

function showViewMessage(view) {
    const messages = {
        sent: 'Sent emails will appear here',
        drafts: 'Draft emails will appear here',
        starred: 'Starred emails will appear here',
        trash: 'Deleted emails will appear here'
    };
    
    emailList.innerHTML = `<div class="email-list-container"><p style="color: var(--text-light); text-align: center; padding: 3rem;">${messages[view] || 'No emails'}</p></div>`;
}

function switchPriority(priority) {
    state.currentPriority = priority;
    
    const activeTabContainer = '.priority-tabs';
    document.querySelectorAll(`${activeTabContainer} .tab`).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.priority === priority);
    });

    emailView.classList.add('hidden');
    emailList.style.display = 'block';
    renderEmailList();
}

// Search
function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase();
    renderEmailList();
}

// Compose
function openComposeModal() {
    composeModal.classList.remove('hidden');
}

function closeComposeModal() {
    composeModal.classList.add('hidden');
    composeForm.reset();
}

async function handleSendEmail(e) {
    e.preventDefault();
    
    const to = document.getElementById('compose-to').value;
    const subject = document.getElementById('compose-subject').value;
    const body = document.getElementById('compose-body').value;

    try {
        const response = await fetch(`${API_URL}/emails/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ to, subject, body })
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }
        
        alert('Email sent successfully!');
        closeComposeModal();
    } catch (error) {
        console.error('Failed to send email:', error);
        alert('Failed to send email. Please try again.');
    }
}

// Utilities
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Start the app
init();
