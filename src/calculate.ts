import './style.css'

class Calculator {
  private displayElement: HTMLInputElement;
  private displayValue = "";
  private currentInput = "";
  private previousInput = "";
  private operation: string | null = null;
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
    console.log('Handling input:', value);

    // Reset after an error
    if (this.displayElement.value === "Error") {
      if (value === "AC") {
        this.clear();
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
    } else if (value === ".") {
      if (this.currentInput === '') {
        this.currentInput = '0.';
        this.displayValue = '0.';
      } else if (!this.currentInput.includes('.')) {
        this.currentInput += value;
        this.displayValue += value;
      }
    } else if (value === 'C') {
      this.clearCurrentInput();
    } else if (value === "AC") {
      this.clear();
    } else if (value === "=") {
      this.calculateResult();
    } else if (value === "+/-") {
      this.toggleSign();
    }

    this.updateDisplay();
    this.updateACToCButton();
  }

  private toggleSign() {
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

  private clearCurrentInput() {
    // Clear only the current input when result is displayed
    if (this.isResultDisplayed) {
      this.currentInput = '';
      this.isResultDisplayed = false; // Allow new input after result is cleared
    } else {
      // Normal clearing behavior (reset currentInput only)
      this.currentInput = '';
    }
    this.displayValue = '0';
    this.updateDisplay();
    this.updateACToCButton();
  }

  private clear() {
    this.currentInput = "0";
    this.previousInput = "";
    this.operation = null;
    this.isResultDisplayed = false;
    this.displayValue = "0";
    this.displayElement.value = "0"; // Ensure the display shows 0 after clearing
  }

  private updateACToCButton() {
    if (this.acButton) {
      if (this.currentInput !== '' && this.currentInput !== '0' && this.currentInput !== '-0') {
        this.acButton.innerText = 'C';
      } else {
        this.acButton.innerText = 'AC';
      }
    }
  }

  private updateDisplay() {
    if (this.displayElement.value === "Error") return;
    if (this.displayValue !== "") {
      this.displayElement.value = this.displayValue || this.previousInput || "0";
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
