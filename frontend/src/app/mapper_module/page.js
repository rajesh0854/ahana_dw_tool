'use client'

import React, { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ButtonGroup,
  Menu,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  useTheme as useMuiTheme,
  alpha,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Code as CodeIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  FormatIndentIncrease as FormatIcon,
  BugReport as VerifyIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Search as SearchIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Clear as ClearIcon,
  FileDownload as FileDownloadIcon,
  FileCopy as FileCopyIcon,
  Description as DescriptionIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  PlayArrow as PlayArrowIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
} from '@mui/icons-material'
import { message } from 'antd'
import { useTheme } from '@/context/ThemeContext'
import Editor from '@monaco-editor/react'
import { format } from 'sql-formatter'
import { z } from 'zod'
import axios from 'axios'
import { motion } from 'framer-motion'

const MapperModule = () => {
  const { darkMode } = useTheme()
  const muiTheme = useMuiTheme()
  
  // New state variables for the table view
  const [showReferenceTable, setShowReferenceTable] = useState(true)
  const [showMapperForm, setShowMapperForm] = useState(false)
  const [allReferences, setAllReferences] = useState([])
  const [loadingReferences, setLoadingReferences] = useState(false)
  const [referenceTablePage, setReferenceTablePage] = useState(0)
  const [referenceRowsPerPage, setReferenceRowsPerPage] = useState(10)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedReference, setSelectedReference] = useState(null)
  
  // Add search state for references table
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredReferences, setFilteredReferences] = useState([])
  
  // Existing state variables
  const [rows, setRows] = useState(
    [...Array(10)].map(() => ({
      mapdtlid: '',
      fieldName: '',
      dataType: '',
      primaryKey: false,
      pkSeq: '',
      nulls: false,
      logic: '',
      validator: 'N',
      keyColumn: '',
      valColumn: '',
      mapCombineCode: '',
      LogicVerFlag: '',
      scdType: '1',  // Store PRCD for SCD Type
      fieldDesc: '' // Add field description property
    }))
  )

  // Add state for data type options
  const [dataTypeOptions, setDataTypeOptions] = useState([])

  // Add useEffect to fetch data type options
  useEffect(() => {
    const fetchDataTypeOptions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/get-parameter-mapping-datatype`)
        if (!response.ok) {
          throw new Error('Failed to fetch data type options')
        }
        const data = await response.json()
        setDataTypeOptions(data)
      } catch (error) {
        console.error('Error fetching data type options:', error)
        message.error('Failed to load data type options')
      }
    }

    fetchDataTypeOptions()
  }, [])

  const [isUpperSectionExpanded, setIsUpperSectionExpanded] = useState(false)

  const [formData, setFormData] = useState({
    reference: '',
    description: '',
    mapperId: '',
    targetSchema: '',
    tableName: '',
    tableType: '',
    freqCode: '',
    sourceSystem: '',
    bulkProcessRows: '',
    
  })

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Add state for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Add these state variables at the top with other states
  const [showSqlEditor, setShowSqlEditor] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState(null)
  const [sqlEditorContent, setSqlEditorContent] = useState('')
  const [sqlError, setSqlError] = useState(null)

  // Add new states for search functionality
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [lastSearchedRef, setLastSearchedRef] = useState('')

  // Add state for tracking if this is an update
  const [isUpdateMode, setIsUpdateMode] = useState(false)

  // Add state for selected row's SQL logic
  const [selectedRowLogic, setSelectedRowLogic] = useState('')

  // Add state for tracking modifications
  const [modifiedFields, setModifiedFields] = useState({})
  const [modifiedRows, setModifiedRows] = useState([])
  const [originalFormData, setOriginalFormData] = useState(null)
  const [originalRows, setOriginalRows] = useState(null)

  // Add state for tracking validated rows
  const [validatedRows, setValidatedRows] = useState([])

  // Add new state for tracking validation status
  const [validationStatus, setValidationStatus] = useState({})

  // Add new state for error messages and logs dialog
  const [errorMessages, setErrorMessages] = useState({});

  // Add new state variables for button workflow
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showValidateButton, setShowValidateButton] = useState(false)
  const [hasBeenValidated, setHasBeenValidated] = useState(false)
  const [allRowsValidated, setAllRowsValidated] = useState(false)

  // Add new state for key sequence errors
  const [pkSeqErrors, setPkSeqErrors] = useState({})

  // Add new state for tracking duplicate keys in the header
  const [hasDuplicateKeys, setHasDuplicateKeys] = useState(false)

  // Add state for SCD type options
  const [scdTypeOptions, setScdTypeOptions] = useState([])

  // Add new state for tracking warnings
  const [rowWarnings, setRowWarnings] = useState({})

  // Add constants for select options
  const TABLE_TYPES = [
    { value: 'NRM', label: 'Normal' },
    { value: 'DIM', label: 'Dimension' },
    { value: 'FCT', label: 'Fact' },
    { value: 'MRT', label: 'Mart' },
  ]

  const FREQ_CODES = [
    { value: 'ID', label: 'Intraday' },
    { value: 'DL', label: 'Daily' },
    { value: 'WK', label: 'Weekly' },
    { value: 'FN', label: 'Fortnightly' },
    { value: 'MN', label: 'Monthly' },
    { value: 'HY', label: 'Half-Yearly' },
    { value: 'YR', label: 'Yearly' },
  ]

  // Add these state variables with the other states
  const [templateAnchorEl, setTemplateAnchorEl] = useState(null)
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null)
  const [uploadAnchorEl, setUploadAnchorEl] = useState(null)

  // Fetch all mapper references
  const fetchAllReferences = async () => {
    setLoadingReferences(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mapper/get-all-mapper-reference`)
      if (response.data) {
        setAllReferences(response.data)
        setFilteredReferences(response.data) // Initialize filtered references with all references
      }
    } catch (error) {
      console.error('Error fetching mapper references:', error)
      message.error('Failed to load mapper references')
    } finally {
      setLoadingReferences(false)
    }
  }

  // Use effect to fetch all references on component mount
  useEffect(() => {
    fetchAllReferences()
  }, [])

  // Add this useEffect to initialize SQL editor content
  useEffect(() => {
    if (showSqlEditor && selectedRowIndex !== null) {
      setSqlEditorContent(rows[selectedRowIndex].logic || '')
    }
  }, [showSqlEditor, selectedRowIndex])

  // Add useEffect to update allRowsValidated state based on current row validation status
  useEffect(() => {
    if (hasBeenValidated) {
      const filledRows = rows.filter(row => 
        row.fieldName.trim() !== '' || 
        row.dataType.trim() !== '' || 
        row.keyColumn.trim() !== '' || 
        row.valColumn.trim() !== '' || 
        row.mapCombineCode.trim() !== '' ||
        row.logic.trim() !== ''
      );
      
      if (filledRows.length === 0) {
        setAllRowsValidated(false);
      } else {
        const allValid = filledRows.every(row => row.LogicVerFlag === 'Y');
        setAllRowsValidated(allValid);
      }
    }
  }, [rows, hasBeenValidated])

  // Add loading state
  const [isSaving, setIsSaving] = useState(false)
  // Add state for validation loading
  const [isValidating, setIsValidating] = useState(false)

  // Configure message position
  useEffect(() => {
    message.config({
      top: 24,
      duration: 3,
      maxCount: 3,
      rtl: false,
      getContainer: () => document.body,
    })
    
    // Small initialization delay to prevent potential render loops
    const timer = setTimeout(() => {
      // Initialize any required states here if needed
    }, 0);
    
    return () => clearTimeout(timer);
  }, [])

  // Zod schema for reference field validation
  const referenceSchema = z
    .string()
    .regex(/^[a-zA-Z0-9_]*$/, {
      message: 'Reference can only contain letters, numbers, and underscores',
    })
    .transform(val => val.toUpperCase())

  // Add new state variables for form field errors
  const [referenceError, setReferenceError] = useState('')
  const [schemaError, setSchemaError] = useState('')
  const [tableNameError, setTableNameError] = useState('')

  // Add state for tracking if mapper is activated
  const [isActivated, setIsActivated] = useState(false)

  // Add new state for tracking activation status
  const [isActivationSuccessful, setIsActivationSuccessful] = useState(false)

  // Add function to handle activation
  const handleActivate = async () => {
    // Only allow activation if all rows are valid
    if (!allRowsValidated || !hasBeenValidated) {
      message.error('All rows must be validated successfully before activation')
      return
    }
    
    try {
      // Call the activate-deactivate API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/activate-deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mapref: formData.reference,
          statusFlag: 'A'  // 'A' for activate
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsActivated(true);
        setIsActivationSuccessful(true); // Set activation success flag
        message.success(data.message || 'Mapper activated successfully');
      } else {
        setIsActivationSuccessful(false); // Reset activation success flag
        message.error(data.message || 'Failed to activate mapper');
      }
      
      // Keep the validate button visible regardless of success/failure
      setShowValidateButton(true);
      
    } catch (error) {
      setIsActivationSuccessful(false); // Reset activation success flag on error
      message.error('Failed to activate mapper: ' + (error.message || 'Unknown error'));
      // Keep the validate button visible even on error
      setShowValidateButton(true);
    }
  }

  // Add function to prevent spaces in input
  const preventSpaces = (value) => {
    return value.replace(/\s/g, '')
  }

  // Modify handleFormChange to reset activation state when changes are made
  const handleFormChange = (field, value) => {
    // Fields that should not allow spaces
    const noSpaceFields = ['targetSchema', 'tableName', 'sourceSystem']
    
    // If the field should not allow spaces, remove them
    if (noSpaceFields.includes(field)) {
      value = preventSpaces(value)
    }

    // If the field is reference, validate and transform using Zod
    if (field === 'reference') {
      try {
        // Only allow letters, numbers, and underscores
        if (!/^[a-zA-Z0-9_]*$/.test(value)) {
          message.error('Reference can only contain letters, numbers, and underscores')
          setReferenceError('invalid')
        } else {
          const validatedValue = referenceSchema.parse(value)
          value = validatedValue
          setReferenceError('') // Clear error on successful validation
        }
      } catch (error) {
        // If validation fails, show error message but still update the field
        if (error.errors && error.errors.length > 0) {
          message.error(error.errors[0].message)
          setReferenceError('invalid')
        }
      }
    }
    
    // Validate targetSchema - must start with a letter and only contain uppercase letters, numbers, and underscores
    if (field === 'targetSchema') {
      // Convert to uppercase
      value = value.toUpperCase();
      
      // Check if it starts with a letter and only contains allowed characters
      if (value && !/^[A-Z][A-Z0-9_]*$/.test(value)) {
        if (!/^[A-Z].*$/.test(value) && value.length > 0) {
          message.error('Target Schema must start with a letter')
        } else {
          message.error('Target Schema can only contain uppercase letters, numbers, and underscores')
        }
        setSchemaError('invalid')
      } else {
        setSchemaError('')
      }
    }
    
    // Validate tableName - must start with a letter and only contain uppercase letters, numbers, and underscores
    if (field === 'tableName') {
      // Convert to uppercase
      value = value.toUpperCase();
      
      // Check if it starts with a letter and only contains allowed characters
      if (value && !/^[A-Z][A-Z0-9_]*$/.test(value)) {
        if (!/^[A-Z].*$/.test(value) && value.length > 0) {
          message.error('Target Table must start with a letter')
        } else {
          message.error('Target Table can only contain uppercase letters, numbers, and underscores')
        }
        setTableNameError('invalid')
      } else {
        setTableNameError('')
      }
    }

    // Handle tableType changes
    if (field === 'tableType') {
      const prevTableType = formData.tableType;
      
      // If changing to DIM or from DIM, mark all rows as modified
      if ((value === 'DIM' && prevTableType !== 'DIM') || (value !== 'DIM' && prevTableType === 'DIM')) {
        // Get indices of all rows that have any data
        const filledRowIndices = rows.map((row, index) => 
          row.fieldName.trim() !== '' || 
          row.dataType.trim() !== '' || 
          row.logic.trim() !== '' ? 
          index : null
        ).filter(index => index !== null);
        
        // Add all filled rows to modifiedRows
        setModifiedRows(prev => {
          const newModifiedRows = [...prev];
          filledRowIndices.forEach(index => {
            if (!newModifiedRows.includes(index)) {
              newModifiedRows.push(index);
            }
          });
          return newModifiedRows;
        });
      }
      
      // If changing from DIM to something else, reset all scdType values
      if (value !== 'DIM' && prevTableType === 'DIM') {
        setRows(prevRows => prevRows.map(row => ({
          ...row,
          scdType: ''  // Reset to '1' instead of empty string
        })));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Track modifications if this is an update
    if (originalFormData) {
      setModifiedFields((prev) => ({
        ...prev,
        [field]: originalFormData[field] !== value,
      }))
    }
    
    // Set hasUnsavedChanges to true and reset validation states when changes are made
    setHasUnsavedChanges(true)
    setShowValidateButton(false)
    setHasBeenValidated(false)
    setAllRowsValidated(false)
    setIsActivated(false)
    setIsActivationSuccessful(false) // Reset activation success state when changes are made
  }

  // Add new function to handle search trigger
  const handleSearchTrigger = () => {
    const reference = formData.reference.trim();
    // Only proceed with search if reference is not empty and contains only letters, numbers, and underscores
    if (reference && /^[a-zA-Z0-9_]+$/.test(reference)) {
      fetchReferenceDetails(reference)
    } else if (reference && !/^[a-zA-Z0-9_]+$/.test(reference)) {
      // If reference contains invalid characters, show error but don't make API call
      setReferenceError('Reference can only contain letters, numbers, and underscores')
    }
  }

  // Add new function to handle key press
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearchTrigger()
    }
  }

  // Function to check for .s across all rows
  const checkDuplicateKeySequences = (rows) => {
    const keySeqValues = {};
    let hasDuplicates = false;
    
    // First pass: collect all key sequence values from primary key rows
    rows.forEach((row, index) => {
      // Only consider rows where primaryKey is true AND pkSeq has a value
      if (row.primaryKey && row.pkSeq !== '') {
        if (!keySeqValues[row.pkSeq]) {
          keySeqValues[row.pkSeq] = [index];
        } else {
          keySeqValues[row.pkSeq].push(index);
          hasDuplicates = true;
        }
      }
    });
    
    // Update duplicate status
    setHasDuplicateKeys(hasDuplicates);
    
    // Return the duplicate map for individual error handling
    return { hasDuplicates, keySeqValues };
  };

  // Modify handleRowChange to reset activation state when changes are made
  const handleRowChange = (index, field, value) => {
    // Fields that should not allow spaces
    const noSpaceFields = ['fieldName', 'dataType', 'keyColumn', 'valColumn', 'mapCombineCode']
    
    // If the field should not allow spaces, remove them
    if (noSpaceFields.includes(field)) {
      value = preventSpaces(value)
    }

    const newRows = [...rows]
    newRows[index] = {
      ...newRows[index],
      [field]: value,
    }
    
    // Reset LogicVerFlag when keyColumn, valColumn, or logic is modified
    if (field === 'keyColumn' || field === 'valColumn' || field === 'logic') {
      newRows[index].LogicVerFlag = ''
    }
    
    // Special handling for primaryKey changes
    if (field === 'primaryKey') {
      // If unchecking primary key
      if (value === false) {
        // Clear the pkSeq
        newRows[index].pkSeq = '';
        
        // Clear any pkSeq errors and warnings for this row
        setPkSeqErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[index];
          return newErrors;
        });
        
        setRowWarnings(prev => {
          const newWarnings = {...prev};
          delete newWarnings[index];
          return newWarnings;
        });
      }
    }

    // When primaryKey or pkSeq changes, verify uniqueness of all key sequences
    if ((field === 'pkSeq' && newRows[index].primaryKey) || field === 'primaryKey') {
      const { hasDuplicates, keySeqValues } = checkDuplicateKeySequences(newRows);
      
      // Update error messages for each row
      const newPkSeqErrors = {...pkSeqErrors};
      const newWarnings = {...rowWarnings};
      
      // Clear all existing key sequence errors first
      Object.keys(newPkSeqErrors).forEach(key => {
        if (newPkSeqErrors[key] === 'Duplicate key sequence') {
          delete newPkSeqErrors[key];
        }
      });
      
      Object.keys(newWarnings).forEach(key => {
        if (newWarnings[key] === 'Duplicate key sequence detected') {
          delete newWarnings[key];
        }
      });
      
      if (hasDuplicates) {
        // Set error messages only for rows with duplicates
        Object.entries(keySeqValues).forEach(([seqValue, indices]) => {
          if (indices.length > 1) {
            indices.forEach(rowIndex => {
              if (newRows[rowIndex].primaryKey) { // Only set errors for rows that are still primary keys
                newPkSeqErrors[rowIndex] = 'Duplicate key sequence';
                newWarnings[rowIndex] = 'Duplicate key sequence detected';
              }
            });
          }
        });
      }
      
      setPkSeqErrors(newPkSeqErrors);
      setRowWarnings(newWarnings);
      
      if (hasDuplicates && field === 'pkSeq') {
        message.warning('Duplicate key sequence values are not allowed');
      }
    }
    
    setRows(newRows);

    // Track modifications if this is an update
    if (originalRows) {
      // Check if the row is already in modifiedRows
      const isAlreadyModified = modifiedRows.includes(index);
      
      // Check if the current field value is different from the original
      const isFieldModified = JSON.stringify(originalRows[index]?.[field]) !== JSON.stringify(value);
      
      // Add to modifiedRows if not already there and the field is modified
      if (!isAlreadyModified && isFieldModified) {
        setModifiedRows((prev) => [...prev, index]);
      }
    }
    
    // Set hasUnsavedChanges to true and reset validation states when changes are made
    setHasUnsavedChanges(true);
    setShowValidateButton(false);
    setHasBeenValidated(false);
    setAllRowsValidated(false);
    setIsActivated(false);
    setIsActivationSuccessful(false); // Reset activation success state when changes are made
  }

  // Modify addRow to check for duplicates after adding a row
  const addRow = () => {
    const newRows = [
      ...rows,
      {
        mapdtlid: '',
        fieldName: '',
        dataType: '',
        primaryKey: false,
        pkSeq: '',
        nulls: false,
        logic: '',
        validator: 'N',
        keyColumn: '',
        valColumn: '',
        mapCombineCode: '',
        LogicVerFlag: '',
        scdType: scdTypeOptions.length > 0 ? scdTypeOptions[0].PRCD : '1',
        fieldDesc: ''
      },
    ];
    
    setRows(newRows);
    
    // Check for duplicates after adding the row
    setTimeout(() => checkDuplicateKeySequences(newRows), 0);
  }

  // Add useEffect to check for duplicates when rows change
  useEffect(() => {
    checkDuplicateKeySequences(rows);
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Function to copy SQL content
  const handleCopySQL = () => {
    navigator.clipboard.writeText(formData.logic || '')
    message.success('Logic copied to clipboard')
  }

  // Function to format SQL
  const handleFormatSQL = () => {
    try {
      const formatted = format(formData.logic || '', {
        language: 'sql',
        indent: '    ',
        uppercase: true,
      })
      setFormData((prev) => ({
        ...prev,
        logic: formatted,
      }))
      message.success('Logic formatted successfully')
    } catch (error) {
      message.error('Failed to format Logic')
    }
  }

  // Function to verify SQL syntax
  const handleVerifySQL = () => {
    try {
      format(formData.logic || '')
      message.success('Logic syntax is valid')
    } catch (error) {
      message.error('Logic syntax error detected')
    }
  }

  // Add this function to reset all fields
  const resetAllFields = () => {
    // Reset form data
    setFormData({
      reference: '',
      description: '',
      mapperId: '',
      targetSchema: '',
      tableName: '',
      tableType: '',
      freqCode: '',
      sourceSystem: '',
      bulkProcessRows: '',
    })

    // Reset rows to initial state with 10 empty rows
    setRows(
      [...Array(10)].map(() => ({
        mapdtlid: '',
        fieldName: '',
        dataType: '',
        primaryKey: false,
        pkSeq: '',
        nulls: false,
        logic: '',
        validator: 'N',
        keyColumn: '',
        valColumn: '',
        mapCombineCode: '',
        LogicVerFlag: '',
        scdType: scdTypeOptions.length > 0 ? scdTypeOptions[0].PRCD : '1', // Use PRCD for storage
        fieldDesc: '' // Add field description
      }))
    )

    // Reset pagination to first page
    setPage(0)
    
    // Reset workflow state variables
    setHasUnsavedChanges(false)
    setShowValidateButton(false)
    setHasBeenValidated(false)
    setAllRowsValidated(false)
    setIsActivated(false)
  }

  // Modified handleSave to return to reference table after successful save
  const handleSave = async () => {
    // Validate form fields
    try {
      // Create a schema using zod for form validation
      const formSchema = z.object({
        reference: z.string().min(1, 'Reference is required').max(30, 'Reference cannot exceed 30 characters'),
        description: z.string().min(1, 'Description is required').max(255, 'Description cannot exceed 255 characters'),
        targetSchema: z.string().min(1, 'Target Schema is required').max(30, 'Target Schema cannot exceed 30 characters'),
        tableName: z.string().min(1, 'Table Name is required').max(30, 'Table Name cannot exceed 30 characters'),
        tableType: z.string().min(1, 'Table Type is required'),
        freqCode: z.string().min(1, 'Frequency Code is required'),
        sourceSystem: z.string().min(1, 'Source System is required').max(30, 'Source System cannot exceed 30 characters'),
        bulkProcessRows: z.string().regex(/^\d*$/, 'Must be a number').transform(val => val === '' ? '0' : val),
      })

      // Validate form data
      formSchema.parse(formData)
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          message.error(`${err.path}: ${err.message}`)
        })
        return
      }
    }

    // Check if there are any rows added
    if (!rows.some(row => row.fieldName)) {
      message.error('At least one row must be added to the table')
      return
    }

    // Ensure no rows with duplicate field names
    const fieldNames = rows.filter(row => row.fieldName).map(row => row.fieldName.toLowerCase())
    const uniqueFieldNames = new Set(fieldNames)
    if (fieldNames.length !== uniqueFieldNames.size) {
      message.error('Field names must be unique')
      return
    }

    // Check if all required fields are filled for all rows with a field name
    const rowsWithFieldName = rows.filter(row => row.fieldName)
    const incompleteRows = rowsWithFieldName.filter(row => !row.dataType)
    if (incompleteRows.length > 0) {
      message.error('All rows with a field name must have a data type')
      return
    }

    // Check if we have any duplicate key sequences
    if (hasDuplicateKeys) {
      message.error('Duplicate key sequence values are not allowed')
      return
    }

    // Check if all rows have been validated
    if (!areAllRowsValid()) {
      message.warning('Not all rows have been validated. Please validate before saving.')
      return
    }

    setIsSaving(true)

    try {
      // Prepare the data to be sent
      const dataToSend = {
        formData: {
          ...formData,
          bulkProcessRows: formData.bulkProcessRows || '0', // Default to 0 if empty
        },
        rows: rows.filter(row => row.fieldName), // Only send rows with a field name
        modifiedRows: modifiedRows, // Send the list of modified row indices
      }

      // Make the API call to save
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/mapper/save-to-db`, dataToSend)

      // Handle successful response
      message.success('Mapper configuration saved successfully')

      // Update mapperId if it was a new mapping
      if (!isUpdateMode && response.data.mapperId) {
        setFormData(prev => ({
          ...prev,
          mapperId: response.data.mapperId,
        }))
      }

      // Update mapdtlids for new rows
      if (response.data.processedRows) {
        const updatedRows = [...rows]
        response.data.processedRows.forEach(processedRow => {
          if (updatedRows[processedRow.index]) {
            updatedRows[processedRow.index].mapdtlid = processedRow.mapdtlid
          }
        })
        setRows(updatedRows)
      }

      // Reset state
      setHasUnsavedChanges(false)
      setModifiedRows([])
      setModifiedFields({})
      
      // Set as update mode since we now have IDs
      setIsUpdateMode(true)
      
      // Store the current state as the original
      setOriginalFormData({...formData})
      setOriginalRows([...rows])
      
      // After saving, navigate back to the reference table
      setTimeout(() => {
        handleReturnToReferenceTable()
      }, 1500) // Short delay to allow user to see success message
    } catch (error) {
      console.error('Error saving mapper:', error)
      message.error(error.response?.data?.error || 'Failed to save mapper configuration')
    } finally {
      setIsSaving(false)
    }
  }

  // Add these handler functions
  const handleOpenSqlEditor = (index) => {
    setSelectedRowIndex(index)
    setShowSqlEditor(true)
    setSqlError(null)
  }

  const handleSaveSql = () => {
    const newRows = [...rows]
    newRows[selectedRowIndex] = {
      ...newRows[selectedRowIndex],
      logic: sqlEditorContent,
    }
    setRows(newRows)
    setShowSqlEditor(false)
    message.success('SQL logic saved successfully')
  }
  // Handler function for downloading template
  const downloadTemplate = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/download-template`);
        if (!response.ok) {
            throw new Error('Failed to download template');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mapper_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading template:', error);
        setError('Failed to download template');
    }
};

  const handleFileUpload = async (event) => {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        console.log(formData);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload file');
        }

        const data = await response.json();
        
        // Remove excluded fields from form data
        const { mapperId, ...cleanedFormData } = data.formData;
        
        // Remove excluded fields from rows
        const cleanedRows = data.rows.map(row => {
            const { NewRow, validator, mapdtlid, mapref, LogicVerFlag, ...cleanedRow } = row;
            return { ...cleanedRow, isNewRow: true }; // Set isNewRow to true for all rows
        });

        setFormData(cleanedFormData);
        setRows(cleanedRows);
        console.log(cleanedRows);
        console.log(cleanedFormData); 

        // Reset all validation and workflow states
        setHasUnsavedChanges(true); // Make save button visible
        setShowValidateButton(false);
        setHasBeenValidated(false);
        setAllRowsValidated(false);
        setIsActivated(false);
        setIsActivationSuccessful(false);
        
        // Reset validation status and errors
        setValidationStatus({});
        setErrorMessages({});
        setRowWarnings({});
        setPkSeqErrors({});
        setHasDuplicateKeys(false);
        
        // Reset modification tracking
        setModifiedFields({});
        setModifiedRows([]);
        
        // Reset original data since this is a new upload
        setOriginalFormData(null);
        setOriginalRows(null);
        
        message.success('File uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        message.error('Failed to upload file');
    }
};

  // Add these validation functions at the top
  const validateNumberInput = (value) => {
    // Allow empty string or numbers
    return value === '' || /^\d+$/.test(value)
  }

  const validateVarchar = (value, maxLength) => {
    return value.length <= maxLength
  }

  // Add this to handle number input changes
  const handleNumberChange = (event, index, field) => {
    const value = event.target.value
    if (validateNumberInput(value)) {
      handleRowChange(index, field, value)
    }
  }

  // Modify fetchReferenceDetails to clear warnings when changing mapping ID
  const fetchReferenceDetails = async (reference) => {
    // Don't proceed if reference is empty or contains invalid characters
    if (!reference || !/^[a-zA-Z0-9_]+$/.test(reference)) {
      message.error('Reference can only contain letters, numbers, and underscores')
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mapper/get-by-reference/${reference}`)
      const data = response.data

      setFormData(data.formData)
      setRows(
        data.rows.length > 0
          ? data.rows.map(row => ({ 
              ...row, 
              validator: row.validator || 'N',
              keyColumn: row.keyColumn || '',
              valColumn: row.valColumn || '',
              mapCombineCode: row.mapCombineCode || '',
              LogicVerFlag: row.LogicVerFlag || '',
              scdType: row.scdType || '1',
              fieldDesc: row.fieldDesc || ''
            }))
          : [...Array(10)].map(() => ({
              mapdtlid: '',
              fieldName: '',
              dataType: '',
              primaryKey: false,
              pkSeq: '',
              nulls: false,
              logic: '',
              validator: 'N',
              keyColumn: '',
              valColumn: '',
              mapCombineCode: '',
              LogicVerFlag: '',
              scdType: '1',
              fieldDesc: ''
            }))
      )

      // Store original data for change tracking
      setOriginalFormData(data.formData)
      setOriginalRows(data.rows)
      setValidationStatus({})
      setLastSearchedRef(reference)
      setIsUpdateMode(true)

      // Reset modification tracking and warnings
      setModifiedFields({})
      setModifiedRows([])
      setRowWarnings({})
      setPkSeqErrors({})
      setHasDuplicateKeys(false)
      
      // Reset workflow states
      setHasUnsavedChanges(false)
      setShowValidateButton(true)
      setHasBeenValidated(false)
      setAllRowsValidated(false)
      setIsActivated(false)
      
      // Show the mapper form
      setShowReferenceTable(false)
      setShowMapperForm(true)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Keep the reference but reset other fields
        setFormData((prev) => ({
          reference: reference,
          description: '',
          mapperId: '',
          targetSchema: '',
          tableName: '',
          tableType: '',
          freqCode: '',
          sourceSystem: '',
          bulkProcessRows: '',
        }))
        setRows(
          [...Array(10)].map(() => ({
            mapdtlid: '',
            fieldName: '',
            dataType: '',
            primaryKey: false,
            pkSeq: '',
            nulls: false,
            logic: '',
            validator: 'N',
            keyColumn: '',
            valColumn: '',
            mapCombineCode: '',
            LogicVerFlag: '',
            scdType: '1',
            fieldDesc: ''
          }))
        )
        setLastSearchedRef(reference)
        setIsUpdateMode(false)
        
        // Reset all states for new reference
        setHasUnsavedChanges(false)
        setShowValidateButton(false)
        setHasBeenValidated(false)
        setAllRowsValidated(false)
        setIsActivated(false)
        setRowWarnings({})
        setPkSeqErrors({})
        setHasDuplicateKeys(false)
        
        message.info('New reference will be created')
        
        // Show the mapper form
        setShowReferenceTable(false)
        setShowMapperForm(true)
      } else {
        message.error(error.response?.data?.error || 'Failed to fetch reference details')
        console.error('Error fetching reference:', error)
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Modify the handleRowClick to update selected row's logic
  const handleRowClick = (index) => {
    setSelectedRowIndex(index)
    setSelectedRowLogic(rows[index].logic || '')
  }

  // Add function to update logic for selected row
  const handleLogicChange = (newLogic) => {
    if (selectedRowIndex !== null) {
      const newRows = [...rows]
      newRows[selectedRowIndex] = {
        ...newRows[selectedRowIndex],
        logic: newLogic,
        // Reset LogicVerFlag when logic is changed
        LogicVerFlag: ''
      }
      setRows(newRows)
      setSelectedRowLogic(newLogic)
      
      // Track modifications if this is an update
      if (originalRows) {
        // Check if the row is already in modifiedRows
        const isAlreadyModified = modifiedRows.includes(selectedRowIndex);
        
        // Check if the current logic value is different from the original
        const isLogicModified = JSON.stringify(originalRows[selectedRowIndex]?.logic) !== JSON.stringify(newLogic);
        
        // Add to modifiedRows if not already there and the logic is modified
        if (!isAlreadyModified && isLogicModified) {
          setModifiedRows((prev) => [...prev, selectedRowIndex]);
        }
      }
      
      // Reset validation status for this row
      setValidationStatus(prev => ({
        ...prev,
        [selectedRowIndex]: undefined
      }))
      
      // Set hasUnsavedChanges to true and reset validation states when logic is changed
      setHasUnsavedChanges(true)
      setShowValidateButton(false)
      setHasBeenValidated(false)
      setAllRowsValidated(false)
    }
  }

  // Function to show logs for a specific row
  const handleShowLogs = (rowIndex) => {
    const message = errorMessages[rowIndex] || 'No logs available for this row.';
    const rowName = rows[rowIndex]?.fieldName ? rows[rowIndex].fieldName : `Row ${rowIndex + 1}`;
    
    setCurrentLogMessage(message);
    setLogsDialogTitle(`Validation Logs - ${rowName}`);
    setShowLogsDialog(true);
  };

  // Function to close logs dialog
  const handleCloseLogsDialog = () => {
    setShowLogsDialog(false);
  };

  // Update handleValidateRow function to call both APIs
  const handleValidateRow = async (index) => {
    const currentRow = rows[index]
    
    // Check if required fields are filled
    if (!currentRow.keyColumn || !currentRow.valColumn || !currentRow.logic) {
      message.error('Please fill in Key Column, Value Column, and SQL Logic')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/validate-logic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_logic: currentRow.logic,
          p_keyclnm: currentRow.keyColumn,
          p_valclnm: currentRow.valColumn
        }),
      })

      const data = await response.json()
      if (data.status === 'success') {
        // Update the row's LogicVerFlag directly in rows state
        const newRows = [...rows]
        newRows[index] = {
          ...newRows[index],
          LogicVerFlag: data.is_valid // 'Y' or 'N'
        }
        setRows(newRows)

        // Store error message if validation failed
        if (data.is_valid === 'N') {
          setErrorMessages(prev => ({
            ...prev,
            [index]: data.message || 'Logic validation failed'
          }))
        } else {
          // Clear any existing error messages for successful validations
          setErrorMessages(prev => {
            const newMessages = {...prev};
            delete newMessages[index];
            return newMessages;
          })
        }

        // Show success/error message
        if (data.is_valid === 'Y') {
          message.success('Logic validation successful')
        } else {
          message.error(data.message || 'Logic validation failed')
        }
      } else {
        throw new Error(data.message || 'Validation failed')
      }
    } catch (error) {
      message.error(error.message || 'Error validating logic')
      // Set LogicVerFlag to 'N' on error
      const newRows = [...rows]
      newRows[index] = {
        ...newRows[index],
        LogicVerFlag: 'N'
      }
      setRows(newRows)
      
      // Store error message
      setErrorMessages(prev => ({
        ...prev,
        [index]: error.message || 'Error validating logic'
      }))
    }
  }

  // Add back the areAllRowsValid function
  const areAllRowsValid = () => {
    // Get rows that have any data filled
    const filledRows = rows.filter(row => 
      row.fieldName.trim() !== '' || 
      row.dataType.trim() !== '' || 
      row.keyColumn.trim() !== '' || 
      row.valColumn.trim() !== '' || 
      row.mapCombineCode.trim() !== '' ||
      row.logic.trim() !== ''
    );

    // If no filled rows, return false
    if (filledRows.length === 0) return false;

    // Check if all filled rows have LogicVerFlag as 'Y'
    const allValid = filledRows.every(row => row.LogicVerFlag === 'Y');
    
    // Don't update state here during render - this causes infinite re-renders
    // Only perform the check and return the value
    return allValid;
  };

  // Update validateAll function to use the batch validation API
  const validateAll = async () => {
    // Get rows that have any data filled
    const filledRows = rows.filter(row => 
      row.fieldName.trim() !== '' || 
      row.dataType.trim() !== '' || 
      row.keyColumn.trim() !== '' || 
      row.valColumn.trim() !== '' || 
      row.mapCombineCode.trim() !== '' ||
      row.logic.trim() !== ''
    )

    if (filledRows.length === 0) {
      message.warning('No rows to validate')
      return
    }

    // Set validating state to true
    setIsValidating(true)
    
    // Show loading message
    message.loading({ content: 'Validating all rows...', key: 'validateAll' })

    try {
      // Call the new batch validation API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/validate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mapref: formData.reference,
          rows: rows
        }),
      })

      const data = await response.json()
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Batch validation failed')
      }

      // Process results and update rows
      const newRows = [...rows]
      let validationMessages = []
      let allValid = true

      // Update LogicVerFlag for each row based on validation results
      data.rowResults.forEach(result => {
        // Find the row index by matching mapdtlid or fieldName if needed
        const rowIndex = rows.findIndex(row => 
          (row.mapdtlid && row.mapdtlid === result.rowId) || 
          (row.fieldName === result.fieldName)
        )

        if (rowIndex !== -1) {
          // Update row validation flag
          newRows[rowIndex] = {
            ...newRows[rowIndex],
            LogicVerFlag: result.isValid ? 'Y' : 'N'
          }

          // Store error messages in state for tooltips
          if (!result.isValid) {
            allValid = false
            setErrorMessages(prev => ({
              ...prev,
              [rowIndex]: result.detailedError || result.error || 'Validation failed'
            }))
            validationMessages.push(`Row ${rowIndex + 1} (${result.fieldName || 'Unnamed'}): ${result.error || 'Validation failed'}`)
          }
        }
      })

      // Update rows with missing required fields
      rows.forEach((row, index) => {
        if ((row.fieldName.trim() !== '' || 
             row.dataType.trim() !== '' || 
             row.keyColumn.trim() !== '' || 
             row.valColumn.trim() !== '' || 
             row.mapCombineCode.trim() !== '' ||
             row.logic.trim() !== '') && 
          (!row.keyColumn || !row.valColumn || !row.logic)) {
        
          newRows[index] = {
            ...newRows[index],
            LogicVerFlag: 'N'
          }
          allValid = false
          
          // Store missing fields error in state for tooltips
          setErrorMessages(prev => ({
            ...prev,
            [index]: 'Missing required fields: Key Column, Value Column, and SQL Logic'
          }))
          
          validationMessages.push(`Row ${index + 1}: Missing required fields`)
        }
      })

      // Update rows state with all validation results
      setRows(newRows)

      // Show final messages
      if (allValid) {
        message.success({ content: 'All rows validated successfully', key: 'validateAll' })
        // Set validation workflow states
        setHasBeenValidated(true)
        setAllRowsValidated(true)
        // Reset activation state when validation is performed
        setIsActivated(false)
        setIsActivationSuccessful(false)
      } else {
        message.error({ 
          content: (
            <div>
              <div>Some rows failed validation:</div>
              {validationMessages.map((msg, idx) => (
                <div key={idx} style={{ marginTop: '8px' }}>{msg}</div>
              ))}
            </div>
          ), 
          key: 'validateAll',
          duration: 5 // Show for longer since there might be multiple messages
        })
        // Set validation workflow states
        setHasBeenValidated(true)
        setAllRowsValidated(false)
        // Reset activation state when validation fails
        setIsActivated(false)
        setIsActivationSuccessful(false)
      }
    } catch (error) {
      message.error({ 
        content: 'Error validating rows: ' + (error.message || 'Unknown error'), 
        key: 'validateAll' 
      });
      console.error('Validation error:', error);
      
      // Set validation workflow states on error
      setHasBeenValidated(true)
      setAllRowsValidated(false)
      // Reset activation state on error
      setIsActivated(false)
      setIsActivationSuccessful(false)
    } finally {
      // Set validating state to false when done
      setIsValidating(false)
    }
  }

  // Add these handler functions
  const handleTemplateClick = (event) => {
    setTemplateAnchorEl(event.currentTarget)
  }

  const handleTemplateClose = () => {
    setTemplateAnchorEl(null)
    setDownloadAnchorEl(null)
  }

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget)
  }

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null)
  }

  const handleUploadClick = () => {
    document.getElementById('file-upload').click()
    handleTemplateClose()
  }

  const handleDownloadTemplate = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/download-template`);
        if (!response.ok) {
            throw new Error('Failed to download template');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mapper_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading template:', error);
        setError('Failed to download template');
    }
};

  const handleExistingTemplateDownload = async () => {
    try {
      message.loading({ content: 'Preparing template...', key: 'downloadTemplate' })
      
      const payload = {
        formData: formData,
        rows: rows
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/download-current`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.reference || 'mapper'}_template.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      message.success({ content: 'Current template downloaded successfully', key: 'downloadTemplate' })
    } catch (error) {
      message.error({ content: 'Failed to download current template', key: 'downloadTemplate' })
      console.error('Download error:', error)
    }
  }

  const handleFileUpload_ = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setFormData(data.formData)
      setRows(data.rows)
      message.success('File uploaded successfully')
    } catch (error) {
      message.error('Failed to upload file')
      console.error('Upload error:', error)
    }
  }

  // Update handleCreateJob function
  const handleCreateJob = async () => {
    // Double check conditions before proceeding
    if (!allRowsValidated || !hasBeenValidated || !isActivationSuccessful) {
      message.error('Mapper must be validated and activated successfully before creating a job');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/create-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mapref: formData.reference
        })
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message || 'Job created successfully');
      } else {
        message.error(data.message || 'Failed to create job');
      }
    } catch (error) {
      message.error('Failed to create job: ' + (error.message || 'Unknown error'));
    }
  }

  // Add useEffect to fetch SCD type options
  useEffect(() => {
    const fetchScdTypeOptions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mapper/parameter_scd_type`)
        if (!response.ok) {
          throw new Error('Failed to fetch SCD type options')
        }
        const data = await response.json()
        setScdTypeOptions(data)
      } catch (error) {
        console.error('Error fetching SCD type options:', error)
        message.error('Failed to load SCD type options')
      }
    }

    fetchScdTypeOptions()
  }, [])

  const [error, setError] = useState(''); // Add this line to define the error state

  // Function to handle creating a new reference
  const handleCreateNewReference = () => {
    // Reset form data
    setFormData({
      reference: '',
      description: '',
      mapperId: '',
      targetSchema: '',
      tableName: '',
      tableType: '',
      freqCode: '',
      sourceSystem: '',
      bulkProcessRows: '',
    })
    
    // Reset all state variables
    setRows(
      [...Array(10)].map(() => ({
        mapdtlid: '',
        fieldName: '',
        dataType: '',
        primaryKey: false,
        pkSeq: '',
        nulls: false,
        logic: '',
        validator: 'N',
        keyColumn: '',
        valColumn: '',
        mapCombineCode: '',
        LogicVerFlag: '',
        scdType: '1',
        fieldDesc: ''
      }))
    )
    
    setLastSearchedRef('')
    setIsUpdateMode(false)
    
    // Reset workflow states
    setHasUnsavedChanges(false)
    setShowValidateButton(false)
    setHasBeenValidated(false)
    setAllRowsValidated(false)
    setIsActivated(false)
    setValidationStatus({})
    setErrorMessages({})
    setPkSeqErrors({})
    setModifiedRows([])
    setModifiedFields({})
    
    // Show the mapper form and hide the reference table
    setShowReferenceTable(false)
    setShowMapperForm(true)
  }
  
  // Function to handle editing an existing reference
  const handleEditReference = (reference) => {
    if (reference) {
      // The existing fetchReferenceDetails function will be called with this reference
      fetchReferenceDetails(reference)
      
      // Show the mapper form and hide the reference table
      setShowReferenceTable(false)
      setShowMapperForm(true)
    }
  }
  
  // Function to handle showing the delete confirmation dialog
  const handleShowDeleteDialog = (reference) => {
    setSelectedReference(reference)
    setShowDeleteDialog(true)
  }
  
  // Function to handle canceling the delete action
  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setSelectedReference(null)
  }
  
  // Function to handle confirming the delete action
  const handleConfirmDelete = async () => {
    try {
      setLoadingReferences(true)
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/mapper/delete-mapper-reference`, {
        mapref: selectedReference
      })
      
      if (response.data.success) {
        message.success(response.data.message || 'Mapper reference deleted successfully')
        setShowDeleteDialog(false)
        setSelectedReference(null)
        // Refresh the references list
        fetchAllReferences()
      } else {
        message.error(response.data.message || 'Failed to delete mapper reference')
      }
    } catch (error) {
      console.error('Error deleting mapper reference:', error)
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message)
      } else {
        message.error('Failed to delete mapper reference. Please try again.')
      }
    } finally {
      setLoadingReferences(false)
    }
  }
  
  // Function to return to the reference table view
  const handleReturnToReferenceTable = () => {
    setShowMapperForm(false)
    setShowReferenceTable(true)
    // Reset search state
    setSearchQuery('')
    // Refresh the references list
    fetchAllReferences()
  }
  
  // Modify the fetchReferenceDetails function to handle navigation

  // Add pagination handler for reference table
  const handleReferenceTableChangePage = (event, newPage) => {
    setReferenceTablePage(newPage)
  }

  // Add rows per page handler for reference table
  const handleReferenceTableChangeRowsPerPage = (event) => {
    setReferenceRowsPerPage(parseInt(event.target.value, 10))
    setReferenceTablePage(0)
  }

  // Format date for display in the reference table
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Add a new function to handle search in references table
  const handleReferenceSearch = (event) => {
    const query = event.target.value
    setSearchQuery(query)
    setReferenceTablePage(0) // Reset to first page when searching
    
    if (query.trim() === '') {
      setFilteredReferences(allReferences)
    } else {
      const filtered = allReferences.filter(reference => 
        // Search in reference ID (index 0)
        reference[0]?.toString().toLowerCase().includes(query.toLowerCase()) || 
        // Search in description (index 1)
        reference[1]?.toString().toLowerCase().includes(query.toLowerCase()) || 
        // Search in schema (index 2)
        reference[2]?.toString().toLowerCase().includes(query.toLowerCase()) || 
        // Search in source system (index 5)
        reference[5]?.toString().toLowerCase().includes(query.toLowerCase())
      )
      setFilteredReferences(filtered)
    }
  }

  return (
    <div 
      className={`p-4 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'} 
      text-${darkMode ? 'white' : 'gray-800'}`}
      style={{ fontSize: 'clamp(0.875rem, 1vw, 1rem)' }}
    >
      {/* Reference Table View */}
      {showReferenceTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className={`transition-all duration-300 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
              <Typography 
                variant="h5" 
                className={`text-xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'} relative`}
              >
                Mapper References
                <span className={`block h-1 w-16 mt-1 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}></span>
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNewReference}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                  },
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  px: 2,
                  py: 1,
                  fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' // Responsive font sizing
                }}
              >
                Create New Reference
              </Button>
            </div>
            
            {/* Add search field */}
            <div className="mb-3">
              <TextField
                placeholder="Search references..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={handleReferenceSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchQuery('')
                          setFilteredReferences(allReferences)
                        }}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: { borderRadius: '8px' }
                }}
                sx={{
                  maxWidth: '400px',
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                    '&:hover fieldset': {
                      borderColor: darkMode ? 'rgba(147, 197, 253, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                    },
                    fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' // Responsive font sizing
                  }
                }}
              />
            </div>
            
            <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/20 backdrop-blur-sm' : 'border-gray-200 bg-white/90 backdrop-blur-sm'} overflow-hidden shadow-md mb-4 transition-all duration-300`}>
              <TableContainer 
                sx={{ 
                  maxHeight: 'calc(100vh - 240px)',
                  backgroundColor: 'transparent',
                  borderRadius: 1,
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Reference
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Description
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Target Schema
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Table Type
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Frequency
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Source System
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Logic Verification
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: darkMode ? '#1A1F2C' : '#F9FAFB',
                          color: darkMode ? 'white' : 'black',
                          fontWeight: 'bold',
                          borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(229, 231, 235, 1)'
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    {loadingReferences ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={30} />
                          <Typography variant="body2" sx={{ mt: 1, color: darkMode ? 'gray.400' : 'gray.600' }}>
                            Loading references...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredReferences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" sx={{ color: darkMode ? 'gray.400' : 'gray.600' }}>
                            {allReferences.length === 0 
                              ? "No references found" 
                              : `No references found matching "${searchQuery}"`}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferences
                        .slice(
                          referenceTablePage * referenceRowsPerPage,
                          referenceTablePage * referenceRowsPerPage + referenceRowsPerPage
                        )
                        .map((reference, index) => (
                          <TableRow 
                            key={reference[0]}
                            hover
                            sx={{ 
                              cursor: 'pointer',
                              height: { xs: 'auto', md: '48px' }, // Adjusted for better scaling
                              '&:hover': {
                                backgroundColor: darkMode 
                                  ? alpha(muiTheme.palette.primary.main, 0.1)
                                  : alpha(muiTheme.palette.primary.main, 0.05)
                              },
                              borderBottom: darkMode ? '1px solid rgba(75, 85, 99, 0.1)' : '1px solid rgba(229, 231, 235, 0.7)'
                            }}
                          >
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[0]}
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[1] || '-'}
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[2] || '-'}
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[3] || '-'}
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[4] || '-'}
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[5] || '-'}
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[7] === 'A' ? 
                                <Chip 
                                  label="Active" 
                                  size="small"
                                  sx={{
                                    backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                                    color: darkMode ? 'rgb(16, 185, 129)' : 'rgb(5, 150, 105)',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                  }}
                                /> : 
                                <Chip 
                                  label="Inactive" 
                                  size="small"
                                  sx={{
                                    backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                    color: darkMode ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                  }}
                                />
                              }
                            </TableCell>
                            <TableCell sx={{ color: darkMode ? 'white' : 'inherit', fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' }}>
                              {reference[6] === 'Y' ? 
                                <Chip 
                                  label="Verified" 
                                  size="small"
                                  sx={{
                                    backgroundColor: darkMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                                    color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                  }}
                                /> : 
                                <Chip 
                                  label="Unverified" 
                                  size="small"
                                  sx={{
                                    backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                                    color: darkMode ? 'rgb(251, 191, 36)' : 'rgb(217, 119, 6)',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                  }}
                                />
                              }
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Tooltip title="Edit Reference">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleEditReference(reference[0])}
                                    sx={{
                                      backgroundColor: darkMode 
                                        ? alpha(muiTheme.palette.primary.main, 0.2)
                                        : alpha(muiTheme.palette.primary.main, 0.1),
                                      '&:hover': {
                                        backgroundColor: darkMode 
                                          ? alpha(muiTheme.palette.primary.main, 0.3)
                                          : alpha(muiTheme.palette.primary.main, 0.2),
                                      }
                                    }}
                                  >
                                    <EditIcon fontSize="small" 
                                      sx={{ color: darkMode ? muiTheme.palette.primary.light : muiTheme.palette.primary.main }} 
                                    />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Reference">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleShowDeleteDialog(reference[0])}
                                    sx={{
                                      backgroundColor: darkMode 
                                        ? alpha(muiTheme.palette.error.main, 0.2)
                                        : alpha(muiTheme.palette.error.main, 0.1),
                                      '&:hover': {
                                        backgroundColor: darkMode 
                                          ? alpha(muiTheme.palette.error.main, 0.3)
                                          : alpha(muiTheme.palette.error.main, 0.2),
                                      }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" 
                                      sx={{ color: darkMode ? muiTheme.palette.error.light : muiTheme.palette.error.main }} 
                                    />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredReferences.length}
              rowsPerPage={referenceRowsPerPage}
              page={referenceTablePage}
              onPageChange={handleReferenceTableChangePage}
              onRowsPerPageChange={handleReferenceTableChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-toolbar': {
                  minHeight: '48px',
                },
                '.MuiInputBase-root': {
                  ml: 1,
                  mr: 1,
                },
                color: darkMode ? 'white' : 'inherit',
                fontSize: 'clamp(0.8rem, 0.875vw, 0.875rem)' // Responsive font sizing
              }}
            />
          </div>
          
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={showDeleteDialog}
            onClose={handleCancelDelete}
            PaperProps={{
              style: {
                backgroundColor: darkMode ? '#1F2937' : 'white',
                borderRadius: '12px',
                padding: '8px'
              }
            }}
          >
            <DialogTitle sx={{ color: darkMode ? 'white' : 'inherit' }}>
              Confirm Deletion
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: darkMode ? '#D1D5DB' : 'inherit' }}>
                Are you sure you want to delete the reference "{selectedReference}"? This operation cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ padding: '16px' }}>
              <Button 
                onClick={handleCancelDelete} 
                sx={{ 
                  textTransform: 'none',
                  color: darkMode ? '#9CA3AF' : 'inherit' 
                }}
                disabled={loadingReferences}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                variant="contained" 
                color="error"
                disabled={loadingReferences}
                startIcon={loadingReferences ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '8px'
                }}
              >
                {loadingReferences ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>
      )}
      
      {/* Mapper Configuration Form - Updated */}
      {showMapperForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {/* Removed Paper wrapper from here */}
          <div className={`transition-all duration-300 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            <div className="mb-6">
              {/* Add Back Button to return to reference table */}
              <Box display="flex" alignItems="center" mb={2}>

              </Box>
            
              {/* Header Section - More visually appealing */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h1 className={`text-xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'} relative`}>
                  Mapper Configuration
                  <span className={`block h-1 w-16 mt-1 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}></span>
                </h1>
                
                <div className="flex items-center gap-3">

                  {/* Template Button - Modernized */}
                  <Button
                    variant="outlined"
                    onClick={handleReturnToReferenceTable}
                    className="transition-all duration-200"
                    sx={{
                      height: '36px', // Reduced from 40px
                      minWidth: '100px', // Reduced from 120px
                      textTransform: 'none',
                      borderRadius: '8px',
                      borderWidth: '1.5px',
                      fontSize: '0.85rem', // Reduced from 0.95rem
                      borderColor: darkMode ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.5)',
                      color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                      '&:hover': {
                        borderColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                        backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.04)'
                      }
                    }}
                    startIcon={<KeyboardArrowLeftIcon />}
                  >
                    Back to References
                  </Button>




                  {/* Template Button - Modernized */}
                  <Button
                    variant="outlined"
                    onClick={handleTemplateClick}
                    className="transition-all duration-200"
                    sx={{
                      height: '36px', // Reduced from 40px
                      minWidth: '100px', // Reduced from 120px
                      textTransform: 'none',
                      borderRadius: '8px',
                      borderWidth: '1.5px',
                      fontSize: '0.85rem', // Reduced from 0.95rem
                      borderColor: darkMode ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.5)',
                      color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                      '&:hover': {
                        borderColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                        backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.04)'
                      }
                    }}
                    endIcon={<KeyboardArrowDownIcon />}
                  >
                    Template
                  </Button>

                  {/* Add Template Menu */}
                  <Menu
                    anchorEl={templateAnchorEl}
                    open={Boolean(templateAnchorEl)}
                    onClose={handleTemplateClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        backgroundColor: darkMode ? 'rgb(31, 41, 55)' : 'white',
                        minWidth: '200px',
                        borderRadius: '8px',
                        mt: 1
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDownloadClick(event)
                      }}
                      className={darkMode ? 'text-gray-200 hover:bg-gray-700' : 'hover:bg-blue-50'}
                    >
                      <ListItemIcon>
                        <DownloadIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Download</ListItemText>
                      <KeyboardArrowRightIcon fontSize="small" className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </MenuItem>
                    <MenuItem 
                      onClick={() => {
                        handleTemplateClose()
                        handleUploadClick()
                      }}
                      className={darkMode ? 'text-gray-200 hover:bg-gray-700' : 'hover:bg-blue-50'}
                    >
                      <ListItemIcon>
                        <UploadIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Upload</ListItemText>
                    </MenuItem>
                  </Menu>

                  {/* Add Download Submenu */}
                  <Menu
                    anchorEl={downloadAnchorEl}
                    open={Boolean(downloadAnchorEl)}
                    onClose={handleDownloadClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        backgroundColor: darkMode ? 'rgb(31, 41, 55)' : 'white',
                        minWidth: '200px',
                        borderRadius: '8px'
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={() => {
                        handleTemplateClose()
                        handleDownloadTemplate()
                      }}
                      className={darkMode ? 'text-gray-200 hover:bg-gray-700' : 'hover:bg-blue-50'}
                    >
                      <ListItemIcon>
                        <DescriptionIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Download Template</ListItemText>
                    </MenuItem>
                    <MenuItem 
                      onClick={() => {
                        handleTemplateClose()
                        handleExistingTemplateDownload()
                      }}
                      className={darkMode ? 'text-gray-200 hover:bg-gray-700' : 'hover:bg-blue-50'}
                    >
                      <ListItemIcon>
                        <FileCopyIcon className={darkMode ? 'text-gray-400' : 'text-gray-600'} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Save Data Template</ListItemText>
                    </MenuItem>
                  </Menu>

                  {/* Add hidden file input for upload */}
                  <input
                    id="file-upload"
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={handleFileUpload}
                  />

                  {/* Action Buttons Group - Enhanced styling */}
                  <div className="flex items-center gap-2">
                    {/* Save/Update Button */}
                    <Tooltip title={
                      areAllRowsValid()
                        ? isUpdateMode
                          ? 'Update Mapper Configuration'
                          : 'Save Mapper Configuration'
                        : 'All rows must be validated successfully before saving'
                    }>
                      <span>
                        <Button
                          variant="contained"
                          onClick={handleSave}
                          disabled={isSaving}
                          sx={{
                            height: '36px', // Reduced from 40px
                            minWidth: '100px', // Reduced from 120px
                            textTransform: 'none',
                            borderRadius: '8px',
                            fontSize: '0.85rem', // Reduced from 0.95rem
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            background: isUpdateMode
                              ? 'linear-gradient(45deg, #059669, #10B981)'
                              : 'linear-gradient(45deg, #2563EB, #3B82F6)',
                            '&:hover': {
                              background: isUpdateMode
                                ? 'linear-gradient(45deg, #047857, #059669)'
                                : 'linear-gradient(45deg, #1D4ED8, #2563EB)',
                            }
                          }}
                          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        >
                          {isUpdateMode ? 'Update' : 'Save'}
                        </Button>
                      </span>
                    </Tooltip>

                    {/* Validate Button */}
                    {showValidateButton && !hasUnsavedChanges && (
                      <Button
                        variant="contained"
                        onClick={validateAll}
                        disabled={isValidating}
                        sx={{
                          height: '40px',
                          minWidth: '120px',
                          textTransform: 'none',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          background: 'linear-gradient(45deg, #059669, #10B981)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #047857, #059669)',
                          }
                        }}
                        startIcon={isValidating ? <CircularProgress size={20} color="inherit" /> : <VerifyIcon />}
                      >
                        {isValidating ? 'Validating...' : 'Validate All'}
                      </Button>
                    )}

                    {/* Activate Button - Show if validated, regardless of activation status */}
                    {hasBeenValidated && allRowsValidated && (
                      <Button
                        variant="contained"
                        onClick={handleActivate}
                        sx={{
                          height: '40px',
                          minWidth: '120px',
                          textTransform: 'none',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          background: 'linear-gradient(45deg, #7C3AED, #8B5CF6)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #6D28D9, #7C3AED)',
                          }
                        }}
                        startIcon={<CheckIcon />}
                      >
                        Activate
                      </Button>
                    )}

                    {/* Create Job Button - Show if activated successfully */}
                    {isActivationSuccessful && (
                      <Button
                        variant="contained"
                        onClick={handleCreateJob}
                        sx={{
                          height: '40px',
                          minWidth: '120px',
                          textTransform: 'none',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          background: 'linear-gradient(45deg, #0EA5E9, #38BDF8)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #0284C7, #0EA5E9)',
                          }
                        }}
                        startIcon={<PlayArrowIcon />}
                      >
                        Create Job
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Section - Improved styling for better zoom compatibility */}
              <div className="grid grid-cols-12 gap-x-5 gap-y-5 mb-5">
                {/* Reference Information Section */}
                <div className={`col-span-5 p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white/80'}`}>
                  <h2 className={`text-base font-medium mb-3 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Reference Information
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <TextField
                        label="Reference"
                        value={formData.reference}
                        onChange={(e) => handleFormChange('reference', e.target.value)}
                        onKeyDown={handleKeyDown}
                        size="small"
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            height: '28px', // Reduced from 32px
                            borderRadius: '6px',
                            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.7rem', // Reduced from 0.75rem
                            transform: 'translate(14px, 7px) scale(1)', // Adjusted from 8px to 7px 
                            '&.MuiInputLabel-shrink': {
                              transform: 'translate(14px, -6px) scale(0.75)',
                            }
                          }
                        }}
                        InputProps={{
                          style: { fontSize: '0.8rem' } // Reduced from 0.875rem
                        }}
                      />
                      <TextField
                        label="Mapper ID"
                        value={formData.mapperId}
                        disabled
                        size="small"
                        sx={{
                          width: '80px', // Reduced from 90px
                          '& .MuiOutlinedInput-root': {
                            height: '28px', // Reduced from 32px 
                            borderRadius: '6px',
                            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.3)' : 'rgba(229, 231, 235, 0.5)',
                            fontSize: '0.8rem' // Reduced from 0.875rem
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.7rem', // Reduced from 0.75rem
                            transform: 'translate(14px, 7px) scale(1)', // Adjusted from 8px to 7px
                            '&.MuiInputLabel-shrink': {
                              transform: 'translate(14px, -6px) scale(0.75)',
                            }
                          }
                        }}
                      />
                    </div>
                    <TextField
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      multiline
                      rows={2}
                      size="small"
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                          fontSize: '0.875rem',
                          padding: '6px 10px',
                          minHeight: '32px',
                          '& textarea': {
                            lineHeight: '1.25',
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.75rem',
                          transform: 'translate(14px, 8px) scale(1)',
                          '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -6px) scale(0.75)',
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Target Configuration Section */}
                <div className={`col-span-7 p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white/80'}`}>
                  <h2 className={`text-base font-medium mb-3 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Target Configuration
                  </h2>
                  <div className="grid grid-cols-12 gap-2">
                    {/* Adjust the Target Configuration fields with tighter spacing */}
                    <TextField
                      label="Target Schema"
                      value={formData.targetSchema}
                      onChange={(e) => handleFormChange('targetSchema', e.target.value)}
                      size="small"
                      variant="outlined"
                      className="col-span-4"
                      fullWidth
                      error={!!schemaError}
                      helperText={schemaError ? "Must start with a letter, only A-Z, 0-9, _" : ""}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.75rem',
                          transform: 'translate(14px, 8px) scale(1)',
                          '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -6px) scale(0.75)',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          position: 'absolute',
                          bottom: '-16px',
                          margin: 0,
                          fontSize: '0.625rem',
                          lineHeight: '1',
                        }
                      }}
                      InputProps={{
                        style: { fontSize: '0.875rem' }
                      }}
                    />
                    <TextField
                      label="Target Table"
                      value={formData.tableName}
                      onChange={(e) => handleFormChange('tableName', e.target.value)}
                      size="small"
                      variant="outlined"
                      className="col-span-4"
                      fullWidth
                      error={!!tableNameError}
                      helperText={tableNameError ? "Must start with a letter, only A-Z, 0-9, _" : ""}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.75rem',
                          transform: 'translate(14px, 8px) scale(1)',
                          '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -6px) scale(0.75)',
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          position: 'absolute',
                          bottom: '-16px',
                          margin: 0,
                          fontSize: '0.625rem',
                          lineHeight: '1',
                        }
                      }}
                      InputProps={{
                        style: { fontSize: '0.875rem' }
                      }}
                    />
                    <FormControl size="small" variant="outlined" className="col-span-4" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: '28px' } }}>
                      <InputLabel id="table-type-label" className={`${darkMode ? 'text-gray-400' : ''}`} sx={{ fontSize: '0.75rem' }}>
                        Table Type
                      </InputLabel>
                      <Select
                        labelId="table-type-label"
                        value={formData.tableType}
                        onChange={(e) => handleFormChange('tableType', e.target.value)}
                        label="Table Type"
                        className={`${darkMode ? 'text-gray-200' : ''}`}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {TABLE_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" variant="outlined" className="col-span-4" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: '28px' } }}>
                      <InputLabel id="freq-code-label" className={`${darkMode ? 'text-gray-400' : ''}`} sx={{ fontSize: '0.75rem' }}>
                        Frequency
                      </InputLabel>
                      <Select
                        labelId="freq-code-label"
                        value={formData.freqCode}
                        onChange={(e) => handleFormChange('freqCode', e.target.value)}
                        label="Frequency"
                        className={`${darkMode ? 'text-gray-200' : ''}`}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {FREQ_CODES.map((code) => (
                          <MenuItem key={code.value} value={code.value}>
                            {code.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Source System"
                      value={formData.sourceSystem}
                      onChange={(e) => handleFormChange('sourceSystem', e.target.value)}
                      size="small"
                      variant="outlined"
                      className="col-span-4"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '28px', // Reduced from 32px
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.7rem', // Reduced from 0.75rem
                          transform: 'translate(14px, 7px) scale(1)', // Adjusted from 8px to 7px
                          '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -6px) scale(0.75)',
                          }
                        }
                      }}
                      InputProps={{
                        style: { fontSize: '0.8rem' } // Reduced from 0.875rem
                      }}
                    />
                    <TextField
                      label="Bulk Process Rows"
                      value={formData.bulkProcessRows}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive integers
                        if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
                          handleFormChange('bulkProcessRows', value);
                        }
                      }}
                      size="small"
                      variant="outlined"
                      className="col-span-4"
                      fullWidth
                      type="number"
                      inputProps={{ min: "1" }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'white',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.75rem',
                          transform: 'translate(14px, 8px) scale(1)',
                          '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -6px) scale(0.75)',
                          }
                        },
                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                          '-webkit-appearance': 'none',
                          margin: 0
                        },
                        '& input[type=number]': {
                          '-moz-appearance': 'textfield'
                        }
                      }}
                      InputProps={{
                        style: { fontSize: '0.875rem' }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Table Section - Enhanced styling */}
              <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/20' : 'border-gray-200 bg-white/90'} overflow-hidden shadow-sm mb-6`}>
                <div className="p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                  <div className="flex justify-between items-center">
                    <h2 className={`text-base font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Mapper Configuration Details
                    </h2>
                    <Button
                      variant="outlined"
                      onClick={addRow}
                      startIcon={<AddIcon />}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        borderColor: darkMode ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.5)',
                        color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                        '&:hover': {
                          borderColor: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                          backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.04)'
                        }
                      }}
                    >
                      Add Row
                    </Button>
                  </div>
                </div>
                <TableContainer className="max-h-[calc(100vh-26rem)]"> {/* Adjusted to be more compact */}
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          align="center"
                          className={`
                            font-medium py-1 px-2 w-24
                            ${hasDuplicateKeys 
                              ? (darkMode ? 'bg-red-900/80 text-red-100' : 'bg-red-100 text-red-800') 
                              : (darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50/90')}
                             sticky top-0 z-10
                            transition-colors duration-300
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }}
                        >
                          Key?
                        </TableCell>
                        <TableCell 
                          align="center"
                          className={`
                            font-medium py-1 px-2 w-24
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)', minWidth: '80px' }}
                        >
                          {hasDuplicateKeys ? (
                            <Tooltip title="Duplicate key sequences detected. Each primary key must have a unique sequence number.">
                              <div className="flex items-center justify-center">
                                KeySeq
                                <span className="ml-1 text-red-500 animate-pulse">⚠️</span>
                              </div>
                            </Tooltip>
                          ) : 'KeySeq'}
                        </TableCell>
                        <TableCell 
                          className={`
                            font-medium py-2 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Target Column Name
                        </TableCell>
                        <TableCell 
                          className={`
                            font-medium py-2 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Data Type
                        </TableCell>
                        {/* Add Description column header */}
                        <TableCell 
                          className={`
                            font-medium py-2 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Description
                        </TableCell>
                        {formData.tableType === 'DIM' && (
                          <TableCell 
                            className={`
                              font-medium py-2 px-2
                              ${
                                darkMode
                                  ? 'bg-gray-800 text-gray-200'
                                  : 'bg-gray-50/90'
                              }
                              sticky top-0 z-10
                            `}
                            sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                          >
                            SCD Type
                          </TableCell>
                        )}
                        {/* Remove Not Null column header */}
                        <TableCell 
                          className={`
                            font-medium py-2 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Key Column
                        </TableCell>
                        <TableCell 
                          className={`
                            font-medium py-2 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Value Column
                        </TableCell>
                        <TableCell 
                          className={`
                            font-medium py-2 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Mapping Combine Code
                        </TableCell>
                        <TableCell
                          align="center"
                          className={`
                            font-medium py-2 px-2 w-16
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                          sx={{ fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)' }} // Responsive font sizing
                        >
                          Valid
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.slice(page * 10, page * 10 + 10).map((row, index) => (
                        <TableRow 
                          key={index}
                          onClick={() => handleRowClick(index + page * 10)}
                          className={`
                            transition-colors duration-150 cursor-pointer
                            ${
                              modifiedRows.includes(index + page * 10)
                                ? darkMode
                                  ? 'bg-green-900/20 hover:bg-green-900/30'
                                  : 'bg-green-50 hover:bg-green-100/70'
                                : darkMode
                                ? `hover:bg-gray-700/50 ${
                                    selectedRowIndex === index + page * 10
                                      ? 'bg-gray-700/70'
                                      : ''
                                  }`
                                : `hover:bg-blue-50/30 ${
                                    selectedRowIndex === index + page * 10
                                      ? 'bg-blue-50/50'
                                      : ''
                                  }`
                            }
                          `}
                          sx={{ height: { xs: '32px', md: '32px' } }}
                        >
                          <TableCell className="py-0 px-1">
                            <Checkbox
                              checked={row.primaryKey}
                              onChange={(e) =>
                                handleRowChange(
                                  index + page * 10,
                                  'primaryKey',
                                  e.target.checked
                                )
                              }
                              className={`${
                                darkMode ? 'text-blue-400' : 'text-blue-500'
                              }`}
                              size="small"
                            />
                          </TableCell>
                          <TableCell className="py-0 px-1">
                            <TextField
                              value={row.pkSeq}
                              onChange={(e) =>
                                handleNumberChange(e, index + page * 10, 'pkSeq')
                              }
                              disabled={!row.primaryKey}
                              size="small"
                              fullWidth
                              variant="outlined"
                              type="number"
                              error={!!pkSeqErrors[index + page * 10]}
                              helperText={pkSeqErrors[index + page * 10]}
                              inputProps={{
                                min: 0,
                                max: 999,
                                step: 1,
                                className: 'px-2 py-1 text-center',
                              }}
                              className={`${
                                darkMode ? 'bg-gray-800/50' : 'bg-white'
                              } rounded-md ${!row.primaryKey ? 'opacity-50' : ''}`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: pkSeqErrors[index + page * 10] 
                                      ? (darkMode ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.7)') 
                                      : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                                  },
                                  '&:hover fieldset': {
                                    borderColor: pkSeqErrors[index + page * 10]
                                      ? (darkMode ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,0.9)')
                                      : (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: pkSeqErrors[index + page * 10]
                                      ? (darkMode ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,1)')
                                      : '#3b82f6',
                                  },
                                },
                                '& .MuiFormHelperText-root': {
                                  color: darkMode ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,0.9)',
                                  position: 'absolute',
                                  bottom: '-20px',
                                  margin: 0,
                                  fontSize: '0.625rem',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-0 px-1">
                            <TextField
                              value={row.fieldName}
                              disabled={!!row.mapdtlid} // Only disable if mapdtlid exists
                              onChange={(e) => {
                                const value = e.target.value
                                  .toUpperCase()
                                  .slice(0, 30);
                                handleRowChange(index + page * 10, 'fieldName', value);
                              }}
                              size="small"
                              fullWidth
                              variant="outlined"
                              inputProps={{
                                maxLength: 30,
                                className: 'px-2 py-1',
                              }}
                              className={`${
                                darkMode ? 'bg-gray-800/50' : row.mapdtlid ? 'bg-gray-100' : 'bg-white'
                              } rounded-md`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.1)',
                                  },
                                  '&.Mui-disabled': {
                                    backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(229, 231, 235, 0.5)',
                                    '& fieldset': {
                                      borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
                                    },
                                    '& input': {
                                      color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                    },
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-0 px-1" style={{ width: '150px' }} // Increase width for Data Type
                          >
                            <Autocomplete
                              value={dataTypeOptions.find(option => option.PRCD === row.dataType) || null}
                              disabled={!!row.mapdtlid} // Only disable if mapdtlid exists
                              onChange={(event, newValue) => {
                                handleRowChange(index + page * 10, 'dataType', newValue ? newValue.PRCD : '')
                              }}
                              options={dataTypeOptions}
                              getOptionLabel={(option) => option.PRCD}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  fullWidth
                                  variant="outlined"
                                  className={`${
                                    darkMode ? 'bg-gray-800/50' : row.mapdtlid ? 'bg-gray-100' : 'bg-white'
                                  } rounded-md`}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: darkMode
                                          ? 'rgba(255,255,255,0.1)'
                                          : 'rgba(0,0,0,0.1)',
                                      },
                                      '&.Mui-disabled': {
                                        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(229, 231, 235, 0.5)',
                                        '& fieldset': {
                                          borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
                                        },
                                        '& input': {
                                          color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                        },
                                      },
                                    },
                                  }}
                                />
                              )}
                              renderOption={(props, option) => (
                                <li {...props}>
                                  <Tooltip 
                                    title={option.PRDESC}
                                    placement="right"
                                    arrow
                                  >
                                    <span>{option.PRCD}</span>
                                  </Tooltip>
                                </li>
                              )}
                              isOptionEqualToValue={(option, value) => option.PRCD === value.PRCD}
                              className={darkMode ? 'text-gray-200' : ''}
                              disableClearable
                            />
                          </TableCell>
                          {/* Add Description field cell */}
                          <TableCell className="py-0 px-1">
                            <TextField
                              value={row.fieldDesc}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 100)
                                handleRowChange(index + page * 10, 'fieldDesc', value)
                              }}
                              size="small"
                              fullWidth
                              variant="outlined"
                              inputProps={{
                                maxLength: 100,
                                className: 'px-2 py-1',
                              }}
                              className={`${
                                darkMode ? 'bg-gray-800/50' : 'bg-white'
                              } rounded-md`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.2)'
                                      : 'rgba(0,0,0,0.2)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#3b82f6',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          {formData.tableType === 'DIM' && (
                            <TableCell className="py-0 px-1">
                              <FormControl
                                fullWidth
                                size="small"
                                variant="outlined"
                                className={`${
                                  darkMode ? 'bg-gray-800/50' : 'bg-white'
                                } rounded-md`}
                              >
                                <Select
                                  value={row.scdType}
                                  onChange={(e) =>
                                    handleRowChange(index + page * 10, 'scdType', e.target.value)
                                  }
                                  renderValue={(value) => {
                                    // Find the option with matching PRCD and display its PRCD
                                    const option = scdTypeOptions.find(opt => opt.PRCD === value);
                                    return option ? option.PRCD : value;
                                  }}
                                  className={darkMode ? 'text-gray-200' : ''}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: darkMode
                                        ? 'rgba(255,255,255,0.1)'
                                        : 'rgba(0,0,0,0.1)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: darkMode
                                        ? 'rgba(255,255,255,0.2)'
                                        : 'rgba(0,0,0,0.2)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#3b82f6',
                                    },
                                  }}
                                >
                                  {scdTypeOptions.map((option) => (
                                    <MenuItem key={option.PRCD} value={option.PRCD}>
                                      {option.PRCD}
                                    </MenuItem>
                                  ))}
                                  {/* Fallback option if API hasn't loaded yet */}
                                  {scdTypeOptions.length === 0 && (
                                    <>
                                      <MenuItem value="1">Type 1</MenuItem>
                                      <MenuItem value="2">Type 2</MenuItem>
                                    </>
                                  )}
                                </Select>
                              </FormControl>
                            </TableCell>
                          )}
                          <TableCell className="py-0 px-1">
                            <TextField
                              value={row.keyColumn}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 30)
                                handleRowChange(index + page * 10, 'keyColumn', value)
                              }}
                              size="small"
                              fullWidth
                              variant="outlined"
                              inputProps={{
                                maxLength: 30,
                                className: 'px-2 py-1',
                              }}
                              className={`${
                                darkMode ? 'bg-gray-800/50' : 'bg-white'
                              } rounded-md`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.2)'
                                      : 'rgba(0,0,0,0.2)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#3b82f6',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-0 px-1">
                            <TextField
                              value={row.valColumn}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 30)
                                handleRowChange(index + page * 10, 'valColumn', value)
                              }}
                              size="small"
                              fullWidth
                              variant="outlined"
                              inputProps={{
                                maxLength: 30,
                                className: 'px-2 py-1',
                              }}
                              className={`${
                                darkMode ? 'bg-gray-800/50' : 'bg-white'
                              } rounded-md`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.2)'
                                      : 'rgba(0,0,0,0.2)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#3b82f6',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-0 px-1">
                            <TextField
                              value={row.mapCombineCode}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 30)
                                handleRowChange(index + page * 10, 'mapCombineCode', value)
                              }}
                              size="small"
                              fullWidth
                              variant="outlined"
                              inputProps={{
                                maxLength: 30,
                                className: 'px-2 py-1',
                              }}
                              className={`${
                                darkMode ? 'bg-gray-800/50' : 'bg-white'
                              } rounded-md`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: darkMode
                                      ? 'rgba(255,255,255,0.2)'
                                      : 'rgba(0,0,0,0.2)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#3b82f6',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell className="py-0 px-1">
                            <Tooltip title={
                              row.LogicVerFlag === '' ? "Validate this row" : 
                              row.LogicVerFlag === 'Y' ? "Logic is valid" : 
                              errorMessages[index + page * 10] || "Logic is invalid"
                            }>
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  handleValidateRow(index + page * 10);
                                }}
                                size="small"
                                sx={{
                                  color: row.LogicVerFlag === ''
                                    ? (darkMode ? 'rgba(156, 163, 175, 0.9)' : 'rgba(75, 85, 99, 0.9)')
                                    : row.LogicVerFlag === 'Y'
                                    ? (darkMode ? 'rgba(34, 197, 94, 0.9)' : 'rgba(22, 163, 74, 0.9)')
                                    : (darkMode ? 'rgba(239, 68, 68, 0.9)' : 'rgba(220, 38, 38, 0.9)'),
                                  '&:hover': {
                                    color: row.LogicVerFlag === ''
                                      ? (darkMode ? 'rgba(156, 163, 175, 1)' : 'rgba(75, 85, 99, 1)')
                                      : row.LogicVerFlag === 'Y'
                                      ? (darkMode ? 'rgba(34, 197, 94, 1)' : 'rgba(22, 163, 74, 1)')
                                      : (darkMode ? 'rgba(239, 68, 68, 1)' : 'rgba(220, 38, 38, 1)'),
                                  }
                                }}
                              >
                                {row.LogicVerFlag === '' ? (
                                  <HelpOutlineIcon fontSize="small" />
                                ) : row.LogicVerFlag === 'Y' ? (
                                  <CheckCircleIcon fontSize="small" />
                                ) : (
                                  <ErrorIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination section - More compact */}
                <div className={`
                  border-t flex justify-between items-center px-3 py-1
                  ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}
                `}>
                  <Tooltip title="Add New Row">
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addRow}
                      className={`
                        shadow-sm hover:shadow-md transition-all duration-200
                        bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                        ${darkMode ? 'text-white' : ''} text-sm py-1 my-2
                      `}
                      size="small"
                    >
                      Add Row
                    </Button>
                  </Tooltip>
                  <TablePagination
                    component="div"
                    count={rows.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={10}
                    rowsPerPageOptions={[10]}
                    className={`
                      ${darkMode ? 'text-gray-300' : ''} 
                      text-sm border-l ml-4 pl-4 
                      ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                    `}
                  />
                </div>
              </div>
            </div>
            
            {/* SQL Editor Section - Improved styling */}
            {selectedRowIndex !== null && (
              <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/20 backdrop-blur-sm' : 'border-gray-200 bg-white/90 backdrop-blur-sm'} overflow-hidden shadow-md`}>
                <div className="p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <CodeIcon
                        className={
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }
                      />
                      <h3 className={`text-base font-medium ${
                        darkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>
                        SQL Logic Editor
                      </h3>
                      {rows[selectedRowIndex]?.fieldName && (
                        <Chip
                          label={rows[selectedRowIndex].fieldName}
                          size="small"
                          sx={{
                            backgroundColor: darkMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                            color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                            fontSize: 'clamp(0.7rem, 0.75vw, 0.75rem)', // Responsive font sizing
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip title="Open Full SQL Editor">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenSqlEditor(selectedRowIndex)}
                          className="transition-all duration-200"
                          sx={{
                            backgroundColor: darkMode ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                            '&:hover': {
                              backgroundColor: darkMode ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.15)',
                            },
                          }}
                        >
                          <FullscreenIcon
                            fontSize="small"
                            className={
                              darkMode ? 'text-blue-400' : 'text-blue-600'
                            }
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Format SQL">
                        <IconButton
                          size="small"
                          onClick={() => {
                            try {
                              const formatted = format(selectedRowLogic || '', {
                                language: 'sql',
                                indent: '  ',
                                uppercase: true,
                              })
                              handleLogicChange(formatted)
                              message.success('SQL formatted successfully')
                            } catch (error) {
                              message.error('Failed to format SQL')
                            }
                          }}
                          className="transition-all duration-200"
                          sx={{
                            backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            '&:hover': {
                              backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                            },
                          }}
                        >
                          <FormatIcon
                            fontSize="small"
                            className={
                              darkMode ? 'text-green-400' : 'text-green-600'
                            }
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Validate Logic">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleValidateRow(selectedRowIndex)}
                            disabled={!rows[selectedRowIndex]?.keyColumn || !rows[selectedRowIndex]?.valColumn || !selectedRowLogic}
                            className="transition-all duration-200"
                            sx={{
                              backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                              '&:hover': {
                                backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)',
                              },
                              '&.Mui-disabled': {
                                backgroundColor: darkMode ? 'rgba(107, 114, 128, 0.15)' : 'rgba(229, 231, 235, 0.5)',
                              }
                            }}
                          >
                            <VerifyIcon
                              fontSize="small"
                              className={
                                !rows[selectedRowIndex]?.keyColumn || !rows[selectedRowIndex]?.valColumn || !selectedRowLogic
                                  ? 'text-gray-400'
                                  : darkMode
                                  ? 'text-yellow-400'
                                  : 'text-yellow-600'
                              }
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                  <div className={`h-24 rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <Editor
                      height="100%"
                      defaultLanguage="sql"
                      theme={darkMode ? 'vs-dark' : 'vs'}
                      value={selectedRowLogic}
                      onChange={handleLogicChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        wordWrap: 'on',
                        lineNumbers: 'on'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* End of removed Paper wrapper */}
        </motion.div>
      )}

      {/* SQL Editor Dialog */}
      <Dialog
        open={showSqlEditor}
        onClose={() => setShowSqlEditor(false)}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          style: {
            backgroundColor: darkMode ? '#1A1F2C' : 'white',
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkMode ? 'white' : 'inherit',
          borderBottom: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 1)'}`,
          padding: '16px 24px' 
        }}>
          <div className="flex justify-between items-center">
            <span>SQL Logic Editor</span>
            <IconButton onClick={() => setShowSqlEditor(false)} size="small">
              <ClearIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ padding: '20px 24px' }}>
          <div className={`h-[60vh] rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme={darkMode ? 'vs-dark' : 'vs'}
              value={sqlEditorContent}
              onChange={setSqlEditorContent}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on'
              }}
            />
          </div>
          {sqlError && (
            <Box mt={2} p={2} bgcolor={darkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 226, 226, 1)'} borderRadius={1}>
              <Typography color="error" variant="body2">
                {sqlError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          padding: '12px 24px',
          borderTop: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 1)'}` 
        }}>
          <Button 
            onClick={() => setShowSqlEditor(false)} 
            sx={{ 
              textTransform: 'none',
              color: darkMode ? '#9CA3AF' : 'inherit',
              borderRadius: '6px'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSql}
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              background: 'linear-gradient(45deg, #2563EB, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1D4ED8, #2563EB)',
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#1F2937' : '#F3F4F6'};
        }

        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4B5563' : '#9CA3AF'};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6B7280' : '#6B7280'};
        }
        
        /* Add smooth transitions for all elements */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        /* Enhance table row hover effect */
        .MuiTableRow-root:hover {
          transition: background-color 0.15s ease !important;
        }
        
        /* Make buttons more interactive */
        .MuiButton-root, .MuiIconButton-root {
          transition: transform 0.1s ease, box-shadow 0.2s ease !important;
        }
        
        .MuiButton-root:active, .MuiIconButton-root:active {
          transform: scale(0.97);
        }

        /* Scaling adjustments */
        .mapper-module-container {
          /* Used to apply scale transformation to the whole component */
          /* transform origin is set to top to avoid layout shift issues */
          margin-bottom: -5vh; /* Compensate for the reduction in height; reduced from -10vh to -5vh */
        }

        /* Adjust typography sizes to be more proportional */
        .MuiTypography-root {
          font-size: 0.9em;
        }

        /* Make form controls more compact */
        .MuiOutlinedInput-root {
          font-size: 0.9rem;
        }

        .MuiInputLabel-root {
          font-size: 0.8rem;
        }

        /* Adjust button sizes for better proportions */
        .MuiButton-root {
          font-size: 0.85rem;
          padding: 4px 16px;
        }

        /* Adjust table cells for better proportions */
        .MuiTableCell-root {
          padding: 8px 12px;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  )
}

export default MapperModule
