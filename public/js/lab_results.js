// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCMK2EIUDf_N5K4qfe2G214gAgctoUAp3Q",
    authDomain: "ptsi-system-293aa.firebaseapp.com",
    projectId: "ptsi-system-293aa",
    storageBucket: "ptsi-system-293aa.firebasestorage.app",
    messagingSenderId: "229290736029",
    appId: "1:229290736029:web:da2246786b173fddcd1774",
    measurementId: "G-2CEM231Z6K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const hamburger = document.getElementById('hamburger');
const logoutBtn = document.getElementById('logout');
const addLabResultBtn = document.getElementById('addLabResultBtn');
const labResultForm = document.getElementById('labResultForm');
const labResultModal = document.getElementById('labResultModal');
const viewLabResultModal = document.getElementById('viewLabResultModal');
const confirmModal = document.getElementById('confirmModal');
const closeModalBtns = document.querySelectorAll('.close-modal, #cancelLabResult, #cancelConfirm, #closeViewModal');
const confirmActionBtn = document.getElementById('confirmAction');
const searchInput = document.getElementById('searchLabResults');
const statusFilter = document.getElementById('statusFilter');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const exportBtn = document.getElementById('exportBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const testTypeSelect = document.getElementById('testType');
const testResultsContainer = document.getElementById('testResultsContainer');
const patientSelect = document.getElementById('patientSelect');
const printResultBtn = document.getElementById('printResult');

// State
let labResults = [];
let filteredLabResults = [];
let patients = [];
let currentPage = 1;
const itemsPerPage = 10;
let selectedLabResultId = null;

// Test type configurations
const testTypeConfigs = {
    cbc: {
        name: 'Complete Blood Count (CBC)',
        fields: [
            { id: 'wbc', label: 'White Blood Cells (WBC)', unit: 'x10³/μL', normalRange: '4.5-11.0' },
            { id: 'rbc', label: 'Red Blood Cells (RBC)', unit: 'x10⁶/μL', normalRange: '4.5-5.9' },
            { id: 'hemoglobin', label: 'Hemoglobin (Hgb)', unit: 'g/dL', normalRange: '13.5-17.5' },
            { id: 'hematocrit', label: 'Hematocrit (Hct)', unit: '%', normalRange: '38.8-50.0' },
            { id: 'platelets', label: 'Platelets', unit: 'x10³/μL', normalRange: '150-450' }
        ]
    },
    urinalysis: {
        name: 'Urinalysis',
        fields: [
            { id: 'color', label: 'Color', normalRange: 'Yellow' },
            { id: 'appearance', label: 'Appearance', normalRange: 'Clear' },
            { id: 'specificGravity', label: 'Specific Gravity', normalRange: '1.005-1.030' },
            { id: 'ph', label: 'pH', normalRange: '4.5-8.0' },
            { id: 'protein', label: 'Protein', normalRange: 'Negative' },
            { id: 'glucose', label: 'Glucose', normalRange: 'Negative' },
            { id: 'ketones', label: 'Ketones', normalRange: 'Negative' },
            { id: 'blood', label: 'Blood', normalRange: 'Negative' }
        ]
    },
    xray: {
        name: 'Chest X-ray',
        fields: [
            { id: 'impression', label: 'Impression', type: 'textarea' },
            { id: 'findings', label: 'Findings', type: 'textarea' },
            { id: 'recommendations', label: 'Recommendations', type: 'textarea' }
        ]
    },
    sputum: {
        name: 'Sputum Test',
        fields: [
            { id: 'afb1', label: 'AFB Smear 1', options: ['Negative', '1+', '2+', '3+'] },
            { id: 'afb2', label: 'AFB Smear 2', options: ['Negative', '1+', '2+', '3+'] },
            { id: 'afb3', label: 'AFB Smear 3', options: ['Negative', '1+', '2+', '3+'] },
            { id: 'culture', label: 'Culture', options: ['Negative', 'Positive'] },
            { id: 'pcr', label: 'TB PCR', options: ['Not Detected', 'Detected'] },
            { id: 'drugResistance', label: 'Drug Resistance', type: 'textarea' }
        ]
    },
    other: {
        name: 'Other Test',
        fields: [
            { id: 'testName', label: 'Test Name', required: true },
            { id: 'result', label: 'Result', type: 'textarea', required: true },
            { id: 'referenceRange', label: 'Reference Range' },
            { id: 'method', label: 'Method Used' }
        ]
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadLabResults();
    loadPatients();
    setCurrentUser();
    
    // Set default dates for filters
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    endDate.valueAsDate = today;
    startDate.valueAsDate = thirtyDaysAgo;
});

// Set up event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('dashboard').addEventListener('click', () => {
        window.location.href = 'dashboard_employee.html';
    });

    document.getElementById('appointment').addEventListener('click', () => {
        window.location.href = 'appointment_employee.html';
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isEmployee');
        localStorage.removeItem('loggedInUsername');
        localStorage.removeItem('employeeId');
        window.location.href = '../index.html';
    });

    // Toggle sidebar
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    });

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    });

    // Add new lab result
    addLabResultBtn.addEventListener('click', openLabResultModal);

    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            labResultModal.style.display = 'none';
            viewLabResultModal.style.display = 'none';
            confirmModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === labResultModal) labResultModal.style.display = 'none';
        if (e.target === viewLabResultModal) viewLabResultModal.style.display = 'none';
        if (e.target === confirmModal) confirmModal.style.display = 'none';
    });

    // Form submission
    labResultForm.addEventListener('submit', saveLabResult);

    // Test type change
    testTypeSelect.addEventListener('change', updateTestFields);

    // Patient selection change
    patientSelect.addEventListener('change', updatePatientInfo);

    // Search and filters
    searchInput.addEventListener('input', filterLabResults);
    applyFiltersBtn.addEventListener('click', filterLabResults);
    resetFiltersBtn.addEventListener('click', resetFilters);
    exportBtn.addEventListener('click', exportLabResults);

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderLabResults();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredLabResults.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderLabResults();
        }
    });

    // Print button
    printResultBtn?.addEventListener('click', printLabResult);
}

