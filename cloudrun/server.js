/**
 * Cloud Run HTTP Server for JobzAI Pipeline
 */

const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

app.post('/', async (req, res) => {
    console.log('🚀 Pipeline triggered!');
    
    // Send immediate response
    res.status(200).json({ 
        status: 'started',
        message: 'Job fetching pipeline has been triggered. This will take 30-40 minutes.'
    });
    
    // Execute pipeline in background
    exec('cd /app && node scripts/processTasksManually.cjs && node scripts/reEnrichAllJobs.cjs', (error, stdout, stderr) => {
        if (error) {
            console.error('Pipeline error:', error);
            console.error(stderr);
            return;
        }
        console.log('✅ Pipeline complete!');
        console.log(stdout);
    });
});

app.get('/', (req, res) => {
    res.send('JobzAI Auto Pipeline - Ready');
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log('JobzAI Pipeline Ready!');
});

