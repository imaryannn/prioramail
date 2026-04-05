// App State
const state = {
    user: null,
    emails: [],
    currentView: 'inbox',
    currentPriority: 'latest',
    currentLabel: null,
    selectedEmail: null,
    searchQuery: '',
    token: null,
    aiCategorized: false,
    isLoadingInbox: false,
    composeAttachments: [],
    currentDraftId: null,
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

const API_URL = 'https://backendprioramail.vercel.app';

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
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            mobileOverlay.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
        });
    }
    
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
            
            // Close mobile menu after navigation
            const sidebar = document.querySelector('.sidebar');
            const mobileOverlay = document.getElementById('mobile-overlay');
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            if (sidebar && mobileOverlay) {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
                if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
            }
        });
    });

    // Priority Tabs (both regular and AI)
    document.querySelectorAll('.priority-tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const priority = e.currentTarget.dataset.priority;
            if (priority) {
                switchPriority(priority);
            }
        });
    });
    
    // More tabs button
    const moreTabsBtn = document.getElementById('more-tabs-btn');
    const moreTabsDropdown = document.getElementById('more-tabs-dropdown');
    
    if (moreTabsBtn && moreTabsDropdown) {
        moreTabsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moreTabsDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!moreTabsDropdown.contains(e.target) && e.target !== moreTabsBtn) {
                moreTabsDropdown.classList.add('hidden');
            }
        });
        
        // Dropdown tab clicks
        document.querySelectorAll('.dropdown-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const priority = e.currentTarget.dataset.priority;
                switchPriority(priority);
                moreTabsDropdown.classList.add('hidden');
            });
        });
    }

    // Compose
    const composeBtn = document.querySelector('.btn-compose');
    const closeBtn = document.querySelector('.btn-close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const backBtn = document.querySelector('.btn-back');
    
    if (composeBtn) composeBtn.addEventListener('click', openComposeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeComposeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeComposeModal);
    if (composeForm) composeForm.addEventListener('submit', handleSendEmail);
    
    // Save draft button
    const saveDraftBtn = document.getElementById('save-draft-btn');
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', handleSaveDraft);
    
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
    
    // Compose toolbar
    setupComposeToolbar();
}

