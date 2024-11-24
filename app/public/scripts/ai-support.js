// AI Support functionality
import { AIService } from './ai-service.js';

export function initializeAISupport() {
    console.log('Initializing AI Support...');

    // Get DOM elements
    const aiButton = document.querySelector('.ai-support-btn');
    const aiModal = document.querySelector('.ai-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeButton = document.querySelector('.ai-close-btn');
    const aiActionButtons = document.querySelectorAll('.ai-action-btn');

    // Debug logs
    console.log('AI Button:', aiButton);
    console.log('AI Modal:', aiModal);
    console.log('Modal Overlay:', modalOverlay);
    console.log('Close Button:', closeButton);

    if (!aiButton || !aiModal || !modalOverlay || !closeButton) {
        console.error('AI Support: Required elements not found');
        return;
    }

    // Close modal
    function closeModal(e) {
        if (e) {
            e.preventDefault();
        }
        console.log('Closing modal');
        
        // Remove active classes to trigger transitions
        modalOverlay.classList.remove('active');
        aiModal.classList.remove('active');
        
        // Reset transform and opacity
        aiModal.style.opacity = '0';
        aiModal.style.transform = 'translate(-50%, -50%) scale(0.95)';
    }

    // Open modal
    aiButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('AI button clicked');
        
        // Reset styles
        modalOverlay.style.removeProperty('display');
        aiModal.style.removeProperty('display');
        
        // Force reflow
        modalOverlay.offsetHeight;
        
        // Add active classes to trigger transitions
        modalOverlay.classList.add('active');
        aiModal.classList.add('active');
        
        // Reset transform and opacity
        aiModal.style.opacity = '1';
        aiModal.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Close button click
    closeButton.addEventListener('click', closeModal);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // AI Actions
    aiActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            handleAIAction(action);
        });
    });

    async function handleAIAction(action) {
        try {
            // Get user role
            const roleInput = document.getElementById('user-role');
            const userRole = roleInput.value.trim() || 'Team Member'; // Default role if none provided

            // Get all tasks from the inbox
            const inboxContainer = document.querySelector('[data-category="inbox"] .tasks-container');
            const taskElements = inboxContainer.querySelectorAll('.task-item');
            
            if (!taskElements.length) {
                console.log('No tasks found in inbox');
                const suggestionsContainer = document.querySelector('.ai-suggestions');
                suggestionsContainer.innerHTML = `
                    <div class="ai-suggestion">
                        <p>ℹ️ No tasks found in inbox to analyze.</p>
                    </div>
                `;
                return;
            }

            console.log(`Processing ${taskElements.length} tasks from inbox`);

            // Convert task elements to task objects with exact selectors
            const tasks = Array.from(taskElements).map(taskEl => {
                // Debug log
                console.log('Processing task element:', taskEl);

                // Get task title using the exact class
                const titleEl = taskEl.querySelector('.task-content .task-text');
                const title = titleEl ? titleEl.textContent.trim() : 'Untitled Task';

                // Get completion status from the task-item class instead of checkbox
                const isCompleted = taskEl.classList.contains('completed');

                return {
                    id: taskEl.id,
                    title: title,
                    completed: isCompleted,
                    category: 'inbox'
                };
            });

            // Debug log the collected tasks
            console.log('Collected tasks:', tasks);

            // Show loading state
            const suggestionsContainer = document.querySelector('.ai-suggestions');
            suggestionsContainer.innerHTML = `
                <div class="ai-loading">
                    <p>🤔 Analyzing ${tasks.length} tasks for ${userRole}...</p>
                </div>
            `;

            // Get AI suggestions with user role
            const suggestions = await AIService.analyzeTasks(tasks, action, userRole);
            console.log('Received suggestions:', suggestions);

            // Process all suggestions and move tasks
            let successCount = 0;
            suggestions.forEach(suggestion => {
                const taskElement = document.getElementById(suggestion.taskId);
                const targetContainer = document.querySelector(`[data-category="${suggestion.suggestedCategory}"] .tasks-container`);
                
                // Debug logging
                console.log('Moving task:', {
                    taskId: suggestion.taskId,
                    targetCategory: suggestion.suggestedCategory,
                    taskElement: taskElement,
                    targetContainer: targetContainer
                });

                if (taskElement && targetContainer) {
                    targetContainer.appendChild(taskElement);
                    window.taskStore?.moveTask(suggestion.taskId, suggestion.suggestedCategory);
                    successCount++;
                    console.log(`Successfully moved task ${suggestion.taskId} to category ${suggestion.suggestedCategory}`);
                } else {
                    console.error('Failed to move task:', {
                        taskFound: !!taskElement,
                        containerFound: !!targetContainer,
                        category: suggestion.suggestedCategory
                    });
                }
            });

            // Display results with exact selectors
            suggestionsContainer.innerHTML = `
                <div class="ai-suggestion">
                    <p>✨ ${successCount} tasks have been reorganized:</p>
                    <ul>
                        ${suggestions.map(s => {
                            const taskEl = document.getElementById(s.taskId);
                            const titleEl = taskEl?.querySelector('.task-content .task-text');
                            const taskTitle = titleEl ? titleEl.textContent.trim() : 'Task';
                            
                            return `
                                <li>
                                    <strong>${taskTitle}</strong>
                                    → Category ${s.suggestedCategory.toUpperCase()}: ${s.reason}
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            `;

        } catch (error) {
            console.error('AI Analysis Error:', error);
            const suggestionsContainer = document.querySelector('.ai-suggestions');
            suggestionsContainer.innerHTML = `
                <div class="ai-error">
                    <p>😅 Oops! Something went wrong while analyzing the tasks.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
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
}