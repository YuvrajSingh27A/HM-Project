const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { spawnSync } = require('child_process');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware to parse JSON bodies and handle CORS
app.use(bodyParser.json());
app.use(cors());

// Endpoint to receive code and language from the frontend
app.post('/evaluate', (req, res) => {
    const { code, language } = req.body;

    // Determine the file name and compile command based on the language
    let fileName;
    let compileCommand;
    if (language === 'cpp') {
        fileName = 'user_code.cpp';
        compileCommand = ['g++', fileName, '-o', 'user_code'];
    } else if (language === 'c') {
        fileName = 'user_code.c';
        compileCommand = ['gcc', fileName, '-o', 'user_code'];
    } else {
        return res.status(400).json({ error: 'Unsupported Language', message: 'The API only supports C++ and C languages' });
    }

    // Write the user's cod to the specified file
    fs.writeFileSync(fileName, code);

    // Compile the user's code
    const compileResult = spawnSync(compileCommand[0], compileCommand.slice(1));
    if (compileResult.status !== 0) {
        const errorMessage = compileResult.stderr.toString();
        return res.status(400).json({ error: 'Compilation Error', message: errorMessage });
    }

    // Read test cases from file
    const testCases = JSON.parse(fs.readFileSync('testcase.json', 'utf8'));

    // Array to store results of each test case
    const results = [];

    // Run the compiled code against each test case
    for (const testCase of testCases) {
        const inputValues = Object.values(testCase.input);
        const input = inputValues.join(' ');
        const expectedOutput = testCase.output.toString();

        let output;
        let success;
        if (language === 'cpp' || language === 'c') {
            const processResult = spawnSync('./user_code', { input, encoding: 'utf-8' });
            output = processResult.stdout.trim();
            success = output === expectedOutput;
        }

        // Store the result of the current test case
        results.push({
            input: inputValues,
            expectedOutput,
            actualOutput: output,
            success,
        });
    }

    // Write results to a JSON file (optional)
    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));

    // Send the results back to the client
    res.json(results);
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