// Authentication
async function handleGoogleLogin() {
    try {
        const response = await fetch(`${API_URL}/auth/google`);
        const data = await response.json();
        window.location.href = data.authUrl;
    } catch (error) {
        console.error('Login failed:', error);
        showToast('Login failed. Please try again.', 'error');
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
        
        // Set flag that we're loading inbox
        state.isLoadingInbox = true;
        
        // Only load inbox emails if we're still on inbox view
        if (state.currentView === 'inbox') {
            await loadEmails();
            
            // Load more emails automatically after initial load
            while (state.isLoadingInbox && state.pagination.hasMore && state.emails.length < 50 && state.currentView === 'inbox') {
                await loadEmails(false, false);
            }
        }
        
        state.isLoadingInbox = false;
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        state.token = null;
        state.isLoadingInbox = false;
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
            state.currentLabel = null; // Clear label when loading inbox
            
            // Start loading message rotation
            state.loading.messageIndex = 0;
            updateLoadingMessage();
            state.loading.intervalId = setInterval(updateLoadingMessage, 2000);
        }
        
        if (state.pagination.isLoadingMore || !state.pagination.hasMore) return;
        state.pagination.isLoadingMore = true;
        
        let url = `${API_URL}/emails?maxResults=10`;
        
        // Add label parameter if we're in a specific view
        if (state.currentLabel) {
            url += `&label=${state.currentLabel}`;
        }
        
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
                priority: email.priority || 'later',
                attachments: email.attachments || []
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

    const emailItems = filteredEmails.map(email => {
        let previewText = email.preview;
        
        // If no preview and has attachments, show attachment names
        if (!previewText && email.attachments && email.attachments.length > 0) {
            const attachmentNames = email.attachments.map(att => att.filename).join(', ');
            previewText = `📎 ${attachmentNames}`;
        }
        
        return `
        <div class="email-item ${email.unread ? 'unread' : ''}" data-id="${email.id}">
            <img src="${email.from.avatar}" alt="${email.from.name}" class="avatar-small">
            <div>
                <div class="email-sender">${email.from.name}</div>
                <div class="email-subject">${email.subject}</div>
                <div class="email-preview">${previewText}</div>
            </div>
            <div class="email-time">${formatDate(email.date)}</div>
        </div>
    `;
    }).join('');
    
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

    // If it's a draft, open compose modal instead
    if (email.isDraft) {
        openComposeModalWithDraft(email);
        return;
    }

    document.getElementById('email-subject').textContent = email.subject;
    document.getElementById('sender-avatar').src = email.from.avatar;
    document.getElementById('sender-name').textContent = email.from.name;
    document.getElementById('sender-email').textContent = email.from.email;
    document.getElementById('email-date').textContent = formatDate(email.date);
    
    const emailBodyElement = document.getElementById('email-body');
    const emailViewElement = document.getElementById('email-view');
    const emailHeaderElement = document.querySelector('.email-header');
    const emailMetaElement = document.querySelector('.email-meta');
    
    // Remove no-body-content class if it exists
    emailBodyElement.classList.remove('no-body-content');
    emailViewElement.classList.remove('no-body-content');
    emailBodyElement.style.padding = '';
    emailBodyElement.style.paddingTop = '';
    emailBodyElement.style.paddingBottom = '';
    if (emailHeaderElement) emailHeaderElement.style.marginBottom = '';
    if (emailMetaElement) emailMetaElement.style.marginBottom = '';
    
    // Check if email has any content
    const hasBody = (email.htmlBody && email.htmlBody.trim()) || (email.body && email.body.trim()) || (email.preview && email.preview.trim());
    const hasAttachments = email.attachments && email.attachments.length > 0;
    
    // Display attachments if any
    let attachmentsHtml = '';
    if (hasAttachments) {
        attachmentsHtml = '<div style="margin-top: ' + (hasBody ? '20px' : '0') + '; padding: 15px; background: #f3f4f6; border-radius: 8px;"><h4 style="margin: 0 0 10px 0; font-size: 14px; color: #374151;">Attachments (' + email.attachments.length + ')</h4>';
        email.attachments.forEach(att => {
            const isImage = att.mimeType.startsWith('image/');
            const icon = isImage ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
            const sizeKB = Math.round(att.size / 1024);
            const downloadUrl = `${API_URL}/emails/${email.id}/attachments/${att.attachmentId}`;
            attachmentsHtml += `<div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 4px; margin-bottom: 8px;"><span style="color: #52796F;">${icon}</span><div style="flex: 1;"><div style="font-weight: 500; color: #1f2937;">${att.filename}</div><div style="font-size: 12px; color: #6b7280;">${sizeKB} KB</div></div><button onclick="downloadAttachment('${downloadUrl}', '${att.filename}')" style="padding: 6px 12px; background: #52796F; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Download</button></div>`;
            
            // Add image preview if it's an image
            if (isImage) {
                attachmentsHtml += `<div style="margin-bottom: 10px;" id="img-preview-${att.attachmentId}"><div style="color: #6b7280; font-size: 12px;">Loading preview...</div></div>`;
                // Load image preview asynchronously
                setTimeout(() => loadImagePreview(downloadUrl, att.attachmentId, att.filename), 100);
            }
        });
        attachmentsHtml += '</div>';
    }
    
    // Sanitize and render HTML emails properly
    if (email.htmlBody && email.htmlBody.trim()) {
        console.log('HTML Body (first 200 chars):', email.htmlBody.substring(0, 200));
        
        // Create iframe for safe HTML rendering
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.minHeight = '400px';
        
        emailBodyElement.innerHTML = '';
        emailBodyElement.appendChild(iframe);
        
        // Add attachments after iframe
        if (attachmentsHtml) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.innerHTML = attachmentsHtml;
            emailBodyElement.appendChild(attachmentsDiv);
        }
        
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
    } else if (email.body && email.body.trim()) {
        // Plain text email
        emailBodyElement.innerHTML = '';
        const textDiv = document.createElement('div');
        textDiv.textContent = email.body;
        textDiv.style.whiteSpace = 'pre-wrap';
        emailBodyElement.appendChild(textDiv);
        
        // Add attachments after text
        if (attachmentsHtml) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.innerHTML = attachmentsHtml;
            emailBodyElement.appendChild(attachmentsDiv);
        }
    } else {
        // No body content, only attachments - remove padding
        emailBodyElement.classList.add('no-body-content');
        emailViewElement.classList.add('no-body-content');
        emailBodyElement.style.padding = '0';
        emailBodyElement.style.paddingTop = '0';
        emailBodyElement.style.paddingBottom = '0';
        const emailHeaderElement = document.querySelector('.email-header');
        if (emailHeaderElement) {
            emailHeaderElement.style.marginBottom = '0.5rem';
        }
        const emailMetaElement = document.querySelector('.email-meta');
        if (emailMetaElement) {
            emailMetaElement.style.marginBottom = '0';
        }
        emailBodyElement.innerHTML = attachmentsHtml || '<div style="color: #6b7280; font-style: italic;">No content</div>';
    }

    emailList.style.display = 'none';
    emailView.classList.remove('hidden');
}

