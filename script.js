/**
 * Tiffin Expense Tracker - Core Application Logic (Vanilla JS)
 */

// Application state default template
const DEFAULT_STATE = {
  expenses: [],
  settings: {
    tiffinPrice: 80,
    theme: 'light'
  }
};

// Global state variable
let state = { ...DEFAULT_STATE };

// LocalStorage key
const STORAGE_KEY = 'tiffin_tracker_data';

// ==========================================================================
// Initialization & State Management
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initFormDefaults();
  bindEvents();
  render();
});

/**
 * Load state from localStorage with safety checks
 */
function loadState() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      // Ensure all root structures exist
      state = {
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) }
      };
    } else {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveState();
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    showToast('Failed to load local data. Using default settings.', 'error');
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

/**
 * Save current state to localStorage
 */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
    showToast('Browser storage full! Changes could not be saved.', 'error');
  }
}

// ==========================================================================
// Theme Controls
// ==========================================================================

function initTheme() {
  const theme = state.settings.theme || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcons(theme);
}

function updateThemeIcons(theme) {
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');
  if (theme === 'dark') {
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  } else {
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  state.settings.theme = newTheme;
  saveState();
  
  document.documentElement.setAttribute('data-theme', newTheme);
  updateThemeIcons(newTheme);
  
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// ==========================================================================
// Helper Utility Functions
// ==========================================================================

/**
 * Returns today's date in local YYYY-MM-DD format
 */
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats a currency number in INR (₹)
 */
function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format date string "YYYY-MM-DD" into "DD MMM YYYY" (timezone safe)
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Parse YYYY-MM string to readable "Month YYYY"
 */
function formatMonthName(monthStr) {
  if (!monthStr || monthStr.indexOf('-') === -1) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Safely parse float values
 */
function safeFloat(val, fallback = 0) {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

// ==========================================================================
// Form Management & Default Values
// ==========================================================================

function initFormDefaults() {
  // Set default tiffin price input values
  const defaultPriceInput = document.getElementById('defaultPriceInput');
  defaultPriceInput.value = state.settings.tiffinPrice || 80;
  
  resetForm();
}

/**
 * Reset form input states to standard/clean values
 */
function resetForm() {
  const form = document.getElementById('expenseForm');
  const editExpenseId = document.getElementById('editExpenseId');
  const formTitle = document.getElementById('formTitle');
  const editBadge = document.getElementById('editBadge');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const saveExpenseBtn = document.getElementById('saveExpenseBtn');
  
  // Clear fields
  form.reset();
  editExpenseId.value = '';
  
  // Set default values
  document.getElementById('expenseDate').value = getTodayDateString();
  document.getElementById('pricePerTiffin').value = state.settings.tiffinPrice || 80;
  
  // Check all members by default
  document.getElementById('memberAmit').checked = true;
  document.getElementById('memberSuresh').checked = true;
  document.getElementById('memberAlpesh').checked = true;
  
  // Reset form card styles from editing state
  document.getElementById('formCard').classList.remove('form-editing');
  formTitle.textContent = 'Add Tiffin Expense';
  saveExpenseBtn.textContent = 'Save Expense';
  editBadge.classList.add('hidden');
  cancelEditBtn.classList.add('hidden');
  
  // Clear validation classes
  const inputs = form.querySelectorAll('input');
  inputs.forEach(el => el.classList.remove('is-invalid'));
  const errors = form.querySelectorAll('.error-msg');
  errors.forEach(el => el.style.display = 'none');
  
  updateLiveSplit();
}

/**
 * Updates live cost values as the user fills in the form fields
 */
function updateLiveSplit() {
  const tiffinsInput = document.getElementById('tiffinsCount');
  const priceInput = document.getElementById('pricePerTiffin');
  
  const tiffins = safeFloat(tiffinsInput.value, 0);
  const price = safeFloat(priceInput.value, 0);
  
  // Count selected members
  const selectedMembers = getSelectedMembersFromForm();
  const selectedCount = selectedMembers.length;
  
  const total = tiffins * price;
  const splitShare = selectedCount > 0 ? (total / selectedCount) : 0;
  
  document.getElementById('liveTotalAmount').textContent = formatCurrency(total);
  document.getElementById('liveSplitShare').textContent = formatCurrency(splitShare);
}

/**
 * Retrieves list of selected members from form checkboxes
 */
function getSelectedMembersFromForm() {
  const members = [];
  if (document.getElementById('memberAmit').checked) members.push('Amit');
  if (document.getElementById('memberSuresh').checked) members.push('Suresh');
  if (document.getElementById('memberAlpesh').checked) members.push('Alpesh');
  return members;
}

// ==========================================================================
// Event Binding & Form Submissions
// ==========================================================================

function bindEvents() {
  // Theme Toggle
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
  
  // Settings: Change Default Price
  document.getElementById('defaultPriceInput').addEventListener('input', (e) => {
    const val = safeFloat(e.target.value, 0);
    if (val > 0) {
      state.settings.tiffinPrice = val;
      saveState();
      
      // If we are in ADD mode, update current form input placeholder & value
      const editExpenseId = document.getElementById('editExpenseId').value;
      if (!editExpenseId) {
        document.getElementById('pricePerTiffin').value = val;
        updateLiveSplit();
      }
    }
  });

  // Form Live Updates
  const liveInputs = ['tiffinsCount', 'pricePerTiffin'];
  liveInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', updateLiveSplit);
  });
  
  const memberChecks = ['memberAmit', 'memberSuresh', 'memberAlpesh'];
  memberChecks.forEach(id => {
    document.getElementById(id).addEventListener('change', updateLiveSplit);
  });
  
  // Submit Expense Form
  document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);
  
  // Cancel Edit Button
  document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
  
  // Table Action Buttons (delegation)
  document.getElementById('expenseTableBody').addEventListener('click', handleTableAction);
  
  // Filters Event Handlers
  document.getElementById('filterSearchInput').addEventListener('input', render);
  document.getElementById('filterMonthSelect').addEventListener('change', render);
  document.getElementById('filterMemberSelect').addEventListener('change', render);
  // Backup: Export / Import
  document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);
  document.getElementById('importBackupInput').addEventListener('change', importBackup);
  document.getElementById('importCSVInput').addEventListener('change', importCSV);
  document.getElementById('downloadCSVTemplateBtn').addEventListener('click', downloadCSVTemplate);
  
  // Reset Data Modal Dialogues
  const clearBtn = document.getElementById('clearDataBtn');
  const confirmModal = document.getElementById('confirmModal');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');
  
  clearBtn.addEventListener('click', () => {
    confirmModal.classList.remove('hidden');
  });
  
  cancelResetBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
  });
  
  confirmResetBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    clearAllData();
  });
}

