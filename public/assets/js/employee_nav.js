// Simple Employee Navigation System
// This handles navigation between employee pages

(function() {
    'use strict';

    // Wait for DOM to be fully loaded
    function initializeNavigation() {
        // Navigation handlers
        const dashboardBtn = document.getElementById('dashboard');
        const labResultBtn = document.getElementById('lab-result');
        const appointmentBtn = document.getElementById('appointment');
        const logoutBtn = document.getElementById('logout');

        // Dashboard navigation
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'dashboard_employee.html';
            });
        }

        // Lab Result navigation
        if (labResultBtn) {
            labResultBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'lab_result_admin.html';
            });
        }

        // Appointment navigation
        if (appointmentBtn) {
            appointmentBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'appointment_employee.html';
            });
        }

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Show confirmation dialog
                const confirmed = confirm('Are you sure you want to logout?');
                
                if (confirmed) {
                    // Clear any session data
                    localStorage.removeItem('loggedInUsername');
                    localStorage.removeItem('userRole');
                    sessionStorage.clear();
                    
                    // Redirect to login page
                    window.location.href = '../index.html';
                }
            });
        }

        // Optional: Add active class to current page
        highlightCurrentPage();
    }

    // Function to highlight the current page in navigation
    function highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop();
        
        // Remove active class from all menu items
        const menuItems = document.querySelectorAll('.menu li');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class based on current page
        let activeId = '';
        if (currentFile === 'dashboard_employee.html') {
            activeId = 'dashboard';
        } else if (currentFile === 'lab_result_employee.html') {
            activeId = 'lab-result';
        } else if (currentFile === 'appointment_employee.html') {
            activeId = 'appointment';
        }

        if (activeId) {
            const activeItem = document.getElementById(activeId);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNavigation);
    } else {
        initializeNavigation();
    }

})();