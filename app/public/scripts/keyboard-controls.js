export function initializeKeyboardControls() {
    const keyboardMap = new Map([
        ['?', showKeyboardShortcuts],
        ['n', focusNewTask],
        ['/', focusNewTask],
        ['Escape', handleEscape],
        ['j', selectNextTask],
        ['k', selectPreviousTask],
        ['e', editSelectedTask],
        ['d', deleteSelectedTask],
        ['Enter', toggleSelectedTask],
        ['1', moveSelectedToCategory.bind(null, 'inbox')],
        ['a', moveSelectedToCategory.bind(null, 'a')],
        ['b', moveSelectedToCategory.bind(null, 'b')],
        ['c', moveSelectedToCategory.bind(null, 'c')],
        ['D', moveSelectedToCategory.bind(null, 'd')],
        ['E', moveSelectedToCategory.bind(null, 'e')],
    ]);

    let selectedTaskId = null;

    // Initialize keyboard shortcuts modal
    const shortcutsModal = document.querySelector('.keyboard-shortcuts');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeBtn = shortcutsModal.querySelector('.close-btn');
    const shortcutsBtn = document.querySelector('.keyboard-shortcuts-btn');

    document.addEventListener('keydown', (e) => {
        // Ignore keyboard shortcuts when typing in input fields
        if (e.target.matches('input, textarea')) {
            return;
        }

        const handler = keyboardMap.get(e.key);
        if (handler) {
            e.preventDefault();
            handler();
        }
    });

    function showKeyboardShortcuts() {
        shortcutsModal.style.removeProperty('display');
        modalOverlay.style.removeProperty('display');
        
        // Force reflow
        shortcutsModal.offsetHeight;
        
        modalOverlay.classList.add('active');
        shortcutsModal.classList.add('active');
    }

    function hideKeyboardShortcuts() {
        modalOverlay.classList.remove('active');
        shortcutsModal.classList.remove('active');
    }

    // Event listeners for modal
    shortcutsBtn.addEventListener('click', showKeyboardShortcuts);
    closeBtn.addEventListener('click', hideKeyboardShortcuts);
    modalOverlay.addEventListener('click', hideKeyboardShortcuts);

    function focusNewTask() {
        const taskInput = document.querySelector('.task-input');
        taskInput.focus();
    }

    function handleEscape() {
        // Close any open modals
        const modals = document.querySelectorAll('.ai-modal, .keyboard-shortcuts');
        modals.forEach(modal => modal.classList.remove('active'));
        modalOverlay.classList.remove('active');
        
        // Unfocus input if focused
        if (document.activeElement instanceof HTMLInputElement) {
            document.activeElement.blur();
        }

        // Deselect task if selected
        if (selectedTaskId) {
            deselectTask();
        }
    }

    function selectNextTask() {
        const tasks = Array.from(document.querySelectorAll('.task-item'));
        if (!tasks.length) return;

        const currentIndex = selectedTaskId 
            ? tasks.findIndex(task => task.id === selectedTaskId)
            : -1;
        
        const nextIndex = currentIndex + 1 < tasks.length ? currentIndex + 1 : 0;
        selectTask(tasks[nextIndex].id);
    }

    function selectPreviousTask() {
        const tasks = Array.from(document.querySelectorAll('.task-item'));
        if (!tasks.length) return;

        const currentIndex = selectedTaskId 
            ? tasks.findIndex(task => task.id === selectedTaskId)
            : 0;
        
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
        selectTask(tasks[previousIndex].id);
    }

    function selectTask(taskId) {
        if (selectedTaskId) {
            const previousTask = document.getElementById(selectedTaskId);
            previousTask?.classList.remove('keyboard-selected');
        }

        selectedTaskId = taskId;
        const task = document.getElementById(taskId);
        task.classList.add('keyboard-selected');
        task.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function deselectTask() {
        if (selectedTaskId) {
            const task = document.getElementById(selectedTaskId);
            task?.classList.remove('keyboard-selected');
            selectedTaskId = null;
        }
    }

    function editSelectedTask() {
        if (!selectedTaskId) return;
        const task = document.getElementById(selectedTaskId);
        const editBtn = task.querySelector('.edit-btn');
        editBtn?.click();
    }

    function deleteSelectedTask() {
        if (!selectedTaskId) return;
        const task = document.getElementById(selectedTaskId);
        const deleteBtn = task.querySelector('.delete-btn');
        deleteBtn?.click();
    }

    function toggleSelectedTask() {
        if (!selectedTaskId) return;
        const task = document.getElementById(selectedTaskId);
        const checkbox = task.querySelector('input[type="checkbox"]');
        checkbox?.click();
    }

    function moveSelectedToCategory(category) {
        if (!selectedTaskId) return;
        const task = document.getElementById(selectedTaskId);
        const targetContainer = document.querySelector(`[data-category="${category}"] .tasks-container`);
        if (task && targetContainer) {
            targetContainer.appendChild(task);
            // Update task store
            window.taskStore?.moveTask(selectedTaskId, category);
        }
    }
}