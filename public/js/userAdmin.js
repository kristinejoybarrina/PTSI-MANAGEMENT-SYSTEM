/**
 * User Management Script
 * Handles the user management interface for admin users
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDA_dVWeUjfgWTJHTIkIomj6ALtD_Lre6g",
    authDomain: "ptsi-project-48025.firebaseapp.com",
    projectId: "ptsi-project-48025",
    storageBucket: "ptsi-project-48025.appspot.com",
    messagingSenderId: "761002258561",
    appId: "1:761002258561:web:1fce70be6b73c1b628dd80"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const userTableBody = document.getElementById('userTableBody');
const searchInput = document.getElementById('searchInput');
const userTypeFilter = document.getElementById('userTypeFilter');
const statusFilter = document.getElementById('statusFilter');
const resetFiltersBtn = document.getElementById('resetFilters');
const pageSizeSelect = document.getElementById('pageSize');
const firstPageBtn = document.getElementById('firstPage');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const lastPageBtn = document.getElementById('lastPage');
const currentPageSpan = document.getElementById('currentPage');
const startItemSpan = document.getElementById('startItem');
const endItemSpan = document.getElementById('endItem');
const totalItemsSpan = document.getElementById('totalItems');

// Modals
const userDetailModal = document.getElementById('userDetailModal');
const confirmModal = document.getElementById('confirmModal');
const closeModalBtns = document.querySelectorAll('.close, #closeModal');
const confirmActionBtn = document.getElementById('confirmAction');
const cancelActionBtn = document.getElementById('cancelAction');
const confirmMessage = document.getElementById('confirmMessage');

// State
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;
let currentUserId = null;
let currentAction = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

// Load users from Firestore
async function loadUsers() {
    try {
        showLoading(true);
        
        // Get current user to exclude from the list
        const currentUser = auth.currentUser;
        
        // Fetch users from Firestore
        const usersSnapshot = await db.collection('users').get();
        allUsers = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Skip the current user
            if (currentUser && userData.uid === currentUser.uid) return;
            
            allUsers.push({
                id: doc.id,
                ...userData,
                // Ensure timestamps are properly converted
                createdAt: userData.createdAt?.toDate() || new Date(),
                lastLogin: userData.lastLogin?.toDate() || null
            });
        });
        
        // Initial filter and render
        applyFilters();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Apply filters and pagination
function applyFilters() {
    // Get filter values
    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = userTypeFilter.value;
    const selectedStatus = statusFilter.value;
    
    // Apply filters
    filteredUsers = allUsers.filter(user => {
        // Search filter
        const matchesSearch = 
            user.email?.toLowerCase().includes(searchTerm) ||
            `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm);
        
        // User type filter
        const matchesType = selectedType === 'all' || user.userType === selectedType;
        
        // Status filter
        const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    // Update pagination
    updatePagination();
    
    // Render the current page
    renderUsers();
}

// Update pagination controls
function updatePagination() {
    // Calculate total pages
    totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    
    // Ensure current page is within bounds
    if (currentPage > totalPages) {
        currentPage = totalPages > 0 ? totalPages : 1;
    }
    
    // Calculate start and end indices
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
    
    // Update pagination info
    startItemSpan.textContent = filteredUsers.length > 0 ? startIndex + 1 : 0;
    endItemSpan.textContent = endIndex;
    totalItemsSpan.textContent = filteredUsers.length;
    currentPageSpan.textContent = currentPage;
    
    // Update button states
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    lastPageBtn.disabled = currentPage >= totalPages;
}

// Render users for the current page
function renderUsers() {
    if (filteredUsers.length === 0) {
        userTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-users">
                    <i class="fas fa-user-slash"></i>
                    <p>No users found matching your criteria</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
    const usersToShow = filteredUsers.slice(startIndex, endIndex);
    
    // Clear the table
    userTableBody.innerHTML = '';
    
    // Add rows for each user
    usersToShow.forEach(user => {
        const row = document.createElement('tr');
        
        // Format dates
        const createdAt = user.createdAt ? formatDate(user.createdAt) : 'N/A';
        const lastLogin = user.lastLogin ? formatDate(user.lastLogin, true) : 'Never';
        
        // Determine status badge class
        let statusClass = 'status-inactive';
        if (user.status === 'active') statusClass = 'status-active';
        else if (user.status === 'suspended') statusClass = 'status-pending';
        
        // Create row HTML
        row.innerHTML = `
            <td>${user.id.substring(0, 8)}</td>
            <td>
                <div class="user-info">
                    <span class="user-name">${user.lastName || 'N/A'}, ${user.firstName || 'N/A'}</span>
                    <span class="user-email">${user.email || ''}</span>
                </div>
            </td>
            <td>${user.email || 'N/A'}</td>
            <td>${formatUserType(user.userType)}</td>
            <td><span class="status-badge ${statusClass}">${user.status || 'inactive'}</span></td>
            <td>${lastLogin}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" data-id="${user.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" data-id="${user.id}" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.status !== 'suspended' ? `
                        <button class="action-btn suspend" data-id="${user.id}" title="Suspend User">
                            <i class="fas fa-user-lock"></i>
                        </button>
                    ` : `
                        <button class="action-btn activate" data-id="${user.id}" title="Activate User">
                            <i class="fas fa-user-check"></i>
                        </button>
                    `}
                    <button class="action-btn delete" data-id="${user.id}" title="Delete User">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        userTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addActionButtonListeners();
}

// Format date for display
function formatDate(date, includeTime = false) {
    if (!(date instanceof Date)) {
        date = date.toDate();
    }
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
}

// Format user type for display
function formatUserType(userType) {
    if (!userType) return 'N/A';
    return userType.charAt(0).toUpperCase() + userType.slice(1);
}

// Show user details in modal
function showUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    // Format user data for display
    const userDetailContent = document.getElementById('userDetailContent');
    userDetailContent.innerHTML = `
        <div class="user-detail-section">
            <h4>Account Information</h4>
            <div class="detail-row">
                <span class="detail-label">User ID:</span>
                <span class="detail-value">${user.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${user.email || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">User Type:</span>
                <span class="detail-value">${formatUserType(user.userType)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${user.status || 'inactive'}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${formatDate(user.createdAt)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Last Login:</span>
                <span class="detail-value">${user.lastLogin ? formatDate(user.lastLogin, true) : 'Never'}</span>
            </div>
        </div>
        
        <div class="user-detail-section">
            <h4>Personal Information</h4>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">
                    ${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''} ${user.suffix || ''}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Birthdate:</span>
                <span class="detail-value">${user.birthDate ? formatDate(user.birthDate) : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Gender:</span>
                <span class="detail-value">${user.gender || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${user.phoneNumber || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${user.address || 'N/A'}</span>
            </div>
        </div>
        
        ${user.userType === 'employee' ? `
            <div class="user-detail-section">
                <h4>Employee Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Department:</span>
                    <span class="detail-value">${user.department || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Role:</span>
                    <span class="detail-value">${user.role || 'Staff'}</span>
                </div>
            </div>
        ` : ''}
        
        ${user.userType === 'patient' ? `
            <div class="user-detail-section">
                <h4>Patient Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Patient ID:</span>
                    <span class="detail-value">${user.patientId || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Blood Type:</span>
                    <span class="detail-value">${user.bloodType || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Emergency Contact:</span>
                    <span class="detail-value">
                        ${user.emergencyContact || 'N/A'} (${user.relationship || 'N/A'})
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Emergency Phone:</span>
                    <span class="detail-value">${user.emergencyPhone || 'N/A'}</span>
                </div>
            </div>
        ` : ''}
    `;
    
    // Update edit button to include user ID
    const editBtn = document.getElementById('editUserBtn');
    editBtn.setAttribute('data-id', userId);
    
    // Show the modal
    showModal(userDetailModal);
}

// Show confirmation modal
function showConfirmation(message, action, userId) {
    confirmMessage.textContent = message;
    currentAction = action;
    currentUserId = userId;
    showModal(confirmModal);
}

// Handle user actions
async function handleUserAction(action, userId) {
    try {
        const userDoc = db.collection('users').doc(userId);
        
        switch (action) {
            case 'suspend':
                await userDoc.update({ status: 'suspended' });
                showSuccess('User has been suspended.');
                break;
                
            case 'activate':
                await userDoc.update({ status: 'active' });
                showSuccess('User has been activated.');
                break;
                
            case 'delete':
                // First, delete the authentication account
                const user = allUsers.find(u => u.id === userId);
                if (user && user.uid) {
                    await auth.deleteUser(user.uid);
                }
                
                // Then delete the Firestore document
                await userDoc.delete();
                showSuccess('User has been deleted.');
                break;
                
            case 'edit':
                // Redirect to edit page
                window.location.href = `user_edit_admin.html?id=${userId}`;
                return; // Skip reload
        }
        
        // Reload users to reflect changes
        loadUsers();
        
    } catch (error) {
        console.error(`Error ${action} user:`, error);
        showError(`Failed to ${action} user. Please try again.`);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Filter event listeners
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    userTypeFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Pagination event listeners
    pageSizeSelect.addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        updatePagination();
        renderUsers();
    });
    
    firstPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            updatePagination();
            renderUsers();
        }
    });
    
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            renderUsers();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            renderUsers();
        }
    });
    
    lastPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            updatePagination();
            renderUsers();
        }
    });
    
    // Modal event listeners
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(userDetailModal);
            hideModal(confirmModal);
        });
    });
    
    // Confirm action button
    confirmActionBtn.addEventListener('click', () => {
        if (currentAction && currentUserId) {
            handleUserAction(currentAction, currentUserId);
        }
        hideModal(confirmModal);
    });
    
    // Cancel action button
    cancelActionBtn.addEventListener('click', () => {
        hideModal(confirmModal);
    });
    
    // Edit user button in modal
    document.getElementById('editUserBtn')?.addEventListener('click', (e) => {
        const userId = e.target.getAttribute('data-id');
        if (userId) {
            window.location.href = `user_edit_admin.html?id=${userId}`;
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === userDetailModal) {
            hideModal(userDetailModal);
        }
        if (e.target === confirmModal) {
            hideModal(confirmModal);
        }
    });
}

// Add event listeners to action buttons
document.addEventListener('DOMContentLoaded', function() {
    // This will be called after the initial render
    addActionButtonListeners();
});

function addActionButtonListeners() {
    // View button
    document.querySelectorAll('.action-btn.view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.getAttribute('data-id');
            showUserDetails(userId);
        });
    });
    
    // Edit button
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.getAttribute('data-id');
            window.location.href = `user_edit_admin.html?id=${userId}`;
        });
    });
    
    // Suspend button
    document.querySelectorAll('.action-btn.suspend').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.getAttribute('data-id');
            showConfirmation('Are you sure you want to suspend this user?', 'suspend', userId);
        });
    });
    
    // Activate button
    document.querySelectorAll('.action-btn.activate').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.getAttribute('data-id');
            showConfirmation('Are you sure you want to activate this user?', 'activate', userId);
        });
    });
    
    // Delete button
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.currentTarget.getAttribute('data-id');
            showConfirmation('Are you sure you want to delete this user? This action cannot be undone.', 'delete', userId);
        });
    });
}

// Reset all filters
function resetFilters() {
    searchInput.value = '';
    userTypeFilter.value = 'all';
    statusFilter.value = 'all';
    currentPage = 1;
    applyFilters();
}

// Show modal
function showModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
    document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal(modal) {
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = 'auto';
}

// Show loading state
function showLoading(isLoading) {
    if (isLoading) {
        userTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-text">
                    <i class="fas fa-spinner fa-spin"></i> Loading users...
                </td>
            </tr>
        `;
    }
}

// Show success message
function showSuccess(message) {
    // You can implement a toast notification here
    alert(message);
}

// Show error message
function showError(message) {
    // You can implement a toast notification here
    alert('Error: ' + message);
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for the user details modal
const style = document.createElement('style');
style.textContent = `
    .user-detail-section {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
    }
    
    .user-detail-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .user-detail-section h4 {
        margin-top: 0;
        margin-bottom: 15px;
        color: var(--primary-color);
        font-size: 1.1rem;
    }
    
    .detail-row {
        display: flex;
        margin-bottom: 10px;
        line-height: 1.5;
    }
    
    .detail-label {
        font-weight: 600;
        color: var(--dark-gray);
        width: 150px;
        flex-shrink: 0;
    }
    
    .detail-value {
        flex: 1;
        color: #555;
    }
    
    .no-users {
        text-align: center;
        padding: 40px 20px;
        color: var(--medium-gray);
    }
    
    .no-users i {
        font-size: 2rem;
        margin-bottom: 10px;
        opacity: 0.7;
    }
    
    .no-users p {
        margin: 10px 0 0;
    }
    
    .user-info {
        display: flex;
        flex-direction: column;
    }
    
    .user-name {
        font-weight: 500;
        color: var(--dark-gray);
    }
    
    .user-email {
        font-size: 0.8rem;
        color: var(--medium-gray);
        margin-top: 2px;
    }
    
    @media (max-width: 768px) {
        .detail-row {
            flex-direction: column;
            margin-bottom: 15px;
        }
        
        .detail-label {
            width: 100%;
            margin-bottom: 3px;
        }
        
        .action-buttons {
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .action-btn {
            width: 28px;
            height: 28px;
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(style);
