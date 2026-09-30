/* ==========================================
1. DOM ELEMENTS SELECTION
   ========================================== */
const mortgageForm = document.querySelector('.calculator__form');

// Input Fields & their parent Form Groups
const currencySelector = document.getElementById('currency-selector');
const amountInput = document.getElementById('amount');
const amountGroup = amountInput.closest('.form-group');

const termInput = document.getElementById('term');
const termGroup = termInput.closest('.form-group');

const rateInput = document.getElementById('rate');
const rateGroup = rateInput.closest('.form-group');

// Radio Options Group & Action Buttons
const mortgageTypeRadios = document.querySelectorAll('input[name="mortgage-type"]');
const mortgageTypeGroup = document.querySelector('.form-group--radio');

const clearBtn = document.querySelector('.calculator__clear-btn');
const calculateBtn = document.querySelector('.calculator__submit-btn');

// Results Display Panel
const resultsSection = document.querySelector('.results');

// Select all numeric fields for comma formatting
const numericInputs = document.querySelectorAll('#amount, #term, #rate');


/* ==========================================
2. CURRENCY STATE MANAGEMENT
   ========================================== */
let selectedCurrency = '£';

currencySelector.addEventListener('change', function(event) {
   selectedCurrency = event.target.value;
});


/* ==========================================
3. EVENT LISTENERS & FUNCTIONALITY
   ========================================== */

clearBtn.addEventListener('click', function() {
   mortgageForm.reset();

   amountGroup.classList.remove('error');
   termGroup.classList.remove('error');
   rateGroup.classList.remove('error');
   mortgageTypeGroup.classList.remove('error');

   currencySelector.disabled = false;

   resultsSection.classList.add('results--empty');
   resultsSection.classList.remove('results--completed');
});


/* ==========================================
   4. CURRENCY & NUMBER FORMATTING
   ========================================== */

function formatCurrency(amount) {
   const safeAmount = isNaN(amount) ? 0 : amount;
   
   const formattedNumber = Number(safeAmount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
   });

   return `${selectedCurrency}${formattedNumber}`;
}

// Helper function to auto-add commas and decimals (.00) to inputs, skipping term
function formatNumberInput(value, inputId) {
   if (!value) return '';
   
   let cleanValue = value.toString().replace(/,/g, '').replace(/[^0-9.]/g, '');
   let parts = cleanValue.split('.');
   let integerPart = parts[0];
   let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
   
   integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
   
   // Skip adding .00 if this is the term input box
   if (inputId !== 'term') {
      if (decimalPart === '' && integerPart !== '') {
         decimalPart = '.00';
      } else if (decimalPart.length === 2) {
         decimalPart += '0';
      }
   } else {
      // Keep term free of decimals/trailing zeros
      decimalPart = ''; 
   }
   
   return integerPart + decimalPart;
}

// Attach input, focus, and blur listeners for live formatting while typing
numericInputs.forEach(input => {
   // Strip commas when clicking into the input so it's easy to edit
   input.addEventListener('focus', (e) => {
      e.target.value = e.target.value.replace(/,/g, '');
   });

   // Format live as the user types
   input.addEventListener('input', (e) => {
      let inputField = e.target;
      let originalCursorPosition = inputField.selectionStart;
      let originalLength = inputField.value.length;

      // Apply formatting (commas only during live typing)
      let rawValue = inputField.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
      let parts = rawValue.split('.');
      let integerPart = parts[0];
      let decimalPart = parts.length > 1 ? '.' + parts[1] : '';
      
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      let formattedValue = integerPart + decimalPart;

      // Update the value
      inputField.value = formattedValue;

      // Adjust cursor position so it doesn't jump to the end
      let newLength = inputField.value.length;
      let cursorAdjustment = newLength - originalLength;
      inputField.setSelectionRange(originalCursorPosition + cursorAdjustment, originalCursorPosition + cursorAdjustment);
   });

   // Add .00 (for amount/rate) and commas when clicking away (blur)
   input.addEventListener('blur', (e) => {
      if (e.target.value.trim() !== '') {
         e.target.value = formatNumberInput(e.target.value, e.target.id);
      }
   });
});


/* ==========================================
   5. CORE MORTGAGE CALCULATION ENGINE
   ========================================== */