// Navigation
function switchView(view) {
    state.currentView = view;
    state.searchQuery = '';
    state.emails = []; // Clear emails immediately
    state.currentLabel = null; // Clear label
    state.isLoadingInbox = false; // Stop inbox loading
    state.pagination.hasMore = false; // Stop any ongoing pagination
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Show/hide tabs based on view
    const priorityTabs = document.querySelector('.priority-tabs');
    
    if (view === 'inbox') {
        priorityTabs.style.display = 'flex';
        
        // Always reload emails for inbox
        loadEmails();
    } else {
        priorityTabs.style.display = 'none';
        loadViewEmails(view);
    }
}

async function loadViewEmails(view) {
    try {
        // CRITICAL: Stop any inbox loading immediately
        state.isLoadingInbox = false;
        state.pagination.isLoadingMore = false;
        
        // Clear emails immediately to prevent showing stale data
        state.emails = [];
        state.currentPriority = 'all'; // Reset priority filter
        
        // Clear the UI immediately
        emailList.innerHTML = '<div class="email-list-container"><p style="color: var(--text-light); text-align: center; padding: 3rem;">Loading...</p></div>';
        
        loadingBar.classList.remove('hidden');
        emailList.style.display = 'block';
        
        let label = '';
        switch(view) {
            case 'sent':
                label = 'SENT';
                break;
            case 'drafts':
                label = 'DRAFT';
                break;
            case 'starred':
                label = 'STARRED';
                break;
        }
        
        // Store current label in state for pagination
        state.currentLabel = label;
        
        // If no label, show message
        if (!label) {
            showViewMessage(view);
            return;
        }
        
        // Reset pagination
        state.pagination.nextPageToken = null;
        state.pagination.hasMore = true;
        
        const response = await fetch(`${API_URL}/emails?label=${label}&maxResults=50`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load ${view} emails`);
        }

        const data = await response.json();
        
        // Check if we got any emails
        if (!data.emails || data.emails.length === 0) {
            showViewMessage(view);
            return;
        }
        
        // CRITICAL: Clear emails again before adding new ones
        state.emails = [];
        
        state.pagination.nextPageToken = data.nextPageToken || null;
        state.pagination.hasMore = !!data.nextPageToken;
        
        for (const email of data.emails) {
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
                priority: email.priority || 'later',
                attachments: email.attachments || [],
                isDraft: view === 'drafts',
                draftId: view === 'drafts' ? email.draftId : null
            });
        }
        
        renderEmailList();
    } catch (error) {
        console.error(`Failed to load ${view} emails:`, error);
        showViewMessage(view);
    } finally {
        loadingBar.classList.add('hidden');
        emailList.style.display = 'block';
    }
}

function showViewMessage(view) {
    const messages = {
        sent: 'Sent emails will appear here',
        drafts: 'Draft emails will appear here',
        starred: 'Starred emails will appear here'
    };
    
    emailList.innerHTML = `<div class="email-list-container"><p style="color: var(--text-light); text-align: center; padding: 3rem;">${messages[view] || 'No emails'}</p></div>`;
}

function switchPriority(priority) {
    state.currentPriority = priority;
    
    const activeTabContainer = '.priority-tabs';
    document.querySelectorAll(`${activeTabContainer} .tab`).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.priority === priority);
    });
    
    // Update dropdown tabs active state
    document.querySelectorAll('.dropdown-tab').forEach(tab => {
        if (tab.dataset.priority === priority) {
            tab.style.background = 'var(--gray-light)';
            tab.style.color = 'var(--accent)';
            tab.style.fontWeight = '600';
        } else {
            tab.style.background = 'transparent';
            tab.style.color = 'var(--text-light)';
            tab.style.fontWeight = '500';
        }
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
    document.getElementById('compose-editor').innerHTML = '';
    document.getElementById('attachments-preview').innerHTML = '';
    state.composeAttachments = [];
    state.currentDraftId = null;
    
    // Reset email inputs
    document.getElementById('to-inputs').innerHTML = `
        <div class="email-input-row">
            <input type="email" class="email-input" placeholder="Email address" required>
            <button type="button" class="btn-add-email" data-target="to-inputs">+</button>
        </div>
    `;
    document.getElementById('cc-inputs').innerHTML = `
        <div class="email-input-row">
            <input type="email" class="email-input" placeholder="Email address">
            <button type="button" class="btn-add-email" data-target="cc-inputs">+</button>
        </div>
    `;
    document.getElementById('bcc-inputs').innerHTML = `
        <div class="email-input-row">
            <input type="email" class="email-input" placeholder="Email address">
            <button type="button" class="btn-add-email" data-target="bcc-inputs">+</button>
        </div>
    `;
    
    // Reset CC/BCC visibility
    document.getElementById('cc-group').classList.add('hidden');
    document.getElementById('bcc-group').classList.add('hidden');
    
    setupEmailInputListeners();
}

function closeComposeModal() {
    composeModal.classList.add('hidden');
    composeForm.reset();
    document.getElementById('compose-editor').innerHTML = '';
    document.getElementById('cc-group').classList.add('hidden');
    document.getElementById('bcc-group').classList.add('hidden');
    document.getElementById('attachments-preview').innerHTML = '';
    state.composeAttachments = [];
}

async function handleSendEmail(e) {
    e.preventDefault();
    
    const sendBtn = document.getElementById('send-btn');
    const btnText = sendBtn.querySelector('.btn-text');
    const btnSpinner = sendBtn.querySelector('.btn-spinner');
    
    // Collect all email addresses
    const toEmails = Array.from(document.querySelectorAll('#to-inputs .email-input'))
        .map(input => input.value.trim())
        .filter(email => email);
    
    const ccEmails = Array.from(document.querySelectorAll('#cc-inputs .email-input'))
        .map(input => input.value.trim())
        .filter(email => email);
    
    const bccEmails = Array.from(document.querySelectorAll('#bcc-inputs .email-input'))
        .map(input => input.value.trim())
        .filter(email => email);
    
    const subject = document.getElementById('compose-subject').value;
    const body = document.getElementById('compose-editor').innerHTML;

    // Prepare form data first
    const formData = new FormData();
    formData.append('to', toEmails.join(', '));
    formData.append('cc', ccEmails.join(', '));
    formData.append('bcc', bccEmails.join(', '));
    formData.append('subject', subject);
    formData.append('body', body);
    
    // Add file attachments
    state.composeAttachments.forEach((file, index) => {
        formData.append('attachments', file);
    });

    // Show sending state
    sendBtn.disabled = true;
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
    
    // Force browser to repaint before sending
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });

    try {
        const response = await fetch(`${API_URL}/emails/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }
        
        // If this was a draft, delete it after sending
        if (state.currentDraftId) {
            try {
                await fetch(`${API_URL}/emails/draft/${state.currentDraftId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${state.token}`
                    }
                });
            } catch (error) {
                console.error('Failed to delete draft after sending:', error);
            }
        }
        
        showToast('Email sent successfully!', 'success');
        closeComposeModal();
    } catch (error) {
        console.error('Failed to send email:', error);
        showToast('Failed to send email. Please try again.', 'error');
    } finally {
        // Reset button state
        sendBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
    }
}

