const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx"); // Library for reading/writing Excel files
const fs = require("fs");
const path = require("path");
const Busboy = require('busboy'); // For parsing multipart/form-data

const app = express();
app.use(cors()); // Enable CORS for all origins

// Define the path to your Excel template file
// IMPORTANT: Place your 'travel claim Template.xlsx' file in the same directory as this server.js file
const TEMPLATE_FILE_NAME = "travel claim Template.xlsx"; // <--- ENSURE THIS EXACTLY MATCHS YOUR FILE NAME AND EXTENSION
const TEMPLATE_FILE_PATH = path.join(__dirname, TEMPLATE_FILE_NAME);

// Column mappings for expense entries (UPDATED based on your latest feedback for shifted columns)
const EXPENSE_COLUMN_MAP = {
    "Sl.no": "A", // Shifted from B to A based on user feedback
    "Date": "B", // Shifted from C to B based on user feedback
    "Bill status": "C", // Shifted from D to C based on user feedback
    "Particulars": "D", // Shifted from E to D based on user feedback
    "Business Miles": "E", // Shifted from F to E based on user feedback
    "Rate": "F", // Shifted from G to F based on user feedback
    "Amount": "H", // Shifted from I to H based on user feedback
    "Food": "I", // Shifted from J to I based on user feedback
    "Taxi/Cab charges": "J", // Shifted from K to J based on user feedback
    "Local Conveyance": "K", // Shifted from L to K based on user feedback
    "Perdium": "L", // Shifted from M to L based on user feedback
    "Parking": "M", // Shifted from N to M based on user feedback
    "Journey Fare": "N", // Shifted from O to N based on user feedback (Maps to 'Flight' in form)
    "Accommodation": "O", // Shifted from P to O based on user feedback
    "Entertainment": "P", // Shifted from Q to P based on user feedback
    "Communication": "Q", // Shifted from R to Q based on user feedback
    "Medical": "R", // Shifted from S to R based on user feedback
    "Others": "S"  // Shifted from T to S based on user feedback
};

