// AI Support functionality
export function initializeAISupport() {
    const aiButton = document.querySelector('.ai-support-btn');
    const aiModal = document.querySelector('.ai-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeButton = document.querySelector('.ai-close-btn');
    const aiActionButtons = document.querySelectorAll('.ai-action-btn');

    // Open modal
    aiButton.addEventListener('click', () => {
        aiModal.classList.add('active');
        modalOverlay.classList.add('active');
    });

    // Close modal
    function closeModal() {
        aiModal.classList.remove('active');
        modalOverlay.classList.remove('active');
    }

    closeButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // AI Actions
    aiActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            handleAIAction(action);
        });
    });

    async function handleAIAction(action) {
        const suggestions = document.querySelector('.ai-suggestions');
        suggestions.innerHTML = '<p>Analyzing your tasks... 🤔</p>';

        try {
            // Collect all tasks with their current categories
            const tasks = Array.from(document.querySelectorAll('.task-item')).map(task => ({
                id: task.id,
                text: task.querySelector('.task-content h3').textContent,
                completed: task.querySelector('input[type="checkbox"]').checked,
                currentCategory: task.closest('.category-section')?.dataset.category || 'inbox'
            }));

            if (tasks.length === 0) {
                suggestions.innerHTML = `
                    <div class="ai-suggestion">
                        <p>No tasks found to analyze! Add some tasks first.</p>
                    </div>
                `;
                return;
            }

            // Send to backend
            const response = await fetch('/api/analyze-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tasks, action })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI suggestions');
            }

            const data = await response.json();
            displaySuggestions(data.suggestions, action);

        } catch (error) {
            console.error('AI Analysis Error:', error);
            suggestions.innerHTML = `
                <div class="ai-error">
                    <p>😅 Oops! Something went wrong while analyzing your tasks.</p>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    function displaySuggestions(suggestions, action) {
        const suggestionsContainer = document.querySelector('.ai-suggestions');
        
        try {
            const parsedSuggestions = JSON.parse(suggestions);
            
            switch(action) {
                case 'categorize':
                    displayCategorySuggestions(parsedSuggestions);
                    break;
                case 'prioritize':
                    displayPrioritySuggestions(parsedSuggestions);
                    break;
                case 'optimize':
                    displayOptimizationSuggestions(parsedSuggestions);
                    break;
            }
        } catch (error) {
            suggestionsContainer.innerHTML = `
                <div class="ai-suggestion">
                    <p>${suggestions}</p>
                </div>
            `;
        }
    }

    function displayCategorySuggestions(suggestions) {
        const suggestionsContainer = document.querySelector('.ai-suggestions');
        suggestionsContainer.innerHTML = Object.entries(suggestions)
            .map(([taskId, suggestion]) => `
                <div class="ai-suggestion" data-task-id="${taskId}" data-category="${suggestion.category}">
                    <p><strong>${suggestion.taskText}</strong></p>
                    <p>Suggested category: ${suggestion.categoryName} ${getCategoryEmoji(suggestion.category)}</p>
                    <p class="suggestion-reason">${suggestion.reason}</p>
                    <button class="apply-suggestion">Apply</button>
                </div>
            `).join('');

        // Add click handlers for suggestions
        suggestionsContainer.querySelectorAll('.apply-suggestion').forEach(button => {
            button.addEventListener('click', (e) => {
                const suggestion = e.target.closest('.ai-suggestion');
                const taskId = suggestion.dataset.taskId;
                const category = suggestion.dataset.category;
                moveTaskToCategory(taskId, category);
                suggestion.classList.add('applied');
                button.textContent = 'Applied ✓';
                button.disabled = true;
            });
        });
    }

    function displayPrioritySuggestions(suggestions) {
        const suggestionsContainer = document.querySelector('.ai-suggestions');
        
        // Create a priority list with task details
        const priorityList = suggestions.priorityOrder.map(taskId => {
            const task = document.getElementById(taskId);
            return {
                taskId,
                text: task.querySelector('.task-content h3').textContent,
                reason: suggestions.reasoning[taskId]
            };
        });

        // Display the suggestions
        suggestionsContainer.innerHTML = `
            <div class="ai-suggestion-summary">
                <h3>📊 Suggested Task Priority</h3>
                <p>Here's the recommended order for your tasks:</p>
                
                <div class="changes-list">
                    ${priorityList.map((item, index) => `
                        <div class="change-item">
                            <div class="priority-number">${index + 1}</div>
                            <div class="priority-content">
                                <p class="task-name"><strong>${item.text}</strong></p>
                                <p class="suggestion-reason">${item.reason}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="suggestion-actions">
                    <button class="apply-all-suggestions">Apply This Order</button>
                    <button class="decline-suggestions">Keep Current Order</button>
                </div>
            </div>
        `;

        // Add event listeners for the buttons
        const applyButton = suggestionsContainer.querySelector('.apply-all-suggestions');
        const declineButton = suggestionsContainer.querySelector('.decline-suggestions');

        applyButton.addEventListener('click', () => {
            // Reorder tasks according to priority
            const tasksContainer = document.querySelector('.tasks-container');
            suggestions.priorityOrder.forEach(taskId => {
                const task = document.getElementById(taskId);
                if (task) {
                    tasksContainer.appendChild(task);
                }
            });

            // Show success message
            suggestionsContainer.innerHTML = `
                <div class="ai-suggestion success">
                    <p>✅ Tasks have been reordered successfully!</p>
                </div>
            `;
        });

        declineButton.addEventListener('click', () => {
            suggestionsContainer.innerHTML = `
                <div class="ai-suggestion">
                    <p>Order unchanged. Your tasks remain in their current order.</p>
                </div>
            `;
        });
    }

    function moveTaskToCategory(taskId, category) {
        const task = document.getElementById(taskId);
        const targetContainer = document.querySelector(`[data-category="${category}"] .tasks-container`);
        if (task && targetContainer) {
            targetContainer.appendChild(task);
            // Update task store
            window.taskStore?.moveTask(taskId, category);
        }
    }

    // ... add displayOptimizationSuggestions function ...
}

function getCategoryEmoji(category) {
    switch(category) {
        case 'a':
            return '🔥';
        case 'd':
            return '👥';
        case 'e':
            return '❌';
        default:
            return '✨';
    }
}