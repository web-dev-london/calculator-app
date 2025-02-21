import './style.css'

class Calculator {
  private displayElement: HTMLInputElement;
  private displayValue = "";
  private currentInput = "";
  private previousInput = "";
  private operation: string | null = null;// fixme: Remove if not needed
  private acButton: HTMLButtonElement | null = null;
  private isResultDisplayed = false;

  constructor(displaySelector: string) {
    this.displayElement = document.querySelector(displaySelector) as HTMLInputElement;
    this.acButton = document.querySelector(".ac") as HTMLButtonElement;
    this.initialize();
  }

  private initialize() {
    Array.from(document.querySelectorAll("button")).forEach(button => {
      button.addEventListener("click", () => this.buttonClickHandler(button));
    })
  }

  private buttonClickHandler(button: HTMLButtonElement) {
    const value = button.innerText;
    this.handleInput(value);
  }

  private handleInput(value: string) {
    console.log("Handling input:", value);
    console.log("Current state before handling:", {
      currentInput: this.currentInput,
      previousInput: this.previousInput,
      displayValue: this.displayValue,
      operation: this.operation,
    });

    // Reset after an error
    if (this.displayElement.value === "Error") {
      if (value === "AC") {
        this.handleClear();
        return;
      }
    }

    // Display value in UI
    if (!isNaN(Number(value))) {
      if (this.isResultDisplayed || this.displayValue === "0") {
        // If a result was just displayed, start a new expression
        this.currentInput = value;
        this.displayValue = value;
        this.isResultDisplayed = false;
      } else {
        this.currentInput += value;
        this.displayValue += value;
      }
    }

    else if (value === ".") {
      // Handling the decimal point (.)
      if (this.isResultDisplayed) {
        // If a result is displayed, allow decimal input after it
        this.currentInput = this.currentInput || "0"; // Start from 0 if empty
        this.currentInput += "."; // Add the decimal point
        this.displayValue = this.currentInput; // Display the updated value
        this.isResultDisplayed = false; // Allow further input
      } else if (this.currentInput === '') {
        // If currentInput is empty, start with '0.'
        this.currentInput = '0.';
        this.displayValue = '0.';
      } else if (!this.currentInput.includes('.')) {
        // If there's no decimal point yet, append it
        this.currentInput += value;
        this.displayValue += value;
      }
    }

    else if (value === 'C') {
      this.handleClearCurrentInput();
    } else if (value === "AC") {
      this.handleClear();
    } else if (value === "+/-") {
      this.handleToggleSign();
    } else if (value === '%') {
      this.handlePercentage();
    } else if (["+", "–", "×", "÷"].includes(value)) {
      this.handleChooseOperation(value);
    } else if (value === "=") {
      this.handleCompute();
    }

    this.handleUpdateDisplay();
    this.handleUpdateACToCButton();
  }

  private handleChooseOperation(operator: string) {
    console.log('Handling choose operation:', operator);

    // // If the user enters an operator without a number, do nothing
    // if (this.currentInput === "" && this.previousInput === "") return;


    // Append operator to currentInput if it's not empty
    if (this.currentInput !== "") {
      this.currentInput += operator;  // Append operator to the expression
      this.displayValue = "";   // Reset displayValue so only numbers show
      return;
    }

    // If the user presses an operator after "=", continue with the last computed value
    if (this.isResultDisplayed) {
      this.isResultDisplayed = false; // Allow new input
      this.previousInput = this.currentInput; // Store last result
    }


    // Compute the result if there was any previous operation
    if (this.previousInput !== "" && this.currentInput !== "") {
      this.handleCompute();
    }
    // Set the new operation
    this.operation = operator;
    this.previousInput = this.currentInput;
    this.currentInput = "";
  }

