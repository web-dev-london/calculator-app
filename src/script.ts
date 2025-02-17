import './style.css'

class Calculator {
  private displayElement: HTMLInputElement;
  private displayValue: string = "";
  private currentInput: string = "";
  private previousInput: string = "";
  private lastOperand: string | null = null; // NEW: Stores last operand for repeated "="
  private lastOperator: string | null = null; // NEW: Stores last operator for repeated "="
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
    console.log("Clicked button:", value);

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


  // private handleInput(value: string): void {
  //   console.log("Clicked button:", value);
  //   // Ensure AC properly resets after an error
  //   if (this.displayElement.value === "Error" || this.displayElement.value === "0") {
  //     if (value === "AC") {
  //       this.clear();
  //       return;
  //     }
  //   }



  //   if (!isNaN(Number(value))) {
  //     if (this.isResultDisplayed) {
  //       if (this.lastOperator !== null) {
  //         // If "=" was pressed before, treat this number as a new operand in the last operation
  //         this.currentInput = value;
  //         this.previousInput = this.lastOperand ?? ""; // Restore the last initial operand
  //         this.operation = this.lastOperator;    // Restore the last operator
  //       } else {
  //         // If no operator exists, start fresh
  //         this.previousInput = "";
  //         this.currentInput = value;
  //       }
  //       this.isResultDisplayed = false;
  //     } else {
  //       this.appendNumber(value);
  //     }
  //   }



  //   if (value === ".") {
  //     if (this.isResultDisplayed) {
  //       this.currentInput = "";
  //       this.isResultDisplayed = false;
  //     }
  //     this.appendNumber(value);
  //   } else if (["+", "–", "×", "÷"].includes(value)) {
  //     this.chooseOperation(value);
  //   } else if (value === "=") {
  //     this.compute();
  //   } else if (value === "AC") {
  //     this.clear();
  //   } else if (value === "C") {
  //     this.clearCurrentInput();
  //   } else if (value === "+/-") {
  //     this.toggleSign();
  //   } else if (value === "%") {
  //     this.percent();
  //   }


  //   this.updateDisplay();
  //   this.updateACButton();
  // }



  // private chooseOperation(op: string): void {
  //   if (this.operation === "÷" && op === "÷") {
  //     this.displayError("Error");
  //     return;
  //   }

  //   if (this.currentInput === "") return;

  //   // Compute the result first before changing the operator
  //   if (this.previousInput !== "") {
  //     this.compute();
  //   }

  //   // Reset the last operand and last operator when the operator changes
  //   this.operation = op;
  //   this.previousInput = this.currentInput;
  //   this.currentInput = "";

  //   // Clear the previous operand and operator to avoid incorrect carryovers
  //   this.lastOperator = op;
  //   this.lastOperand = null; // Clear previous operand after changing operator
  // }


  private chooseOperation(op: string): void {
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

    // Reset lastOperand when changing the operation
    this.lastOperator = op; // Set the new operator
  }


  // private compute(): void {
  //   // if (this.operation === null) return;
  //   let prev = parseFloat(this.previousInput || "0");
  //   let current = parseFloat(this.currentInput || "0");

  //   // If "=" is pressed again, use the last operator and operand
  //   if (this.isResultDisplayed && this.lastOperand !== null && this.lastOperator !== null) {
  //     // Use last result (prev) and operand (current) from the last operation
  //     current = parseFloat(this.lastOperand); // Reuse last operand if "=" is pressed again
  //     prev = parseFloat(this.previousInput);  // Use last result if "=" is pressed again
  //     this.operation = this.lastOperator;     // Restore last operator
  //   } else if (this.operation === null) {
  //     return; // Ensure "=" doesn't trigger an error without an operation
  //   }

  //   // Handle case where operation is set but no second number was entered
  //   if (this.currentInput === "" && this.operation !== null) {
  //     current = prev; // Repeat the previous number if there's no new input
  //   }

  //   if (isNaN(prev) || isNaN(current)) {
  //     this.displayError("Error");
  //     return;
  //   }

  //   if (this.operation === "÷" && current === 0) {
  //     this.displayError("Error");
  //     return;
  //   }

  //   let result: number;
  //   switch (this.operation) {
  //     case "+":
  //       result = prev + current;
  //       break;
  //     case "–":
  //       result = prev - current;
  //       break;
  //     case "×":
  //       result = prev * current;
  //       break;
  //     case "÷":
  //       result = prev / current;
  //       break;
  //     default:
  //       return;
  //   }

  //   this.currentInput = result.toString();
  //   this.previousInput = result.toString();
  //   this.isResultDisplayed = true;

  //   // Store values for repeated "=" presses
  //   this.lastOperand = current.toString(); // Keep the current operand for repeated "="
  //   this.lastOperator = this.operation; // Keep the operation for repeated "="

  //   this.operation = null; // Reset operation after computation
  //   this.updateACButton();
  // }


  // private compute(): void {
  //   let prev = parseFloat(this.previousInput || "0");
  //   let current = parseFloat(this.currentInput || "0");

