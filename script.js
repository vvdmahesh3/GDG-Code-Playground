const editor = ace.edit("editor", {
    theme: "ace/theme/monokai",
    mode: "ace/mode/javascript",
    fontSize: 16,
    tabSize: 2,
    useSoftTabs: true,
    wrap: true,
    showPrintMargin: false,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    showLineNumbers: true,
    showGutter: true,
    highlightActiveLine: true
});

const output = document.getElementById("output");
const previewPanel = document.getElementById("preview");
const previewContent = previewPanel.querySelector(".preview-content");
const runButton = document.getElementById("run-button");
const saveButton = document.getElementById("save-button");
const clearButton = document.getElementById("clear-button");
const languageSelect = document.getElementById("language-select");
const aiMessage = document.getElementById("ai-message");
const aiSuggestions = document.getElementById("ai-suggestions");

const fileContents = {
    "c": `/**
 * Sample C Code
 */
#include <stdio.h>
int main() {
    printf("Hello from C!\\n");
    for(int i = 0; i < 5; i++) {
        printf("Count: %d\\n", i);
    }
    return 0;
}`,
    "python": `"""
Sample Python Code
"""
def greet():
    print("Hello from Python!")
    for i in range(5):
        print(f"Count: {i}")

greet()`,
    "java": `/**
 * Sample Java Code
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        for(int i = 0; i < 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}`,
    "javascript": editor.getValue()
};

const languageHandlers = {
    async javascript(code) {
        try {
            const consoleOutput = [];
            const customConsole = {
                log: (...args) => consoleOutput.push(args.join(" ")),
                error: (...args) => consoleOutput.push(`Error: ${args.join(" ")}`),
                warn: (...args) => consoleOutput.push(`Warn: ${args.join(" ")}`)
            };
            const func = new Function("console", code);
            func(customConsole);
            return consoleOutput.join("\n");
        } catch (e) {
            return `Error: ${e.message}`;
        }
    },
    async python(code) {
        const lines = code.split("\n");
        const outputLines = lines
            .filter(line => line.includes("print"))
            .map(line => line.match(/print\((.*)\)/)?.[1]?.replace(/["']/g, "") || "");
        return outputLines.join("\n") || "Python simulation: Code executed";
    },
    async c(code) {
        const lines = code.split("\n");
        const outputLines = lines
            .filter(line => line.includes("printf"))
            .map(line => line.match(/printf\(["'](.*)["']\)/)?.[1]?.replace(/\\n/g, "\n") || "");
        return outputLines.join("\n") || "C simulation: Code executed";
    },
    async java(code) {
        const lines = code.split("\n");
        const outputLines = lines
            .filter(line => line.includes("System.out.println"))
            .map(line => line.match(/System\.out\.println\(["']?(.*?)["']?\)/)?.[1] || "");
        return outputLines.join("\n") || "Java simulation: Code executed";
    }
};

languageSelect.addEventListener("change", (e) => {
    const mode = e.target.value;
    editor.session.setMode(`ace/mode/${mode}`);
    editor.setValue(fileContents[mode], -1);
    updateAiSuggestions(mode, editor.getValue());
    const selectedOption = e.target.options[e.target.selectedIndex];
    languageSelect.style.setProperty('--selected-icon', `"${selectedOption.dataset.icon}"`);
});

runButton.addEventListener("click", async () => {
    const code = editor.getValue();
    const language = languageSelect.value;
    fileContents[language] = code;
    output.textContent = "Running...\n";
    const result = await languageHandlers[language](code);
    output.textContent = result || "No output generated";
});

saveButton.addEventListener("click", () => {
    const mode = languageSelect.value;
    fileContents[mode] = editor.getValue();
    const blob = new Blob([fileContents[mode]], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `file.${mode === "javascript" ? "js" : mode}`;
    a.click();
    window.URL.revokeObjectURL(url);
});

clearButton.addEventListener("click", () => {
    editor.setValue("");
    output.textContent = "";
    updateAiSuggestions(languageSelect.value, "");
});

function updateAiSuggestions(language, code) {
    let tips = [];
    let note = "";
    
    if (language === "c") {
        if (code.includes("printf")) tips.push("Ensure you include a newline character (\\n) in printf.");
        if (code.includes("for")) tips.push("Consider adding error handling for loop bounds.");
        note = "Note: Always include necessary headers like <stdio.h>.";
    } else if (language === "python") {
        if (code.includes("print")) tips.push("Use f-strings for more readable string formatting.");
        if (code.includes("for")) tips.push("Consider using list comprehensions for concise code.");
        note = "Note: Python is dynamically typed, be cautious with variable types.";
    } else if (language === "java") {
        if (code.includes("System.out.println")) tips.push("Consider using String.format for complex outputs.");
        if (code.includes("for")) tips.push("Use enhanced for loops for collections when applicable.");
        note = "Note: Ensure your class name matches the file name.";
    } else if (language === "javascript") {
        if (code.includes("console.log")) tips.push("Use template literals (``) for cleaner concatenation.");
        if (code.includes("function")) tips.push("Consider using arrow functions for concise code.");
        note = "Note: Use async/await for better promise handling.";
    }

    if (tips.length === 0) tips.push("Start coding to get personalized suggestions!");
    
    aiMessage.textContent = `Analyzing your ${language} code...`;
    aiSuggestions.innerHTML = `<h3>Pro Tips:</h3>` + 
        tips.map(tip => `<div class="suggestion-item">${tip}</div>`).join("") + 
        `<div class="suggestion-item">${note}</div>`;
}

editor.on("change", () => {
    const mode = languageSelect.value;
    fileContents[mode] = editor.getValue();
    updateAiSuggestions(mode, editor.getValue());
});

// Rest of your original JavaScript code for challenges, docs, animations, etc.

languageSelect.style.setProperty('--selected-icon', '"🟨"');
editor.focus();