/**
 * Form validation check
 */
function validateForm() {
  let isValid = true;
  
  const dateInput = document.getElementById('expenseDate');
  const tiffinsInput = document.getElementById('tiffinsCount');
  const priceInput = document.getElementById('pricePerTiffin');
  
  // Clear error displays
  const form = document.getElementById('expenseForm');
  form.querySelectorAll('input').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
  
  // 1. Date validate
  if (!dateInput.value) {
    dateInput.classList.add('is-invalid');
    document.getElementById('dateError').style.display = 'block';
    isValid = false;
  }
  
  // 2. Tiffins count validate
  const tiffins = safeFloat(tiffinsInput.value, 0);
  if (tiffins <= 0) {
    tiffinsInput.classList.add('is-invalid');
    document.getElementById('tiffinsError').style.display = 'block';
    isValid = false;
  }
  
  // 3. Price validate
  const price = safeFloat(priceInput.value, 0);
  if (price <= 0) {
    priceInput.classList.add('is-invalid');
    document.getElementById('priceError').style.display = 'block';
    isValid = false;
  }
  
  // 4. Members selected validate
  const selectedMembers = getSelectedMembersFromForm();
  if (selectedMembers.length === 0) {
    document.getElementById('membersError').style.display = 'block';
    isValid = false;
  }
  
  return isValid;
}