  //   // Handle repeated "=" behavior
  //   if (this.isResultDisplayed && this.lastOperand !== null && this.lastOperator !== null) {
  //     // Reuse the previous result and operator for repeated "="
  //     current = parseFloat(this.lastOperand);  // Reuse the last operand
  //     prev = parseFloat(this.previousInput);   // Reuse the last result
  //     this.operation = this.lastOperator;      // Restore the last operator
  //   } else if (this.operation === null) {
  //     return;  // If no operation is set, do nothing
  //   }

  //   // // If "C" was pressed, restore the previous operand and operator
  //   // else if (this.previousInput === "" && this.lastOperator !== null && this.lastOperand !== null) {
  //   //   prev = parseFloat(this.lastOperand);  // Use the last operand
  //   //   this.operation = this.lastOperator;   // Use the last operator
  //   // }

  //   // Handle case where the user hasn't entered the second number
  //   if (this.currentInput === "" && this.operation !== null) {
  //     current = prev; // Use the previous operand if no new input
  //   }

  //   if (isNaN(prev) || isNaN(current)) {
  //     this.displayError("Error");
  //     return;
  //   }

  //   if (this.operation === "÷" && current === 0) {
  //     this.displayError("Error");
  //     return;
  //   }

  //   let result: number;
  //   switch (this.operation) {
  //     case "+":
  //       result = prev + current;
  //       break;
  //     case "–":
  //       result = prev - current;
  //       break;
  //     case "×":
  //       result = prev * current;
  //       break;
  //     case "÷":
  //       result = prev / current;
  //       break;
  //     default:
  //       return;
  //   }

  //   this.currentInput = result.toString();
  //   this.previousInput = result.toString();
  //   this.isResultDisplayed = true;

  //   // Ensure new numbers after "=" continue correctly
  //   this.lastOperand = current.toString();
  //   this.lastOperator = this.operation;

  //   this.operation = null;
  //   this.updateACButton();
  // }

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


  // private compute(): void {
  //   let prev = parseFloat(this.previousInput || "0");
  //   let current = parseFloat(this.currentInput || "0");

  //   // ✅ Store the **first operand** if not already stored
  //   if (this.lastOperand === null && this.previousInput !== "") {
  //     this.lastOperand = this.previousInput;
  //   }

  //   // ✅ If "=" is pressed repeatedly, continue using the first operand
  //   if (this.isResultDisplayed && this.lastOperator !== null) {
  //     prev = parseFloat(this.previousInput);  // Keep previous result
  //     current = parseFloat(this.lastOperand ?? ""); // Always use **first** operand
  //     this.operation = this.lastOperator;
  //   }
  //   // ✅ Otherwise, update last operator
  //   else if (this.operation !== null) {
  //     this.lastOperator = this.operation;
  //   } else {
  //     return; // If no operation, do nothing
  //   }

  //   // Handle case where no second number was entered
  //   if (this.currentInput === "" && this.operation !== null) {
  //     current = prev;
  //   }

  //   if (isNaN(prev) || isNaN(current)) {
  //     this.displayError("Error");
  //     return;
  //   }

  //   if (this.operation === "÷" && current === 0) {
  //     this.displayError("Error");
  //     return;
  //   }

  //   let result: number;
  //   switch (this.operation) {
  //     case "+":
  //       result = prev + current;
  //       break;
  //     case "–":
  //       result = prev - current;
  //       break;
  //     case "×":
  //       result = prev * current;
  //       break;
  //     case "÷":
  //       result = prev / current;
  //       break;
  //     default:
  //       return;
  //   }

  //   this.currentInput = result.toString();
  //   this.previousInput = result.toString();
  //   this.isResultDisplayed = true;

  //   // ✅ **Fix: Ensure lastOperand does NOT change after entering a new number**
  //   this.lastOperand = this.lastOperand ?? current.toString();
  //   this.lastOperator = this.operation;

  //   this.operation = null;
  //   this.updateACButton();
  // }



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
    this.lastOperand = null;
    this.lastOperator = null;
    this.displayElement.value = "0"; // Ensure the display shows 0 after clearing

    this.updateACButton();
  }


  private clearCurrentInput(): void {
    if (this.isResultDisplayed) {
      // Clear only the current input when result is displayed
      this.currentInput = "0";
      this.isResultDisplayed = false; // Allow new input after result

      // Do NOT reset lastOperand and lastOperator when result is displayed
    } else {
      // Normal clearing behavior (reset currentInput only)
      this.currentInput = "0";
      this.lastOperand = null;  // Reset last operand
      this.lastOperator = null; // Reset last operator
    }

    this.updateDisplay();
    this.updateACButton();
  }

  private updateDisplay(): void {
    if (this.displayElement.value === "Error") return;
    if (this.displayValue !== "") {
      this.displayElement.value = this.displayValue;
    }
  }



  private updateACButton(): void {
    if (this.acButton) {
      // AC should remain if display is "Error" or input is "0"
      if (this.displayElement.value === "Error" || this.currentInput === "0") {
        this.acButton.innerText = "AC"; // Reset to "AC" on error or initial state
      } // Ensure pressing "+/-" does not change AC to C
      else if (this.operation === null && this.currentInput !== "-0" && this.currentInput !== "0") {
        this.acButton.innerText = "C";
      }
    }
  }

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
    this.lastOperand = null;
    this.lastOperator = null;

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
