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
        this.displayValue = value;
      }
    } else if (["+", "–", "×", "÷"].includes(value)) {
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
      this.percent();
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
    if (this.previousInput !== "") {
      this.compute();
    } // fixme: Compute the result if there was any previous operation

    // Set the new operation
    this.operation = op;
    this.previousInput = this.currentInput;
    this.currentInput = "";
  }

  private compute(): void {
    try {
      const expression = this.currentInput.replace(/–/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
      const tokens = this.tokenize(expression);
      const rpn = this.convertToRPN(tokens);
      const result = this.evaluateRPN(rpn);



      this.currentInput = result.toString();
      this.displayValue = result.toString(); // Ensure only the result is shown
      this.isResultDisplayed = true;
    } catch (error) {
      this.displayError("Error");
    }

    this.updateDisplay();
  }

  private tokenize(expression: string): string[] {
    return expression.match(/(\d+(\.\d+)?)|[+\-*/()]/g) || [];
  }


  private convertToRPN(tokens: string[]): string[] {
    const precedence: { [key: string]: number } = { "+": 1, "-": 1, "*": 2, "/": 2 };
    const output: string[] = [];
    const operators: string[] = [];

    tokens.forEach(token => {
      if (!isNaN(Number(token))) {
        output.push(token);
      } else if ("+-*/".includes(token)) {
        while (operators.length > 0 && precedence[operators[operators.length - 1]] >= precedence[token]) {
          output.push(operators.pop()!);
        }
        operators.push(token);
      } else if (token === "(") {
        operators.push(token);
      } else if (token === ")") {
        while (operators.length > 0 && operators[operators.length - 1] !== "(") {
          output.push(operators.pop()!);
        }
        operators.pop(); // Remove "("
      }
    });

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
      } else {
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


  private appendNumber(number: string): void {
    // If the current input is "-0", replace it with "-number" when the user presses a number
    if (this.currentInput === "-0" && number !== ".") {
      this.currentInput = `-${number}`;
      return;
    }

    if (number === "." && this.currentInput.includes(".")) return;

    if (number === "." && this.currentInput === "") {
      this.currentInput = "0.";
      return;
    }
    if (this.currentInput === "0" && number !== ".") {
      this.currentInput = number;
      return;
    }
    this.currentInput += number;
  }

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




  private updateDisplay(): void {
    console.log('Display updated to:', this.displayValue);
    if (this.displayElement.value === "Error") return;
    if (this.displayValue !== "") {
      this.displayElement.value = this.displayValue;
    }
  }


  private updateACButton(): void {
    if (this.acButton) {
      if (this.currentInput === "0" && !this.previousInput && !this.operation) {
        this.acButton.innerText = "AC";
      } else {
        this.acButton.innerText = "C";
      }
    }
  }



  // private updateACButton(): void {
  //   if (this.acButton) {
  //     // AC should remain if display is "Error" or input is "0"
  //     if (this.displayElement.value === "Error" || this.currentInput === "0") {
  //       this.acButton.innerText = "AC"; // Reset to "AC" on error or initial state
  //     } // Ensure pressing "+/-" does not change AC to C
  //     else if (this.operation === null && this.currentInput !== "-0" && this.currentInput !== "0") {
  //       this.acButton.innerText = "C";
  //     }
  //   }
  // }

  // Public method to reset the AC button after page reload
  public resetACButton(): void {
    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }

  private toggleSign(): void {
    if (this.currentInput === "0" || this.displayElement.value === "0") {
      this.currentInput = "-0";
    } else if (this.currentInput) {
      this.currentInput = (parseFloat(this.currentInput) * -1).toString();
    }
  }

  private percent(): void {
    if (this.currentInput) {
      this.currentInput = (parseFloat(this.currentInput) / 100).toString();
    }
  }

  private displayError(message: string): void {
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