/**
 * Process new or edited expense submissions
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showToast('Please correct form validation errors.', 'error');
    return;
  }
  
  const editExpenseId = document.getElementById('editExpenseId').value;
  const dateVal = document.getElementById('expenseDate').value;
  const tiffinsVal = safeFloat(document.getElementById('tiffinsCount').value, 0);
  const priceVal = safeFloat(document.getElementById('pricePerTiffin').value, 0);
  const notesVal = document.getElementById('expenseNotes').value.trim();
  const selectedMembers = getSelectedMembersFromForm();
  
  const totalAmount = tiffinsVal * priceVal;
  const splitShare = totalAmount / selectedMembers.length;
  
  if (editExpenseId) {
    // EDIT MODE: Update existing record
    const index = state.expenses.findIndex(exp => exp.id === editExpenseId);
    if (index !== -1) {
      state.expenses[index] = {
        id: editExpenseId,
        date: dateVal,
        tiffins: tiffinsVal,
        price: priceVal,
        total: totalAmount,
        members: selectedMembers,
        share: splitShare,
        notes: notesVal
      };
      saveState();
      resetForm();
      showToast('Expense updated successfully.', 'success');
      render();
    } else {
      showToast('Could not find record to update.', 'error');
      resetForm();
    }
  } else {
    // ADD MODE: Create new record
    const newExpense = {
      id: String(Date.now()), // Unique timestamp identifier
      date: dateVal,
      tiffins: tiffinsVal,
      price: priceVal,
      total: totalAmount,
      members: selectedMembers,
      share: splitShare,
      notes: notesVal
    };
    
    state.expenses.push(newExpense);
    saveState();
    resetForm();
    showToast('Tiffin expense saved.', 'success');
    render();
  }
}

/**
 * Handle Edit/Delete actions in Table Body delegation
 */
function handleTableAction(e) {
  // Find button context
  const button = e.target.closest('.table-action-btn');
  if (!button) return;
  
  const expenseId = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');
  
  if (action === 'edit') {
    loadExpenseIntoForm(expenseId);
  } else if (action === 'delete') {
    confirmDeleteExpense(expenseId);
  }
}

/**
 * Load selected expense info into input form for editing
 */
function loadExpenseIntoForm(id) {
  const expense = state.expenses.find(exp => exp.id === id);
  if (!expense) {
    showToast('Expense details not found.', 'error');
    return;
  }
  
  document.getElementById('editExpenseId').value = expense.id;
  document.getElementById('expenseDate').value = expense.date;
  document.getElementById('tiffinsCount').value = expense.tiffins;
  document.getElementById('pricePerTiffin').value = expense.price;
  document.getElementById('expenseNotes').value = expense.notes || '';
  
  // Set member checkboxes
  document.getElementById('memberAmit').checked = expense.members.includes('Amit');
  document.getElementById('memberSuresh').checked = expense.members.includes('Suresh');
  document.getElementById('memberAlpesh').checked = expense.members.includes('Alpesh');
  
  // Set styles
  const formCard = document.getElementById('formCard');
  formCard.classList.add('form-editing');
  document.getElementById('formTitle').textContent = 'Edit Tiffin Expense';
  document.getElementById('saveExpenseBtn').textContent = 'Update Expense';
  document.getElementById('editBadge').classList.remove('hidden');
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  
  // Clear any existing validation states
  const form = document.getElementById('expenseForm');
  form.querySelectorAll('input').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
  
  // Scroll to form nicely on mobile
  formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  updateLiveSplit();
  showToast('Loaded details into form.', 'info');
}

/**
 * Prompts user and deletes selected expense record
 */
function confirmDeleteExpense(id) {
  const expense = state.expenses.find(exp => exp.id === id);
  if (!expense) return;
  
  const displayMsg = `Delete entry on ${formatDisplayDate(expense.date)} (Total: ${formatCurrency(expense.total)})?`;
  if (confirm(displayMsg)) {
    // If the currently edited expense is the one being deleted, reset form
    const currentEditId = document.getElementById('editExpenseId').value;
    if (currentEditId === id) {
      resetForm();
    }
    
    state.expenses = state.expenses.filter(exp => exp.id !== id);
    saveState();
    showToast('Tiffin expense deleted.', 'success');
    render();
  }
}

// ==========================================================================
// Reporting & Calculation Engines
// ==========================================================================

/**
 * Calculate totals for a subset of expenses
 */
