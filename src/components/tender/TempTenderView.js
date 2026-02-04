"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import * as XLSX from "xlsx"; // Import the xlsx library
import {
  FileText,
  ImageIcon,
  ExternalLink,
  Eye,
  ArrowLeft,
  Award,
  Briefcase,
  FileCheck,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
} from "lucide-react"
import logo from "../../assets/images (1).png"

// Date formatting utility function
const formatDate = (dateValue) => {
  if (!dateValue || dateValue === "" || dateValue === "—") return dateValue;
  
  // Check if it's already in dd-mm-yyyy format
  const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (ddMmYyyyRegex.test(dateValue)) {
    return dateValue;
  }
  
  // Check if it's in yyyy-mm-dd format (common from databases)
  const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (yyyyMmDdRegex.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}-${month}-${year}`;
  }
  
  // Check if it's a date string that can be parsed
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {
    // If parsing fails, return the original value
  }
  
  return dateValue;
};

// Custom styled components using template literals
const StyledContainer = ({ children, ...props }) => {
  const style = {
    padding: "10px",
    background: " #ffffff",
    minHeight: "100vh",
    ...props.style,
  }
  return <div style={style}>{children}</div>
}

const StyledHeader = ({ children, ...props }) => {
  const style = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    marginBottom: "20px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    position: "relative",
    overflow: "hidden",
    ...props.style,
  }
  return <div style={style}>{children}</div>
}

const StyledCard = ({ children, highlight, ...props }) => {
  const style = {
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "12px",
    background: highlight ? "linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)" : "#ffffff",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    position: "relative",
    overflow: "hidden",
    ...props.style,
  }
  return <div style={style}>{children}</div>
}

const StyledButton = ({ children, primary, ...props }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
    outline: "none",
    ...props.style,
  }

  const primaryStyle = {
    ...baseStyle,
    backgroundColor: "#F69320",
    color: "white",
    boxShadow: "0 4px 10px rgba(246, 147, 32, 0.2)",
  }

  const secondaryStyle = {
    ...baseStyle,
    backgroundColor: "#f8f9fa",
    color: "#333",
    border: "1px solid #e0e0e0",
  }

  const style = primary ? primaryStyle : secondaryStyle

  return (
    <button {...props} style={style}>
      {children}
    </button>
  )
}

const StyledTitle = ({ children, level = 1, ...props }) => {
  const baseStyle = {
    margin: "0 0 10px 0",
    fontWeight: "600",
    color: "#333",
    ...props.style,
  }

  let fontSize
  switch (level) {
    case 1:
      fontSize = "24px"
      break
    case 2:
      fontSize = "20px"
      break
    case 3:
      fontSize = "18px"
      break
    default:
      fontSize = "16px"
  }

  const style = { ...baseStyle, fontSize }

  return <h3 style={style}>{children}</h3>
}

const StyledSubtitle = ({ children, ...props }) => {
  const style = {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 15px 0",
    ...props.style,
  }
  return <p style={style}>{children}</p>
}

const StyledGrid = ({ children, columns = 1, ...props }) => {
  const style = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "15px",
    width: "100%",
    ...props.style,
  }

  // Add a resize event listener to handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const gridElements = document.querySelectorAll('[data-grid="true"]')
      gridElements.forEach((el) => {
        el.style.gridTemplateColumns = window.innerWidth < 768 ? "1fr" : "1fr 1fr"
      })
    }

    window.addEventListener("resize", handleResize)
    // Initial call
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div data-grid="true" style={style}>
      {children}
    </div>
  )
}

const StyledFieldBox = ({ children, isEditing, variant = "default", ...props }) => {
  let baseStyle = {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: isEditing ? "#fff8e1" : "#f9f9f9",
    border: isEditing ? "1px solid #F69320" : "1px solid #eee",
    height: "100%",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
    ...props.style,
  }

  // Different style variants
  if (variant === "modern") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isEditing ? "#fff8e1" : "#ffffff",
      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
      border: "none",
      borderLeft: "3px solid #F69320",
    }
  } else if (variant === "card") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: "#ffffff",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
      borderRadius: "10px",
      border: "1px solid #f0f0f0",
      padding: "15px",
    }
  } else if (variant === "flat") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isEditing ? "#fff8e1" : "#f8f9fa",
      border: "1px solid #eaeaea",
      borderRadius: "6px",
      boxShadow: "none",
    }
  }

  return <div style={baseStyle}>{children}</div>
}

const StyledFieldLabel = ({ children, ...props }) => {
  const style = {
    fontSize: "12px",
    fontWeight: "600",
    color: "#555",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    ...props.style,
  }
  return <div style={style}>{children}</div>
}

const StyledFieldValue = ({ children, ...props }) => {
  const style = {
    fontSize: "14px",
    color: "#333",
    wordBreak: "break-word",
    fontWeight: "500",
    ...props.style,
  }
  return <div style={style}>{children}</div>
}

const StyledInput = ({ value, onChange, ...props }) => {
  const style = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "white",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
    ":focus": {
      borderColor: "#F69320",
      boxShadow: "0 0 0 2px rgba(246, 147, 32, 0.2)",
    },
    ...props.style,
  }
  return <input value={value} onChange={onChange} style={style} {...props} />
}

// Date input component with auto-formatting
const StyledDateInput = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState(value || "");
  
  useEffect(() => {
    setDisplayValue(value || "");
  }, [value]);
  
  const handleChange = (e) => {
    const input = e.target.value;
    setDisplayValue(input);
    
    // Auto-format as user types
    let formatted = input.replace(/\D/g, '');
    
    if (formatted.length > 2) {
      formatted = formatted.substring(0, 2) + '-' + formatted.substring(2);
    }
    if (formatted.length > 5) {
      formatted = formatted.substring(0, 5) + '-' + formatted.substring(5, 9);
    }
    
    setDisplayValue(formatted);
    
    // Only call onChange when we have a complete date
    if (formatted.length === 10) {
      onChange(formatted);
    } else if (formatted.length === 0) {
      onChange("");
    }
  };
  
  const style = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "white",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
    ":focus": {
      borderColor: "#F69320",
      boxShadow: "0 0 0 2px rgba(246, 147, 32, 0.2)",
    },
    ...props.style,
  };
  
  return (
    <input
      value={displayValue}
      onChange={handleChange}
      placeholder="dd-mm-yyyy"
      maxLength={10}
      style={style}
      {...props}
    />
  );
};

const StyledAvatar = ({ src, alt, size = 100, ...props }) => {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "8px",
    objectFit: "cover",
    border: "2px solid white",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    ...props.style,
  }
  return <img src={src || "/placeholder.svg"} alt={alt} style={style} />
}

const StyledIconButton = ({ children, onClick, ...props }) => {
  const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "absolute",
    bottom: "5px",
    right: "5px",
    ":hover": {
      backgroundColor: "white",
      transform: "scale(1.1)",
    },
    ...props.style,
  }
  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  )
}

const StyledDivider = (props) => {
  const style = {
    height: "1px",
    width: "100%",
    backgroundColor: "#eee",
    margin: "15px 0",
    ...props.style,
  }
  return <div style={style}></div>
}

const StyledBadge = ({ children, color = "#F69320", ...props }) => {
  const style = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
    backgroundColor: color,
    ...props.style,
  }
  return <span style={style}>{children}</span>
}

const StyledLoading = (props) => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    ...props.style,
  }

  const spinnerStyle = {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(246, 147, 32, 0.1)",
    borderRadius: "50%",
    borderTop: "4px solid #F69320",
    animation: "spin 1s linear infinite",
  }

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const StyledError = ({ children, ...props }) => {
  const style = {
    textAlign: "center",
    padding: "30px",
    color: "#d32f2f",
    fontSize: "18px",
    ...props.style,
  }
  return <div style={style}>{children}</div>
}

const StyledToast = ({ message, type = "success", onClose }) => {
  const style = {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    backgroundColor: type === "success" ? "#4caf50" : "#f44336",
    color: "white",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: "250px",
  }

  return (
    <div style={style}>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          marginLeft: "10px",
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

// New styled section header component
const StyledSectionHeader = ({ title, icon, onToggle, isCollapsed, count, ...props }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 20px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #F69320 0%, #ffb74d 100%)",
        color: "white",
        boxShadow: "0 4px 15px rgba(246, 147, 32, 0.2)",
        marginBottom: isCollapsed ? "10px" : "20px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        ...props.style,
      }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>{title}</h3>
        {count > 0 && (
          <span
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              borderRadius: "20px",
              padding: "2px 10px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {count}
          </span>
        )}
      </div>
      <div>{isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div>
    </div>
  )
}

// Icon mapping for field types
const getIconForField = (fieldName) => {
  const fieldNameLower = fieldName.toLowerCase()
  if (fieldNameLower.includes("name")) return <User size={16} />
  if (fieldNameLower.includes("company") || fieldNameLower.includes("organization")) return <Building size={16} />
  if (fieldNameLower.includes("date")) return <Calendar size={16} />
  if (fieldNameLower.includes("address") || fieldNameLower.includes("location")) return <MapPin size={16} />
  if (fieldNameLower.includes("phone") || fieldNameLower.includes("contact")) return <Phone size={16} />
  if (fieldNameLower.includes("email")) return <Mail size={16} />
  if (fieldNameLower.includes("document") || fieldNameLower.includes("certificate")) return <FileCheck size={16} />
  return <Briefcase size={16} />
}

function TempTenderView() {
  const { activityId } = useParams()
  const [details, setDetails] = useState([])
  const [checkpoints, setCheckpoints] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState("")
  const [windowWidth, setWindowWidth] = useState(1200)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({})

  // Field style variant state
  const [fieldVariant, setFieldVariant] = useState("modern") // Options: default, modern, card, flat

  // User state - check if user is admin
  const [user, setUser] = useState(null)
  const isAdmin = user?.role === "Admin" || user?.role === "Project Manager";

  // Checkpoint groups
  const sections = {
    "Tender Published Details": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    "TENDER PARTICIPATED BY SWCL": [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    "TENDER OPENED DETAILS": [
      31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
    ],
    "LOA AWARDED TO SWCL": [
      59, 60, 126,61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 105, 104, 111
    ],
  }

  const candidateDetailsIds = [2, 4, 5, 7, 6, 18]
  const studentPhotoChkId = 3 // Assume 2 is the image URL
  const priceCheckpoints = [10, 12, 15, 17, 22, 24,26,28,29,62,64,66,70,72];

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Get user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to parse user from localStorage", e)
      }
    }
  }, [])

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [detailsRes, checkpointsRes] = await Promise.all([
          axios.get(
            `https://namami-infotech.com/SANCHAR/src/menu/get_transaction_dtl.php?activityId=${encodeURIComponent(
              activityId,
            )}`,
          ),
          axios.get(`https://namami-infotech.com/SANCHAR/src/menu/get_checkpoints.php`),
        ])

        if (detailsRes.data.success && checkpointsRes.data.success) {
          const checkpointMap = {}
          checkpointsRes.data.data.forEach((cp) => {
            checkpointMap[cp.CheckpointId] = cp.Description
          })
          setCheckpoints(checkpointMap)
          setDetails(detailsRes.data.data)

          // Initialize editedData with current values
          const initialEditData = {}
          detailsRes.data.data.forEach((item) => {
            initialEditData[item.ChkId] = item.Value
          })
          setEditedData(initialEditData)
        } else {
          setError("No details or checkpoints found.")
        }
      } catch (err) {
        setError("Failed to fetch tender details.")
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [activityId])

  const getValueByChkId = (chkId) => {
    const item = details.find((d) => Number.parseInt(d.ChkId) === chkId);
    if (!item) return "";
    
    const value = item.Value;
    
    // Check if the field name contains "date" (case insensitive)
    const fieldName = checkpoints[chkId] || "";
    const isDateField = fieldName.toLowerCase().includes('date');
    
    if (isDateField) {
      return formatDate(value);
    }
    
    return value;
  };

  // Function to check if a value is an image URL
  const isImageUrl = (url) => {
    if (!url || typeof url !== "string") return false
    return (
      url.startsWith("https://") &&
      (url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".png") || url.endsWith(".gif"))
    )
  }

  // Function to check if a value is a PDF URL
  const isPdfUrl = (url) => {
    if (!url || typeof url !== "string") return false
    return url.startsWith("https://") && url.includes(".pdf")
  }

  // Function to open file in new tab
  const openFileInNewTab = (url) => {
    window.open(url, "_blank")
  }

  // Handle input change in edit mode
  const handleInputChange = (chkId, value) => {
    setEditedData((prev) => ({
      ...prev,
      [chkId]: value,
    }))
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // If we're exiting edit mode without saving, reset to original values
      const initialEditData = {}
      details.forEach((item) => {
        initialEditData[item.ChkId] = item.Value
      })
      setEditedData(initialEditData)
    }
    setIsEditing(!isEditing)
  }

  // Toggle section collapse
  const toggleSectionCollapse = (sectionTitle) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }))
  }

  // Cycle through field style variants
  const cycleFieldVariant = () => {
    const variants = ["default", "modern", "card", "flat"]
    const currentIndex = variants.indexOf(fieldVariant)
    const nextIndex = (currentIndex + 1) % variants.length
    setFieldVariant(variants[nextIndex])
  }

  // Function to export data to Excel
  const exportToExcel = () => {
    // Collect all fields that are rendered on the page
    
    // 1. Candidate/Tender Details fields
    const tenderDetailsFields = candidateDetailsIds.map(id => {
      const fieldName = checkpoints[id] || `Checkpoint #${id}`;
      const isDateField = fieldName.toLowerCase().includes('date');
      let value = getValueByChkId(id);
      
      return {
        fieldName: fieldName,
        value: value || "—"
      };
    });

    // 2. Tender Photo field
    const tenderPhotoField = {
      fieldName: checkpoints[studentPhotoChkId] || "Tender Photo",
      value: getValueByChkId(studentPhotoChkId) || "—"
    };

    // 3. Section fields
    const sectionFields = [];
    Object.entries(sections).forEach(([sectionTitle, ids]) => {
      details.forEach(item => {
        const baseId = Number.parseInt(item.ChkId.toString().split("_")[0]);
        if (ids.includes(baseId) && item.Value !== null && item.Value !== "") {
          const label = item.ChkId.includes("_") 
            ? `${checkpoints[item.ChkId.split("_")[1]] || `Checkpoint #${item.ChkId.split("_")[1]}`}`
            : checkpoints[item.ChkId] || `Checkpoint #${item.ChkId}`;
          
          const isDateField = label.toLowerCase().includes('date');
          let value = item.Value;
          
          // Format date for export
          if (isDateField) {
            value = formatDate(value);
          }
          
          sectionFields.push({
            fieldName: label,
            value: value || "—"
          });
        }
      });
    });

    // Combine all fields
    const allFields = [
      ...tenderDetailsFields,
      tenderPhotoField,
      ...sectionFields
    ];

    // Remove duplicates (in case some fields appear in multiple sections)
    const uniqueFields = [];
    const seenFields = new Set();
    
    allFields.forEach(field => {
      if (!seenFields.has(field.fieldName)) {
        seenFields.add(field.fieldName);
        uniqueFields.push(field);
      }
    });

    // Prepare data for export
    const dataToExport = uniqueFields.map(field => ({
      "Field Name": field.fieldName,
      "Value": field.value
    }));

    // Add a header row with Tender ID
    const headerRow = {
      "Field Name": "TENDER DETAILS",
      "Value": `Tender ID: ${activityId}`
    };
    
    const finalData = [headerRow, ...dataToExport];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(finalData, { skipHeader: true });
    
    // Add custom header styling
    const wscols = [
      { wch: 40 }, // Field Name column width
      { wch: 60 }  // Value column width
    ];
    ws['!cols'] = wscols;

    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      
      if (C === 0) {
        // First cell - "TENDER DETAILS"
        ws[address].s = {
          font: { bold: true, sz: 16, color: { rgb: "FF6F00" } },
          alignment: { horizontal: "center" }
        };
      } else {
        // Second cell - Tender ID
        ws[address].s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: "center" }
        };
      }
    }

    // Style the data rows
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[address]) continue;
        
        if (C === 0) {
          // Field Name column
          ws[address].s = {
            font: { bold: true, sz: 12 },
            alignment: { vertical: "top" }
          };
        } else {
          // Value column
          ws[address].s = {
            font: { sz: 11 },
            alignment: { vertical: "top", wrapText: true }
          };
        }
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tender Details");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `Tender_Details_${activityId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Utility function to calculate GST (18%)
  const calculateGST = (amount) => {
    if (!amount || isNaN(amount)) return { withGST: 0, withoutGST: 0 };
    
    const numAmount = parseFloat(amount.toString().replace(/,/g, ''));
    if (isNaN(numAmount)) return { withGST: 0, withoutGST: 0 };
    
    return {
      withGST: numAmount,
      withoutGST: numAmount / 1.18, // Assuming 18% GST
      gstAmount: numAmount - (numAmount / 1.18)
    };
  };

  const FileUploadField = ({ chkId, currentValue, onChange, isEditing }) => {
    const [previewUrl, setPreviewUrl] = useState(currentValue);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
  
    const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      setIsUploading(true);
  
      try {
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPreviewUrl(event.target.result);
          };
          reader.readAsDataURL(file);
        }
  
        // Convert file to base64
        const base64Data = await convertToBase64(file);
        
        // Call your API to upload the file
        const response = await axios.post('https://namami-infotech.com/SANCHAR/src/menu/edit_image.php', {
          ActivityId: activityId,
          ChkId: chkId,
          ImageData: base64Data
        });
  
        if (response.data.success) {
          onChange(chkId, response.data.data.ImageUrl);
          setToast({
            show: true,
            message: 'File uploaded successfully',
            type: 'success'
          });
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setToast({
          show: true,
          message: error.message || 'Failed to upload file',
          type: 'error'
        });
        setPreviewUrl(currentValue); // Revert to previous value
      } finally {
        setIsUploading(false);
      }
    };
  
    const convertToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });
    };
  
    const triggerFileInput = () => {
      fileInputRef.current.click();
    };
  
    if (!isEditing) {
      return null;
    }
  
    return (
      <div style={{ marginTop: '10px' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          style={{ display: 'none' }}
        />
        
        <StyledButton
          onClick={triggerFileInput}
          style={{ width: '100%' }}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload New File'}
        </StyledButton>
        
        {previewUrl && isImageUrl(previewUrl) && (
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              marginTop: '10px',
              borderRadius: '8px'
            }}
          />
        )}
        
        {previewUrl && isPdfUrl(previewUrl) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <FileText size={24} style={{ marginRight: '10px' }} />
            <span>PDF Document</span>
          </div>
        )}
      </div>
    );
  };

  const renderPriceField = (field, isEditing) => {
    const priceData = calculateGST(field.value);
    const formattedWithGST = priceData.withGST.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const formattedWithoutGST = priceData.withoutGST.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const formattedGSTAmount = priceData.gstAmount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return (
      <StyledFieldBox key={field.id} isEditing={isEditing} variant={fieldVariant}>
        <StyledFieldLabel>
          {getIconForField(field.label)}
          {field.label}
        </StyledFieldLabel>
        {isEditing ? (
          <StyledInput
            value={editedData[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder="Enter amount with GST"
          />
        ) : (
          <div>
            <StyledFieldValue style={{ fontWeight: 'bold' }}>
              {formattedWithGST} (Incl. GST)
            </StyledFieldValue>
            <StyledFieldValue style={{ fontSize: '13px', color: '#555' }}>
              {formattedWithoutGST} (Excl. GST)
            </StyledFieldValue>
            <StyledFieldValue style={{ fontSize: '12px', color: '#777' }}>
              {formattedGSTAmount} (GST Amount)
            </StyledFieldValue>
          </div>
        )}
      </StyledFieldBox>
    );
  };

  const renderStudentDetails = () => {
    const fields = candidateDetailsIds.map((id) => {
      const fieldName = checkpoints[id] || `Checkpoint #${id}`;
      const isDateField = fieldName.toLowerCase().includes('date');
      const value = getValueByChkId(id);
      
      return {
        id,
        label: fieldName,
        value: value,
        isDateField,
        isImage: isImageUrl(value),
        isPdf: isPdfUrl(value),
      };
    });
  
    return (
      <StyledCard highlight={true}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Award size={20} color="#F69320" style={{ marginRight: "10px" }} />
            <StyledTitle level={2}>Tender Details</StyledTitle>
          </div>
  
          {isAdmin && (
            <div>
              {isEditing ? (
                <div style={{ display: "flex", gap: "10px" }}>
                  <StyledButton
                    onClick={saveChanges}
                    primary
                    disabled={isSaving}
                    style={{ backgroundColor: "#4caf50" }}
                  >
                    {isSaving ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save size={16} style={{ marginRight: "5px" }} />
                        Save
                      </>
                    )}
                  </StyledButton>
                  <StyledButton onClick={toggleEditMode}>
                    <X size={16} style={{ marginRight: "5px" }} />
                    Cancel
                  </StyledButton>
                </div>
              ) : (
                <StyledButton onClick={toggleEditMode} primary>
                  <Edit size={16} style={{ marginRight: "5px" }} />
                  Edit Details
                </StyledButton>
              )}
            </div>
          )}
        </div>
        <StyledDivider />
  
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Photo and basic info section */}
          <div
            style={{
              display: "flex",
              flexDirection: window.innerWidth < 768 ? "column" : "row",
              gap: "20px",
              alignItems: window.innerWidth < 768 ? "center" : "flex-start",
            }}
          >
            {/* Photo Column */}
            <div
              style={{
                flex: "0 0 auto",
                textAlign: "center",
                position: "relative",
                padding: "10px",
                background: "linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
              }}
            >
              {isEditing ? (
                <div style={{ marginBottom: '15px' }}>
                  <FileUploadField
                    chkId={studentPhotoChkId}
                    currentValue={editedData[studentPhotoChkId] || getValueByChkId(studentPhotoChkId)}
                    onChange={handleInputChange}
                    isEditing={isEditing}
                  />
                </div>
              ) : isPdfUrl(getValueByChkId(studentPhotoChkId)) ? (
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                    border: "2px solid white",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                    margin: "0 auto 10px auto",
                    cursor: "pointer",
                  }}
                  onClick={() => openFileInNewTab(getValueByChkId(studentPhotoChkId))}
                >
                  <FileText size={50} color="#F69320" />
                </div>
              ) : (
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <StyledAvatar src={getValueByChkId(studentPhotoChkId)} alt="Tender Image" size={120} />
                  {isImageUrl(getValueByChkId(studentPhotoChkId)) && (
                    <StyledIconButton onClick={() => openFileInNewTab(getValueByChkId(studentPhotoChkId))}>
                      <Eye size={16} />
                    </StyledIconButton>
                  )}
                </div>
              )}
              <div style={{ fontSize: "14px", fontWeight: "600", marginTop: "5px" }}>Tender</div>
            </div>
  
            {/* Key Details */}
            <div
              style={{ flex: "1", padding: "15px", backgroundColor: "rgba(255, 255, 255, 0.7)", borderRadius: "12px" }}
            >
              <StyledTitle level={3} style={{ color: "#F69320", marginBottom: "15px" }}>
                Key Information
              </StyledTitle>
              <StyledGrid columns={window.innerWidth < 768 ? 1 : 2}>
                {fields
                  .filter((f, idx) => idx < 4 && !f.isImage && !f.isPdf)
                  .map((field, idx) => (
                    <StyledFieldBox
                      key={idx}
                      style={{ backgroundColor: "white" }}
                      isEditing={isEditing}
                      variant={fieldVariant}
                    >
                      <StyledFieldLabel>
                        {field.isDateField ? <Calendar size={16} /> : getIconForField(field.label)}
                        {field.label}
                      </StyledFieldLabel>
                      {isEditing ? (
                        field.isDateField ? (
                          <StyledDateInput
                            value={editedData[field.id] || ""}
                            onChange={(value) => handleInputChange(field.id, value)}
                          />
                        ) : (
                          <StyledInput
                            value={editedData[field.id] || ""}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                          />
                        )
                      ) : (
                        <StyledFieldValue>{field.value || "—"}</StyledFieldValue>
                      )}
                    </StyledFieldBox>
                  ))}
              </StyledGrid>
            </div>
          </div>
  
          {/* Additional Details */}
          <div>
            <StyledTitle level={3} style={{ marginBottom: "15px" }}>
              Additional Details
            </StyledTitle>
            <StyledGrid columns={window.innerWidth < 768 ? 1 : 3}>
              {fields
                .filter((f, idx) => idx >= 4 && !f.isImage && !f.isPdf)
                .map((field, idx) => (
                  <StyledFieldBox key={idx} isEditing={isEditing} variant={fieldVariant}>
                    <StyledFieldLabel>
                      {field.isDateField ? <Calendar size={16} /> : getIconForField(field.label)}
                      {field.label}
                    </StyledFieldLabel>
                    {isEditing ? (
                      field.isDateField ? (
                        <StyledDateInput
                          value={editedData[field.id] || ""}
                          onChange={(value) => handleInputChange(field.id, value)}
                        />
                      ) : (
                        <StyledInput
                          value={editedData[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        />
                      )
                    ) : (
                      <StyledFieldValue>{field.value || "—"}</StyledFieldValue>
                    )}
                  </StyledFieldBox>
                ))}
  
              {/* Render image and PDF fields separately */}
              {fields
                .filter((f) => f.isImage || f.isPdf)
                .map((field, idx) => (
                  <StyledFieldBox key={`file-${idx}`} isEditing={isEditing} variant={fieldVariant}>
                    <StyledFieldLabel>
                      {field.isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                      {field.label}
                    </StyledFieldLabel>
                    {isEditing ? (
                      <>
                        <StyledInput
                          value={editedData[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.isPdf ? "Enter PDF URL" : "Enter image URL"}
                        />
                        <FileUploadField
                          chkId={field.id}
                          currentValue={editedData[field.id] || field.value}
                          onChange={handleInputChange}
                          isEditing={isEditing}
                        />
                      </>
                    ) : field.isImage ? (
                      <StyledButton
                        style={{ marginTop: "5px", padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => openFileInNewTab(field.value)}
                      >
                        <ImageIcon size={14} style={{ marginRight: "5px" }} />
                        View Image
                      </StyledButton>
                    ) : field.isPdf ? (
                      <StyledButton
                        style={{ marginTop: "5px", padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => openFileInNewTab(field.value)}
                      >
                        <FileText size={14} style={{ marginRight: "5px" }} />
                        View PDF
                      </StyledButton>
                    ) : null}
                  </StyledFieldBox>
                ))}
            </StyledGrid>
          </div>
        </div>
      </StyledCard>
    );
  };

  const getGridColumns = () => {
    if (windowWidth < 480) return "1fr"
    if (windowWidth < 768) return "1fr 1fr"
    if (windowWidth < 1200) return "repeat(3, 1fr)"
    return "repeat(4, 1fr)"
  }

  const renderSection = (title, checkpointIds) => {
    const sectionData = details.filter((item) => {
      const baseId = Number.parseInt(item.ChkId.toString().split("_")[0])
      return checkpointIds.includes(baseId) && item.Value !== null && item.Value !== "";
    });

    if (sectionData.length === 0) return null

    const getLabel = (chkId) => {
      if (chkId.includes("_")) {
        const [parentId, childId] = chkId.split("_")
        const parentLabel = checkpoints[parentId] || `Checkpoint #${parentId}`
        const childLabel = checkpoints[childId] || `Checkpoint #${childId}`
        return `${childLabel} (${parentLabel})`
      } else {
        return checkpoints[chkId] || `Checkpoint #${chkId}`
      }
    }

    const isCollapsed = collapsedSections[title]
    const itemCount = sectionData.length

    // Get icon based on section title
    let sectionIcon
    if (title.toLowerCase().includes("published")) {
      sectionIcon = <FileText size={20} color="white" />
    } else if (title.toLowerCase().includes("participated")) {
      sectionIcon = <Briefcase size={20} color="white" />
    } else if (title.toLowerCase().includes("opened")) {
      sectionIcon = <FileCheck size={20} color="white" />
    } else if (title.toLowerCase().includes("awarded")) {
      sectionIcon = <Award size={20} color="white" />
    } else {
      sectionIcon = <FileCheck size={20} color="white" />
    }

    return (
      <div key={title} style={{ marginBottom: "25px" }}>
        <StyledSectionHeader
          title={title}
          icon={sectionIcon}
          onToggle={() => toggleSectionCollapse(title)}
          isCollapsed={isCollapsed}
          count={itemCount}
        />

        {!isCollapsed && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f0f0f0",
            }}
          >
            {/* Single grid for all items - no grouping */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: getGridColumns(),
                gap: "15px",
                width: "100%",
              }}
            >
              {sectionData.map((item, index) => {
                const isImage = isImageUrl(item.Value)
                const isPdf = isPdfUrl(item.Value)
                const isPriceField = priceCheckpoints.includes(Number(item.ChkId));
                const fieldLabel = getLabel(item.ChkId);
                const isDateField = fieldLabel.toLowerCase().includes('date');
                
                // Skip rendering if value is null or empty
                if (!item.Value || item.Value === "") return null;
                
                if (isPriceField) {
                  const field = {
                    id: item.ChkId,
                    label: fieldLabel,
                    value: item.Value
                  };
                  return renderPriceField(field, isEditing);
                }
                
                return (
                  <StyledFieldBox
                    key={`${item.ChkId}-${index}`}
                    isEditing={isEditing}
                    variant={fieldVariant}
                    style={{
                      backgroundColor: isImage || isPdf ? "rgba(246, 147, 32, 0.05)" : undefined,
                      border: isImage || isPdf ? "1px solid rgba(246, 147, 32, 0.2)" : undefined,
                    }}
                  >
                    <StyledFieldLabel>
                      {isImage ? (
                        <ImageIcon size={16} />
                      ) : isPdf ? (
                        <FileText size={16} />
                      ) : isDateField ? (
                        <Calendar size={16} />
                      ) : (
                        getIconForField(fieldLabel)
                      )}
                      {fieldLabel}
                    </StyledFieldLabel>
                
                    {isEditing ? (
                      <>
                        {isImage || isPdf ? (
                          <>
                            <StyledInput
                              value={editedData[item.ChkId] || ""}
                              onChange={(e) => handleInputChange(item.ChkId, e.target.value)}
                              placeholder={isPdf ? "Enter PDF URL" : isImage ? "Enter image URL" : "Enter value"}
                            />
                            <FileUploadField
                              chkId={item.ChkId}
                              currentValue={editedData[item.ChkId] || item.Value}
                              onChange={handleInputChange}
                              isEditing={isEditing}
                            />
                          </>
                        ) : isDateField ? (
                          <StyledDateInput
                            value={editedData[item.ChkId] || ""}
                            onChange={(value) => handleInputChange(item.ChkId, value)}
                          />
                        ) : (
                          <StyledInput
                            value={editedData[item.ChkId] || ""}
                            onChange={(e) => handleInputChange(item.ChkId, e.target.value)}
                          />
                        )}
                      </>
                    ) : isImage ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ position: "relative", marginBottom: "10px" }}>
                          <img
                            src={item.Value || "/placeholder.svg"}
                            alt={fieldLabel}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "2px solid white",
                              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <StyledIconButton onClick={() => openFileInNewTab(item.Value)}>
                            <Eye size={16} />
                          </StyledIconButton>
                        </div>
                        <StyledButton
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => openFileInNewTab(item.Value)}
                        >
                          <ExternalLink size={14} style={{ marginRight: "5px" }} />
                          Open Image
                        </StyledButton>
                      </div>
                    ) : isPdf ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#F69320',
                            backgroundColor: 'rgba(246, 147, 32, 0.1)',
                            marginBottom: '10px'
                          }}
                        >
                          <FileText size={12} style={{ marginRight: '5px' }} />
                          PDF Document
                        </div>
                        <StyledButton
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => openFileInNewTab(item.Value)}
                        >
                          <ExternalLink size={14} style={{ marginRight: "5px" }} />
                          Open PDF
                        </StyledButton>
                      </div>
                    ) : (
                      <StyledFieldValue>
                        {isDateField ? formatDate(item.Value) : item.Value || "—"}
                      </StyledFieldValue>
                    )}
                  </StyledFieldBox>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  };

  // Save changes
  const saveChanges = async () => {
    if (!isAdmin) {
      setToast({
        show: true,
        message: "Only admin users can save changes",
        type: "error",
      })
      return
    }

    setIsSaving(true)
    try {
      // Convert editedData from object to array format expected by API
      const dataToSend = {}
      Object.keys(editedData).forEach((chkId) => {
        dataToSend[chkId] = editedData[chkId]
      })

      const response = await axios.post("https://namami-infotech.com/SANCHAR/src/menu/edit_transaction.php", {
        ActivityId: activityId,
        data: dataToSend,
        LatLong: null, // Add LatLong if needed
      })

      if (response.data.success) {
        // Update local details with edited data
        const updatedDetails = details.map((item) => ({
          ...item,
          Value: editedData[item.ChkId] || item.Value,
        }))

        setDetails(updatedDetails)
        setIsEditing(false)
        setToast({
          show: true,
          message: "Changes saved successfully",
          type: "success",
        })
      } else {
        throw new Error(response.data.message || "Failed to save changes")
      }
    } catch (err) {
      console.error("Error saving changes:", err)
      setToast({
        show: true,
        message: err.message || "Failed to save changes",
        type: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const closeToast = () => {
    setToast({ ...toast, show: false })
  }

  if (loading) {
    return <StyledLoading />
  }

  if (error) {
    return (
      <StyledError>
        <div style={{ fontSize: "24px", marginBottom: "15px" }}>{error}</div>
        <StyledButton primary onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: "5px" }} />
          Go Back
        </StyledButton>
      </StyledError>
    )
  }

  return (
    <StyledContainer>
      {/* Header with Back button */}
      <StyledHeader>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <StyledButton
            primary
            onClick={() => navigate(-1)}
            style={{ padding: "8px", borderRadius: "50%", minWidth: "40px", minHeight: "40px" }}
          >
            <ArrowLeft size={20} />
          </StyledButton>

          <div>
            <StyledTitle level={1} style={{ color: "#F69320", margin: 0 }}>
              SANCHHAR RAILWAY TENDERS
            </StyledTitle>
            <StyledSubtitle style={{ margin: 0 }}>
              TENDER Form Details {isAdmin && <StyledBadge color="#4caf50">Admin Access</StyledBadge>}
            </StyledSubtitle>
          </div>
        </div>

        {/* Logo with decorative elements */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <StyledButton onClick={cycleFieldVariant} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Filter size={16} />
            Style: {fieldVariant.charAt(0).toUpperCase() + fieldVariant.slice(1)}
          </StyledButton>
          
          {/* Add Export to Excel button */}
          <StyledButton 
            onClick={exportToExcel} 
            primary
            style={{ backgroundColor: "#F69320", display: "flex", alignItems: "center", gap: "5px" }}
            title="Export to Excel"
          >
            <Download size={16} />
            Export to Excel
          </StyledButton>
          
          <div style={{ position: "relative" }}>
            <img
              src={logo || "/placeholder.svg"}
              alt="Logo"
              style={{
                maxHeight: "50px",
                position: "relative",
                zIndex: 1,
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
              }}
            />
          </div>
        </div>
      </StyledHeader>

      {/* Main Content */}
      <div style={{ margin: "0 auto" }}>
        {/* Tender Details */}
        {renderStudentDetails()}

        {/* Remaining Sections */}
        {Object.entries(sections).map(([sectionTitle, ids]) => renderSection(sectionTitle, ids))}
      </div>

      {/* Add a floating action button for quick navigation back to top */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 100,
        }}
      >
        <StyledButton
          primary
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            padding: 0,
            boxShadow: "0 4px 15px rgba(246, 147, 32, 0.3)",
          }}
        >
          <ArrowLeft size={24} style={{ transform: "rotate(90deg)" }} />
        </StyledButton>
      </div>

      {/* Toast notification */}
      {toast.show && <StyledToast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Add global styles */}
      <style>{`
        * {
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </StyledContainer>
  )
}

export default TempTenderView