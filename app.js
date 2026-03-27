// App State
const state = {
    user: null,
    emails: [],
    currentView: 'inbox',
    currentPriority: 'focus',
    selectedEmail: null
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const emailList = document.getElementById('email-list');
const emailView = document.getElementById('email-view');
const composeModal = document.getElementById('compose-modal');
const composeForm = document.getElementById('compose-form');

// Initialize App
function init() {
    setupEventListeners();
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        showMainScreen();
        loadEmails();
    }
}

// Event Listeners
function setupEventListeners() {
    // Login
    googleLoginBtn.addEventListener('click', handleGoogleLogin);

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
    document.querySelector('.btn-compose').addEventListener('click', openComposeModal);
    document.querySelector('.btn-close').addEventListener('click', closeComposeModal);
    document.querySelector('.btn-cancel').addEventListener('click', closeComposeModal);
    composeForm.addEventListener('submit', handleSendEmail);

    // Back button
    document.querySelector('.btn-back').addEventListener('click', () => {
        emailView.classList.add('hidden');
        emailList.style.display = 'block';
    });
}

// Authentication
async function handleGoogleLogin() {
    try {
        // TODO: Implement actual Google OAuth
        // For now, simulate login
        const mockUser = {
            email: 'user@example.com',
            name: 'User',
            avatar: 'https://via.placeholder.com/40'
        };
        
        state.user = mockUser;
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        showMainScreen();
        loadEmails();
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}

function showMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    
    // Update user info
    document.getElementById('user-avatar').src = state.user.avatar;
    document.getElementById('user-email').textContent = state.user.email;
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
    return [
        {
            id: '1',
            from: { name: 'Sarah Johnson', email: 'sarah@company.com' },
            subject: 'Q4 Project Deadline',
            preview: 'Hi team, just a reminder that the Q4 project deadline is approaching...',
            body: 'Hi team,\n\nJust a reminder that the Q4 project deadline is approaching. Please ensure all deliverables are submitted by Friday.\n\nBest regards,\nSarah',
            date: new Date('2024-01-15T10:30:00'),
            unread: true,
            priority: 'focus'
        },
        {
            id: '2',
            from: { name: 'Marketing Team', email: 'marketing@company.com' },
            subject: 'Weekly Newsletter',
            preview: 'Check out this week\'s highlights and upcoming events...',
            body: 'Check out this week\'s highlights and upcoming events. We have some exciting announcements!',
            date: new Date('2024-01-15T09:15:00'),
            unread: false,
            priority: 'later'
        },
        {
            id: '3',
            from: { name: 'LinkedIn', email: 'notifications@linkedin.com' },
            subject: 'You have 5 new connection requests',
            preview: 'Expand your professional network...',
            body: 'Expand your professional network by accepting these connection requests.',
            date: new Date('2024-01-14T16:45:00'),
            unread: false,
            priority: 'ignore'
        },
        {
            id: '4',
            from: { name: 'John Doe', email: 'john@example.com' },
            subject: 'Meeting Tomorrow',
            preview: 'Don\'t forget about our meeting tomorrow at 2 PM...',
            body: 'Hi,\n\nDon\'t forget about our meeting tomorrow at 2 PM. I\'ll send the Zoom link shortly.\n\nThanks,\nJohn',
            date: new Date('2024-01-15T11:00:00'),
            unread: true,
            priority: 'focus'
        }
    ];
}

// Rendering
function renderEmailList() {
    const filteredEmails = state.emails.filter(email => 
        email.priority === state.currentPriority
    );

    if (filteredEmails.length === 0) {
        emailList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 3rem;">No emails in this category</p>';
        return;
    }

    emailList.innerHTML = filteredEmails.map(email => `
        <div class="email-item ${email.unread ? 'unread' : ''}" data-id="${email.id}">
            <img src="${email.from.avatar || 'https://via.placeholder.com/40'}" alt="${email.from.name}" class="avatar-small">
            <div>
                <div class="email-sender">${email.from.name}</div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-preview">${email.preview}</div>
            </div>
            <div class="email-time">${formatDate(email.date)}</div>
        </div>
    `).join('');

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
    document.getElementById('sender-avatar').src = email.from.avatar || 'https://via.placeholder.com/32';
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
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    loadEmails();
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
