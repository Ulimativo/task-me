document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.querySelector('.task-input');
    const addButton = document.querySelector('.add-btn');
    let taskCounter = 0;

    // Initialize drag and drop
    initializeDragAndDrop();

    // Add new task functionality
    addButton.addEventListener('click', () => addNewTask());
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTask();
    });

    function addNewTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        const inboxContainer = document.querySelector('[data-category="inbox"] .tasks-container');
        const taskElement = createTaskElement(taskText);
        inboxContainer.appendChild(taskElement);
        taskInput.value = '';
    }

    function createTaskElement(text) {
        taskCounter++;
        const taskId = `task-${taskCounter}`;
        
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.draggable = true;
        taskDiv.id = taskId;
        
        taskDiv.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" id="${taskId}-check">
                <label for="${taskId}-check"></label>
            </div>
            <div class="task-content">
                <h3>${text}</h3>
            </div>
            <div class="task-actions">
                <button class="task-btn" aria-label="Edit task">✏️</button>
                <button class="task-btn" aria-label="Delete task">🗑️</button>
            </div>
        `;

        // Add drag event listeners
        taskDiv.addEventListener('dragstart', handleDragStart);
        taskDiv.addEventListener('dragend', handleDragEnd);

        return taskDiv;
    }

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
            dropZone.appendChild(taskElement);
        }
    }
});