import './style.css'


class Calculator {
  private displayElement: HTMLInputElement;
  private currentInput: string = "";
  private previousInput: string = "";
  private operation: string | null = null;
  private acButton: HTMLButtonElement | null = null;
  private isResultDisplayed: boolean = false;

  constructor(displaySelector: string) {
    this.displayElement = document.querySelector(displaySelector) as HTMLInputElement;
    this.acButton = document.querySelector(".ac") as HTMLButtonElement;
    this.initialize();
  }

  private initialize(): void {
    // Add event listeners for buttons
    document.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => this.buttonClickHandler(button));
    });

    // Add keyboard support
    window.addEventListener("keydown", (e) => this.keyboardHandler(e));

    // Update button text based on current input
    this.updateACButton();
  }

  private buttonClickHandler(button: HTMLButtonElement): void {
    const value = button.innerText;
    this.handleInput(value);
  }

  private keyboardHandler(e: KeyboardEvent): void {
    const key = e.key;
    if (key === "Enter") {
      this.handleInput("=");
    } else if (key === "Backspace") {
      this.handleInput("C"); // Clear current input when backspace is pressed
    } else {
      this.handleInput(key);
    }
  }

  private handleInput(value: string): void {
    if (!isNaN(Number(value)) || value === ".") {
      if (this.isResultDisplayed) {
        this.currentInput = ""; // Reset if a number is pressed after "="
        this.isResultDisplayed = false;
      }
      this.appendNumber(value);
    } else if (["+", "–", "×", "÷"].includes(value)) {
      this.chooseOperation(value);
    } else if (value === "=") {
      this.compute();
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

  private appendNumber(number: string): void {
    if (number === "." && this.currentInput.includes(".")) return; // Prevent multiple decimals
    if (number === "." && this.currentInput === "") {
      this.currentInput = "0."; // Prevent starting with a decimal
      return;
    }
    if (this.currentInput === "0" && number !== ".") {
      this.currentInput = number;
      return;
    }
    this.currentInput += number;
  }

  private chooseOperation(op: string): void {
    if (this.currentInput === "") return; // Do nothing if no input yet
    if (this.previousInput !== "") {
      this.compute(); // Compute if there is a previous input
    }
    this.operation = op;
    this.previousInput = this.currentInput;
    this.currentInput = ""; // Don't clear until next number input
  }

  private compute(): void {
    const prev = parseFloat(this.previousInput);
    const current = parseFloat(this.currentInput);

    // If there is no valid second number, show an error
    if (this.currentInput === "") {
      this.displayError("Error");
      return;
    }

    // Handle division by zero and 0 ÷ 0 separately
    if (this.operation === "÷") {
      if (current === 0) {
        this.displayError("Error");
        return;
      }
    }

    let result: number;

    if (isNaN(prev) || isNaN(current)) return;

    switch (this.operation) {
      case "+":
        result = prev + current;
        break;
      case "–":
        result = prev - current;
        break;
      case "×":
        result = prev * current;
        break;
      case "÷":
        result = prev / current;
        break;
      default:
        return;
    }

    this.currentInput = result.toString();
    this.operation = null;
    this.previousInput = "";
    this.isResultDisplayed = true;
  }

  private clear(): void {
    this.currentInput = "0"; // Ensures reset to 0
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = false;
    this.updateDisplay();
    this.updateACButton();
  }


  private clearCurrentInput(): void {
    this.currentInput = ""; // Empty instead of setting to "0"
    if (!this.operation) {
      this.previousInput = "";
    }
    this.isResultDisplayed = false;
    this.updateDisplay();
    this.updateACButton();
  }

  private toggleSign(): void {
    if (this.currentInput === "0") {
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

  private updateDisplay(): void {
    if (this.displayElement.value === "Error") return; // Preserve error message
    this.displayElement.value = this.currentInput || this.previousInput || '0';
  }


  private displayError(message: string): void {
    this.displayElement.value = message;

    // Set an internal state to track error occurred
    this.currentInput = "";
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = true;

    // Ensure AC button resets properly
    this.updateACButton();
  }



  private updateACButton(): void {
    if (this.acButton) {
      if (this.currentInput !== "0" && (this.currentInput || this.previousInput)) {
        this.acButton.innerText = "C";
      } else {
        this.acButton.innerText = "AC";
      }
    }
  }
}


document.addEventListener("DOMContentLoaded", () => {
  new Calculator(".display");
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



// const hour = document.querySelector('.hour')
// const minute = document.querySelector('.minute')

// // Set up the time
// const updateTime = () => {
//   const currentTime = new Date()

//   const currentHour = currentTime.getHours()
//   const currentMinute = currentTime.getMinutes()

//   let displayHour = currentHour % 12 || 12;

//   if (hour) hour.textContent = displayHour.toString().padStart(2, "0");
//   if (minute) minute.textContent = currentMinute.toString().padStart(2, "0");
// }
// setInterval(updateTime, 1000);
// updateTime()


// const formatNumber = (num: string) => {
//   if (!num) return '0';
//   let number = parseFloat(num);
//   if (isNaN(number)) return '0';
//   let [integerPart, decimalPart] = number.toFixed(8).split('.');
//   integerPart = Number(integerPart).toLocaleString('en-US');
//   decimalPart = decimalPart?.replace(/0+$/, '');
//   return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
// };






/* 

const display = document.querySelector('.display')
const ac = document.querySelector('.ac')
const pm = document.querySelector('.pm')
const percent = document.querySelector('.percent')
const division = document.querySelector('.division')
const multiplication = document.querySelector('.multiplication')
const addition = document.querySelector('.addition')
const subtraction = document.querySelector('.subtraction')
const decimal = document.querySelector('.decimal')
const equal = document.querySelector('.equal')
const numberZero = document.querySelector('.number-0')
const numberOne = document.querySelector('.number-1')
const numberTwo = document.querySelector('.number-2')
const numberThree = document.querySelector('.number-3')
const numberFour = document.querySelector('.number-4')
const numberFive = document.querySelector('.number-5')
const numberSix = document.querySelector('.number-6')
const numberSeven = document.querySelector('.number-7')
const numberEight = document.querySelector('.number-8')
const numberNine = document.querySelector('.number-9')

const numbers = [numberZero, numberOne, numberTwo, numberThree, numberFour, numberFive, numberSix, numberSeven, numberEight, numberNine]



let currentInput = "";
let previousInput = "";
let operator: string | null = null;


const updateDisplay = () => {
  if (display instanceof HTMLInputElement) {
    if (currentInput === "-0") {
      display.value = "-0";
    } else {
      display.value = currentInput || '0';
    }
  }
};


const updateAcButton = () => {
  if (ac) {
    ac.textContent = currentInput ? "C" : "AC";
  }
}

numbers.forEach((button, index) => {
  button?.addEventListener("click", () => {
    // Remove commas and decimal point for length checking purposes
    const currentInputWithoutCommasAndDot = currentInput.replace(/[,\.]/g, "");

    // Prevent adding more than 8 digits after the decimal point
    if (currentInput.includes(".") && currentInput.split(".")[1]?.length >= 8) return;

    // Limit the input to 9 digits (excluding commas and decimal point)
    if (currentInputWithoutCommasAndDot.length < 9) {
      currentInput += index.toString();
      updateDisplay();
      updateAcButton();
    }
  });
});



decimal && decimal.addEventListener("click", () => {
  console.log("decimal button clicked");
  if (!currentInput.includes(".")) {
    currentInput += currentInput ? "." : "0.";
    updateDisplay();
    updateAcButton();
  }
});

const resetCalculator = () => {
  currentInput = "";
  previousInput = "";
  operator = null;
  updateDisplay();
  updateAcButton();
}


ac && ac.addEventListener("click", resetCalculator);


pm && pm.addEventListener("click", () => {
  if (currentInput === "0") {
    currentInput = "-0";
  } else if (currentInput) {
    currentInput = (parseFloat(currentInput.replace(/,/g, "")) * -1).toString();
  }
  updateDisplay();
});

percent && percent.addEventListener("click", () => {
  if (currentInput || previousInput) {
    currentInput = (parseFloat((currentInput || previousInput).replace(/,/g, "")) / 100).toString();
    previousInput = "";
    updateDisplay();
  }
});


const handleOperator = (op: string) => {
  if (currentInput || previousInput) {
    if (!previousInput) {
      previousInput = currentInput.replace(/[,\.]/g, "");
    }
    currentInput = "";
    operator = op;
    // updateAcButton();
  }
};

const roundResult = (num: number) => parseFloat(num.toFixed(8));


division && division.addEventListener("click", () => handleOperator("/"));
multiplication && multiplication.addEventListener("click", () => handleOperator("*"));
subtraction && subtraction.addEventListener("click", () => handleOperator("-"));
addition && addition.addEventListener("click", () => handleOperator("+"));

equal && equal.addEventListener("click", () => {
  if (previousInput && currentInput && operator) {
    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput.replace(/,/g, ""));
    switch (operator) {
      case "+":
        currentInput = roundResult(prev + curr).toString();
        break;
      case "-": currentInput = (prev - curr).toString(); break;
      case "*": currentInput = (prev * curr).toString(); break;
      case "/": currentInput = curr !== 0 ? (prev / curr).toString() : "Error";
        if (currentInput === "Error") {
          setTimeout(resetCalculator, 1500);
        }
        break;
    }
    previousInput = "";
    operator = null;
    updateDisplay();
    updateAcButton();
  }
});
*/