function calculateSubsetTotals(expenseSubset) {
  const totals = {
    spent: 0,
    tiffins: 0,
    Amit: 0,
    Suresh: 0,
    Alpesh: 0,
    mealsAmit: 0,
    mealsSuresh: 0,
    mealsAlpesh: 0,
    tiffinShareAmit: 0,
    tiffinShareSuresh: 0,
    tiffinShareAlpesh: 0
  };
  
  expenseSubset.forEach(exp => {
    totals.spent += exp.total;
    totals.tiffins += exp.tiffins;
    
    const count = exp.members.length;
    if (count > 0) {
      const shareValue = exp.total / count;
      const shareTiffin = exp.tiffins / count;
      
      exp.members.forEach(member => {
        if (member === 'Amit') {
          totals.Amit += shareValue;
          totals.mealsAmit += 1;
          totals.tiffinShareAmit += shareTiffin;
        } else if (member === 'Suresh') {
          totals.Suresh += shareValue;
          totals.mealsSuresh += 1;
          totals.tiffinShareSuresh += shareTiffin;
        } else if (member === 'Alpesh') {
          totals.Alpesh += shareValue;
          totals.mealsAlpesh += 1;
          totals.tiffinShareAlpesh += shareTiffin;
        }
      });
    }
  });
  
  return totals;
}

// ==========================================================================
// Toast Notification Engine
// ==========================================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      ${iconSvg}
      <span>${message}</span>
    </div>
    <button class="toast-close-btn" aria-label="Dismiss toast">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  const dismiss = () => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  };
  
  toast.querySelector('.toast-close-btn').addEventListener('click', dismiss);
  
  // Auto-remove
  setTimeout(() => {
    if (toast.parentNode) {
      dismiss();
    }
  }, 4000);
}

// ==========================================================================
// Backup & Clear Database Controllers
// ==========================================================================

/**
 * Downloads current state as JSON file
 */