// Utilities
function decodeHtmlEntities(text) {
    if (!text) return text;
    
    // Create a temporary element to decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    let decoded = textarea.value;
    
    // Sometimes entities are double-encoded, decode again if needed
    if (decoded.includes('&lt;') || decoded.includes('&gt;') || decoded.includes('&quot;')) {
        textarea.innerHTML = decoded;
        decoded = textarea.value;
    }
    
    return decoded;
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Download attachment function
function downloadAttachment(url, filename) {
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Download failed');
            return response.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Download failed:', error);
            alert('Failed to download attachment');
        });
}

// Load image preview with authentication
function loadImagePreview(url, attachmentId, filename) {
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${state.token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to load image');
            return response.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const previewDiv = document.getElementById(`img-preview-${attachmentId}`);
            if (previewDiv) {
                previewDiv.innerHTML = `<img src="${blobUrl}" alt="${filename}" style="max-width: 100%; max-height: 400px; border-radius: 4px; border: 1px solid #e5e7eb;"/>`;
            }
        })
        .catch(error => {
            console.error('Failed to load image preview:', error);
            const previewDiv = document.getElementById(`img-preview-${attachmentId}`);
            if (previewDiv) {
                previewDiv.style.display = 'none';
            }
        });
}

// Make functions available globally
window.downloadAttachment = downloadAttachment;
window.loadImagePreview = loadImagePreview;

