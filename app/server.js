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
        const { tasks, action } = req.body;
        
        let prompt = '';
        switch(action) {
            case 'categorize':
                prompt = `Analyze these tasks and categorize them into: 
                A (Very Important & Urgent), 
                B (Important), 
                C (Nice-to-do), 
                D (Delegate), 
                E (Eliminate).
                Tasks: ${JSON.stringify(tasks)}
                Provide the response in JSON format with task IDs and suggested categories.`;
                break;
            case 'prioritize':
                prompt = `Analyze these tasks and suggest a priority order. 
                Consider urgency, importance, and dependencies.
                Tasks: ${JSON.stringify(tasks)}
                Provide the response in JSON format with ordered task IDs and reasoning.`;
                break;
            case 'optimize':
                prompt = `Suggest an optimal schedule for completing these tasks. 
                Consider time management best practices.
                Tasks: ${JSON.stringify(tasks)}
                Provide the response in JSON format with suggested timeframes and tips.`;
                break;
        }

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        res.json({ suggestions: completion.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        res.status(500).json({ error: 'Failed to analyze tasks' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
