// CALENDAR FUNCTIONALITY
class Calendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.options = {
            showNavigation: true,
            showHeader: true,
            showDays: true,
            recentDays: 0, // 0 means show full month, >0 shows recent days
            ...options
        };
        
        this.currentDate = new Date();
        this.events = [];
        
        this.init();
    }
    
    init() {
        // Create calendar structure
        this.createCalendarStructure();
        this.render();
        
        // Load events if needed
        if (typeof this.options.onLoad === 'function') {
            this.options.onLoad(this);
        }
    }
    
    createCalendarStructure() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create header
        if (this.options.showHeader) {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            
            if (this.options.showNavigation) {
                this.prevBtn = document.createElement('button');
                this.prevBtn.id = 'prevMonth';
                this.prevBtn.innerHTML = '&lt;';
                this.prevBtn.addEventListener('click', () => this.prevMonth());
                header.appendChild(this.prevBtn);
            }
            
            this.monthYear = document.createElement('h2');
            this.monthYear.id = 'monthYear';
            header.appendChild(this.monthYear);
            
            if (this.options.showNavigation) {
                this.nextBtn = document.createElement('button');
                this.nextBtn.id = 'nextMonth';
                this.nextBtn.innerHTML = '&gt;';
                this.nextBtn.addEventListener('click', () => this.nextMonth());
                header.appendChild(this.nextBtn);
            }
            
            this.container.appendChild(header);
        }
        
        // Create calendar table
        this.table = document.createElement('table');
        this.table.className = 'calendar';
        
        if (this.options.showDays) {
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Sun</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                </tr>
            `;
            this.table.appendChild(thead);
        }
        
        this.calendarBody = document.createElement('tbody');
        this.calendarBody.id = 'calendarBody';
        this.table.appendChild(this.calendarBody);
        this.container.appendChild(this.table);
        
        // Add recent dates section if needed
        if (this.options.recentDays > 0) {
            this.recentDatesContainer = document.createElement('div');
            this.recentDatesContainer.className = 'recent-dates';
            this.recentDatesContainer.innerHTML = '<h3>Upcoming Dates</h3>';
            this.container.appendChild(this.recentDatesContainer);
        }
    }
    
    render() {
        if (this.options.recentDays > 0) {
            this.renderRecentDates();
        } else {
            this.renderFullMonth();
        }
    }
    
    renderFullMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.monthYear.textContent = this.currentDate.toLocaleString('default', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        this.calendarBody.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInLastMonth = new Date(year, month, 0).getDate();
        
        let row = document.createElement('tr');
        let dayCount = 1;
        let nextMonthDay = 1;
        
        // Previous month days
        for (let i = 0; i < firstDay; i++) {
            row.innerHTML += '<td class="other-month"></td>';
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            if (row.children.length === 7) {
                this.calendarBody.appendChild(row);
                row = document.createElement('tr');
            }
            
            const date = new Date(year, month, day);
            const isToday = this.isToday(date);
            const hasEvent = this.hasEvent(date);
            
            let dayClass = '';
            if (isToday) dayClass += ' today';
            if (hasEvent) dayClass += ' has-event';
            
            row.innerHTML += `<td class="${dayClass.trim()}" data-date="${this.formatDate(date)}">
                <span class="date">${day}</span>
                ${hasEvent ? '<span class="event-dot"></span>' : ''}
            </td>`;
            
            dayCount++;
        }
        
        // Next month days
        while (row.children.length < 7) {
            row.innerHTML += '<td class="other-month"></td>';
            nextMonthDay++;
        }
        
        if (row.children.length > 0) {
            this.calendarBody.appendChild(row);
        }
        
        // Add click handlers
        this.addDateClickHandlers();
    }
    
    renderRecentDates() {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + this.options.recentDays);
        
        this.monthYear.textContent = 'Upcoming';
        this.calendarBody.innerHTML = '';
        
        let row = document.createElement('tr');
        let dayCount = 0;
        
        while (today <= endDate) {
            if (dayCount > 0 && dayCount % 7 === 0) {
                this.calendarBody.appendChild(row);
                row = document.createElement('tr');
            }
            
            const date = new Date(today);
            const isToday = this.isToday(date);
            const hasEvent = this.hasEvent(date);
            
            let dayClass = '';
            if (isToday) dayClass += ' today';
            if (hasEvent) dayClass += ' has-event';
            
            row.innerHTML += `
                <td class="${dayClass.trim()}" data-date="${this.formatDate(date)}">
                    <div class="day-name">${date.toLocaleString('default', { weekday: 'short' })}</div>
                    <div class="date-number">${date.getDate()}</div>
                    ${hasEvent ? '<div class="event-indicator">•</div>' : ''}
                </td>
            `;
            
            today.setDate(today.getDate() + 1);
            dayCount++;
        }
        
        // Fill remaining cells if needed
        while (row.children.length < 7) {
            row.innerHTML += '<td></td>';
        }
        
        this.calendarBody.appendChild(row);
        this.addDateClickHandlers();
    }
    
    addDateClickHandlers() {
        const dateCells = this.calendarBody.querySelectorAll('td[data-date]');
        dateCells.forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.getAttribute('data-date');
                if (this.options.onDateClick) {
                    this.options.onDateClick(date);
                }
            });
        });
    }
    
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
    
    addEvent(date, title, description = '') {
        this.events.push({
            date: this.formatDate(new Date(date)),
            title,
            description
        });
        this.render();
    }
    
    hasEvent(date) {
        const dateStr = this.formatDate(date);
        return this.events.some(event => event.date === dateStr);
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

// Initialize calendar if elements exist
document.addEventListener('DOMContentLoaded', () => {
    // Admin dashboard - full calendar
    if (document.getElementById('calendarAdmin')) {
        window.adminCalendar = new Calendar('calendarAdmin', {
            showNavigation: true,
            showHeader: true,
            showDays: true,
            recentDays: 0,
            onDateClick: (date) => {
                console.log('Admin date clicked:', date);
                // Format date for display
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = date.toLocaleDateString('en-US', options);
                
                // Set the date in the modal
                document.getElementById('modalDate').textContent = formattedDate;
                
                // TODO: Fetch appointments for this date from the server
                // For now, we'll use sample data
                const sampleAppointments = [
                    { id: 1, time: '09:00 AM', patient: 'John Doe', type: 'Consultation' },
                    { id: 2, time: '10:30 AM', patient: 'Jane Smith', type: 'Follow-up' },
                    { id: 3, time: '02:15 PM', patient: 'Robert Johnson', type: 'Therapy' }
                ];
                
                // Populate the appointment list
                const appointmentList = document.getElementById('appointmentList');
                appointmentList.innerHTML = '';
                
                if (sampleAppointments.length === 0) {
                    appointmentList.innerHTML = '<p>No appointments scheduled for this date.</p>';
                } else {
                    sampleAppointments.forEach(appt => {
                        const apptElement = document.createElement('div');
                        apptElement.className = 'appointment-item';
                        apptElement.innerHTML = `
                            <div class="appointment-time">${appt.time}</div>
                            <div class="appointment-details">
                                <div class="appointment-patient">${appt.patient}</div>
                                <div class="appointment-type">${appt.type}</div>
                            </div>
                            <button class="view-appointment-btn" data-id="${appt.id}">View</button>
                        `;
                        appointmentList.appendChild(apptElement);
                    });
                }
                
                // Show the modal
                document.getElementById('appointmentModal').style.display = 'block';
            }
        });
    }
    
    // Employee dashboard - recent dates only
    if (document.getElementById('calendarEmployee')) {
        window.employeeCalendar = new Calendar('calendarEmployee', {
            showNavigation: false,
            showHeader: true,
            showDays: true,
            recentDays: 7, // Show next 7 days
            onDateClick: (date) => {
                console.log('Employee date clicked:', date);
                // Handle employee date click
            }
        });
    }
    
    // Client dashboard - full calendar
    if (document.getElementById('calendarClient')) {
        window.clientCalendar = new Calendar('calendarClient', {
            showNavigation: true,
            showHeader: true,
            showDays: true,
            recentDays: 0,
            onDateClick: (date) => {
                console.log('Client date clicked:', date);
                // Handle client date click
            }
        });
    }
});