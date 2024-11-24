document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.querySelector('.task-input');
    const addButton = document.querySelector('.add-btn');
    
    // Task store with localStorage persistence
    const taskStore = {
        tasks: new Map(),
        version: '1.0', // For future data structure updates
        storageKey: 'taskme_tasks',
        counterKey: 'taskme_counter',

        init() {
            try {
                // Load tasks from localStorage
                const savedTasks = localStorage.getItem(this.storageKey);
                const savedCounter = localStorage.getItem(this.counterKey);
                
                if (savedTasks) {
                    const { version, tasks } = JSON.parse(savedTasks);
                    
                    // Version check for future compatibility
                    if (version === this.version) {
                        tasks.forEach(task => {
                            this.tasks.set(task.id, task);
                            renderTask(task);
                        });
                    }
                }

                // Initialize or restore counter
                window.taskCounter = savedCounter ? parseInt(savedCounter) : 0;
                
                // Check storage usage
                this.checkStorageUsage();
            } catch (error) {
                console.error('Error initializing task store:', error);
                this.handleStorageError();
            }
        },

        save() {
            try {
                const tasksData = {
                    version: this.version,
                    tasks: Array.from(this.tasks.values())
                };
                
                localStorage.setItem(this.storageKey, JSON.stringify(tasksData));
                localStorage.setItem(this.counterKey, window.taskCounter.toString());
                
                this.checkStorageUsage();
            } catch (error) {
                console.error('Error saving tasks:', error);
                this.handleStorageError();
            }
        },

        checkStorageUsage() {
            const usage = new Blob([localStorage.getItem(this.storageKey) || '']).size;
            const limit = 5 * 1024 * 1024; // 5MB limit
            const usagePercentage = (usage / limit) * 100;

            if (usagePercentage > 80) {
                this.showStorageWarning(usagePercentage);
            }
        },

        showStorageWarning(percentage) {
            const warning = document.createElement('div');
            warning.className = 'storage-warning';
            warning.innerHTML = `
                <p>⚠️ Storage usage: ${percentage.toFixed(1)}%</p>
                <button class="export-btn">Export Tasks</button>
            `;
            document.querySelector('.tasks-header').appendChild(warning);
        },

        handleStorageError() {
            const error = document.createElement('div');
            error.className = 'storage-error';
            error.innerHTML = `
                <p>⚠️ Unable to save tasks. Storage might be full.</p>
                <button class="export-btn">Export Tasks</button>
            `;
            document.querySelector('.tasks-header').appendChild(error);
        },

        exportTasks() {
            const tasksData = {
                version: this.version,
                tasks: Array.from(this.tasks.values()),
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(tasksData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `taskme-backup-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        },

        async importTasks(file) {
            try {
                const text = await file.text();
                const importedData = JSON.parse(text);
                
                if (importedData.version === this.version) {
                    // Clear existing tasks
                    this.clearAllTasks();
                    
                    // Import new tasks
                    importedData.tasks.forEach(task => {
                        this.tasks.set(task.id, task);
                        renderTask(task);
                    });
                    
                    this.save();
                    return true;
                } else {
                    throw new Error('Incompatible version');
                }
            } catch (error) {
                console.error('Import error:', error);
                return false;
            }
        },

        clearAllTasks() {
            this.tasks.clear();
            document.querySelectorAll('.task-item').forEach(el => el.remove());
            this.save();
            window.taskCounter = 0;
        },

        addTask(taskData) {
            this.tasks.set(taskData.id, taskData);
            this.save();
        },

        removeTask(taskId) {
            this.tasks.delete(taskId);
            this.save();
        },

        updateTask(taskId, updates) {
            const task = this.tasks.get(taskId);
            if (task) {
                Object.assign(task, updates);
                this.tasks.set(taskId, task);
                this.save();
            }
        },

        moveTask(taskId, newCategory) {
            const task = this.tasks.get(taskId);
            if (task) {
                task.category = newCategory;
                this.tasks.set(taskId, task);
                this.save();
            }
        }
    };

    // Initialize the task store
    window.taskStore = taskStore;
    taskStore.init();

    // Add task management controls to header
    const controlsHtml = `
        <div class="task-management">
            <button class="management-btn import-btn">📥 Import</button>
            <button class="management-btn export-btn">📤 Export</button>
            <button class="management-btn clear-btn">🗑️ Clear All</button>
            <input type="file" id="import-file" accept=".json" style="display: none;">
        </div>
    `;
    document.querySelector('.tasks-header').insertAdjacentHTML('beforeend', controlsHtml);

    // Add event listeners for management controls
    document.querySelector('.export-btn').addEventListener('click', () => {
        taskStore.exportTasks();
    });

    document.querySelector('.import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const success = await taskStore.importTasks(e.target.files[0]);
            if (success) {
                alert('Tasks imported successfully!');
            } else {
                alert('Failed to import tasks. Please check the file format.');
            }
        }
    });

    document.querySelector('.clear-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all tasks? This cannot be undone.')) {
            taskStore.clearAllTasks();
        }
    });

    // Add new task functionality
    function addNewTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        taskCounter++;
        const taskId = `task-${taskCounter}`;
        
        // Create task data
        const taskData = {
            id: taskId,
            text: taskText,
            category: 'inbox',
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Add to store and render
        taskStore.addTask(taskData);
        renderTask(taskData);
        
        // Clear input
        taskInput.value = '';
    }

    function renderTask(taskData) {
        const taskHtml = `
            <div class="task-item ${taskData.completed ? 'completed' : ''}" id="${taskData.id}" draggable="true">
                <span class="drag-handle">⋮⋮</span>
                <label class="task-checkbox">
                    <input type="checkbox" ${taskData.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <h3 class="task-text">${taskData.text}</h3>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" title="Edit task">✏️</button>
                    <button class="task-btn delete-btn" title="Delete task">🗑️</button>
                </div>
            </div>
        `;

        const categoryContainer = document.querySelector(
            `[data-category="${taskData.category}"] .tasks-container`
        ) || document.querySelector('[data-category="inbox"] .tasks-container');

        categoryContainer.insertAdjacentHTML('beforeend', taskHtml);

        // Add event listeners to the new task
        const taskElement = document.getElementById(taskData.id);
        initializeTaskListeners(taskElement);
    }

    function initializeTaskListeners(taskElement) {
        // Existing listeners
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            taskStore.updateTask(taskElement.id, { completed: e.target.checked });
            taskElement.classList.toggle('completed', e.target.checked);
        });

        const deleteBtn = taskElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            taskElement.remove();
            taskStore.removeTask(taskElement.id);
        });

        // New edit functionality
        const editBtn = taskElement.querySelector('.edit-btn');
        const taskTextElement = taskElement.querySelector('.task-text');
        
        editBtn.addEventListener('click', () => {
            const currentText = taskTextElement.textContent;
            taskTextElement.innerHTML = `
                <input type="text" class="edit-input" value="${currentText}">
            `;
            
            const editInput = taskTextElement.querySelector('.edit-input');
            editInput.focus();
            editInput.select();

            function saveEdit() {
                const newText = editInput.value.trim();
                if (newText) {
                    taskStore.updateTask(taskElement.id, { text: newText });
                    taskTextElement.textContent = newText;
                } else {
                    taskTextElement.textContent = currentText;
                }
            }

            editInput.addEventListener('blur', saveEdit);
            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                }
            });
            editInput.addEventListener('keyup', (e) => {
                if (e.key === 'Escape') {
                    taskTextElement.textContent = currentText;
                }
            });
        });

        // Drag and drop listeners
        taskElement.addEventListener('dragstart', handleDragStart);
        taskElement.addEventListener('dragend', handleDragEnd);
    }

    // Event listeners
    addButton.addEventListener('click', addNewTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTask();
    });

    // Initialize drag and drop
    initializeDragAndDrop();

    function initializeDragAndDrop() {
        const dropZones = document.querySelectorAll('[data-droppable="true"]');

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('drop', handleDrop);
            zone.addEventListener('dragenter', handleDragEnter);
            zone.addEventListener('dragleave', handleDragLeave);
        });
    }

    function handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.id);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        const dropZone = e.currentTarget;
        dropZone.classList.remove('drag-over');

        const taskId = e.dataTransfer.getData('text/plain');
        const taskElement = document.getElementById(taskId);
        
        if (taskElement && dropZone.classList.contains('tasks-container')) {
            // Get the new category from the parent category section
            const newCategory = dropZone.closest('.category-section').dataset.category;
            
            // Update store
            taskStore.moveTask(taskId, newCategory);
            
            // Update DOM
            dropZone.appendChild(taskElement);
        }
    }

    // Helper function to get category name
    function getCategoryName(category) {
        const categories = {
            'inbox': 'Inbox',
            'a': 'Priority A',
            'b': 'Priority B',
            'c': 'Priority C',
            'd': 'Delegate',
            'e': 'Eliminate'
        };
        return categories[category] || 'Inbox';
    }
});