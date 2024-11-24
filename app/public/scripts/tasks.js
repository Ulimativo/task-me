document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.querySelector('.task-input');
    const addButton = document.querySelector('.add-btn');
    
    // Initialize task counter from session storage or start at 0
    let taskCounter = parseInt(sessionStorage.getItem('taskCounter') || '0');

    // Task store with persistence
    const taskStore = {
        tasks: new Map(),

        init() {
            // Load tasks from session storage
            const savedTasks = sessionStorage.getItem('tasks');
            if (savedTasks) {
                const tasksArray = JSON.parse(savedTasks);
                tasksArray.forEach(task => {
                    this.tasks.set(task.id, task);
                    renderTask(task); // Render each saved task
                });
            }
        },

        save() {
            // Save tasks to session storage
            const tasksArray = Array.from(this.tasks.values());
            sessionStorage.setItem('tasks', JSON.stringify(tasksArray));
            sessionStorage.setItem('taskCounter', taskCounter.toString());
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
            <div class="task-item" id="${taskData.id}" draggable="true">
                <div class="task-content">
                    <input type="checkbox" ${taskData.completed ? 'checked' : ''}>
                    <h3>${taskData.text}</h3>
                </div>
                <div class="task-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            </div>
        `;

        // Find the correct category container
        const categoryContainer = document.querySelector(
            `[data-category="${taskData.category}"] .tasks-container`
        ) || document.querySelector('[data-category="inbox"] .tasks-container');

        categoryContainer.insertAdjacentHTML('beforeend', taskHtml);

        // Add event listeners to the new task
        const taskElement = document.getElementById(taskData.id);
        initializeTaskListeners(taskElement);
    }

    function initializeTaskListeners(taskElement) {
        // Checkbox listener
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            taskStore.updateTask(taskElement.id, { completed: e.target.checked });
        });

        // Delete button listener
        const deleteBtn = taskElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            taskElement.remove();
            taskStore.removeTask(taskElement.id);
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
});