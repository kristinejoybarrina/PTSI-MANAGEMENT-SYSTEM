/**
 * User Creation Script
 * Handles the user creation form for admin users
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

const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const form = document.getElementById('createUserForm');
const userTypeSelect = document.getElementById('userType');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordMatch = document.getElementById('passwordMatch');
const strengthBar = document.querySelector('.strength-bar');
const strengthText = document.querySelector('.strength-text span');
const requirementItems = document.querySelectorAll('.password-requirements li');
const departmentGroup = document.getElementById('departmentGroup');
const patientInfoSection = document.getElementById('patientInfoSection');
const createUserBtn = document.getElementById('createUserBtn');

// Success Modal Elements
const successModal = document.getElementById('successModal');
const closeModal = document.getElementById('closeModal');
const printBtn = document.getElementById('printCredentials');

// Password requirements
const requirements = [
    { regex: /.{8,}/, index: 0 }, // At least 8 characters
    { regex: /[0-9]/, index: 1 }, // At least 1 number
    { regex: /[a-z]/, index: 2 }, // At least 1 lowercase letter
    { regex: /[^A-Za-z0-9]/, index: 3 }, // At least 1 special character
    { regex: /[A-Z]/, index: 4 }, // At least 1 uppercase letter
];

// Toggle password visibility
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const icon = input.nextElementSibling?.querySelector('i');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    const requirementsMet = [false, false, false, false, false];
    
    // Check which requirements are met
    requirements.forEach(item => {
        if (item.regex.test(password)) {
            strength++;
            requirementsMet[item.index] = true;
        }
    });
    
    // Update UI for each requirement
    requirementsMet.forEach((met, index) => {
        const requirementItem = document.getElementById(`req-${['length', 'number', 'lowercase', 'special', 'uppercase'][index]}`);
        if (requirementItem) {
            requirementItem.classList.toggle('valid', met);
        }
    });
    
    // Update strength meter
    const strengthPercent = (strength / requirements.length) * 100;
    strengthBar.style.width = `${strengthPercent}%`;
    
    // Update strength text and color
    if (strength <= 1) {
        strengthBar.style.backgroundColor = '#e74c3c';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#e74c3c';
    } else if (strength <= 3) {
        strengthBar.style.backgroundColor = '#f39c12';
        strengthText.textContent = 'Moderate';
        strengthText.style.color = '#f39c12';
    } else {
        strengthBar.style.backgroundColor = '#27ae60';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#27ae60';
    }
    
    return strength;
}

// Check if passwords match
function checkPasswordsMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (password && confirmPassword) {
        if (password === confirmPassword) {
            passwordMatch.textContent = 'Passwords match';
            passwordMatch.style.color = '#27ae60';
            return true;
        } else {
            passwordMatch.textContent = 'Passwords do not match';
            passwordMatch.style.color = '#e74c3c';
            return false;
        }
    }
    return false;
}

// Toggle sections based on user type
function toggleUserTypeSections() {
    const userType = userTypeSelect.value;
    
    // Show/hide department field for employees
    departmentGroup.style.display = userType === 'employee' ? 'block' : 'none';
    
    // Show/hide patient information section
    patientInfoSection.style.display = userType === 'patient' ? 'block' : 'none';
}

// Generate a random password
function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    
    // Ensure at least one of each character type
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    // Add one of each required character type
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    // Fill the rest of the password with random characters
    for (let i = 4; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password to make it more random
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Create user in Firebase Authentication
async function createAuthUser(email, password, userData) {
    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Set display name
        await user.updateProfile({
            displayName: `${userData.firstName} ${userData.lastName}`.trim()
        });
        
        // Add user data to Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            userType: userData.userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            ...userData
        });
        
        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Get the submit button
    const submitBtn = document.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    // Disable submit button to prevent multiple submissions
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        // Get form values
        const userType = userTypeSelect.value;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const middleName = document.getElementById('middleName').value.trim();
        const suffix = document.getElementById('suffix').value.trim();
        const birthDate = document.getElementById('birthDate').value;
        const gender = document.getElementById('gender').value;
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const address = document.getElementById('address').value.trim();
        
        // Validate required fields
        if (!userType || !email || !password || !firstName || !lastName || !birthDate || !gender || !phoneNumber) {
            throw new Error('Please fill in all required fields');
        }
        
        // Check password strength
        const strength = checkPasswordStrength(password);
        if (strength < 3) {
            throw new Error('Please choose a stronger password');
        }
        
        // Check if passwords match
        if (!checkPasswordsMatch()) {
            throw new Error('Passwords do not match');
        }
        
        // Prepare user data
        const userData = {
            userType,
            firstName,
            lastName,
            middleName: middleName || null,
            suffix: suffix || null,
            birthDate: new Date(birthDate),
            gender,
            phoneNumber,
            address: address || null,
            status: 'active',
            lastLogin: null,
            createdBy: auth.currentUser ? auth.currentUser.uid : 'system',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add user type specific data
        if (userType === 'employee') {
            userData.department = document.getElementById('department').value || null;
            userData.role = 'staff'; // Default role, can be updated later
        } else if (userType === 'patient') {
            userData.bloodType = document.getElementById('bloodType').value || null;
            userData.emergencyContact = document.getElementById('emergencyContact').value.trim() || null;
            userData.emergencyPhone = document.getElementById('emergencyPhone').value.trim() || null;
            userData.relationship = document.getElementById('relationship').value.trim() || null;
            userData.patientId = `PAT-${Date.now().toString().slice(-6)}`;
        }
        
        // Create user in Firebase Authentication and Firestore
        const user = await createAuthUser(email, password, userData);
        
        // Show success modal with credentials
        document.getElementById('createdEmail').textContent = email;
        document.getElementById('createdPassword').textContent = password;
        successModal.style.display = 'flex';
        
        // Reset form
        form.reset();
        
    } catch (error) {
        console.error('Error creating user:', error);
        alert(`Error: ${error.message}`);
    } finally {
        // Re-enable submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText || '<i class="fas fa-user-plus"></i> Create User';
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date for birth date (18 years ago)
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    
    const birthDateInput = document.getElementById('birthDate');
    if (birthDateInput) {
        birthDateInput.max = maxDate.toISOString().split('T')[0];
        birthDateInput.min = minDate.toISOString().split('T')[0];
        birthDateInput.value = maxDate.toISOString().split('T')[0];
    }
    
    // Generate a strong password by default
    const generatedPassword = generateRandomPassword(12);
    if (passwordInput && confirmPasswordInput) {
        passwordInput.value = generatedPassword;
        confirmPasswordInput.value = generatedPassword;
        checkPasswordStrength(generatedPassword);
        checkPasswordsMatch();
    }
    
    // Add form submission handler
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // Add input event listeners for real-time validation
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            checkPasswordStrength(passwordInput.value);
            checkPasswordsMatch();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordsMatch);
    }
    
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const inputId = this.getAttribute('data-target');
            togglePassword(inputId);
        });
    });
    
    // Toggle user type sections
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', toggleUserTypeSections);
    }
    
    // Close modal when clicking the close button
    const closeModalBtn = document.querySelector('.close');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            successModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
    
    // Toggle sections based on user type
    toggleUserTypeSections();
});

// Event delegation for dynamic elements
document.addEventListener('change', (e) => {
    if (e.target === userTypeSelect) {
        toggleUserTypeSections();
    } else if (e.target === passwordInput) {
        checkPasswordStrength(e.target.value);
    } else if (e.target === passwordInput || e.target === confirmPasswordInput) {
        checkPasswordsMatch();
    }
});

// Form submission
form.addEventListener('submit', handleSubmit);

// Modal close button
closeModal.addEventListener('click', () => {
    successModal.style.display = 'none';
    window.location.href = 'user_admin.html';
});

// Print button in modal
printBtn.addEventListener('click', () => {
    const printContent = `
        <html>
            <head>
                <title>User Account Details</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; margin-bottom: 20px; }
                    .credentials { margin: 20px 0; }
                    .credentials p { margin: 5px 0; font-size: 16px; }
                    .note { margin-top: 30px; font-style: italic; color: #666; }
                    @media print { 
                        @page { size: auto; margin: 10mm; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>User Account Created</h1>
                <div class="credentials">
                    <p><strong>Email:</strong> ${document.getElementById('email').value}</p>
                    <p><strong>Password:</strong> ${passwordInput.value}</p>
                </div>
                <div class="note">
                    <p>Please provide these credentials to the user. For security reasons, they will be prompted to change their password upon first login.</p>
                </div>
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.style.display = 'none';
        window.location.href = 'user_admin.html';
    }
});

// Generate password button
const generatePasswordBtn = document.createElement('button');
generatePasswordBtn.type = 'button';
generatePasswordBtn.className = 'btn btn-secondary';
generatePasswordBtn.style.marginTop = '10px';
generatePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Generate Strong Password';
generatePasswordBtn.onclick = () => {
    const newPassword = generateRandomPassword(12);
    passwordInput.value = newPassword;
    confirmPasswordInput.value = newPassword;
    checkPasswordStrength(newPassword);
    checkPasswordsMatch();
};

document.querySelector('.password-input').parentNode.appendChild(generatePasswordBtn);
