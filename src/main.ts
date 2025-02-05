import './style.css'

const hour = document.querySelector('.hour')
const minute = document.querySelector('.minute')
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


// Set up the time
const updateTime = () => {
  const currentTime = new Date()

  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()

  // Convert to 12-hour format
  let displayHour = currentHour % 12 || 12;

  hour!.textContent = displayHour.toString().padStart(2, "0");
  minute!.textContent = currentMinute.toString().padStart(2, "0");
}
setInterval(updateTime, 1000);
updateTime()


let currentInput: string = "";
let previousInput: string = "";
let operator: string | null = null;

const formatNumber = (num: string) => {
  let number = parseFloat(num);

  if (isNaN(number)) return "0";

  // Limit to 8 decimal places
  let [integerPart, decimalPart] = number.toFixed(8).split(".");

  // Format integer part with commas
  integerPart = Number(integerPart).toLocaleString("en-US");

  // Remove unnecessary trailing zeros in the decimal part
  decimalPart = decimalPart?.replace(/0+$/, "");

  // Combine integer and decimal parts (only add decimal if it exists)
  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
};



const updateDisplay = () => {
  if (display instanceof HTMLInputElement) {
    if (currentInput === "-0") {
      display.value = "-0";
    } else {
      display.value = currentInput ? formatNumber(currentInput) : "0";
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

    // Limit the input to 9 digits (excluding commas)
    if (currentInputWithoutCommasAndDot.length < 9) {
      currentInput += index.toString();
      updateDisplay();
      updateAcButton();
    }
  });
});


decimal?.addEventListener("click", () => {
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

ac?.addEventListener("click", resetCalculator);

pm?.addEventListener("click", () => {
  if (currentInput === "0") {
    currentInput = "-0";
  } else if (currentInput) {
    currentInput = (parseFloat(currentInput.replace(/,/g, "")) * -1).toString();
  }
  updateDisplay();
});

percent?.addEventListener("click", () => {
  if (currentInput) {
    currentInput = (parseFloat(currentInput.replace(/,/g, "")) / 100).toString();
    updateDisplay();
  }
});

const handleOperator = (op: string) => {
  if (currentInput) {
    previousInput = currentInput.replace(/,/g, "");
    currentInput = "";
    operator = op;
    // updateAcButton();
  }
};

division?.addEventListener("click", () => handleOperator("/"));
multiplication?.addEventListener("click", () => handleOperator("*"));
subtraction?.addEventListener("click", () => handleOperator("-"));
addition?.addEventListener("click", () => handleOperator("+"));

equal?.addEventListener("click", () => {
  if (previousInput && currentInput && operator) {
    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput.replace(/,/g, ""));
    switch (operator) {
      case "+": currentInput = (prev + curr).toString(); break;
      case "-": currentInput = (prev - curr).toString(); break;
      case "*": currentInput = (prev * curr).toString(); break;
      case "/": currentInput = curr !== 0 ? (prev / curr).toString() : "Error"; break;
    }
    previousInput = "";
    operator = null;
    updateDisplay();
    updateAcButton();
  }
});
