export class AIService {
    static async analyzeTasks(tasks, action) {
        try {
            console.log('Sending tasks for analysis:', { tasks, action });

            const response = await fetch('/api/analyze-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    tasks, 
                    action,
                    prompt: this.getPromptForAction(action)
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received AI response:', data);
            
            return this.parseAIResponse(data);
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    static parseAIResponse(response) {
        try {
            console.log('Parsing AI response:', response);

            if (!response.suggestions || !Array.isArray(response.suggestions)) {
                throw new Error('Invalid response format: suggestions must be an array');
            }

            // Validate and normalize each suggestion
            const validSuggestions = response.suggestions.map(suggestion => {
                if (!suggestion.taskId) {
                    throw new Error('Missing taskId in suggestion');
                }

                // Normalize category to lowercase and validate
                const category = suggestion.suggestedCategory.toLowerCase();
                if (!['a', 'b', 'c', 'd', 'e'].includes(category)) {
                    throw new Error(`Invalid category: ${category}`);
                }

                return {
                    taskId: suggestion.taskId,
                    suggestedCategory: category,
                    reason: suggestion.reason || 'No reason provided'
                };
            });

            return validSuggestions;
        } catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Failed to parse AI suggestions');
        }
    }

    static getPromptForAction(action) {
        const prompts = {
            prioritize: `
                You are a task management assistant. Analyze the following tasks and categorize each one into one of these categories:
                
                A - Very Important & Urgent:
                - High impact tasks that need immediate attention
                - Critical deadlines
                - Important consequences if not done
                
                B - Important but Less Urgent:
                - Important tasks that can wait a bit
                - Medium-term deadlines
                - Significant but not critical impact
                
                C - Nice-to-do Tasks:
                - Tasks that would be good to do
                - No immediate deadline
                - Low impact if delayed
                
                D - Delegate Tasks:
                - Tasks that can be done by others
                - Tasks that require different expertise
                - Tasks better suited for delegation
                
                E - Eliminate Tasks:
                - Tasks with minimal value
                - Unnecessary or redundant tasks
                - Tasks that don't align with goals

                For each task, you must:
                1. Assign exactly one category (A, B, C, D, or E)
                2. Provide a brief, clear reason for the categorization
                3. Include the task's ID in your response

                Return your analysis in this exact JSON format:
                {
                    "suggestions": [
                        {
                            "taskId": "task-id",
                            "suggestedCategory": "a",
                            "reason": "Brief explanation of why this category was chosen"
                        }
                    ]
                }

                Important rules:
                - Every task must be categorized
                - Categories must be lowercase letters (a, b, c, d, or e)
                - Each task should appear exactly once in the suggestions
                - Provide specific reasons for each categorization
                - Maintain the exact JSON format
            `,
            categorize: `
                Analyze these tasks and suggest appropriate categories. Return the results in this exact JSON format:
                {
                    "suggestions": [
                        {
                            "taskId": "task-id",
                            "suggestedCategory": "a",
                            "reason": "Brief explanation"
                        }
                    ]
                }
            `,
            optimize: `
                Analyze these tasks and suggest an optimized schedule. Return the results in this exact JSON format:
                {
                    "suggestions": [
                        {
                            "taskId": "task-id",
                            "suggestedCategory": "a",
                            "reason": "Brief explanation"
                        }
                    ]
                }
            `
        };
        return prompts[action] || prompts.prioritize;
    }
}