// This is the endpoint to handle form submission and generate Excel
app.post("/api/export-excel", (req, res) => {
    let employeeInfo = {};
    let expenses = []; // This will store parsed expense objects
    let parsedFiles = []; // Not used for Excel content, but collected if needed later

    const busboy = Busboy({ headers: req.headers });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        // Consume the file stream, as we're not saving files for Excel generation
        file.resume();
        parsedFiles.push({
            fieldname: fieldname,
            originalname: filename.filename,
            encoding: encoding,
            mimetype: mimetype,
        });
        // If you were saving files, you'd implement fs.createWriteStream here:
        // const saveTo = path.join(__dirname, 'uploads', filename.filename);
        // file.pipe(fs.createWriteStream(saveTo));
    });

    busboy.on('field', (fieldname, val) => {
        // Parse employee info
        const employeeMatch = fieldname.match(/^employeeInfo\[(\w+)\]$/);
        if (employeeMatch) {
            employeeInfo[employeeMatch[1]] = val;
            return;
        }

        // Parse expense entries
        const expenseMatch = fieldname.match(/^expenses\[(\d+)\]\[(\w+)\]$/);
        if (expenseMatch) {
            const index = parseInt(expenseMatch[1]);
            const key = expenseMatch[2];
            if (!expenses[index]) {
                expenses[index] = {};
            }
            expenses[index][key] = val;
        }
    });

    busboy.on('finish', async () => {
        console.log("Received Employee Info:", employeeInfo);
        console.log("Received Expenses Data:", expenses);

        if (!fs.existsSync(TEMPLATE_FILE_PATH)) {
            console.error(`ERROR: Excel template file NOT FOUND at: ${TEMPLATE_FILE_PATH}`);
            console.error("Please ensure 'travel claim Template.xlsx' is in the same directory as server.js.");
            return res.status(500).send("Server Error: Excel template file not found. Please check server console for details.");
        }

        try {
            // Read the existing workbook
            const workbook = XLSX.readFile(TEMPLATE_FILE_PATH);
            const sheetName = workbook.SheetNames[0]; // Assuming data goes into the first sheet
            const worksheet = workbook.Sheets[sheetName];

            // Helper function to write to a specific cell with optional style
            const writeCell = (cellAddress, value, applyBold = false) => {
                const cell = worksheet[cellAddress] || (worksheet[cellAddress] = {});
                cell.v = value;
                if (typeof value === 'number') {
                    cell.t = 'n'; // Number
                } else if (value instanceof Date) {
                    cell.t = 'd'; // Date
                    // Excel will use its default date format for 'd' type cells.
                } else {
                    cell.t = 's'; // String
                }

                // Apply bold directly to the font property of the cell's style object
                if (!cell.s) {
                    cell.s = {};
                }
                if (!cell.s.font) {
                    cell.s.font = {};
                }
                cell.s.font.bold = applyBold;
            };

            // Helper function to get cell value (useful for existing labels)
            const getCellValue = (cellAddress) => {
                const cell = worksheet[cellAddress];
                return cell ? cell.v : undefined;
            };

            // --- Apply requested formatting and insert data ---

            // Clear A2 if it contains "EXPENSES CLAIM" (to avoid duplication)
            writeCell("A2", "", false); // Clear the cell, ensure no bold

            // 1. "EXPENSES CLAIM" in G2, bold
            writeCell("G2", "EXPENSES CLAIM", true);

            // 2. Employee Name, Employee No, E-mail ID labels in bold (A5, A6, A7)
            writeCell("A5", getCellValue("A5") || "Employee Name :", true);
            writeCell("D5", employeeInfo.employeeName || "", false); // Value not bold

            writeCell("A6", getCellValue("A6") || "Employee No :", true);
            writeCell("D6", employeeInfo.employeeNo || "", false); // Value not bold

            writeCell("A7", getCellValue("A7") || "E-mail ID :", true);
            writeCell("D7", employeeInfo.emailId || "", false); // Value not bold

            // 3. Project (F5) and Period (P5) labels in bold, correct positioning
            writeCell("F5", getCellValue("F5") || "Project :", true);
            writeCell("G5", "", false); // Clear G5 (if it had data before)
            writeCell("H5", employeeInfo.project || "", false); // Value in H5, not bold

            // Period label in O5, value in P5, clear Q5 if it had content
            writeCell("O5", getCellValue("O5") || "Period :", true); // Label in O5
            writeCell("P5", employeeInfo.period || "", false); // Value in P5, not bold
            writeCell("Q5", "", false); // Clear Q5 (if it had data before)


            // 4. "Expenses Incurred in Indian Rupees" in A9, in bold
            writeCell("A9", getCellValue("A9") || "Expenses Incurred in Indian Rupees", true);

            // 5. All table headers in bold (INR table)
            const inrHeaderRow = 10;
            const inrHeaderColumns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S"]; // Adjusted for new map
            inrHeaderColumns.forEach(col => {
                const cellAddress = col + inrHeaderRow;
                writeCell(cellAddress, getCellValue(cellAddress), true);
            });

            // 5. All table headers in bold (USD table)
            const usdHeaderRow = 21;
            const usdHeaderColumns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S"]; // Adjusted for new map
            usdHeaderColumns.forEach(col => {
                const cellAddress = col + usdHeaderRow;
                writeCell(cellAddress, getCellValue(cellAddress), true);
            });

            // 6. Net Claim payable in D52 in bold
            writeCell("D52", getCellValue("D52") || "Net Claim payable", true);

            // 7. Submitted by : in A60, Approved by in L60 (both in bold but values in normal)
            writeCell("A60", getCellValue("A60") || "Submitted by :", true);
            writeCell("D60", employeeInfo.submittedBy || "", false); // Value not bold

            writeCell("L60", getCellValue("L60") || "Approved by :", true);
            // Assuming approved by value is in M60, but not explicitly requested to fill it.

            // 8. date in A61 and L61 in bold
            writeCell("A61", getCellValue("A61") || "Date :", true);
            writeCell("D61", employeeInfo.dateSubmitted || "", false); // Value not bold

            writeCell("L61", getCellValue("L61") || "Date :", true);
            // Assuming approved date value is in M61, but not explicitly requested to fill it.


            // --- Insert Expense Entries ---
            let inrCurrentRow = 11; // Starting row for INR expenses
            let usdCurrentRow = 22; // Starting row for USD expenses

            expenses.forEach((exp, index) => {
                const amount = parseFloat(exp.amount) || 0.0;
                const type = exp.type || "";
                const currency = exp.currency || "";

                // Determine which table to write to based on currency
                let currentRow;
                if (currency === "INR") {
                    currentRow = inrCurrentRow;
                    inrCurrentRow++; // Increment for next INR expense
                } else if (currency === "USD" || currency === "CAD" || currency === "GBP" || currency === "CHF" || currency === "EUR" || currency === "JPY") {
                    currentRow = usdCurrentRow;
                    usdCurrentRow++; // Increment for next USD expense
                } else {
                    console.warn(`Skipping expense with unknown or missing currency: ${currency} for expense index ${index}`);
                    return; // Skip this expense if currency is not recognized
                }

                const billStatusCellAddress = EXPENSE_COLUMN_MAP["Bill status"] + currentRow;
                // *** FIX: Remove existing comments from the Bill status cell more robustly ***
                // Clear all comments from the worksheet before writing, then add back if needed (not needed here)
                // This is a more aggressive approach to ensure no old comments remain.
                if (worksheet['!comments']) {
                    worksheet['!comments'] = worksheet['!comments'].filter(comment => {
                        // Keep comments that are NOT for the current billStatusCellAddress
                        return comment.ref !== billStatusCellAddress;
                    });
                }
                // Clear the cell value before writing to it, to ensure no old data remains
                writeCell(billStatusCellAddress, "", false); // Clear cell value


                // Prepare particulars string based on type
                let finalParticulars = exp.particulars || "";
                if (type === "Taxi" || type === "Flight") {
                    const from = exp.from || "";
                    const to = exp.to || "";
                    if (from && to) {
                        finalParticulars = `From: ${from}, To: ${to}${finalParticulars ? ' - ' + finalParticulars : ''}`;
                    } else if (from) {
                        finalParticulars = `From: ${from}${finalParticulars ? ' - ' + finalParticulars : ''}`;
                    } else if (to) {
                        finalParticulars = `To: ${to}${finalParticulars ? ' - ' + finalParticulars : ''}`;
                    }
                }

                // Convert date string to a Date object for correct Excel date handling
                const expenseDate = exp.date ? new Date(exp.date) : "";

                // Write common expense fields (values are not bold)
                writeCell(EXPENSE_COLUMN_MAP["Sl.no"] + currentRow, index + 1, false); // Sl.no
                writeCell(EXPENSE_COLUMN_MAP["Date"] + currentRow, expenseDate, false); // Use Date object
                writeCell(EXPENSE_COLUMN_MAP["Bill status"] + currentRow, exp.billStatus || "", false);
                writeCell(EXPENSE_COLUMN_MAP["Particulars"] + currentRow, finalParticulars, false);
                writeCell(EXPENSE_COLUMN_MAP["Business Miles"] + currentRow, parseFloat(exp.businessMiles) || 0.0, false);
                writeCell(EXPENSE_COLUMN_MAP["Rate"] + currentRow, parseFloat(exp.rate) || 0.0, false);
                writeCell(EXPENSE_COLUMN_MAP["Amount"] + currentRow, amount, false); // Total amount for the row

                // Write classified amounts
                const classificationColumns = [
                    "Food", "Taxi/Cab charges", "Local Conveyance", "Perdium", "Parking",
                    "Journey Fare", "Accommodation", "Entertainment", "Communication",
                    "Medical", "Others"
                ];

                classificationColumns.forEach(colName => {
                    const column = EXPENSE_COLUMN_MAP[colName];
                    if (column) {
                        // If the expense type matches the classification column, write the amount, otherwise 0
                        // Special handling for 'Flight' type mapping to 'Journey Fare' column
                        if ((colName === exp.type) || (colName === "Journey Fare" && exp.type === "Flight")) {
                            writeCell(column + currentRow, amount, false);
                        } else {
                            // Ensure other classification columns for this row are explicitly set to 0.0
                            // (or empty, depending on how you want your template to behave if no value)
                            writeCell(column + currentRow, 0.0, false);
                        }
                    }
                });
            });

            // --- FIX: Change second table title position from A20 to A19 ---
            // 10. Second table title: "Expenses Incurred in USD" or "Expenses Incurred in (selected currency)"
            // Find the first non-INR expense (excluding empty currency) to determine the title for the second table
            const firstNonInrExpense = expenses.find(exp => exp.currency !== "INR" && exp.currency !== "");
            const secondTableTitle = firstNonInrExpense && firstNonInrExpense.currency ?
                `Expenses Incurred in ${firstNonInrExpense.currency}` :
                "Expenses Incurred in USD"; // Default if no non-INR currency found, or if only INR expenses are present
            writeCell("A19", secondTableTitle, true); // Changed from A20 to A19
            // Clear A20 if it previously had content
            writeCell("A20", "", false);


            // --- Generate the modified workbook and send it ---
            const wbout = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Filled_Travel_Expense_Claim_${Date.now()}.xlsx`);
            res.send(wbout);

        } catch (error) {
            console.error("Error processing Excel template:", error);
            res.status(500).send("Failed to process Excel template. Please check server console for errors.");
        }
    });

    req.pipe(busboy); // Pipe the request stream to busboy
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});



