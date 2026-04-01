// App State
const state = {
    user: null,
    emails: [],
    currentView: 'inbox',
    currentPriority: 'focus',
    selectedEmail: null,
    searchQuery: '',
    token: null
};

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

    // Priority Tabs
    document.querySelectorAll('.tab').forEach(tab => {
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
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const user = await response.json();
        state.user = user;
        showMainScreen();
        loadEmails();
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        state.token = null;
    }
}

function showMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    
    // Update user info
    const avatar = state.user.picture || generateAvatar(state.user.name);
    document.getElementById('user-avatar').src = avatar;
    document.getElementById('user-email').textContent = state.user.email;
}

function generateAvatar(name) {
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%2384A98C"/%3E%3Ctext x="20" y="26" font-size="18" fill="white" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600"%3E${initial}%3C/text%3E%3C/svg%3E`;
}

// Email Loading
async function loadEmails() {
    try {
        // TODO: Fetch from backend API
        // For now, use mock data
        state.emails = getMockEmails();
        renderEmailList();
    } catch (error) {
        console.error('Failed to load emails:', error);
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
    let filteredEmails = state.emails.filter(email => 
        email.priority === state.currentPriority
    );

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

    // Add click listeners
    document.querySelectorAll('.email-item').forEach(item => {
        item.addEventListener('click', () => {
            const emailId = item.dataset.id;
            showEmail(emailId);
        });
    });
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
    document.getElementById('email-body').textContent = email.body;

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

    // Show/hide priority tabs based on view
    const priorityTabs = document.querySelector('.priority-tabs');
    if (view === 'inbox') {
        priorityTabs.style.display = 'flex';
        loadEmails();
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
    
    document.querySelectorAll('.tab').forEach(tab => {
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
        // TODO: Send via backend API
        console.log('Sending email:', { to, subject, body });
        
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
