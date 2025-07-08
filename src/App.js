import React, { useState, useEffect } from "react";
import axios from "axios";

// Your provided logo URL - This needs to be outside the App function
const LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWRAD9OnOutbxLxmTjgsgANBihLacaD9pRCw&s";

function App() {
  // State for employee and project information
  const [employeeInfo, setEmployeeInfo] = useState({
    employeeName: "",
    employeeNo: "",
    emailId: "",
    project: "", // Changed to be selected from dropdown
    period: "",
    submittedBy: "",
    dateSubmitted: "",
  });

  // State to manage the list of current expense entries being filled
  const [expenses, setExpenses] = useState([
    {
      slNo: 1, // Serial number, will be updated in map
      date: "",
      billStatus: "",
      particulars: "",
      businessMiles: "",
      rate: "",
      type: "", // Maps to classification columns
      from: "", // Conditional for Taxi/Flight
      to: "", // Conditional for Taxi/Flight
      currency: "",
      amount: "",
      location: "", // Will be ignored in Excel
      file: null, // Stores the File object for the receipt (will be ignored in Excel)
    },
  ]);

  const [message, setMessage] = useState(""); // For success/error messages

  // State for responsive grid columns
  const [gridColumns, setGridColumns] = useState('1fr');

  // Effect for responsive grid columns
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setGridColumns('1fr 1fr');
      } else {
        setGridColumns('1fr');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Handles changes to employee/project info fields.
   */
  const handleEmployeeInfoChange = (field, value) => {
    setEmployeeInfo(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handles changes to input fields for a specific expense item.
   */
  const handleChange = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  /**
   * Handles changes to the file input for a specific expense item.
   */
  const handleFileChange = (index, file) => {
    const updated = [...expenses];
    updated[index].file = file;
    setExpenses(updated);
  };

  /**
   * Adds a new, empty expense item to the expenses array.
   */
  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        slNo: expenses.length + 1,
        date: "",
        billStatus: "",
        particulars: "",
        businessMiles: "",
        rate: "",
        type: "",
        from: "",
        to: "",
        currency: "",
        amount: "",
        location: "",
        file: null,
      },
    ]);
  };

  /**
   * Handles the form submission and triggers Excel download.
   * This now sends all current form data to the backend.
   */
  const handleSubmitAndDownload = async () => {
    setMessage("Generating Excel file...");

    // Create a FormData object to send both text fields and files
    const formData = new FormData();

    // Append employee info
    for (const key in employeeInfo) {
      formData.append(`employeeInfo[${key}]`, employeeInfo[key]);
    }

    // Append expense entries
    expenses.forEach((expense, index) => {
      for (const key in expense) {
        if (key === "file" && expense[key]) {
          formData.append(`expenses[${index}][${key}]`, expense[key], expense[key].name);
        } else {
          formData.append(`expenses[${index}][${key}]`, expense[key]);
        }
      }
    });

    try {
      const res = await axios.post("http://localhost:5000/api/export-excel", formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        },
        responseType: "blob", // Expect a binary response (the Excel file)
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Travel_Expense_Claim.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage("Excel file downloaded successfully!");

      // Optionally clear the form after submission
      setEmployeeInfo({
        employeeName: "",
        employeeNo: "",
        emailId: "",
        project: "",
        period: "",
        submittedBy: "",
        dateSubmitted: "",
      });
      setExpenses([
        {
          slNo: 1, date: "", billStatus: "", particulars: "", businessMiles: "", rate: "",
          type: "", from: "", to: "", currency: "", amount: "", location: "", file: null,
        },
      ]);

    } catch (err) {
      console.error("Error generating or downloading Excel file:", err);
      setMessage("Failed to generate or download Excel. Check backend server.");
    }
  };


  // Common styles for inputs and selects for consistency
  const inputStyle = {
    marginTop: '4px',
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  };

  const inputFocusStyle = {
    borderColor: '#60a5fa',
    boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.5)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  };

  const buttonBaseStyle = {
    padding: '12px 28px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease-in-out, box-shadow 0.2s ease-in-out',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const primaryButtonHoverStyle = {
    backgroundColor: '#2563eb',
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
  };

  const successButtonHoverStyle = {
    backgroundColor: '#15803d',
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
  };

  // No loading state needed as there's no initial Firebase connection
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px 16px',
      fontFamily: 'Roboto, Arial, sans-serif',
      lineHeight: '1.6',
      color: '#334155',
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
      }}>
        {/* Logo Section */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
        }}>
          <img
            src={LOGO_URL}
            alt="Company Logo"
            style={{
              maxWidth: '80px',
              height: 'auto',
              borderRadius: '6px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/80x20/CCCCCC/000000?text=Logo";
            }}
          />
        </div>

        {/* Form title */}
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '30px',
          textAlign: 'center',
          color: '#1e293b',
          paddingTop: '20px',
        }}>Travel Expense Reimbursement</h2>

        {/* Message display */}
        {message && (
          <div style={{
            backgroundColor: message.startsWith("Error") ? '#fee2e2' : '#d1fae5',
            color: message.startsWith("Error") ? '#ef4444' : '#047857',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '500',
            border: `1px solid ${message.startsWith("Error") ? '#fca5a5' : '#a7f3d0'}`
          }}>
            {message}
          </div>
        )}

        {/* Employee and Project Details Section */}
        <div style={{
          border: '1px solid #e2e8f0',
          padding: '30px',
          marginBottom: '24px',
          borderRadius: '10px',
          backgroundColor: '#fefefe',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: '#475569' }}>Employee & Project Details</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: '20px',
          }}>
            <div>
              <label htmlFor="employeeName" style={labelStyle}>Employee Name:</label>
              <input
                id="employeeName"
                type="text"
                value={employeeInfo.employeeName}
                onChange={(e) => handleEmployeeInfoChange("employeeName", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>
            <div>
              <label htmlFor="employeeNo" style={labelStyle}>Employee No:</label>
              <input
                id="employeeNo"
                type="text"
                value={employeeInfo.employeeNo}
                onChange={(e) => handleEmployeeInfoChange("employeeNo", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>
            <div>
              <label htmlFor="emailId" style={labelStyle}>E-mail ID:</label>
              <input
                id="emailId"
                type="email"
                value={employeeInfo.emailId}
                onChange={(e) => handleEmployeeInfoChange("emailId", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>
            {/* Project Dropdown */}
            <div>
              <label htmlFor="project" style={labelStyle}>Project:</label>
              <select
                id="project"
                value={employeeInfo.project}
                onChange={(e) => handleEmployeeInfoChange("project", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              >
                <option value="">Select Project</option>
                <option value="Engineering Services">Engineering Services</option>
                {/* Add more project options here if needed */}
              </select>
            </div>
            <div>
              <label htmlFor="period" style={labelStyle}>Period:</label>
              <input
                id="period"
                type="text"
                value={employeeInfo.period}
                onChange={(e) => handleEmployeeInfoChange("period", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                placeholder="e.g., Jan 2024"
              />
            </div>
            <div>
              <label htmlFor="submittedBy" style={labelStyle}>Submitted By:</label>
              <input
                id="submittedBy"
                type="text"
                value={employeeInfo.submittedBy}
                onChange={(e) => handleEmployeeInfoChange("submittedBy", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="dateSubmitted" style={labelStyle}>Date Submitted:</label>
              <input
                id="dateSubmitted"
                type="date"
                value={employeeInfo.dateSubmitted}
                onChange={(e) => handleEmployeeInfoChange("dateSubmitted", e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
            </div>
          </div>
        </div>

        {/* Expense Entries Section */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: '#475569' }}>Expense Entries</h3>
        {expenses.map((exp, i) => (
          <div
            key={i}
            style={{
              border: '1px solid #e2e8f0',
              padding: '30px',
              marginBottom: '24px',
              borderRadius: '10px',
              backgroundColor: '#fefefe',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: '#64748b' }}>Expense #{i + 1}</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: '20px',
            }}>
              <div>
                <label htmlFor={`date-${i}`} style={labelStyle}>Date:</label>
                <input
                  id={`date-${i}`}
                  type="date"
                  value={exp.date}
                  onChange={(e) => handleChange(i, "date", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </div>

              <div>
                <label htmlFor={`billStatus-${i}`} style={labelStyle}>Bill Status:</label>
                <select
                  id={`billStatus-${i}`}
                  value={exp.billStatus}
                  onChange={(e) => handleChange(i, "billStatus", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                >
                  <option value="">Select Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Reimbursed">Reimbursed</option>
                </select>
              </div>

              <div>
                <label htmlFor={`type-${i}`} style={labelStyle}>Type of Expense:</label>
                <select
                  id={`type-${i}`}
                  value={exp.type}
                  onChange={(e) => handleChange(i, "type", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                >
                  <option value="">Select</option>
                  <option value="Food">Food</option>
                  <option value="Taxi">Taxi/Cab charges</option>
                  <option value="Local Conveyance">Local Conveyance</option>
                  <option value="Perdium">Perdium</option>
                  <option value="Parking">Parking</option>
                  <option value="Flight">Journey Fare</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Communication">Communication</option>
                  <option value="Medical">Medical</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label htmlFor={`particulars-${i}`} style={labelStyle}>Particulars:</label>
                <input
                  id={`particulars-${i}`}
                  type="text"
                  value={exp.particulars}
                  onChange={(e) => handleChange(i, "particulars", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  placeholder="e.g., Dinner with client, Flight to London"
                />
              </div>

              {(exp.type === "Taxi" || exp.type === "Flight") && (
                <>
                  <div>
                    <label htmlFor={`from-${i}`} style={labelStyle}>From:</label>
                    <input
                      id={`from-${i}`}
                      type="text"
                      value={exp.from}
                      onChange={(e) => handleChange(i, "from", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`to-${i}`} style={labelStyle}>To:</label>
                    <input
                      id={`to-${i}`}
                      type="text"
                      value={exp.to}
                      onChange={(e) => handleChange(i, "to", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    />
                  </div>
                </>
              )}

              {(exp.type === "Local Conveyance" || exp.type === "Taxi") && (
                <div>
                  <label htmlFor={`businessMiles-${i}`} style={labelStyle}>Business Miles:</label>
                  <input
                    id={`businessMiles-${i}`}
                    type="number"
                    value={exp.businessMiles}
                    onChange={(e) => handleChange(i, "businessMiles", e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  />
                </div>
              )}

              <div>
                <label htmlFor={`rate-${i}`} style={labelStyle}>Rate:</label>
                <input
                  id={`rate-${i}`}
                  type="number"
                  value={exp.rate}
                  onChange={(e) => handleChange(i, "rate", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                  placeholder="e.g., per mile, per day"
                />
              </div>

              <div>
                <label htmlFor={`currency-${i}`} style={labelStyle}>Currency:</label>
                <select
                  id={`currency-${i}`}
                  value={exp.currency}
                  onChange={(e) => handleChange(i, "currency", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

                  {exp.currency && (
                    <div>
                      <label htmlFor={`amount-${i}`} style={labelStyle}>Amount ({exp.currency}):</label>
                      <input
                        id={`amount-${i}`}
                        type="number"
                        value={exp.amount}
                        onChange={(e) => handleChange(i, "amount", e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                      />
                    </div>
                  )}

                  {/* Location and File Upload are no longer used for Excel output but kept in form if needed */}
                  <div>
                    <label htmlFor={`location-${i}`} style={labelStyle}>Location (Ignored in Excel):</label>
                    <input
                      id={`location-${i}`}
                      type="text"
                      value={exp.location}
                      onChange={(e) => handleChange(i, "location", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    />
                  </div>

                  <div>
                    <label htmlFor={`file-${i}`} style={labelStyle}>Upload Receipt (Ignored in Excel):</label>
                    <input
                      id={`file-${i}`}
                      type="file"
                      onChange={(e) => handleFileChange(i, e.target.files[0])}
                      style={{
                        ...inputStyle,
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                    />
                    {exp.file && (
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        marginTop: '4px',
                        fontStyle: 'italic'
                      }}>Selected: {exp.file.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '30px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={addExpense}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => Object.assign(e.target.style, primaryButtonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#3b82f6', transform: 'none', boxShadow: buttonBaseStyle.boxShadow })}
                onFocus={(e) => Object.assign(e.target.style, { boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5)' })}
                onBlur={(e) => Object.assign(e.target.style, { boxShadow: buttonBaseStyle.boxShadow })}
              >
                + Add Expense
              </button>

              <button
                onClick={handleSubmitAndDownload}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => Object.assign(e.target.style, successButtonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.target.style, { backgroundColor: '#22c55e', transform: 'none', boxShadow: buttonBaseStyle.boxShadow })}
                onFocus={(e) => Object.assign(e.target.style, { boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.5)' })}
                onBlur={(e) => Object.assign(e.target.style, { boxShadow: buttonBaseStyle.boxShadow })}
              >
                Submit & Download Excel
              </button>
            </div>
          </div>
        </div>
      );
    }

    export default App;


    