// Set current user info
function setCurrentUser() {
    const username = localStorage.getItem('loggedInUsername');
    if (username) {
        document.getElementById('employeeName').textContent = username;
    }
}

// Show loading state
function showLoading(isLoading) {
    const loadingSpinner = document.querySelector('.loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // You can implement a more sophisticated notification system here
    alert(`${type.toUpperCase()}: ${message}`);
}

// Load lab results from Firestore
async function loadLabResults() {
    try {
        showLoading(true);
        const querySnapshot = await db.collection('labResults')
            .orderBy('testDate', 'desc')
            .get();
        
        labResults = [];
        querySnapshot.forEach(doc => {
            labResults.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        filterLabResults();
    } catch (error) {
        console.error("Error loading lab results:", error);
        showNotification('Error loading lab results. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load patients for the dropdown
async function loadPatients() {
    try {
        showLoading(true);
        const querySnapshot = await db.collection('registrationForm').get();
        patients = [];
        
        // Clear existing options except the first one
        while (patientSelect.options.length > 1) {
            patientSelect.remove(1);
        }
        
        querySnapshot.forEach(doc => {
            const patient = {
                id: doc.id,
                ...doc.data()
            };
            patients.push(patient);
            
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unnamed Patient';
            patientSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading patients:", error);
        showNotification('Error loading patients. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Update test fields based on selected test type
function updateTestFields() {
    const testType = testTypeSelect.value;
    testResultsContainer.innerHTML = '';
    
    if (!testType) {
        testResultsContainer.innerHTML = `
            <div class="no-test-selected">
                <p>Select a test type to see specific test fields</p>
            </div>
        `;
        return;
    }
    
    const testConfig = testTypeConfigs[testType];
    if (!testConfig) return;
    
    const fieldsFragment = document.createDocumentFragment();
    
    testConfig.fields.forEach(field => {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.textContent = field.label;
        
        let input;
        
        if (field.options) {
            // Create select dropdown for fields with options
            input = document.createElement('select');
            input.id = field.id;
            input.name = field.id;
            input.required = field.required || false;
            
            field.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.toLowerCase();
                optionElement.textContent = option;
                input.appendChild(optionElement);
            });
        } else if (field.type === 'textarea') {
            // Create textarea for longer text
            input = document.createElement('textarea');
            input.id = field.id;
            input.name = field.id;
            input.rows = 3;
            input.required = field.required || false;
        } else {
            // Create regular input
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.id = field.id;
            input.name = field.id;
            input.required = field.required || false;
            
            if (field.unit) {
                input.placeholder = field.unit;
            }
        }
        
        fieldGroup.appendChild(label);
        fieldGroup.appendChild(input);
        
        // Add reference range if available
        if (field.normalRange && !field.options) {
            const refRange = document.createElement('small');
            refRange.className = 'reference-range';
            refRange.textContent = `Normal range: ${field.normalRange}`;
            fieldGroup.appendChild(refRange);
        }
        
        fieldsFragment.appendChild(fieldGroup);
    });
    
    testResultsContainer.appendChild(fieldsFragment);
}

// Update patient info when a patient is selected
function updatePatientInfo() {
    const patientId = patientSelect.value;
    if (!patientId) {
        document.getElementById('patientDob').value = '';
        document.getElementById('patientGender').value = '';
        return;
    }
    
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        if (patient.birthDate) {
            const birthDate = patient.birthDate.toDate ? 
                patient.birthDate.toDate() : 
                new Date(patient.birthDate);
            document.getElementById('patientDob').value = birthDate.toISOString().split('T')[0];
        } else {
            document.getElementById('patientDob').value = '';
        }
        
        document.getElementById('patientGender').value = patient.gender || '';
    }
}

// Filter lab results based on search and filters
function filterLabResults() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const start = startDate.value ? new Date(startDate.value) : null;
    const end = endDate.value ? new Date(endDate.value) : null;
    
    if (end) {
        end.setDate(end.getDate() + 1); // Include the entire end date
    }
    
    filteredLabResults = labResults.filter(result => {
        // Search term matching
        const matchesSearch = !searchTerm || 
            (result.patientName && result.patientName.toLowerCase().includes(searchTerm)) ||
            (result.testType && result.testType.toLowerCase().includes(searchTerm)) ||
            (result.id && result.id.toLowerCase().includes(searchTerm));
        
        // Status filter
        const matchesStatus = status === 'all' || result.status === status;
        
        // Date range filter
        let matchesDate = true;
        if (start || end) {
            const testDate = result.testDate?.toDate ? 
                result.testDate.toDate() : 
                new Date(result.testDate);
            
            if (start && testDate < start) {
                matchesDate = false;
            }
            if (end && testDate > end) {
                matchesDate = false;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    currentPage = 1; // Reset to first page when filters change
    renderLabResults();
}

// Reset all filters
function resetFilters() {
    searchInput.value = '';
    statusFilter.value = 'all';
    
    // Reset to default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    endDate.valueAsDate = today;
    startDate.valueAsDate = thirtyDaysAgo;
    
    filterLabResults();
}

// Render lab results in the table
function renderLabResults() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = filteredLabResults.slice(startIndex, endIndex);
    
    const labResultList = document.getElementById('labResultList');
    labResultList.innerHTML = '';
    
    if (paginatedResults.length === 0) {
        labResultList.innerHTML = '<div class="no-results">No lab results found</div>';
        updatePagination();
        return;
    }
    
    paginatedResults.forEach(result => {
        const row = document.createElement('div');
        row.className = 'labresult-row';
        
        const testDate = result.testDate?.toDate ? 
            result.testDate.toDate() : 
            new Date(result.testDate);
        
        const formattedDate = testDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Format test type for display
        let testTypeDisplay = result.testType || 'N/A';
        if (testTypeConfigs[result.testType]) {
            testTypeDisplay = testTypeConfigs[result.testType].name;
        } else if (result.testType) {
            // Capitalize first letter of each word
            testTypeDisplay = result.testType
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        
        row.innerHTML = `
            <div class="labresult-id">${result.id.substring(0, 8)}</div>
            <div class="labresult-patient">${result.patientName || 'N/A'}</div>
            <div class="labresult-test">${testTypeDisplay}</div>
            <div class="labresult-date">${formattedDate}</div>
            <div class="labresult-status">
                <span class="status-badge status-${result.status || 'pending'}">
                    ${(result.status || 'pending').charAt(0).toUpperCase() + (result.status || 'pending').slice(1)}
                </span>
            </div>
            <div class="labresult-actions">
                <button class="btn-icon btn-view" data-id="${result.id}" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-edit" data-id="${result.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" data-id="${result.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        labResultList.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const labResultId = e.currentTarget.getAttribute('data-id');
            viewLabResult(labResultId);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const labResultId = e.currentTarget.getAttribute('data-id');
            editLabResult(labResultId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const labResultId = e.currentTarget.getAttribute('data-id');
            confirmDelete(labResultId);
        });
    });
    
    updatePagination();
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredLabResults.length / itemsPerPage) || 1;
    
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Open modal to add new lab result
function openLabResultModal(labResult = null) {
    const modal = document.getElementById('labResultModal');
    const form = document.getElementById('labResultForm');
    
    if (labResult) {
        document.getElementById('modalTitle').textContent = 'Edit Lab Result';
        document.getElementById('labResultId').value = labResult.id;
        document.getElementById('patientSelect').value = labResult.patientId || '';
        
        // Update patient info
        updatePatientInfo();
        
        // Set test type and update fields
        document.getElementById('testType').value = labResult.testType || '';
        updateTestFields();
        
        // Set test date
        const testDate = labResult.testDate?.toDate ? 
            labResult.testDate.toDate() : 
            new Date(labResult.testDate);
        document.getElementById('testDate').valueAsDate = testDate;
        
        // Set status
        document.getElementById('status').value = labResult.status || 'pending';
        
        // Set test results
        if (labResult.results) {
            Object.entries(labResult.results).forEach(([key, value]) => {
                const input = document.getElementById(key);
                if (input) {
                    if (input.tagName === 'SELECT' || input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                        input.value = value;
                    }
                }
            });
        }
        
        // Set notes
        document.getElementById('notes').value = labResult.notes || '';
    } else {
        document.getElementById('modalTitle').textContent = 'Add New Lab Result';
        form.reset();
        
        // Set default date to today
        document.getElementById('testDate').valueAsDate = new Date();
        
        // Reset test type and fields
        document.getElementById('testType').value = '';
        updateTestFields();
    }
    
    modal.style.display = 'flex';
}

// View lab result details
async function viewLabResult(labResultId) {
    try {
        showLoading(true);
        const doc = await db.collection('labResults').doc(labResultId).get();
        
        if (!doc.exists) {
            showNotification('Lab result not found.', 'error');
            return;
        }
        
        const labResult = {
            id: doc.id,
            ...doc.data()
        };
        
        const modal = document.getElementById('viewLabResultModal');
        const detailsContainer = document.getElementById('labResultDetails');
        
        // Format test date
        const testDate = labResult.testDate?.toDate ? 
            labResult.testDate.toDate() : 
            new Date(labResult.testDate);
        const formattedDate = testDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Get test type display name
        let testTypeDisplay = labResult.testType || 'N/A';
        if (testTypeConfigs[labResult.testType]) {
            testTypeDisplay = testTypeConfigs[labResult.testType].name;
        }
        
        // Create HTML for lab result details
        let html = `
            <div class="labresult-details">
                <div class="detail-section">
                    <h4>Patient Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Patient Name:</span>
                        <span class="detail-value">${labResult.patientName || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Test Type:</span>
                        <span class="detail-value">${testTypeDisplay}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Test Date:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="status-badge status-${labResult.status || 'pending'}">
                            ${(labResult.status || 'pending').charAt(0).toUpperCase() + (labResult.status || 'pending').slice(1)}
                        </span>
                    </div>
                </div>
        `;
        
        // Add test results if available
        if (labResult.results && Object.keys(labResult.results).length > 0) {
            html += `
                <div class="detail-section">
                    <h4>Test Results</h4>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Test</th>
                                <th>Result</th>
                                <th>Reference Range</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add each test result as a table row
            Object.entries(labResult.results).forEach(([key, value]) => {
                // Find field config to get display name and reference range
                const fieldConfig = testTypeConfigs[labResult.testType]?.fields?.find(f => f.id === key);
                const displayName = fieldConfig?.label || key;
                const referenceRange = fieldConfig?.normalRange || 'N/A';
                
                html += `
                    <tr>
                        <td>${displayName}</td>
                        <td>${value || 'N/A'}</td>
                        <td>${referenceRange}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Add notes if available
        if (labResult.notes) {
            html += `
                <div class="detail-section">
                    <h4>Notes</h4>
                    <div class="notes">${labResult.notes}</div>
                </div>
            `;
        }
        
        // Add metadata
        html += `
            <div class="detail-section metadata">
                <div class="detail-row">
                    <span class="detail-label">Created By:</span>
                    <span class="detail-value">${labResult.createdBy || 'System'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created At:</span>
                    <span class="detail-value">${labResult.createdAt?.toDate ? labResult.createdAt.toDate().toLocaleString() : 'N/A'}</span>
                </div>
                ${labResult.updatedBy ? `
                    <div class="detail-row">
                        <span class="detail-label">Last Updated By:</span>
                        <span class="detail-value">${labResult.updatedBy}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Last Updated At:</span>
                        <span class="detail-value">${labResult.updatedAt?.toDate ? labResult.updatedAt.toDate().toLocaleString() : 'N/A'}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        detailsContainer.innerHTML = html;
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error("Error viewing lab result:", error);
        showNotification('Error loading lab result details. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Save lab result to Firestore
async function saveLabResult(e) {
    if (e) e.preventDefault();
    
    try {
        showLoading(true);
        
        const form = document.getElementById('labResultForm');
        const labResultId = document.getElementById('labResultId').value;
        const patientId = document.getElementById('patientSelect').value;
        const patientName = document.getElementById('patientSelect').options[document.getElementById('patientSelect').selectedIndex].text;
        const testType = document.getElementById('testType').value;
        const testDate = document.getElementById('testDate').value;
        const status = document.getElementById('status').value;
        const notes = document.getElementById('notes').value;
        
        // Get test results based on test type
        const results = {};
        const testConfig = testTypeConfigs[testType];
        if (testConfig) {
            testConfig.fields.forEach(field => {
                const input = document.getElementById(field.id);
                if (input) {
                    results[field.id] = input.value;
                }
            });
        }
        
        const labResultData = {
            patientId,
            patientName,
            testType,
            testDate: new Date(testDate),
            status,
            results,
            notes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: localStorage.getItem('loggedInUsername') || 'Employee'
        };
        
        if (labResultId) {
            // Update existing lab result
            await db.collection('labResults').doc(labResultId).update(labResultData);
            showNotification('Lab result updated successfully!', 'success');
        } else {
            // Add new lab result
            labResultData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            labResultData.createdBy = localStorage.getItem('loggedInUsername') || 'Employee';
            await db.collection('labResults').add(labResultData);
            showNotification('Lab result created successfully!', 'success');
        }
        
        // Close modal and refresh the list
        document.getElementById('labResultModal').style.display = 'none';
        loadLabResults();
        
    } catch (error) {
        console.error("Error saving lab result:", error);
        showNotification('Error saving lab result. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Edit an existing lab result
async function editLabResult(labResultId) {
    try {
        showLoading(true);
        const doc = await db.collection('labResults').doc(labResultId).get();
        
        if (doc.exists) {
            const labResult = {
                id: doc.id,
                ...doc.data()
            };
            
            // Convert Firestore timestamps to Date objects
            if (labResult.testDate?.toDate) {
                labResult.testDate = labResult.testDate.toDate();
            }
            
            openLabResultModal(labResult);
        } else {
            showNotification('Lab result not found.', 'error');
        }
    } catch (error) {
        console.error("Error editing lab result:", error);
        showNotification('Error loading lab result details.', 'error');
    } finally {
        showLoading(false);
    }
}

// Confirm before deleting a lab result
function confirmDelete(labResultId) {
    selectedLabResultId = labResultId;
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this lab result?';
    confirmActionBtn.textContent = 'Delete';
    confirmActionBtn.className = 'btn-danger';
    confirmActionBtn.onclick = deleteLabResult;
    confirmModal.style.display = 'flex';
}

// Delete a lab result
async function deleteLabResult() {
    if (!selectedLabResultId) return;
    
    try {
        showLoading(true);
        await db.collection('labResults').doc(selectedLabResultId).delete();
        showNotification('Lab result deleted successfully!', 'success');
        confirmModal.style.display = 'none';
        loadLabResults();
    } catch (error) {
        console.error("Error deleting lab result:", error);
        showNotification('Error deleting lab result. Please try again.', 'error');
    } finally {
        selectedLabResultId = null;
        showLoading(false);
    }
}

// Export lab results to CSV
function exportLabResults() {
    if (filteredLabResults.length === 0) {
        showNotification('No lab results to export.', 'info');
        return;
    }
    
    try {
        // Create CSV header
        let csvContent = 'Patient Name,Test Type,Test Date,Status,Notes\n';
        
        // Add each lab result as a row
        filteredLabResults.forEach(result => {
            const testDate = result.testDate?.toDate ? 
                result.testDate.toDate() : 
                new Date(result.testDate);
            
            const formattedDate = testDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Escape quotes and wrap in quotes to handle commas in the data
            const escapeCsv = (str) => {
                if (str === null || str === undefined) return '';
                return `"${String(str).replace(/"/g, '""')}"`;
            };
            
            csvContent += [
                escapeCsv(result.patientName),
                escapeCsv(testTypeConfigs[result.testType]?.name || result.testType || ''),
                escapeCsv(formattedDate),
                escapeCsv(result.status || ''),
                escapeCsv(result.notes || '')
            ].join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `lab_results_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error("Error exporting lab results:", error);
        showNotification('Error exporting lab results. Please try again.', 'error');
    }
}

// Print lab result
function printLabResult() {
    const printContent = document.getElementById('labResultDetails').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div class="print-container">
            <div class="print-header">
                <img src="https://philtbsociety.org/wp-content/uploads/2022/07/cropped-1-PTSI-New-Logo-Original-1-600x786.png" alt="PTSI Logo" class="print-logo">
                <h1>Lab Result Report</h1>
                <p class="print-date">Generated on: ${new Date().toLocaleString()}</p>
            </div>
            ${printContent}
            <div class="print-footer">
                <p>This is a computer-generated document. No signature is required.</p>
            </div>
        </div>
        <style>
            @page { size: auto; margin: 1cm; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .print-container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .print-logo { max-height: 80px; margin-bottom: 10px; }
            .print-date { color: #666; font-size: 0.9em; }
            .detail-section { margin-bottom: 20px; }
            .detail-section h4 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            .detail-row { display: flex; margin-bottom: 8px; }
            .detail-label { font-weight: bold; min-width: 150px; }
            .results-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .results-table th, .results-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .results-table th { background-color: #f5f5f5; }
            .notes { background-color: #f9f9f9; padding: 10px; border-radius: 4px; }
            .metadata { font-size: 0.9em; color: #666; margin-top: 30px; }
            .print-footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            @media print {
                .no-print { display: none; }
                .print-container { max-width: 100%; padding: 0; }
                .print-header { margin-top: 0; }
            }
        </style>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    
    // Re-attach event listeners after printing
    setupEventListeners();
    
    // Re-open the modal if it was open
    document.getElementById('viewLabResultModal').style.display = 'flex';
}
