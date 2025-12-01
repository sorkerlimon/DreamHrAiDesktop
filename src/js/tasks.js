// Task management functionality for DreamHRAi

class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.showLoadingState();
        this.loadSampleTasks();
        this.setupEventListeners();
        this.updateStats();
        this.renderTasks();
        this.hideLoadingState();
    }

    loadSampleTasks() {
        // Generate sample tasks
        this.tasks = [
            {
                id: 1,
                title: 'Complete project documentation',
                description: 'Write comprehensive documentation for the DreamHRAi project including API references and user guides.',
                priority: 'high',
                status: 'progress',
                progress: 65,
                startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                endTime: null,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                title: 'Database optimization',
                description: 'Optimize database queries and implement indexing for better performance.',
                priority: 'medium',
                status: 'queue',
                progress: 0,
                startTime: null,
                endTime: null,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                title: 'User interface testing',
                description: 'Conduct thorough testing of all UI components and user workflows.',
                priority: 'medium',
                status: 'complete',
                progress: 100,
                startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 4,
                title: 'Security audit',
                description: 'Perform comprehensive security audit of the application and infrastructure.',
                priority: 'high',
                status: 'failed',
                progress: 30,
                startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                endTime: null,
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 5,
                title: 'Client meeting preparation',
                description: 'Prepare presentation and documentation for upcoming client meeting.',
                priority: 'low',
                status: 'cancel',
                progress: 0,
                startTime: null,
                endTime: null,
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        this.filteredTasks = [...this.tasks];
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('statusFilter').addEventListener('change', (e) => this.handleFilter(e));

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Add smooth scrolling for better UX
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    handleKeyboardShortcuts(e) {
        // Escape to close modals
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal');
            if (modal) {
                modal.remove();
            }
        }
    }

    handleSearch(e) {
        this.currentSearch = e.target.value.toLowerCase().trim();
        this.debounce(() => this.applyFilters(), 300);
    }

    handleFilter(e) {
        this.currentFilter = e.target.value;
        this.applyFilters();
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }

    applyFilters() {
        this.showLoadingState();

        setTimeout(() => {
            this.filteredTasks = this.tasks.filter(task => {
                const matchesSearch = !this.currentSearch ||
                    task.title.toLowerCase().includes(this.currentSearch) ||
                    task.description.toLowerCase().includes(this.currentSearch);
                const matchesStatus = this.currentFilter === 'all' || task.status === this.currentFilter;

                return matchesSearch && matchesStatus;
            });

            this.renderTasks();
            this.hideLoadingState();
        }, 150); // Small delay for better UX
    }

    showLoadingState() {
        this.isLoading = true;
        const tasksGrid = document.getElementById('tasksGrid');
        const existingLoader = tasksGrid.querySelector('.loading-spinner');

        if (!existingLoader) {
            const loader = document.createElement('div');
            loader.className = 'loading-spinner';
            loader.innerHTML = `
                <div class="spinner"></div>
                <p>Loading tasks...</p>
            `;
            tasksGrid.innerHTML = '';
            tasksGrid.appendChild(loader);
        }
    }

    hideLoadingState() {
        this.isLoading = false;
        const loader = document.querySelector('.loading-spinner');
        if (loader) {
            loader.remove();
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'complete').length;
        const inProgressTasks = this.tasks.filter(t => t.status === 'progress').length;
        const pendingTasks = this.tasks.filter(t => t.status === 'queue').length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('inProgressTasks').textContent = inProgressTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
    }

    renderTasks() {
        const tasksGrid = document.getElementById('tasksGrid');

        if (this.filteredTasks.length === 0) {
            tasksGrid.innerHTML = `
                <div class="no-tasks">
                    <h3>No tasks found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        tasksGrid.innerHTML = this.filteredTasks.map(task => `
            <div class="task-card" data-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-priority priority-${task.priority}">${task.priority}</div>
                    </div>
                </div>

                <div class="task-description">${task.description}</div>

                <div class="task-meta">
                    <span>Created: ${this.formatDate(task.createdAt)}</span>
                    <span>Status: <span class="task-status status-${task.status}">${this.formatStatus(task.status)}</span></span>
                </div>

                ${task.status === 'progress' || task.status === 'complete' ? `
                    <div class="task-progress">
                        <div class="progress-bar" style="width: ${task.progress}%"></div>
                    </div>
                ` : ''}

                <div class="task-actions">
                    ${this.getActionButtons(task)}
                </div>
            </div>
        `).join('');

        // Add event listeners to action buttons
        this.attachActionListeners();
    }

    getActionButtons(task) {
        const buttons = [];

        if (task.status === 'queue') {
            buttons.push('<button class="task-btn btn-start" data-action="start" data-id="' + task.id + '">Start</button>');
        }

        if (task.status === 'progress') {
            buttons.push('<button class="task-btn btn-complete" data-action="complete" data-id="' + task.id + '">Complete</button>');
        }

        buttons.push('<button class="task-btn btn-edit" data-action="edit" data-id="' + task.id + '">Edit</button>');
        buttons.push('<button class="task-btn btn-delete" data-action="delete" data-id="' + task.id + '">Delete</button>');

        return buttons.join('');
    }

    attachActionListeners() {
        document.querySelectorAll('.task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const taskId = parseInt(e.target.dataset.id);
                this.handleTaskAction(action, taskId);
            });
        });
    }

    handleTaskAction(action, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const taskCard = document.querySelector(`[data-id="${taskId}"]`);

        switch (action) {
            case 'start':
                task.status = 'progress';
                task.startTime = new Date().toISOString();
                this.animateTaskCard(taskCard, 'pulse');
                this.showNotification('Task started successfully!', 'success');
                break;

            case 'complete':
                task.status = 'complete';
                task.endTime = new Date().toISOString();
                task.progress = 100;
                this.animateTaskCard(taskCard, 'bounce');
                this.showNotification('Task completed successfully!', 'success');
                break;

            case 'edit':
                this.showEditTaskModal(task);
                return; // Don't update stats/render yet

            case 'delete':
                this.confirmDelete(task, taskCard);
                return;
        }

        this.updateStats();
        this.applyFilters(); // Re-render with current filters
    }

    animateTaskCard(card, animation) {
        if (!card) return;

        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = `${animation} 0.6s ease-out`;
        }, 10);

        setTimeout(() => {
            card.style.animation = '';
        }, 600);
    }

    confirmDelete(task, card) {
        // Create a modern confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal confirm-modal';
        modal.innerHTML = `
            <div class="modal-content confirm-content">
                <h3>Delete Task</h3>
                <p>Are you sure you want to delete "<strong>${task.title}</strong>"? This action cannot be undone.</p>
                <div class="form-actions">
                    <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="button" class="delete-confirm-btn">Delete Task</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.delete-confirm-btn').addEventListener('click', () => {
            card.classList.add('removed');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== task.id);
                this.showNotification('Task deleted successfully!', 'success');
                this.updateStats();
                this.applyFilters();
            }, 300);
            modal.remove();
        });
    }

    showAddTaskModal() {
        this.showTaskModal('Add New Task', null);
    }

    showEditTaskModal(task) {
        this.showTaskModal('Edit Task', task);
    }

    showTaskModal(title, task = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <form id="taskForm">
                    <div class="form-group">
                        <label>Task Title:</label>
                        <input type="text" id="taskTitle" required value="${task ? task.title : ''}">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="taskDesc" rows="3" required>${task ? task.description : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Priority:</label>
                        <select id="taskPriority" required>
                            <option value="low" ${task && task.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${task && task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${task && task.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status:</label>
                        <select id="taskStatus" required>
                            <option value="queue" ${task && task.status === 'queue' ? 'selected' : ''}>Queue</option>
                            <option value="progress" ${task && task.status === 'progress' ? 'selected' : ''}>In Progress</option>
                            <option value="complete" ${task && task.status === 'complete' ? 'selected' : ''}>Complete</option>
                            <option value="cancel" ${task && task.status === 'cancel' ? 'selected' : ''}>Cancel</option>
                            <option value="failed" ${task && task.status === 'failed' ? 'selected' : ''}>Failed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Progress (%):</label>
                        <input type="number" id="taskProgress" min="0" max="100" value="${task ? task.progress : 0}">
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit">${task ? 'Update' : 'Create'} Task</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask(task);
            modal.remove();
        });
    }

    saveTask(existingTask) {
        // Clear previous validation errors
        this.clearValidationErrors();

        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDesc').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        const progress = parseInt(document.getElementById('taskProgress').value) || 0;

        // Validate form
        const errors = this.validateTaskForm(title, description, progress);

        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return;
        }

        if (existingTask) {
            // Update existing task
            existingTask.title = title;
            existingTask.description = description;
            existingTask.priority = priority;
            existingTask.status = status;
            existingTask.progress = progress;
            this.showNotification('Task updated successfully!', 'success');
        } else {
            // Create new task
            const newTask = {
                id: Math.max(...this.tasks.map(t => t.id), 0) + 1,
                title,
                description,
                priority,
                status,
                progress,
                startTime: status === 'progress' ? new Date().toISOString() : null,
                endTime: status === 'complete' ? new Date().toISOString() : null,
                createdAt: new Date().toISOString()
            };
            this.tasks.push(newTask);
            this.showNotification('Task created successfully!', 'success');
        }

        this.updateStats();
        this.applyFilters();
    }

    validateTaskForm(title, description, progress) {
        const errors = [];

        if (!title) {
            errors.push({ field: 'taskTitle', message: 'Task title is required' });
        } else if (title.length < 3) {
            errors.push({ field: 'taskTitle', message: 'Task title must be at least 3 characters long' });
        } else if (title.length > 100) {
            errors.push({ field: 'taskTitle', message: 'Task title must be less than 100 characters' });
        }

        if (!description) {
            errors.push({ field: 'taskDesc', message: 'Task description is required' });
        } else if (description.length < 10) {
            errors.push({ field: 'taskDesc', message: 'Task description must be at least 10 characters long' });
        }

        if (isNaN(progress) || progress < 0 || progress > 100) {
            errors.push({ field: 'taskProgress', message: 'Progress must be a number between 0 and 100' });
        }

        return errors;
    }

    showValidationErrors(errors) {
        errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (field) {
                field.style.borderColor = '#ef4444';
                field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';

                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = error.message;
                field.parentNode.appendChild(errorDiv);
            }
        });

        this.showNotification('Please fix the errors in the form', 'error');
    }

    clearValidationErrors() {
        // Clear field styles
        const fields = ['taskTitle', 'taskDesc', 'taskProgress'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.borderColor = '';
                field.style.boxShadow = '';
            }
        });

        // Remove error messages
        document.querySelectorAll('.field-error').forEach(error => error.remove());
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatStatus(status) {
        const statusMap = {
            'queue': 'Queue',
            'progress': 'In Progress',
            'complete': 'Complete',
            'cancel': 'Cancel',
            'failed': 'Failed'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
