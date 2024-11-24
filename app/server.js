const express = require('express');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/analyze-tasks', async (req, res) => {
    try {
        const { tasks, action, prompt } = req.body;
        
        console.log('Analyzing tasks:', tasks.length, 'tasks');

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a task management assistant specialized in the ABCDE prioritization method. 
                             Your responses must always be in valid JSON format with a 'suggestions' array containing 
                             a suggestion for every task provided.`
                },
                {
                    role: "user",
                    content: prompt + "\nTasks: " + JSON.stringify(tasks)
                }
            ],
            model: "gpt-3.5-turbo",
            temperature: 0.3, // Reduced for more consistent categorization
            response_format: { type: "json_object" }
        });

        const response = completion.choices[0].message.content;
        console.log('AI Response received');

        // Parse and validate the response
        const parsedResponse = JSON.parse(response);
        
        // Verify all tasks are categorized
        const taskIds = new Set(tasks.map(t => t.id));
        const suggestedIds = new Set(parsedResponse.suggestions.map(s => s.taskId));
        
        if (taskIds.size !== suggestedIds.size) {
            console.error('Missing categorizations:', {
                expected: Array.from(taskIds),
                received: Array.from(suggestedIds)
            });
            throw new Error('Not all tasks were categorized');
        }

        res.json(parsedResponse);
    } catch (error) {
        console.error('OpenAI API Error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze tasks',
            details: error.message,
            suggestions: []
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