function calculateMortgage(amount, termYears, annualRate, type) {
   const monthlyRate = (annualRate / 100) / 12;
   const totalPayments = termYears * 12;

   let monthlyPayment = 0;
   let totalPayment = 0;

   if (type === 'repayment') {
      if (monthlyRate === 0) {
         monthlyPayment = amount / totalPayments;
      } else {
         const x = Math.pow(1 + monthlyRate, totalPayments);
         monthlyPayment = (amount * monthlyRate * x) / (x - 1);
      }
      totalPayment = monthlyPayment * totalPayments;

   } else if (type === 'interest-only') {
      monthlyPayment = amount * monthlyRate;
      totalPayment = (monthlyPayment * totalPayments) + amount;
   }

   return {
      monthly: monthlyPayment,
      total: totalPayment
   };
}


/* ==========================================
   6. SUBMIT EVENT & UI VALIDATION
   ========================================== */

const monthlyOutput = document.querySelector('.results__output--monthly');
const totalOutput = document.querySelector('.results__output--total');

mortgageForm.addEventListener('submit', function(event) {
   event.preventDefault();

   // Format all numeric fields upon clicking submit as well
   numericInputs.forEach(input => {
      if (input.value.trim() !== '') {
         input.value = formatNumberInput(input.value, input.id);
      }
   });

   // Helper function for Amount & Term
   function handleFieldError(inputElement, groupElement, customMsg) {
      const valueStr = inputElement.value.trim();
      const valueNum = parseFloat(valueStr.replace(/,/g, '')); // Strip commas before checking number value
      const errorMsg = groupElement.querySelector('.form-error-msg');

      if (valueStr === '' || isNaN(valueNum) || valueNum < 0.1) {
         groupElement.classList.add('error');
         if (errorMsg) {
            errorMsg.textContent = valueStr === '' ? 'This field is required' : customMsg;
         }
         return false;
      } else {
         groupElement.classList.remove('error');
         return true;
      }
   }

   // Extract values (making sure to strip commas so math doesn't break)
   const cleanAmount = amountInput.value.replace(/,/g, '');
   const cleanTerm = termInput.value.replace(/,/g, '');
   const cleanRate = rateInput.value.replace(/,/g, '');

   const amount = parseFloat(cleanAmount);
   const term = parseFloat(cleanTerm);
   const rate = parseFloat(cleanRate);

   let selectedType = '';
   mortgageTypeRadios.forEach(radio => {
      if (radio.checked) {
         selectedType = radio.value;
      }
   });

   // Track validation status
   let isValid = true;

   // 1. Validate Mortgage Amount
   const isAmountValid = handleFieldError(amountInput, amountGroup, 'Please enter a valid amount greater than 0');
   if (!isAmountValid) isValid = false;

   // 2. Validate Mortgage Term
   const isTermValid = handleFieldError(termInput, termGroup, 'Please enter a valid term in years');
   if (!isTermValid) isValid = false;

   // 3. Validate Interest Rate
   const rateStr = rateInput.value.trim();
   const rateNum = parseFloat(rateStr.replace(/,/g, ''));
   const rateErrorMsg = rateGroup.querySelector('.form-error-msg');

   if (rateStr === '' || isNaN(rateNum) || rateNum < 0.1) {
      rateGroup.classList.add('error');
      if (rateErrorMsg) {
         rateErrorMsg.textContent = rateStr === '' ? 'This field is required' : 'Please enter a valid interest rate';
      }
      isValid = false;
   } else {
      rateGroup.classList.remove('error');
   }

   // 4. Validate Mortgage Type Selection
   if (!selectedType) {
      mortgageTypeGroup.classList.add('error');
      const typeErrorMsg = mortgageTypeGroup.querySelector('.form-error-msg');
      if (typeErrorMsg) typeErrorMsg.textContent = 'This field is required';
      isValid = false;
   } else {
      mortgageTypeGroup.classList.remove('error');
   }

   // Stop execution if validation fails
   if (!isValid) {
      return;
   }

   // Run calculation engine if all inputs are valid
   const results = calculateMortgage(amount, term, rate, selectedType);

   monthlyOutput.textContent = formatCurrency(results.monthly);
   totalOutput.textContent = formatCurrency(results.total);

   currencySelector.disabled = true;

   resultsSection.classList.remove('results--empty');
   resultsSection.classList.add('results--completed');
});
