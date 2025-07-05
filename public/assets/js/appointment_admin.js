document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calendarMonthEl = document.getElementById('calendarMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const calendarDaysEl = document.getElementById('calendarDays');
    const appointmentList = document.getElementById('appointmentList');
    const filterStatus = document.getElementById('filterStatus');
    const filterDate = document.getElementById('filterDate');
    const searchInput = document.getElementById('searchAppointments');
    const viewModeTabs = document.querySelectorAll('.view-mode-tab');
    const calendarView = document.getElementById('calendarView');
    const tableView = document.getElementById('tableView');
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    const appointmentModal = document.getElementById('appointmentModal');
    const closeModal = document.querySelector('.close-modal');
    const appointmentForm = document.getElementById('appointmentForm');

    // Current date
    let currentDate = new Date();
    let currentView = 'calendar'; // 'calendar' or 'table'

    // Sample data - Replace with actual API calls
    let appointments = [
        {
            id: 1,
            patientName: 'Juan Dela Cruz',
            patientId: 'PT-001',
            date: new Date(2025, 6, 15, 10, 30),
            type: 'Check-up',
            status: 'confirmed',
            notes: 'Regular check-up',
            doctor: 'Dr. Maria Santos'
        },
        {
            id: 2,
            patientName: 'Maria Santos',
            patientId: 'PT-002',
            date: new Date(2025, 6, 15, 14, 0),
            type: 'Dental',
            status: 'pending',
            notes: 'Tooth extraction',
            doctor: 'Dr. Jose Reyes'
        },
        {
            id: 3,
            patientName: 'Pedro Bautista',
            patientId: 'PT-003',
            date: new Date(2025, 6, 16, 9, 0),
            type: 'Lab Test',
            status: 'completed',
            notes: 'Blood test',
            doctor: 'Dr. Ana Lim'
        },
        {
            id: 4,
            patientName: 'Sofia Reyes',
            patientId: 'PT-004',
            date: new Date(2025, 6, 17, 11, 30),
            type: 'Consultation',
            status: 'cancelled',
            notes: 'Cancelled by patient',
            doctor: 'Dr. Carlos Garcia'
        },
        {
            id: 5,
            patientName: 'Miguel Lopez',
            patientId: 'PT-005',
            date: new Date(2025, 6, 17, 15, 0),
            type: 'Follow-up',
            status: 'confirmed',
            notes: 'Post-surgery check',
            doctor: 'Dr. Maria Santos'
        }
    ];

    // Initialize the page
    function init() {
        renderCalendar();
        renderAppointmentList();
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Navigation
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        // View mode tabs
        viewModeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                setViewMode(view);
            });
        });

        // Filters
        filterStatus.addEventListener('change', renderAppointmentList);
        filterDate.addEventListener('change', renderAppointmentList);
        searchInput.addEventListener('input', debounce(renderAppointmentList, 300));

        // Modal
        newAppointmentBtn.addEventListener('click', () => openModal());
        closeModal.addEventListener('click', () => closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === appointmentModal) {
                closeModal();
            }
        });

        // Form submission
        appointmentForm.addEventListener('submit', handleFormSubmit);
    }

    // Render the calendar
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Set month and year in header
        calendarMonthEl.textContent = new Intl.DateTimeFormat('en-US', { 
            month: 'long', 
            year: 'numeric' 
        }).format(currentDate);

        // Get first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week for first day (0-6, where 0 is Sunday)
        const firstDayIndex = firstDay.getDay();
        
        // Get days from previous month to show
        const prevLastDay = new Date(year, month, 0).getDate();
        
        // Get days from next month to show
        const lastDayIndex = lastDay.getDay();
        const nextDays = 7 - lastDayIndex - 1;
        
        // Generate calendar days
        let days = '';
        
        // Previous month days
        for (let x = firstDayIndex; x > 0; x--) {
            const day = prevLastDay - x + 1;
            const date = new Date(year, month - 1, day);
            days += `<div class="calendar-day other-month" data-date="${date.toISOString()}">${day}</div>`;
        }
        
        // Current month days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const hasAppointment = appointments.some(apt => {
                return apt.date.getDate() === i && 
                       apt.date.getMonth() === month && 
                       apt.date.getFullYear() === year;
            });
            
            const isToday = today.getDate() === i && 
                           today.getMonth() === month && 
                           today.getFullYear() === year;
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (hasAppointment) dayClass += ' has-appointments';
            
            days += `<div class="${dayClass}" data-date="${date.toISOString()}">${i}</div>`;
        }
        
        // Next month days
        for (let j = 1; j <= nextDays; j++) {
            const date = new Date(year, month + 1, j);
            days += `<div class="calendar-day other-month" data-date="${date.toISOString()}">${j}</div>`;
        }
        
        calendarDaysEl.innerHTML = days;
        
        // Add click event to calendar days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                const selectedDate = new Date(day.dataset.date);
                filterDate.value = formatDate(selectedDate);
                setViewMode('table');
                renderAppointmentList();
            });
        });
    }

    // Render appointment list
    function renderAppointmentList() {
        let filteredAppointments = [...appointments];
        
        // Apply status filter
        if (filterStatus.value !== 'all') {
            filteredAppointments = filteredAppointments.filter(
                apt => apt.status === filterStatus.value
            );
        }
        
        // Apply date filter
        if (filterDate.value) {
            const selectedDate = new Date(filterDate.value);
            filteredAppointments = filteredAppointments.filter(apt => {
                return apt.date.toDateString() === selectedDate.toDateString();
            });
        }
        
        // Apply search
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredAppointments = filteredAppointments.filter(apt => {
                return (
                    apt.patientName.toLowerCase().includes(searchTerm) ||
                    apt.patientId.toLowerCase().includes(searchTerm) ||
                    apt.type.toLowerCase().includes(searchTerm) ||
                    apt.doctor.toLowerCase().includes(searchTerm) ||
                    apt.notes.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        // Sort by date
        filteredAppointments.sort((a, b) => a.date - b.date);
        
        // Render appointments
        if (filteredAppointments.length > 0) {
            let html = `
                <table class="appointment-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Patient</th>
                            <th>Type</th>
                            <th>Doctor</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            filteredAppointments.forEach(apt => {
                const statusClass = `status-${apt.status}`;
                const formattedDate = formatDateTime(apt.date);
                
                html += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>
                            <div class="font-medium">${apt.patientName}</div>
                            <div class="text-sm text-gray-500">${apt.patientId}</div>
                        </td>
                        <td>${apt.type}</td>
                        <td>${apt.doctor}</td>
                        <td><span class="status-badge ${statusClass}">${formatStatus(apt.status)}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn view" title="View" onclick="viewAppointment(${apt.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn edit" title="Edit" onclick="editAppointment(${apt.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${apt.status !== 'cancelled' ? `
                                    <button class="action-btn delete" title="Cancel" onclick="cancelAppointment(${apt.id})">
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            appointmentList.innerHTML = html;
        } else {
            appointmentList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="far fa-calendar-alt"></i>
                    </div>
                    <h3 class="empty-state-title">No Appointments Found</h3>
                    <p class="empty-state-description">
                        There are no appointments matching your current filters.
                    </p>
                    <button class="btn btn-primary" onclick="clearFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
        }
    }

    // Set view mode (calendar or table)
    function setViewMode(view) {
        currentView = view;
        
        // Update active tab
        viewModeTabs.forEach(tab => {
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show/hide views
        if (view === 'calendar') {
            calendarView.style.display = 'block';
            tableView.style.display = 'none';
        } else {
            calendarView.style.display = 'none';
            tableView.style.display = 'block';
            renderAppointmentList();
        }
    }

    // Open appointment modal
    function openModal(appointment = null) {
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('appointmentForm');
        
        if (appointment) {
            // Edit mode
            modalTitle.textContent = 'Edit Appointment';
            form.dataset.mode = 'edit';
            form.dataset.id = appointment.id;
            
            // Fill form with appointment data
            document.getElementById('patientName').value = appointment.patientName;
            document.getElementById('patientId').value = appointment.patientId;
            document.getElementById('appointmentDate').value = formatDateForInput(appointment.date);
            document.getElementById('appointmentTime').value = formatTimeForInput(appointment.date);
            document.getElementById('appointmentType').value = appointment.type;
            document.getElementById('doctor').value = appointment.doctor;
            document.getElementById('status').value = appointment.status;
            document.getElementById('notes').value = appointment.notes;
        } else {
            // Add new mode
            modalTitle.textContent = 'New Appointment';
            form.dataset.mode = 'add';
            form.reset();
            
            // Set default values
            const now = new Date();
            document.getElementById('appointmentDate').value = formatDateForInput(now);
            document.getElementById('appointmentTime').value = formatTimeForInput(now);
            document.getElementById('status').value = 'pending';
        }
        
        appointmentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        appointmentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const mode = form.dataset.mode;
        
        // Get form values
        const appointmentData = {
            patientName: formData.get('patientName'),
            patientId: formData.get('patientId'),
            date: new Date(`${formData.get('appointmentDate')}T${formData.get('appointmentTime')}`),
            type: formData.get('appointmentType'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            doctor: formData.get('doctor')
        };
        
        // Validate form
        if (!appointmentData.patientName || !appointmentData.patientId || !appointmentData.type) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (appointmentData.date < new Date() && appointmentData.status !== 'completed') {
            if (!confirm('This appointment is in the past. Are you sure you want to continue?')) {
                return;
            }
        }
        
        // Save appointment
        if (mode === 'add') {
            // Add new appointment
            const newAppointment = {
                ...appointmentData,
                id: appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1
            };
            appointments.push(newAppointment);
            showToast('Appointment created successfully', 'success');
        } else {
            // Update existing appointment
            const id = parseInt(form.dataset.id);
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                appointments[index] = { ...appointments[index], ...appointmentData };
                showToast('Appointment updated successfully', 'success');
            }
        }
        
        // Update UI
        closeModal();
        renderCalendar();
        if (currentView === 'table') {
            renderAppointmentList();
        }
    }

    // View appointment details
    function viewAppointment(id) {
        const appointment = appointments.find(a => a.id === id);
        if (!appointment) return;
        
        // In a real app, you might open a detailed view modal
        alert(`Appointment Details:\n\n` +
              `Patient: ${appointment.patientName} (${appointment.patientId})\n` +
              `Date: ${formatDateTime(appointment.date)}\n` +
              `Type: ${appointment.type}\n` +
              `Status: ${formatStatus(appointment.status)}\n` +
              `Doctor: ${appointment.doctor}\n` +
              `Notes: ${appointment.notes}`);
    }

    // Edit appointment
    function editAppointment(id) {
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
            openModal(appointment);
        }
    }

    // Cancel appointment
    function cancelAppointment(id) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                appointments[index].status = 'cancelled';
                showToast('Appointment cancelled', 'success');
                renderCalendar();
                if (currentView === 'table') {
                    renderAppointmentList();
                }
            }
        }
    }

    // Clear all filters
    function clearFilters() {
        filterStatus.value = 'all';
        filterDate.value = '';
        searchInput.value = '';
        renderAppointmentList();
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        // In a real app, you might use a toast library
        console.log(`${type.toUpperCase()}: ${message}`);
        // For demo purposes, we'll just use an alert
        alert(`${type.toUpperCase()}: ${message}`);
    }

    // Format date for display
    function formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    // Format date and time for display
    function formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    // Format date for input[type="date"]
    function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    // Format time for input[type="time"]
    function formatTimeForInput(date) {
        return date.toTimeString().slice(0, 5);
    }

    // Format status for display
    function formatStatus(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Debounce function for search input
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Initialize the application
    init();
});

// Global functions that can be called from HTML
function viewAppointment(id) {
    // This will be called from the HTML
    const event = new CustomEvent('viewAppointment', { detail: { id } });
    document.dispatchEvent(event);
}

function editAppointment(id) {
    const event = new CustomEvent('editAppointment', { detail: { id } });
    document.dispatchEvent(event);
}

function cancelAppointment(id) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const event = new CustomEvent('cancelAppointment', { detail: { id } });
        document.dispatchEvent(event);
    }
}

function clearFilters() {
    const event = new Event('clearFilters');
    document.dispatchEvent(event);
}