// Compose toolbar setup
function setupComposeToolbar() {
    // CC/BCC buttons
    document.getElementById('btn-cc')?.addEventListener('click', () => {
        document.getElementById('cc-group').classList.toggle('hidden');
    });
    
    document.getElementById('btn-bcc')?.addEventListener('click', () => {
        document.getElementById('bcc-group').classList.toggle('hidden');
    });
    
    setupEmailInputListeners();
    
    // Formatting buttons
    document.getElementById('btn-bold')?.addEventListener('click', () => {
        document.execCommand('bold', false, null);
    });
    
    document.getElementById('btn-italic')?.addEventListener('click', () => {
        document.execCommand('italic', false, null);
    });
    
    document.getElementById('btn-underline')?.addEventListener('click', () => {
        document.execCommand('underline', false, null);
    });
    
    document.getElementById('btn-ul')?.addEventListener('click', () => {
        document.execCommand('insertUnorderedList', false, null);
    });
    
    document.getElementById('btn-ol')?.addEventListener('click', () => {
        document.execCommand('insertOrderedList', false, null);
    });
    
    document.getElementById('btn-link')?.addEventListener('click', () => {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    });
    
    // Image upload
    document.getElementById('compose-image')?.addEventListener('change', (e) => {
        const files = e.target.files;
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = `<img src="${event.target.result}" alt="${file.name}" style="max-width: 100%; height: auto;">`;
                    document.getElementById('compose-editor').innerHTML += img;
                };
                reader.readAsDataURL(file);
            }
        }
        e.target.value = '';
    });
    
    // File attachments
    document.getElementById('compose-attachment')?.addEventListener('change', (e) => {
        const files = e.target.files;
        const preview = document.getElementById('attachments-preview');
        
        for (let file of files) {
            state.composeAttachments.push(file);
            
            const item = document.createElement('div');
            item.className = 'attachment-item';
            item.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span>${file.name}</span>
                <button type="button" class="attachment-remove" data-filename="${file.name}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            
            item.querySelector('.attachment-remove').addEventListener('click', function() {
                const filename = this.dataset.filename;
                state.composeAttachments = state.composeAttachments.filter(f => f.name !== filename);
                item.remove();
            });
            
            preview.appendChild(item);
        }
        
        e.target.value = '';
    });
}

// Setup email input listeners for add/remove buttons
function setupEmailInputListeners() {
    document.querySelectorAll('.btn-add-email').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const container = document.getElementById(targetId);
            
            const newRow = document.createElement('div');
            newRow.className = 'email-input-row';
            newRow.innerHTML = `
                <input type="email" class="email-input" placeholder="Email address">
                <button type="button" class="btn-remove-email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            
            container.appendChild(newRow);
            setupEmailInputListeners();
        });
    });
    
    document.querySelectorAll('.btn-remove-email').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.email-input-row').remove();
        });
    });
}

// Start the app
init();


// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,
        error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`
    };
    
    const titles = {
        success: 'Success',
        error: 'Error',
        info: 'Info'
    };
    
    toast.innerHTML = `
        ${icons[type]}
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}


// Save Draft Function
async function handleSaveDraft() {
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const originalText = saveDraftBtn.innerHTML;
    
    // Collect all email addresses
    const toEmails = Array.from(document.querySelectorAll('#to-inputs .email-input'))
        .map(input => input.value.trim())
        .filter(email => email);
    
    const ccEmails = Array.from(document.querySelectorAll('#cc-inputs .email-input'))
        .map(input => input.value.trim())
        .filter(email => email);
    
    const bccEmails = Array.from(document.querySelectorAll('#bcc-inputs .email-input'))
        .map(input => input.value.trim())
        .filter(email => email);
    
    const subject = document.getElementById('compose-subject').value;
    const body = document.getElementById('compose-editor').innerHTML;
    
    // Check if there's any content to save
    if (!toEmails.length && !subject && !body) {
        showToast('Nothing to save', 'info');
        return;
    }
    
    try {
        saveDraftBtn.disabled = true;
        saveDraftBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinner">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            Saving...
        `;
        
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
        
        const response = await fetch(`${API_URL}/emails/draft`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                to: toEmails.join(', '),
                cc: ccEmails.join(', '),
                bcc: bccEmails.join(', '),
                subject,
                body
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save draft');
        }
        
        showToast('Draft saved successfully!', 'success');
        closeComposeModal();
    } catch (error) {
        console.error('Failed to save draft:', error);
        showToast('Failed to save draft. Please try again.', 'error');
    } finally {
        saveDraftBtn.disabled = false;
        saveDraftBtn.innerHTML = originalText;
    }
}


