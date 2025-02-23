import './style.css'

class Calculator {
  private displayElement: HTMLInputElement;
  private displayValue = "";
  private currentInput = "";
  private acButton: HTMLButtonElement | null = null;
  private isResultDisplayed = false;
  // 🆕 Store the last operation
  // private lastOperator: string | null = null;
  // private lastOperand: string | null = null;


  constructor(displaySelector: string) {
    this.displayElement = document.querySelector(displaySelector) as HTMLInputElement;
    this.acButton = document.querySelector(".ac") as HTMLButtonElement;
    this.initialize();
    this.handleResetACButton();
  }

  private initialize() {
    Array.from(document.querySelectorAll("button")).forEach(button => {
      button.addEventListener("click", () => this.buttonClickHandler(button));
    })
    this.displayElement.value = "0";

    this.handleUpdateACToCButton();
  }

  private buttonClickHandler(button: HTMLButtonElement) {
    const value = button.innerText;
    this.handleInput(value);
  }

  private handleInput(value: string) {
    console.log("Handling input:", value);
    console.log("Current state before handling:", {
      currentInput: this.currentInput,
      displayValue: this.displayValue,
    });

    // if (this.acButton) {
    //   if (this.currentInput === '0' && this.isOperator(value)) {
    //     this.acButton.innerText = 'AC';
    //     return;
    //   }
    // }

    // Reset after an error
    if (this.displayElement.value === "Error") {
      if (value === "AC") {
        this.handleClear();
        return;
      }
    }

    // if (this.currentInput === '-0' && this.isOperator(value)) {
    //   if (this.acButton) {
    //     this.acButton.innerText = 'AC';
    //   }
    //   return;
    // }

    // Display value in UI
    if (!isNaN(Number(value))) {
      // Handle the case where the display is "-0" and the user presses a number.
      if (this.displayValue === '-0') {
        // When "-0" is displayed and a number is pressed, make it a negative number.
        this.currentInput = `-${value}`;
        this.displayValue = `-${value}`;
        this.isResultDisplayed = false;
      } else {
        // Handle other cases for normal input.
        if (this.isResultDisplayed || this.displayValue === "0" || this.currentInput === "-0") {
          // If a result was just displayed, start a new expression.
          this.currentInput = value;
          this.displayValue = value;
          this.isResultDisplayed = false;
        } else {
          // Otherwise, add the value to the current input.
          this.currentInput += value;
          this.displayValue += value;
        }
      }
    }


    else if (value === ".") {
      // Handling the decimal point (.)
      if (this.isResultDisplayed) {
        // If a result is displayed, allow decimal input after it
        this.currentInput = this.currentInput || "0"; // Start from 0 if empty
        this.currentInput = "0."; // Add the decimal point
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
    } else if (this.isOperator(value)) {
      if (this.acButton) {
        this.acButton.innerText = "AC";
      }
      this.handleChooseOperation(value);
    } else if (value === "=") {
      this.handleCompute();
    }

    this.handleUpdateDisplay();
    this.handleUpdateACToCButton();

    console.log('Current state after handling:', {
      currentInput: this.currentInput,
      displayValue: this.displayValue,
    });
  }

  private isOperator(value: string): boolean {
    return ["+", "–", "×", "÷"].includes(value);
  }

  private handleChooseOperation(operator: string) {
    // Check if the last character is an operator
    if (this.currentInput !== "" && ["+", "–", "×", "÷"].includes(this.currentInput.slice(-1))) {
      // Replace the last operator with the new one
      this.currentInput = this.currentInput.slice(0, -1) + operator;
      this.displayValue = "";   // Reset displayValue so only numbers show
      return;
    }
    // Append operator to currentInput if it's not empty
    if (this.currentInput !== "") {
      this.currentInput += operator;  // Append operator to the expression
      this.displayValue = "";   // Reset displayValue so only numbers show
      return;
    }
    // Compute the result if currentInput is not empty
    if (this.currentInput !== "") {
      this.handleCompute();
    }

    // // Ensure currentInput is always a string
    // if (typeof this.currentInput !== "string") {
    //   this.currentInput = "";
    // }

    // // Prevent multiple consecutive operators
    // if (this.currentInput === "" || ["+", "–", "×", "÷"].includes(this.currentInput.slice(-1))) {
    //   return; // Do nothing if input is empty or last character is an operator
    // }

    // this.currentInput += operator;
    // this.displayValue = "";
  }

  private handleCompute() {
    try {
      if (this.acButton) {
        if (this.currentInput === '' && ['+', '–', '×', '÷'].includes('÷')) {
          this.handleDisplayError('Error');
          return;
        }
      }
      let expression = this.currentInput.replace(/–/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
      console.log('Expression after replacing operators:', expression);

      const tokens = this.tokenize(expression);
      console.log('Tokens:', tokens);
      if (tokens.length === 0) {
        console.log('No tokens found', { tokens });
        return;
      }
      const rpn = this.convertToRPN(tokens);
      const result = this.evaluateRPN(rpn);
      console.log('Computed result:', result);

      // ✅ Handle repeated "=" presses (e.g., -2 + = -4 = -6 = -8)

      this.currentInput = result.toString();
      this.displayValue = result.toString(); // Ensure only the result is shown
      this.isResultDisplayed = true;
    } catch (error) {
      this.handleDisplayError("Error");
    }

    this.handleUpdateDisplay();
  }

  private tokenize(expression: string): string[] {
    // Only match numbers, decimals, and operators
    return expression.match(/(\d+(\.\d+)?)|[+\-*/]/g) || [];

  }

  private convertToRPN(tokens: string[]): string[] {
    const precedence: { [key: string]: number } = { "+": 1, "-": 1, "*": 2, "/": 2 };
    const output: string[] = [];
    const operators: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (!isNaN(Number(token))) {
        output.push(token);  // Normal numbers go to output
      }
      // Handle negative numbers (e.g., -6, 3 * -4, 5 / -2)
      else if (token === "-" &&
        (i === 0 || "+-*/".includes(tokens[i - 1])) &&
        i + 1 < tokens.length && !isNaN(Number(tokens[i + 1]))) {
        output.push(token + tokens[i + 1]); // Merge "-4" or "-6"
        i++; // Skip the next token since it's part of the negative number
      }
      // Handle normal operators
      else if ("+-*/".includes(token)) {
        // Handle division by zero when pressing "="
        if (token === "/" && output.length > 0 && (output[output.length - 1] === "0" || output[output.length - 1] === "-0")) {
          this.handleDisplayError("Error"); // Show error for division by zero
          return [];
        }

        // Check if operator is at the end (e.g., 3 +)
        if (i === tokens.length - 1) {
          output.push(output[output.length - 1]);
        }

        while (operators.length > 0 && precedence[operators[operators.length - 1]] >= precedence[token]) {
          output.push(operators.pop()!);
        }
        operators.push(token);
      }
    }

    // Pop any remaining operators
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
    this.currentInput = (parseFloat(this.currentInput) / 100).toString();
    this.displayValue = this.currentInput;  // Update display with the immediate result
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
    this.isResultDisplayed = false;
    this.displayValue = "0";
    this.displayElement.value = "0"; // Ensure the display shows 0 after clearing
  }

  private handleUpdateACToCButton() {
    const operators = ['+', '–', '×', '÷'];
    if (this.acButton) {
      if (this.currentInput !== '' && this.currentInput !== '0' && this.currentInput !== '-0') {
        this.acButton.innerText = 'C';
      } else {
        this.acButton.innerText = 'AC';
      }
    }
  }

  private handleUpdateDisplay() {
    if (this.displayElement.value === "Error") return;
    if (this.displayValue !== "") {
      this.displayElement.value = this.displayValue || "0";
    }
  }

  private handleDisplayError(message: string) {
    this.displayElement.value = message;
    this.displayValue = message;
    this.currentInput = "";
    this.isResultDisplayed = true;

    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }
  // Public method to reset the AC button after page reload
  public handleResetACButton() {
    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const calculator = new Calculator(".display");
  calculator.handleResetACButton();
});


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
