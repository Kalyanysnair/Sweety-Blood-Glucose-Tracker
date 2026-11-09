// server/src/utils/dateUtils.js

const ALLOWED_TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

/**
 * Returns the current date in YYYY-MM-DD format based on local system time.
 */
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates whether a date string is in YYYY-MM-DD format and is a valid calendar date.
 */
function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/**
 * Checks whether a YYYY-MM-DD date is in the future relative to today.
 */
function isDateInFuture(dateStr) {
  const today = getTodayString();
  return dateStr > today;
}

/**
 * Calculates start and end dates for a Month-To-Date report.
 * First day of selected month through selected date.
 */
function getMonthToDateRange(selectedDateStr) {
  const [year, month] = selectedDateStr.split('-').map(Number);
  const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
  return {
    startDate: firstDayStr,
    endDate: selectedDateStr
  };
}

/**
 * Calculates start and end dates for a Previous Month report relative to the selected date.
 * Entire previous calendar month relative to the selected date.
 */
function getPreviousMonthRange(selectedDateStr) {
  const [year, month] = selectedDateStr.split('-').map(Number);
  // Month is 1-indexed (1 = Jan, 12 = Dec)
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const paddedMonth = String(prevMonth).padStart(2, '0');
  const startDate = `${prevYear}-${paddedMonth}-01`;

  // Last day of previous month: day 0 of month gives last day of prev month
  const lastDay = new Date(year, month - 1, 0).getDate();
  const endDate = `${prevYear}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

  return {
    startDate,
    endDate,
    year: prevYear,
    month: prevMonth,
    monthName: new Date(prevYear, prevMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  };
}

module.exports = {
  ALLOWED_TIME_SLOTS,
  getTodayString,
  formatDate,
  isValidDateString,
  isDateInFuture,
  getMonthToDateRange,
  getPreviousMonthRange
};