// Open Compose Modal with Draft
function openComposeModalWithDraft(email) {
    composeModal.classList.remove('hidden');
    
    // Parse To, CC, BCC from email headers
    const toEmails = email.to ? email.to.split(',').map(e => e.trim()).filter(e => e) : [];
    const ccEmails = email.cc ? email.cc.split(',').map(e => e.trim()).filter(e => e) : [];
    const bccEmails = email.bcc ? email.bcc.split(',').map(e => e.trim()).filter(e => e) : [];
    
    // Set To emails
    const toInputsContainer = document.getElementById('to-inputs');
    toInputsContainer.innerHTML = '';
    if (toEmails.length > 0) {
        toEmails.forEach((email, index) => {
            const row = document.createElement('div');
            row.className = 'email-input-row';
            row.innerHTML = `
                <input type="email" class="email-input" placeholder="Email address" value="${email}" ${index === 0 ? 'required' : ''}>
                ${index === 0 ? 
                    '<button type="button" class="btn-add-email" data-target="to-inputs">+</button>' :
                    '<button type="button" class="btn-remove-email"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>'
                }
            `;
            toInputsContainer.appendChild(row);
        });
    } else {
        toInputsContainer.innerHTML = `
            <div class="email-input-row">
                <input type="email" class="email-input" placeholder="Email address" required>
                <button type="button" class="btn-add-email" data-target="to-inputs">+</button>
            </div>
        `;
    }
    
    // Set CC emails if any
    if (ccEmails.length > 0) {
        document.getElementById('cc-group').classList.remove('hidden');
        const ccInputsContainer = document.getElementById('cc-inputs');
        ccInputsContainer.innerHTML = '';
        ccEmails.forEach((email, index) => {
            const row = document.createElement('div');
            row.className = 'email-input-row';
            row.innerHTML = `
                <input type="email" class="email-input" placeholder="Email address" value="${email}">
                ${index === 0 ? 
                    '<button type="button" class="btn-add-email" data-target="cc-inputs">+</button>' :
                    '<button type="button" class="btn-remove-email"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>'
                }
            `;
            ccInputsContainer.appendChild(row);
        });
    }
    
    // Set BCC emails if any
    if (bccEmails.length > 0) {
        document.getElementById('bcc-group').classList.remove('hidden');
        const bccInputsContainer = document.getElementById('bcc-inputs');
        bccInputsContainer.innerHTML = '';
        bccEmails.forEach((email, index) => {
            const row = document.createElement('div');
            row.className = 'email-input-row';
            row.innerHTML = `
                <input type="email" class="email-input" placeholder="Email address" value="${email}">
                ${index === 0 ? 
                    '<button type="button" class="btn-add-email" data-target="bcc-inputs">+</button>' :
                    '<button type="button" class="btn-remove-email"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>'
                }
            `;
            bccInputsContainer.appendChild(row);
        });
    }
    
    // Set subject
    document.getElementById('compose-subject').value = email.subject === '(No Subject)' ? '' : email.subject;
    
    // Set body
    document.getElementById('compose-editor').innerHTML = email.htmlBody || email.body || '';
    
    // Store draft ID in state for later use
    state.currentDraftId = email.draftId;
    
    // Update button text to show we're editing a draft
    const sendBtn = document.getElementById('send-btn');
    sendBtn.querySelector('.btn-text').textContent = 'Send';
    
    // Re-setup email input listeners
    setupEmailInputListeners();
}