function exportBackup() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    const todayStr = getTodayDateString();
    
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `tiffin_expenses_backup_${todayStr}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    
    showToast('Backup file generated and downloaded.', 'success');
  } catch (err) {
    showToast('Failed to export backup.', 'error');
  }
}

/**
 * Reads JSON file upload and updates internal state
 */
function importBackup(e) {
  const fileReader = new FileReader();
  const file = e.target.files[0];
  if (!file) return;
  
  fileReader.onload = function(event) {
    try {
      const parsed = JSON.parse(event.target.result);
      
      // Basic JSON layout validations
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('JSON is not an object.');
      }
      
      if (!parsed.expenses || !Array.isArray(parsed.expenses)) {
        throw new Error('Backup missing valid "expenses" array.');
      }
      
      // Validate structure of first couple of entries if any
      const validationPassed = parsed.expenses.every((exp, idx) => {
        if (!exp.id || !exp.date || typeof exp.tiffins === 'undefined' || typeof exp.price === 'undefined' || !exp.members) {
          console.warn(`Record at index ${idx} is missing essential properties.`);
          return false;
        }
        return true;
      });
      
      if (!validationPassed) {
        throw new Error('Database records schema check failed. Properties missing.');
      }
      
      // Load import safely
      state.expenses = parsed.expenses;
      if (parsed.settings) {
        state.settings = { ...DEFAULT_STATE.settings, ...parsed.settings };
      }
      
      saveState();
      initTheme();
      initFormDefaults();
      render();
      showToast('Database records imported successfully!', 'success');
      
    } catch (err) {
      console.error(err);
      showToast(`Restore failed: ${err.message}`, 'error');
    } finally {
      // Clear input element so it can load the same file again
      e.target.value = '';
    }
  };
  
  fileReader.readAsText(file);
}

/**
 * Downloads a sample CSV file structure as template
 */
function downloadCSVTemplate() {
  const csvContent = "data:text/csv;charset=utf-8,Date,Tiffins,Price,Shared By,Notes\r\n" +
    `${getTodayDateString()},2,80,"Amit, Suresh, Alpesh",Dinner example\r\n` +
    `${getTodayDateString()},1,80,"Amit, Alpesh",Lunch example\r\n`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "tiffin_expenses_template.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Downloaded sample CSV template.', 'success');
}

/**
 * Reads uploaded CSV file and processes input lines
 */
function importCSV(e) {
  const fileReader = new FileReader();
  const file = e.target.files[0];
  if (!file) return;

  fileReader.onload = function(event) {
    try {
      const text = event.target.result;
      const parsedLines = parseCSV(text);

      if (!parsedLines || parsedLines.length < 2) {
        throw new Error('CSV file is empty or missing data rows.');
      }

      // Check index of headers case-insensitively
      const headers = parsedLines[0].map(h => h.trim().toLowerCase());
      let dateIdx = -1, tiffinsIdx = -1, priceIdx = -1, membersIdx = -1, notesIdx = -1;

      for (let col = 0; col < headers.length; col++) {
        const hText = headers[col];
        if (hText.includes('date')) dateIdx = col;
        else if (hText.includes('tiffin') || hText.includes('qty') || hText.includes('count') || hText.includes('bought')) tiffinsIdx = col;
        else if (hText.includes('price') || hText.includes('rate') || hText.includes('cost')) priceIdx = col;
        else if (hText.includes('share') || hText.includes('member') || hText.includes('people') || hText.includes('who') || hText.includes('by')) membersIdx = col;
        else if (hText.includes('note') || hText.includes('desc') || hText.includes('info')) notesIdx = col;
      }

      // Fallback to standard indices if not found
      if (dateIdx === -1) dateIdx = 0;
      if (tiffinsIdx === -1) tiffinsIdx = 1;
      if (priceIdx === -1) priceIdx = 2;
      if (membersIdx === -1) membersIdx = 3;
      if (notesIdx === -1) notesIdx = 4;

      const newExpenses = [];
      let skippedRows = 0;

      for (let i = 1; i < parsedLines.length; i++) {
        const row = parsedLines[i];
        
        // Skip empty rows
        if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
          continue;
        }

        const rawDate = row[dateIdx] ? row[dateIdx].trim() : '';
        const rawTiffins = row[tiffinsIdx] ? row[tiffinsIdx].trim() : '';
        const rawPrice = row[priceIdx] ? row[priceIdx].trim() : '';
        const rawMembersStr = row[membersIdx] ? row[membersIdx].trim() : '';
        const rawNotes = row[notesIdx] ? row[notesIdx].trim() : '';

        if (!rawDate || !rawTiffins || !rawPrice) {
          skippedRows++;
          continue;
        }

        // Try to normalize date format to YYYY-MM-DD
        let normalizedDate = '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          normalizedDate = rawDate;
        } else {
          // Attempt parsing DD/MM/YYYY or DD-MM-YYYY
          const parts = rawDate.split(/[-\/]/);
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else if (parts[0].length === 4) {
              normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          }
        }

        // Validate date
        if (!normalizedDate || isNaN(Date.parse(normalizedDate))) {
          skippedRows++;
          continue;
        }

        const tiffins = parseFloat(rawTiffins);
        const price = parseFloat(rawPrice);

        if (isNaN(tiffins) || tiffins <= 0 || isNaN(price) || price <= 0) {
          skippedRows++;
          continue;
        }

        // Detect members in row
        const members = [];
        const lowerMembersStr = rawMembersStr.toLowerCase();
        if (lowerMembersStr.includes('amit')) members.push('Amit');
        if (lowerMembersStr.includes('suresh')) members.push('Suresh');
        if (lowerMembersStr.includes('alpesh')) members.push('Alpesh');

        // Default to all check in case of empty field
        if (members.length === 0) {
          members.push('Amit', 'Suresh', 'Alpesh');
        }

        const total = tiffins * price;
        const share = total / members.length;

        newExpenses.push({
          id: String(Date.now() + i),
          date: normalizedDate,
          tiffins: tiffins,
          price: price,
          total: total,
          members: members,
          share: share,
          notes: rawNotes
        });
      }

      if (newExpenses.length === 0) {
        throw new Error(`No valid expense lines found in CSV. (Skipped ${skippedRows} rows)`);
      }

      // Request confirmation of replace vs append
      const appendChoice = confirm(
        `Parsed ${newExpenses.length} valid expense(s) from CSV.\n` +
        (skippedRows > 0 ? `(Skipped ${skippedRows} invalid rows)\n\n` : '\n') +
        `Press OK to APPEND these records to your existing history.\n` +
        `Press Cancel to OVERWRITE and replace your entire expense history.`
      );

      if (appendChoice) {
        state.expenses = [...state.expenses, ...newExpenses];
        showToast(`Appended ${newExpenses.length} records successfully!`, 'success');
      } else {
        state.expenses = newExpenses;
        showToast(`Restored database with ${newExpenses.length} records from CSV!`, 'success');
      }

      saveState();
      render();

    } catch (err) {
      console.error(err);
      showToast(`CSV Import failed: ${err.message}`, 'error');
    } finally {
      // Clear input so same file can be uploaded again
      e.target.value = '';
    }
  };

  fileReader.readAsText(file);
}

/**
 * Robust RFC 4180 compliant CSV parser
 */
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}


/**
 * Resets entire storage
 */
function clearAllData() {
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveState();
  initTheme();
  initFormDefaults();
  render();
  showToast('All database records cleared.', 'warning');
}

// ==========================================================================
// Rendering Engine
// ==========================================================================

function render() {
  const now = new Date();
  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"
  
  // 1. Calculate stats counters
  const totalStats = calculateSubsetTotals(state.expenses);
  
  // Current month stats subset
  const currentMonthExpenses = state.expenses.filter(exp => exp.date.substring(0, 7) === currentMonthStr);
  const currentMonthStats = calculateSubsetTotals(currentMonthExpenses);
  
  // Today's stats subset
  const todayExpenses = state.expenses.filter(exp => exp.date === todayStr);
  const todayStats = calculateSubsetTotals(todayExpenses);
  
  // Previous Month subset
  // Get previous month YYYY-MM
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  const prevMonthStr = `${prevMonthYear}-${prevMonthMonth}`;
  
  const previousMonthExpenses = state.expenses.filter(exp => exp.date.substring(0, 7) === prevMonthStr);
  const previousMonthStats = calculateSubsetTotals(previousMonthExpenses);
  const currentMonthMemberStats = currentMonthStats;
  
  // 2. Render Header Stats Grid
  document.getElementById('statTotalSpent').textContent = formatCurrency(totalStats.spent);
  document.getElementById('statTotalTiffins').textContent = totalStats.tiffins.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById('statMonthlyTotal').textContent = formatCurrency(currentMonthStats.spent);
  document.getElementById('statTodayTotal').textContent = formatCurrency(todayStats.spent);
  
  // 3. Render Individual Members Dashboard Cards
  // Amit
  document.getElementById('mealsAmit').textContent = currentMonthMemberStats.mealsAmit;
  document.getElementById('tiffinShareAmit').textContent = currentMonthMemberStats.tiffinShareAmit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('totalAmit').textContent = formatCurrency(currentMonthMemberStats.Amit);
  
  // Suresh
  document.getElementById('mealsSuresh').textContent = currentMonthMemberStats.mealsSuresh;
  document.getElementById('tiffinShareSuresh').textContent = currentMonthMemberStats.tiffinShareSuresh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('totalSuresh').textContent = formatCurrency(currentMonthMemberStats.Suresh);
  
  // Alpesh
  document.getElementById('mealsAlpesh').textContent = currentMonthMemberStats.mealsAlpesh;
  document.getElementById('tiffinShareAlpesh').textContent = currentMonthMemberStats.tiffinShareAlpesh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('totalAlpesh').textContent = formatCurrency(currentMonthMemberStats.Alpesh);
  
  // 4. Render Reports Table Rows
  // Current Month Summary
  document.getElementById('reportCMTotal').textContent = formatCurrency(currentMonthStats.spent);
  document.getElementById('reportCMAmit').textContent = formatCurrency(currentMonthStats.Amit);
  document.getElementById('reportCMSuresh').textContent = formatCurrency(currentMonthStats.Suresh);
  document.getElementById('reportCMAlpesh').textContent = formatCurrency(currentMonthStats.Alpesh);
  
  // Previous Month Summary
  document.getElementById('reportPMTotal').textContent = formatCurrency(previousMonthStats.spent);
  document.getElementById('reportPMAmit').textContent = formatCurrency(previousMonthStats.Amit);
  document.getElementById('reportPMSuresh').textContent = formatCurrency(previousMonthStats.Suresh);
  document.getElementById('reportPMAlpesh').textContent = formatCurrency(previousMonthStats.Alpesh);
  
  // Lifetime Total Summary
  document.getElementById('reportLFTotal').textContent = formatCurrency(totalStats.spent);
  document.getElementById('reportLFAmit').textContent = formatCurrency(totalStats.Amit);
  document.getElementById('reportLFSuresh').textContent = formatCurrency(totalStats.Suresh);
  document.getElementById('reportLFAlpesh').textContent = formatCurrency(totalStats.Alpesh);
  
  // 5. Populate/Sync Month Filter Options dynamically
  populateMonthFilter();
  
  // 6. Filter & Render Expense History Table
  renderExpenseHistoryTable();
}

/**
 * Populates unique month strings in dropdown filter
 */
function populateMonthFilter() {
  const monthSelect = document.getElementById('filterMonthSelect');
  const previouslySelected = monthSelect.value;
  
  // Get all unique YYYY-MM strings from expenses
  const months = new Set();
  state.expenses.forEach(exp => {
    if (exp.date) {
      months.add(exp.date.substring(0, 7)); // get YYYY-MM
    }
  });
  
  // Convert to array and sort descending chronological order
  const sortedMonths = Array.from(months).sort().reverse();
  
  // Clear options but preserve the first "All Months" option
  monthSelect.innerHTML = '<option value="all">All Months</option>';
  
  sortedMonths.forEach(mStr => {
    const opt = document.createElement('option');
    opt.value = mStr;
    opt.textContent = formatMonthName(mStr);
    monthSelect.appendChild(opt);
  });
  
  // Try to restore selection if it's still available
  if (Array.from(monthSelect.options).some(opt => opt.value === previouslySelected)) {
    monthSelect.value = previouslySelected;
  } else {
    monthSelect.value = 'all';
  }
}

/**
 * Filter, sort, and render expense history lines
 */
function renderExpenseHistoryTable() {
  const searchVal = document.getElementById('filterSearchInput').value.trim().toLowerCase();
  const filterMonth = document.getElementById('filterMonthSelect').value;
  const filterMember = document.getElementById('filterMemberSelect').value;
  
  // Filter expenses
  let filtered = state.expenses.filter(exp => {
    // Note search match
    const notesMatch = !searchVal || (exp.notes && exp.notes.toLowerCase().includes(searchVal));
    
    // Month match
    const monthMatch = filterMonth === 'all' || (exp.date && exp.date.substring(0, 7) === filterMonth);
    
    // Member match
    const memberMatch = filterMember === 'all' || (exp.members && exp.members.includes(filterMember));
    
    return notesMatch && monthMatch && memberMatch;
  });
  
  // Sort: Date descending (newest first), then ID descending
  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id);
  });
  
  const tbody = document.getElementById('expenseTableBody');
  const emptyState = document.getElementById('tableEmptyState');
  
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  filtered.forEach(exp => {
    const tr = document.createElement('tr');
    
    // Build member chips
    const memberChips = exp.members.map(m => `<span class="member-chip ${m}">${m}</span>`).join(' ');
    
    tr.innerHTML = `
      <td class="col-date" data-label="Date">${formatDisplayDate(exp.date)}</td>
      <td class="col-tiffins" data-label="Tiffins">${exp.tiffins.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="col-price" data-label="Price">${formatCurrency(exp.price)}</td>
      <td class="col-total" data-label="Total">${formatCurrency(exp.total)}</td>
      <td class="col-members" data-label="Shared By">
        <div class="history-member-chips">${memberChips}</div>
      </td>
      <td class="col-share" data-label="Per-person Share">${formatCurrency(exp.share)}</td>
      <td class="col-notes" data-label="Notes" title="${exp.notes || ''}">${exp.notes || '-'}</td>
      <td class="col-actions" data-label="Actions">
        <div class="action-btn-group">
          <button class="table-action-btn btn-edit" data-id="${exp.id}" data-action="edit" title="Edit Expense" aria-label="Edit Expense">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
          <button class="table-action-btn btn-delete" data-id="${exp.id}" data-action="delete" title="Delete Expense" aria-label="Delete Expense">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
