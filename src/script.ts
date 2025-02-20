import './style.css'

class Calculator {
  private displayElement: HTMLInputElement;
  private displayValue: string = "";
  private currentInput: string = "";
  private previousInput: string = "";
  private operation: string | null = null;
  private acButton: HTMLButtonElement | null = null;
  private isResultDisplayed: boolean = false;

  constructor(displaySelector: string) {
    this.displayElement = document.querySelector(displaySelector) as HTMLInputElement;
    this.acButton = document.querySelector(".ac") as HTMLButtonElement;
    this.initialize();
    this.resetACButton();
  }

  private initialize(): void {
    document.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => this.buttonClickHandler(button));
    });

    window.addEventListener("keydown", (e) => this.keyboardHandler(e));

    // Ensure the display shows 0 when the calculator is initialized
    this.displayElement.value = "0";

    this.updateACButton();
  }

  private keyboardHandler(e: KeyboardEvent): void {
    const key = e.key;
    if (key === "Enter") {
      this.handleInput("=");
    } else if (key === "Backspace") {
      this.handleInput("C");
    } else {
      this.handleInput(key);
    }
  }

  private buttonClickHandler(button: HTMLButtonElement): void {
    const value = button.innerText;
    this.handleInput(value);
  }

  private handleInput(value: string): void {
    console.log('Handling input:', value);
    console.log('Current input before handling:', this.currentInput);
    console.log('Display value before handling:', this.displayValue);

    // Reset after an error
    if (this.displayElement.value === "Error") {
      if (value === "AC") {
        this.clear();
        return;
      }
    }

    if (!isNaN(Number(value)) || value === ".") {
      if (this.isResultDisplayed) {
        // If a result was just displayed, start a new expression
        this.currentInput = value;
        this.displayValue = value;
        this.isResultDisplayed = false;
      } else {
        this.currentInput += value;
        this.displayValue += value;
      }
    }
    else if (["+", "–", "×", "÷"].includes(value)) {
      this.chooseOperation(value);
      // if (this.currentInput !== "") {
      //   this.currentInput += value; // Append operator to the expression
      //   this.displayValue = ""; // Reset displayValue so only numbers show
      // }
    } else if (value === "=") {
      this.compute(); // Call the PEMDAS-aware compute function
    } else if (value === "AC") {
      this.clear();
    } else if (value === "C") {
      this.clearCurrentInput();
    } else if (value === "+/-") {
      this.toggleSign();
    } else if (value === "%") {
      this.applyPercentage();
    }

    this.updateDisplay();
    this.updateACButton();
  }

  private chooseOperation(op: string): void {
    console.log('Operator chosen:', op);
    console.log('Previous input:', this.previousInput);
    console.log('Current input before operation:', this.currentInput);
    if (this.operation === op) return;
    if (this.operation === "÷" && op === "÷") {
      this.displayError("Error");
      return;
    }

    // Append operator to currentInput if it's not empty
    if (this.currentInput !== "") {
      this.currentInput += op;  // Append operator to the expression
      this.displayValue = "";   // Reset displayValue so only numbers show
      return;
    }

    // If the user presses an operator after "=", continue with the last computed value
    if (this.isResultDisplayed) {
      this.isResultDisplayed = false; // Allow new input
      this.previousInput = this.currentInput; // Store last result
    }

    // If the user enters an operator without a number, do nothing
    if (this.currentInput === "" && this.previousInput === "") return;

    // If the user presses multiple operators in a row, replace the last one
    if (this.previousInput !== "" && this.currentInput === "") {
      this.operation = op;  // Replace the last operator
      return;
    }

    // Compute the result if there was any previous operation
    if (this.previousInput !== "" && this.currentInput !== "") {
      this.compute();
    } // fixme: Compute the result if there was any previous operation

    // Set the new operation
    this.operation = op;
    this.previousInput = this.currentInput;
    this.currentInput = "";
  }

  private compute(): void {
    try {
      let expression = this.currentInput.replace(/–/g, "-").replace(/×/g, "*").replace(/÷/g, "/");

      let result: number;

      // Handle deferred percentage calculation
      if (this.currentInput.includes("%")) {
        // Extract the percentage and apply it
        const valueWithoutPercentage = parseFloat(this.currentInput.replace("%", ""));
        if (this.operation) {
          // Apply the percentage to the result of the operation
          result = valueWithoutPercentage / 100;
        } else {
          result = valueWithoutPercentage / 100; // If no operation, just apply percentage
        }
      } else {
        const tokens = this.tokenize(expression);
        const rpn = this.convertToRPN(tokens);
        result = this.evaluateRPN(rpn);
      }

      this.currentInput = result.toString();
      this.displayValue = result.toString(); // Ensure only the result is shown
      this.isResultDisplayed = true;
    } catch (error) {
      this.displayError("Error");
    }

    this.updateDisplay();
  }

  private tokenize(expression: string): string[] {
    // Only match numbers, decimals, and operators
    return expression.match(/(\d+(\.\d+)?)|[+\-*/]/g) || [];
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
    const stack: number[] = [];

    tokens.forEach(token => {
      if (!isNaN(Number(token))) {
        stack.push(Number(token));
      } else if (token === "%") {
        stack.push(stack.pop()! / 100);
        // const a = stack.pop()!;
        // const b = stack.pop() || 1;
        // stack.push(b * (a / 100)); // Perform the percentage operation
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


  // private appendNumber(number: string): void {
  //   // If the current input is "-0", replace it with "-number" when the user presses a number
  //   if (this.currentInput === "-0" && number !== ".") {
  //     this.currentInput = `-${number}`;
  //     return;
  //   }

  //   if (number === "." && this.currentInput.includes(".")) return;

  //   if (number === "." && this.currentInput === "") {
  //     this.currentInput = "0.";
  //     return;
  //   }
  //   if (this.currentInput === "0" && number !== ".") {
  //     this.currentInput = number;
  //     return;
  //   }
  //   this.currentInput += number;
  // }

  private clear(): void {
    this.currentInput = "0";
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = false;
    this.displayValue = "0";
    this.displayElement.value = "0"; // Ensure the display shows 0 after clearing

    this.updateACButton();
  }


  private clearCurrentInput(): void {
    if (this.isResultDisplayed) {
      // Clear only the current input when result is displayed
      this.currentInput = "";
      this.isResultDisplayed = false; // Allow new input after result is cleared

      // Do NOT reset lastOperand and lastOperator when result is displayed
    } else {
      // Normal clearing behavior (reset currentInput only)
      this.currentInput = "";
    }
    this.displayValue = '0';
    this.updateDisplay();
    this.updateACButton();
  }


  private updateACButton(): void {
    if (this.acButton) {
      if (this.currentInput !== "" && this.currentInput !== "0") {
        this.acButton.innerText = "C"; // Keep "C" if there's an input to clear
      }
      else if (["+", "–", "×", "÷", "+/-", "%"].includes(this.currentInput)) {
        this.acButton.innerText = "C";
      }
      else {
        this.acButton.innerText = "AC"; // Reset to "AC" only when fully cleared
      }
    }
  }


  private updateDisplay(): void {
    console.log('Display updated to:', this.displayValue);
    if (this.displayElement.value === "Error") return;
    if (this.displayValue !== "") {
      this.displayElement.value = this.displayValue;
    }
  }


  // Public method to reset the AC button after page reload
  public resetACButton(): void {
    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }

  private toggleSign(): void {
    console.log("Before toggle sign:", this.currentInput);  // Log before toggling
    if (this.currentInput === "0" || this.displayElement.value === "0") {
      this.currentInput = "-0";
    } else if (this.currentInput) {
      this.currentInput = (parseFloat(this.currentInput) * -1).toString();
    }
    console.log("After toggle sign:", this.currentInput);  // Log after toggling
  }


  private applyPercentage(): void {
    if (!this.currentInput || isNaN(parseFloat(this.currentInput))) return;

    // Case 1: If no operation is currently active, apply percentage immediately
    if (this.operation === null && this.previousInput === "") {
      this.currentInput = (parseFloat(this.currentInput) / 100).toString();
      this.displayValue = this.currentInput;  // Update display with the immediate result
    }
    // Case 2: If there's an ongoing operation, defer the percentage application
    else if (this.operation !== null) {
      this.currentInput += "%";  // Mark it for deferred calculation
    }

    this.updateDisplay();  // Update the display with the current input
  }





  private displayError(message: string): void {
    console.log("Displaying error:", message);
    this.displayElement.value = message;
    this.currentInput = "";
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = true;
    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }

}


document.addEventListener("DOMContentLoaded", () => {
  const calculator = new Calculator(".display");
  calculator.resetACButton();
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