  private handleCompute() {
    try {
      console.log('Computing result...');
      let expression = this.currentInput.replace(/–/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
      console.log('Expression after replacing operators:', expression);

      const tokens = this.tokenize(expression);
      console.log('Tokens:', tokens);
      if (tokens.length === 0) {
        console.log('No tokens found', { tokens });
        return;
      }
      const rpn = this.convertToRPN(tokens);
      console.log('Reversed Polish Notation (RPN):', rpn);
      const result = this.evaluateRPN(rpn);
      console.log('Computed result:', result);


      this.currentInput = result.toString();
      this.displayValue = result.toString(); // Ensure only the result is shown
      this.isResultDisplayed = true;
      console.log('Result:', result);
      console.log('Current input after computing:', this.currentInput);
      console.log('Display value after computing:', this.displayValue);
    } catch (error) {
      this.handleDisplayError("Error");
    }

    this.handleUpdateDisplay();
  }

  private tokenize(expression: string): string[] {
    // Only match numbers, decimals, and operators
    const tokens = expression.match(/(\d+(\.\d+)?)|[+\-*/]/g) || [];

    const result: string[] = [];


    tokens.forEach(token => {
      if ("+-*/".includes(token)) {
        // Check if the operator is division and the next token is zero
        if (token === '/' && result[result.length - 1] === '0') {
          this.handleDisplayError("Error");
          return;
        }
        // Prevent adding operators if the previous token is zero and the current operator is +, -, or *
        if (result[result.length - 1] === '0' && (token === '*' || token === '+' || token === '-')) {
          return;
        }
        // If the result is not empty and the last token is an operator
        if (result.length > 0 && "+-*/".includes(result[result.length - 1])) {
          // If two operators are encountered, replace the last one with the current one
          result[result.length - 1] = token;
        } else {
          // Otherwise, just add the operator to the result
          result.push(token);
        }
      } else {
        // If it's a number, add it to the result
        result.push(token);
      }
    });

    return result;
  }

  private convertToRPN(tokens: string[]): string[] {
    const precedence: { [key: string]: number } = { "+": 1, "-": 1, "*": 2, "/": 2 };
    const output: string[] = [];
    const operators: string[] = [];

    tokens.forEach(token => {
      if (!isNaN(Number(token))) {
        output.push(token);  // Add numbers directly to the output
      } else if ("+-*/".includes(token)) {
        // Handle operators based on precedence
        while (operators.length > 0 && precedence[operators[operators.length - 1]] >= precedence[token]) {
          output.push(operators.pop()!);
        }
        operators.push(token);  // Push the current operator onto the stack
      }
    });

    // Pop any remaining operators from the stack
    while (operators.length > 0) {
      output.push(operators.pop()!);
    }

    return output;
  }

  private evaluateRPN(tokens: string[]): number {
    console.log('Evaluating RPN...', tokens);
    const stack: number[] = [];

    tokens.forEach(token => {
      if (!isNaN(Number(token))) {
        stack.push(Number(token));
      }
      else {
        const b = stack.pop()!;
        const a = stack.pop()!;
        switch (token) {
          case "+": stack.push(a + b); break;
          case "-": stack.push(a - b); break;
          case "*": stack.push(a * b); break;
          case "/": stack.push(a / b); break;
        }
      }
    });

    return stack[0];
  }

  private handlePercentage() {
    if (!this.currentInput || isNaN(parseFloat(this.currentInput))) return;
    // Case 1: If no operation is currently active, apply percentage immediately
    if (this.operation === null && this.previousInput === "") {
      this.currentInput = (parseFloat(this.currentInput) / 100).toString();
      this.displayValue = this.currentInput;  // Update display with the immediate result
    }
    // If there is ongoing operations, defer the percentage application
    else if (this.operation !== null) {
      this.currentInput += "%";  // Mark it for deferred calculation
    }
  }

  private handleToggleSign() {
    // If current input is 0. add a negative sign
    if (this.currentInput === '0') {
      this.currentInput = '-0';
      this.displayValue = '-0';
      return;
    }

    if (this.currentInput === '') {
      this.currentInput = '-0';
      this.displayValue = '-0';
    } else if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
      this.displayValue = this.displayValue.slice(1);
    } else {
      this.currentInput = '-' + this.currentInput;
      this.displayValue = '-' + this.displayValue;
    }
  }

  private handleClearCurrentInput() {
    // Clear only the current input when result is displayed
    if (this.isResultDisplayed) {
      this.currentInput = '';
      this.isResultDisplayed = false; // Allow new input after result is cleared
    } else {
      // Normal clearing behavior (reset currentInput only)
      this.currentInput = '';
    }
    this.displayValue = '0';
    this.handleUpdateDisplay();
    this.handleUpdateACToCButton();
  }

  private handleClear() {
    this.currentInput = "0";
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = false;
    this.displayValue = "0";
    this.displayElement.value = "0"; // Ensure the display shows 0 after clearing
  }

  private handleUpdateACToCButton() {
    if (this.acButton) {
      if (this.currentInput !== '' && this.currentInput !== '0' && this.currentInput !== '-0') {
        this.acButton.innerText = 'C';
      } else {
        this.acButton.innerText = 'AC';
      }
    }
  }

  private handleUpdateDisplay() {
    console.log('Display updated to:', this.displayValue);
    if (this.displayElement.value === "Error") return;
    if (this.displayValue !== "") {
      this.displayElement.value = this.displayValue || this.previousInput;
    }
  }

  private handleDisplayError(message: string): void {
    this.displayElement.value = message;
    this.displayValue = message;
    this.currentInput = "";
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = true;

    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }
}


document.addEventListener("DOMContentLoaded", () => new Calculator(".display"));


class Clock {
  private hourElement: HTMLElement | null;
  private minuteElement: HTMLElement | null;

  constructor(hourSelector: string, minuteSelector: string) {
    this.hourElement = document.querySelector(hourSelector);
    this.minuteElement = document.querySelector(minuteSelector);

    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  private updateTime(): void {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    let displayHour = currentHour % 12 || 12;

    if (this.hourElement) {
      this.hourElement.textContent = displayHour.toString().padStart(2, "0");
    }
    if (this.minuteElement) {
      this.minuteElement.textContent = currentMinute.toString().padStart(2, "0");
    }
  }
}

// Initialize the Clock instance
new Clock('.hour', '.minute');
