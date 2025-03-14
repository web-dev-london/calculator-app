import './style.css'


interface TokenArray extends Array<string> {
  wasDoubleNegative?: boolean;
}

class Calculator {
  private displayElement: HTMLInputElement;
  private displayValue = "";
  private currentInput = "";
  private acButton: HTMLButtonElement | null = null;
  private isResultDisplayed = false;


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

    // Reset after an error
    if (this.displayElement.value === "Error") {
      if (value === "AC") {
        this.handleClear();
        return;
      }
    }

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
      } else if (this.currentInput === '' || this.currentInput === '0') {
        // If currentInput is empty, start with '0.'
        this.currentInput = '0.';
        this.displayValue = '0.';
      } else if (this.currentInput === '-0') {
        this.currentInput = '-0.';
        this.displayValue = '-0.';
        this.handleUpdateACToCButton();
      }
      else if (!this.currentInput.includes('.')) {
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
      this.handleToggleSign(this.currentInput);
      return;
    } else if (value === '%') {
      this.handlePercentage(this.currentInput);
      this.currentInput += value;
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
    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
    // Check if the last character is an operator
    if (this.currentInput !== "" && this.isOperator(this.currentInput.slice(-1))) {
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
  }

  private handleCompute() {
    try {
      // Check if the current input is empty and division operator is pressed
      let expression = this.normalizeExpression(this.currentInput)
      console.log('Expression after replacing operators:', expression);

      // Handle cases like "0*0=", "0*=", "0+0=", "0+=", "0+-0", "0--0", etc
      if (/^0[+\-*]0?$/.test(expression) || /^0[+\-*]{2,}0?$/.test(expression)) {
        this.handleClear();
        return;
      }

      const tokens = this.tokenize(expression);
      console.log('Tokens:', tokens);
      if (tokens.length === 0) {
        return;
      }
      const rpn = this.convertToRPN(tokens);
      const result = this.evaluateRPN(rpn);
      console.log('Computed result:', result);

      // ✅ Handle repeated "=" presses (e.g., -2 + = -4 = -6 = -8)

      this.currentInput = result.toString();
      this.displayValue = result.toString(); // Ensure only the result is shown
      this.isResultDisplayed = true;

      this.handleUpdateACToCButton();
    } catch (error) {
      this.handleDisplayError("Error");
    }

    this.handleUpdateDisplay();
  }


  // private tokenize(input: string): string[] {
  //   input = this.normalizeExpression(input);
  //   const tokens: string[] = [];
  //   let currentToken = '';

  //   // Loop through the input character by character
  //   for (let i = 0; i < input.length; i++) {
  //     const char = input[i];

  //     // Check if the character is a digit or decimal
  //     if (/\d/.test(char) || char === '.') {
  //       currentToken += char;
  //     }
  //     // Check for operators (+, -, *, /)
  //     else if (char === '-' || char === '+' || char === '*' || char === '/') {
  //       // If the current token exists (it's a number), push it
  //       if (currentToken) {
  //         tokens.push(currentToken);
  //         currentToken = '';
  //       }

  //       // If the character is a negative sign at the beginning or after an operator,
  //       // treat it as part of a negative number (like '-2' rather than '- 2')
  //       if (char === '-' && (i === 0 || ['+', '-', '*', '/'].includes(input[i - 1]))) {
  //         currentToken += char; // It's part of a negative number
  //       } else {
  //         tokens.push(char); // It's a subtraction or other operator
  //       }
  //     }

  //     // Ignore spaces (if any)
  //     else if (char !== ' ') {
  //       throw new Error(`Unexpected character: ${char}`);
  //     }
  //   }

  //   // Push the last token if there is one
  //   if (currentToken) {
  //     tokens.push(currentToken);
  //   }

  //   return tokens;
  // }



  private tokenize(input: string): TokenArray {
    input = this.normalizeExpression(input);  // Normalize input to handle cases like '--' as '+'
    const tokens: TokenArray = [];
    let currentToken = '';
    let wasDoubleNegative = false;  // Flag to track `--`

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      // Handle numbers and decimals
      if (/\d/.test(char) || char === '.') {
        currentToken += char;
      }
      else if (char === '-' || char === '+' || char === '*' || char === '/') {
        if (currentToken) {
          tokens.push(currentToken);  // Push the completed number
          currentToken = '';
        }

        // If there's a consecutive `--`, treat it as a plus
        if (char === '-' && i + 1 < input.length && input[i + 1] === '-') {
          tokens.push("+");  // Convert `--` into `+`
          wasDoubleNegative = true;
          i++;  // Skip next `-`
        }
        else if (char === '-' && (tokens.length === 0 || ['+', '-', '*', '/'].includes(tokens[tokens.length - 1]))) {
          // Treat a '-' at the start or after an operator as part of a negative number
          currentToken += char;
        }
        else {
          tokens.push(char);  // Otherwise, it's a regular operator
        }
      }
      else if (char !== ' ') {
        throw new Error(`Unexpected character: ${char}`);
      }
    }

    if (currentToken) {
      tokens.push(currentToken);  // Push any leftover number
    }
    tokens.wasDoubleNegative = wasDoubleNegative;
    return tokens;
  }





  private normalizeExpression(expression: string): string {
    return expression
      .replace(/–/g, "-")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/%/g, '')
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
        // Only throw an error when division BY 0
        if (token === "/" && tokens[i + 1] === "0") {
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
          case "/":
            if (b === 0) {
              this.handleDisplayError("Error"); // Division by zero should always be an error
              return;
            }
            const result = a / b;
            stack.push(result); // Convert -0 to 0
            break;
        }
      }
    });

    return stack[0];
  }

  // private handlePercentage(value: string) {

  //   // If currentInput starts with '0' do nothing
  //   if (this.acButton) {
  //     if (this.currentInput.match(/^0%+$/) || this.currentInput === '0')
  //       return;
  //   }
  //   if (!value || isNaN(parseFloat(value))) return;

  //   const tokens = this.tokenize(this.currentInput);
  //   console.log('Tokens before percentage:', tokens);

  //   if (tokens.length < 2 || (tokens.length === 2 && tokens[0] === '-')) {
  //     // Handle negative standalone numbers 
  //     const fullNumber = parseFloat(this.currentInput)
  //     if (!isNaN(fullNumber)) {
  //       // If there's only one number, simply divide it by 100
  //       const percentageValue = fullNumber / 100;
  //       this.currentInput = percentageValue.toString();
  //       this.displayValue = this.currentInput;
  //     }
  //   } else {
  //     // If there's an operation before the percentage, take the last number and apply percentage
  //     const lastNumber = parseFloat(tokens.pop()!);
  //     const operator = tokens[tokens.length - 1];

  //     console.log('Last number:', lastNumber);
  //     console.log('Operator:', operator);

  //     let percentageValue: undefined | number;

  //     if (!isNaN(lastNumber)) {
  //       if (["+", "-"].includes(operator)) {
  //         // Get the previous number in the expression
  //         const prevNumber = parseFloat(tokens[tokens.length - 2]);
  //         console.log('Previous number:', prevNumber);
  //         // Apply percentage relative to the previous number
  //         percentageValue = (lastNumber / 100) * prevNumber;
  //         console.log('Percentage value:', percentageValue);
  //       } else if (["*", "/"].includes(operator)) {
  //         percentageValue = lastNumber / 100
  //         console.log('Percentage value:', percentageValue);
  //       }

  //       // Update currentInput by replacing last number with its percentage value
  //       tokens.push(percentageValue?.toString() ?? '');
  //       this.currentInput = tokens.join(""); // Reconstruct the expression
  //       this.displayValue = percentageValue?.toString() ?? '';
  //       console.log('Updated currentInput:', this.currentInput);
  //       console.log('Updated displayValue:', this.displayValue);  // Show the percentage value
  //     }
  //   }

  //   this.isResultDisplayed = true;
  // }

  private handlePercentage(value: string) {
    // If currentInput is '-0', set displayValue to '0'
    if (this.acButton) {
      if (this.currentInput.match(/^0%+$/)) {
        return;
      }
      if (this.currentInput === '-0') {
        this.currentInput = '0';
        this.displayValue = '0';
      }
    }


    if (!value || isNaN(parseFloat(value))) return;

    const tokens = this.tokenize(this.currentInput);
    console.log('Tokens before percentage:', tokens);

    if (tokens.length < 2 || (tokens.length === 2 && tokens[0] === '-')) {
      // Handle negative standalone numbers 
      const fullNumber = parseFloat(this.currentInput)
      if (!isNaN(fullNumber)) {
        // If there's only one number, simply divide it by 100
        const percentageValue = fullNumber / 100;
        this.currentInput = percentageValue.toString();
        this.displayValue = this.currentInput;
      }
    } else {
      // If there's an operation before the percentage, take the last number and apply percentage
      const lastNumber = parseFloat(tokens.pop()!);
      const operator = tokens[tokens.length - 1];

      console.log('Last number:', lastNumber);
      console.log('Operator:', operator);

      let percentageValue: undefined | number;

      if (!isNaN(lastNumber)) {
        let prevNumberStr = tokens[0] === '-' ? '-' + tokens[1] : tokens[tokens.length - 2];

        // Log for debugging
        console.log('Previous number:', prevNumberStr);

        const prevNumber = parseFloat(prevNumberStr);

        // Apply percentage based on the previous number
        if (["+", "-"].includes(operator)) {
          percentageValue = (lastNumber / 100) * prevNumber;
        } else if (["*", "/"].includes(operator)) {
          percentageValue = lastNumber / 100;
        }

        // Log for debugging
        console.log('Percentage value:', percentageValue);

        // Update currentInput by replacing last number with its percentage value
        tokens.push(percentageValue?.toString() ?? '');
        this.currentInput = tokens.join(""); // Reconstruct the expression
        this.displayValue = percentageValue?.toString() ?? '';

        // Log for debugging
        console.log('Updated currentInput:', this.currentInput);
        console.log('Updated displayValue:', this.displayValue);  // Show the percentage value
      }

    }

    this.isResultDisplayed = true;
  }

  // private handleToggleSign(value: string) {
  //   // –
  //   if (!value || isNaN(parseFloat(value))) {
  //     this.currentInput = '-0'
  //     this.displayValue = '-0'
  //     return;
  //   }
  //   if (value.startsWith('-')) {
  //     this.currentInput = value.slice(1);
  //   } else {
  //     this.currentInput = `-${value}`;
  //   }

  //   this.displayValue = this.currentInput;
  //   this.handleUpdateDisplay();
  // }


  private handleToggleSign(value: string) {
    const tokens = this.tokenize(value) as any;
    console.log('Tokens:', tokens);

    if (!tokens.length) return;

    // Restore `--` if previously converted to `+`
    if (tokens.wasDoubleNegative) {
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i] === "+") {
          tokens.splice(i, 1, "-");  // Change `+` back to `-`
          break;
        }
      }
    }
    else {
      // Loop through tokens to find last number
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (!isNaN(Number(tokens[i]))) {
          tokens[i] = this.toggleTokenSign(tokens[i]);
          break;
        }
      }
    }

    this.updateLastToken(tokens);
  }




  // private handleToggleSign(value: string) {
  //   const tokens = this.tokenize(value);
  //   console.log('Tokens length:', tokens.length);
  //   console.log('Tokens:', tokens);

  //   if (!tokens.length) return;

  //   // Loop through tokens in reverse order to find the first number
  //   for (let i = tokens.length - 1; i >= 0; i--) {
  //     const token = tokens[i];

  //     if (!isNaN(Number(token))) {
  //       // Toggle the first number found
  //       if (i > 0 && tokens[i - 1] === "-") {
  //         // If previous token is '-', remove it (switch sign)
  //         tokens.splice(i - 1, 1);
  //       } else {
  //         // Otherwise, toggle sign normally
  //         tokens[i] = this.toggleTokenSign(token);
  //       }
  //       break;
  //     }
  //   }

  //   this.updateLastToken(tokens);
  // }




  private toggleTokenSign(token: string): string {
    console.log('Toggling sign for token:', token);
    if (!isNaN(Number(token))) {
      // If the number is negative, make it positive; if positive, make it negative
      return token.startsWith('-') ? token.slice(1) : `-${token}`;
    }
    return token;  // Return operator unchanged
  }


  private updateLastToken(tokens: string[]) {
    const lastToken = tokens[tokens.length - 1];
    console.log('Last token after update:', lastToken);

    // Update the display value
    this.displayValue = lastToken;

    // Update the full current input
    this.currentInput = tokens.join('');
    console.log('Updated currentInput:', this.currentInput);
    console.log('Updated displayValue:', this.displayValue);

    this.handleUpdateDisplay();  // Update the UI or display
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

    if (this.acButton) {
      this.acButton.innerText = "AC";
    }
  }

  private handleUpdateACToCButton() {
    if (!this.acButton) return;

    if (this.isResultDisplayed && this.displayValue === "Error") {
      this.acButton.innerText = "AC";
      return;
    }

    // If a result is displayed and user hasn't typed anything new, show "C"
    if (this.isResultDisplayed) {
      this.acButton.innerText = "C";
      return;
    } else {
      // If input is only "0", "0+" or other conditions, show "AC"
      const shouldKeepAC =
        this.currentInput === "" ||  // No input at all
        this.currentInput === "0" || // Only "0" entered
        this.currentInput === "-0" || // Handling "-0" case
        this.currentInput.startsWith('%') || // Handles "%"
        (this.currentInput.length === 2 && this.currentInput.startsWith("0") && this.isOperator(this.currentInput[1])) ||  // Handles "0+"
        (this.currentInput.length === 3 && this.currentInput.startsWith("0") && this.isOperator(this.currentInput[1]) && this.currentInput.endsWith('0')) || // Handles "0+0"
        // Handles '0+-0'
        (this.currentInput.length === 4 && this.currentInput.startsWith("0") && this.isOperator(this.currentInput[1]) && this.displayValue === '-0' && this.currentInput.endsWith('0'));

      this.acButton.innerText = shouldKeepAC ? "AC" : "C";
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


/* 
       // Handle cases like "2+-0" correctly
    const tokens = this.tokenize(this.currentInput);
    if (tokens.length >= 2 && tokens[tokens.length - 1] === "0") {
      // If it's already "-0", remove the minus sign
      if (this.currentInput.endsWith("-0")) {
        this.currentInput = this.currentInput.slice(0, -2) + "0";  // Remove the minus from "-0"
        this.displayValue = this.displayValue.slice(0, -2) + "0";  // Ensure display value is updated
      } else {
        // Otherwise, add the minus to "0" to make it "-0"
        this.currentInput = this.currentInput.slice(0, -1) + "-0";
        this.displayValue = this.displayValue.slice(0, -1) + "-0";
      }
      return;
    }
     */