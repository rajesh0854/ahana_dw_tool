'use client'

import React, { useState, useEffect, memo } from 'react'
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
  Fab,
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
  MoreVert as MoreVertIcon,
  ContentCopy as DuplicateIcon,
  ImportExport as ExportIcon,
  InsertDriveFile as FileIcon,
  TableChart as TableIcon,
} from '@mui/icons-material'
import { message } from 'antd'
import { useTheme } from '@/context/ThemeContext'
import Editor from '@monaco-editor/react'
import { format } from 'sql-formatter'
import { z } from 'zod'
import axios from 'axios'
import { motion } from 'framer-motion'
// Add the useReferenceLock import
import { useReferenceLock, releaseReferenceLock } from './lockUtils'

// Using memo to prevent unnecessary rerenders
const ReferenceForm = memo(({ handleReturnToReferenceTable, reference, onLockFailed }) => {
  const { darkMode } = useTheme()

  // Add state for user data
  const [userData, setUserData] = useState(null)

  // Use the locking hook to acquire a lock when the component mounts
  useReferenceLock(reference, onLockFailed);

  // Modify handleReturnToReferenceTable to release the lock
  const handleReturnWithUnlock = () => {
    if (reference) {
      // Release the lock when returning to the table
      console.log(`Releasing lock for reference ${reference} before navigation`);
      
      // First clean up any local state related to the lock
      localStorage.removeItem(`mapper_lock_${reference}`);
      
      // Then call the API to release the lock
      releaseReferenceLock(reference)
        .then((result) => {
          console.log(`Lock release result for ${reference}:`, result);
          handleReturnToReferenceTable();
        })
        .catch((error) => {
          console.error(`Error releasing lock for ${reference}:`, error);
          // Navigate anyway, even if there was an error
          handleReturnToReferenceTable();
        });
    } else {
      handleReturnToReferenceTable();
    }
  };

  // New state variables for the table view
  const [showReferenceTable, setShowReferenceTable] = useState(true)
  // Existing state variables
  const [showMapperForm, setShowMapperForm] = useState(false)

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
      execSequence: '',
      mapCombineCode: '',
      LogicVerFlag: '',
      scdType: '1', // Store PRCD for SCD Type
      fieldDesc: '', // Add field description property
    }))
  )

  // Add state for data type options
  const [dataTypeOptions, setDataTypeOptions] = useState([])

  // Add useEffect to fetch data type options
  useEffect(() => {
    if (reference) {
      fetchReferenceDetails(reference)
    }else{
        handleCreateNewReference()
    }

    const fetchDataTypeOptions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mapper/get-parameter-mapping-datatype`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch data type options')
        }
        const data = await response.json()
        setDataTypeOptions(data)
      } catch (error) {
        message.error('Failed to load data type options')
      }
    }

    fetchDataTypeOptions()
  }, [])

  // REMOVED: const [isUpperSectionExpanded, setIsUpperSectionExpanded] = useState(false)

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

  // Removed pagination state - using scrollbar instead

  // REMOVED: const [isFullscreen, setIsFullscreen] = useState(false)

  // Add these state variables at the top with other states
  const [showSqlEditor, setShowSqlEditor] = useState(false)
  const [selectedRowIndex, setSelectedRowIndex] = useState(null)
  const [sqlEditorContent, setSqlEditorContent] = useState('')
  const [sqlError, setSqlError] = useState(null)

  // Add new states for search functionality
  const [isSearching, setIsSearching] = useState(false)
  // REMOVED: const [searchTimeout, setSearchTimeout] = useState(null)
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
  // REMOVED: const [validatedRows, setValidatedRows] = useState([])

  // Add new state for tracking validation status
  const [validationStatus, setValidationStatus] = useState({})

  // Add new state for error messages and logs dialog
  const [errorMessages, setErrorMessages] = useState({})

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

  // Add state for job creation tracking
  const [isJobCreating, setIsJobCreating] = useState(false)
  const [isJobCreated, setIsJobCreated] = useState(false)

  // Add new state for tracking bulk validation status
  const [bulkValidationSuccess, setBulkValidationSuccess] = useState(true)

  // Add constants for select options
  const TABLE_TYPES = [
    { value: 'NRM', label: 'Normal' },
    { value: 'DIM', label: 'Dimension' },
    { value: 'FCT', label: 'Fact' },
    { value: 'MRT', label: 'Mart' },
  ]

  const FREQ_CODES = [
    { value: '', label: 'None' },
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
  // Add export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  // Add loading state
  const [isSaving, setIsSaving] = useState(false)
  // Add state for validation loading
  const [isValidating, setIsValidating] = useState(false)

  // Add this useEffect to initialize SQL editor content
  useEffect(() => {
    if (showSqlEditor && selectedRowIndex !== null) {
      setSqlEditorContent(rows[selectedRowIndex].logic || '')
    }
  }, [showSqlEditor, selectedRowIndex])

  // Add useEffect to update allRowsValidated state based on current row validation status
  useEffect(() => {
    if (hasBeenValidated) {
      const filledRows = rows.filter(
        (row) =>
          row.fieldName.trim() !== '' ||
          row.dataType.trim() !== '' ||
          row.keyColumn.trim() !== '' ||
          row.valColumn.trim() !== '' ||
          row.mapCombineCode.trim() !== '' ||
          row.logic.trim() !== ''
      )

      if (filledRows.length === 0) {
        setAllRowsValidated(false)
      } else {
        const allValid = filledRows.every((row) => row.LogicVerFlag === 'Y')
        setAllRowsValidated(allValid)
      }
    }
  }, [rows, hasBeenValidated])

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
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  // Zod schema for reference field validation
  const referenceSchema = z
    .string()
    .regex(/^[a-zA-Z0-9_]*$/, {
      message: 'Reference can only contain letters, numbers, and underscores',
    })
    .transform((val) => val.toUpperCase())

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
      // Show loading state during activation
      message.loading({ content: 'Activating mapper...', key: 'activateMapper' })
      
      // Call the activate-deactivate API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/activate-deactivate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mapref: formData.reference,
            statusFlag: 'A', // 'A' for activate
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        // Set activation states
        setIsActivated(true)
        setIsActivationSuccessful(true) // Set activation success flag
        
        message.success({ 
          content: data.message || 'Mapper activated successfully',
          key: 'activateMapper' 
        })
        
        // Disable the activate button and keep validate disabled
        setShowValidateButton(false)
        
        // Make sure job creation is reset when activating again
        setIsJobCreated(false)
        

      } else {
        setIsActivated(false)
        setIsActivationSuccessful(false) // Reset activation success flag
        message.error({ 
          content: data.message || 'Failed to activate mapper',
          key: 'activateMapper'
        })
        
        // Keep validate button enabled to allow retry
        setShowValidateButton(true)
      }
    } catch (error) {
      setIsActivated(false)
      setIsActivationSuccessful(false) // Reset activation success flag on error
      message.error({
        content: 'Failed to activate mapper: ' + (error.message || 'Unknown error'),
        key: 'activateMapper'
      })
      
      // Keep validate button enabled to allow retry
      setShowValidateButton(true)
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
      // Remove spaces and only allow allowed characters
      value = preventSpaces(value)
      
      try {
        // Only allow letters, numbers, and underscores
        if (!/^[a-zA-Z0-9_]*$/.test(value)) {
          message.error(
            'Reference can only contain letters, numbers, and underscores'
          )
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
      value = value.toUpperCase()

      // Check if it starts with a letter and only contains allowed characters
      if (value && !/^[A-Z][A-Z0-9_]*$/.test(value)) {
        if (!/^[A-Z].*$/.test(value) && value.length > 0) {
          message.error('Target Schema must start with a letter')
        } else {
          message.error(
            'Target Schema can only contain uppercase letters, numbers, and underscores'
          )
        }
        setSchemaError('invalid')
      } else {
        setSchemaError('')
      }
    }

    // Validate tableName - must start with a letter and only contain uppercase letters, numbers, and underscores
    if (field === 'tableName') {
      // Convert to uppercase
      value = value.toUpperCase()

      // Check if it starts with a letter and only contains allowed characters
      if (value && !/^[A-Z][A-Z0-9_]*$/.test(value)) {
        if (!/^[A-Z].*$/.test(value) && value.length > 0) {
          message.error('Target Table must start with a letter')
        } else {
          message.error(
            'Target Table can only contain uppercase letters, numbers, and underscores'
          )
        }
        setTableNameError('invalid')
      } else {
        setTableNameError('')
      }
    }

    // Handle tableType changes
    if (field === 'tableType') {
      const prevTableType = formData.tableType

      // If changing to DIM or from DIM, mark all rows as modified
      if (
        (value === 'DIM' && prevTableType !== 'DIM') ||
        (value !== 'DIM' && prevTableType === 'DIM')
      ) {
        // Get indices of all rows that have any data
        const filledRowIndices = rows
          .map((row, index) =>
            row.fieldName.trim() !== '' ||
            row.dataType.trim() !== '' ||
            row.logic.trim() !== ''
              ? index
              : null
          )
          .filter((index) => index !== null)

        // Add all filled rows to modifiedRows
        setModifiedRows((prev) => {
          const newModifiedRows = [...prev]
          filledRowIndices.forEach((index) => {
            if (!newModifiedRows.includes(index)) {
              newModifiedRows.push(index)
            }
          })
          return newModifiedRows
        })
      }

      // If changing from DIM to something else, reset all scdType values
      if (value !== 'DIM' && prevTableType === 'DIM') {
        setRows((prevRows) =>
          prevRows.map((row) => ({
            ...row,
            scdType: '', // Reset to '1' instead of empty string
          }))
        )
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
    const reference = formData.reference.trim()
    // Only proceed with search if reference is not empty and contains only letters, numbers, and underscores
    if (reference && /^[a-zA-Z0-9_]+$/.test(reference)) {
      fetchReferenceDetails(reference)
    } else if (reference && !/^[a-zA-Z0-9_]+$/.test(reference)) {
      // If reference contains invalid characters, show error but don't make API call
      setReferenceError(
        'Reference can only contain letters, numbers, and underscores'
      )
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
    const keySeqValues = {}
    let hasDuplicates = false

    // First pass: collect all key sequence values from primary key rows
    rows.forEach((row, index) => {
      // Only consider rows where primaryKey is true AND pkSeq has a value
      if (row.primaryKey && row.pkSeq !== '') {
        if (!keySeqValues[row.pkSeq]) {
          keySeqValues[row.pkSeq] = [index]
        } else {
          keySeqValues[row.pkSeq].push(index)
          hasDuplicates = true
        }
      }
    })

    // Update duplicate status
    setHasDuplicateKeys(hasDuplicates)

    // Return the duplicate map for individual error handling
    return { hasDuplicates, keySeqValues }
  }

  // Modify handleRowChange to reset activation state when changes are made
  const handleRowChange = (index, field, value) => {
    // Fields that should not allow spaces
    const noSpaceFields = [
      'fieldName',
      'dataType',
      'keyColumn',
      'valColumn',
      'execSequence',
      'mapCombineCode',
    ]

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
        newRows[index].pkSeq = ''

        // Clear any pkSeq errors and warnings for this row
        setPkSeqErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[index]
          return newErrors
        })

        setRowWarnings((prev) => {
          const newWarnings = { ...prev }
          delete newWarnings[index]
          return newWarnings
        })
      }
    }

    // When primaryKey or pkSeq changes, verify uniqueness of all key sequences
    if (
      (field === 'pkSeq' && newRows[index].primaryKey) ||
      field === 'primaryKey'
    ) {
      const { hasDuplicates, keySeqValues } =
        checkDuplicateKeySequences(newRows)

      // Update error messages for each row
      const newPkSeqErrors = { ...pkSeqErrors }
      const newWarnings = { ...rowWarnings }

      // Clear all existing key sequence errors first
      Object.keys(newPkSeqErrors).forEach((key) => {
        if (newPkSeqErrors[key] === 'Duplicate key sequence') {
          delete newPkSeqErrors[key]
        }
      })

      Object.keys(newWarnings).forEach((key) => {
        if (newWarnings[key] === 'Duplicate key sequence detected') {
          delete newWarnings[key]
        }
      })

      if (hasDuplicates) {
        // Set error messages only for rows with duplicates
        Object.entries(keySeqValues).forEach(([seqValue, indices]) => {
          if (indices.length > 1) {
            indices.forEach((rowIndex) => {
              if (newRows[rowIndex].primaryKey) {
                // Only set errors for rows that are still primary keys
                newPkSeqErrors[rowIndex] = 'Duplicate key sequence'
                newWarnings[rowIndex] = 'Duplicate key sequence detected'
              }
            })
          }
        })
      }

      setPkSeqErrors(newPkSeqErrors)
      setRowWarnings(newWarnings)

      if (hasDuplicates && field === 'pkSeq') {
        message.warning('Duplicate key sequence values are not allowed')
      }
    }

    setRows(newRows)

    // Track modifications if this is an update
    if (originalRows) {
      // Check if the row is already in modifiedRows
      const isAlreadyModified = modifiedRows.includes(index)

      // Check if the current field value is different from the original
      const isFieldModified =
        JSON.stringify(originalRows[index]?.[field]) !== JSON.stringify(value)

      // Add to modifiedRows if not already there and the field is modified
      if (!isAlreadyModified && isFieldModified) {
        setModifiedRows((prev) => [...prev, index])
      }
    }

    // Set hasUnsavedChanges to true and reset validation states when changes are made
    setHasUnsavedChanges(true)
    setShowValidateButton(false)
    setHasBeenValidated(false)
    setAllRowsValidated(false)
    setIsActivated(false)
    setIsActivationSuccessful(false) // Reset activation success state when changes are made
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
        execSequence: '',
        mapCombineCode: '',
        LogicVerFlag: '',
        scdType: scdTypeOptions.length > 0 ? scdTypeOptions[0].PRCD : '1',
        fieldDesc: '',
      },
    ]

    setRows(newRows)

    // Check for duplicates after adding the row
    setTimeout(() => checkDuplicateKeySequences(newRows), 0)
  }

  // Add useEffect to check for duplicates when rows change
  useEffect(() => {
    checkDuplicateKeySequences(rows)
  }, [])

  // Removed pagination handlers - using scrollbar instead

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
        execSequence: '',
        mapCombineCode: '',
        LogicVerFlag: '',
        scdType: scdTypeOptions.length > 0 ? scdTypeOptions[0].PRCD : '1', // Use PRCD for storage
        fieldDesc: '', // Add field description
      }))
    )

    // Removed pagination reset - using scrollbar instead

    // Reset workflow state variables
    setHasUnsavedChanges(false)
    setShowValidateButton(false)
    setHasBeenValidated(false)
    setAllRowsValidated(false)
    setIsActivated(false)
  }

  // Modified handleSave to not return to reference table after successful save
  const handleSave = async () => {
    // Validate form fields
    try {
      // Create a schema using zod for form validation
      const formSchema = z.object({
        reference: z
          .string()
          .min(1, 'Reference is required')
          .max(100, 'Reference cannot exceed 100 characters')
          .regex(/^[a-zA-Z0-9_]*$/, {
            message: 'Reference can only contain letters, numbers, and underscores',
          }),
        description: z
          .string()
          .min(1, 'Description is required')
          .max(255, 'Description cannot exceed 255 characters'),
        targetSchema: z
          .string()
          .min(1, 'Target Schema is required')
          .max(30, 'Target Schema cannot exceed 30 characters'),
        tableName: z
          .string()
          .min(1, 'Table Name is required')
          .max(30, 'Table Name cannot exceed 30 characters'),
        tableType: z.string().min(1, 'Table Type is required'),
        freqCode: z.string().optional(),
        sourceSystem: z
          .string()
          .min(1, 'Source System is required')
          .max(30, 'Source System cannot exceed 30 characters'),
        // bulkProcessRows: z
        //   .string()
        //   .regex(/^\d*$/, 'Must be a number')
        //   .transform((val) => (val === '' ? '0' : val)),
      })

      // Validate form data
      formSchema.parse(formData)
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          message.error(`${err.path}: ${err.message}`)
        })
        return
      }
    }

    // Check if there are any rows added
    if (!rows.some((row) => row.fieldName)) {
      message.error('At least one row must be added to the table')
      return
    }

    // Ensure no rows with duplicate field names
    const fieldNameCounts = {};
    const duplicateFieldNames = [];
    const processedFieldNamesForDuplicates = []; // To store names for display

    rows
      .filter((row) => row.fieldName && row.fieldName.trim() !== '')
      .forEach((row) => {
        // FieldName should already be normalized (UPPERCASE_NOSPACE)
        // For counting, use toLowerCase to ensure case-insensitivity if any variation slips through, though it shouldn't.
        const countKey = row.fieldName.toLowerCase(); 
        fieldNameCounts[countKey] = (fieldNameCounts[countKey] || 0) + 1;
        if (fieldNameCounts[countKey] > 1 && !duplicateFieldNames.includes(row.fieldName)) {
          // Store the original-cased (but already normalized) fieldName for the error message
          duplicateFieldNames.push(row.fieldName);
        }
      });

    if (duplicateFieldNames.length > 0) {
      message.error(
        `Duplicate field names found: ${duplicateFieldNames.join(
          ', '
        )}. Please ensure all target column names are unique.`
      );
      return;
    }

    // Check if all required fields are filled for all rows with a field name
    const rowsWithFieldName = rows.filter((row) => row.fieldName)
    const incompleteRows = rowsWithFieldName.filter((row) => !row.dataType)
    if (incompleteRows.length > 0) {
      message.error('All rows with a field name must have a data type')
      return
    }

    // Check if we have any duplicate key sequences
    if (hasDuplicateKeys) {
      message.error('Duplicate key sequence values are not allowed')
      return
    }

    // REMOVED: Check if all rows have been validated
    // if (!areAllRowsValid()) {
    //   message.warning(
    //     'Not all rows have been validated. Please validate before saving.'
    //   )
    //   return
    // }

    setIsSaving(true)

    try {
      // Prepare the data to be sent with user information
      const dataToSend = {
        formData: {
          ...formData,
          bulkProcessRows: formData.bulkProcessRows || '0', // Default to 0 if empty
          user_id: userData?.id || '', // Add user ID from localStorage
          username: userData?.username || '' // Add username from localStorage
        },
        rows: rows.filter((row) => row.fieldName), // Only send rows with a field name
        modifiedRows: modifiedRows, // Send the list of modified row indices
      }

      // Make the API call to save
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/save-to-db`,
        dataToSend
      )

      // Handle successful response
      message.success('Mapper configuration saved successfully');

      // Perform a "silent refresh" by re-fetching the data.
      // This ensures the form state is completely fresh after the save/update,
      // and all dependent states (validation, activation) are correctly reset.
      await fetchReferenceDetails(formData.reference);

      // The fetchReferenceDetails function handles:
      // - Updating formData, rows with the latest data from the server
      // - Setting isUpdateMode to true
      // - Setting originalFormData and originalRows to the fetched data
      // - Resetting modification tracking (modifiedFields, modifiedRows)
      // - Setting hasUnsavedChanges to false
      // - Setting showValidateButton to true
      // - Resetting validation states (hasBeenValidated, allRowsValidated)
      // - Resetting activation states (isActivated, isActivationSuccessful is implicitly handled)
      // - And other relevant cleanups like validationStatus, warnings, etc.

      // Manual state updates previously here are no longer needed as
      // fetchReferenceDetails covers them by reloading the authoritative state.
      // For example:
      // if (!isUpdateMode && response.data.mapperId) { setFormData(...) }
      // if (response.data.processedRows) { setRows(...) }
      // setHasUnsavedChanges(false)
      // setModifiedRows([])
      // setModifiedFields({})
      // setIsUpdateMode(true)
      // setOriginalFormData({ ...formData })
      // setOriginalRows([...rows])
      // setShowValidateButton(true)
      // setHasBeenValidated(false)
      // setAllRowsValidated(false)
      // setIsActivated(false)
      // setIsActivationSuccessful(false)

    } catch (error) {

      message.error(
        error.response?.data?.error || 'Failed to save mapper configuration'
      )
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

  // Add function to handle logic change in SQL editor
  const handleLogicChange = (newLogic) => {
    if (selectedRowIndex !== null) {
      const newRows = [...rows]
      newRows[selectedRowIndex] = {
        ...newRows[selectedRowIndex],
        logic: newLogic,
        // Reset LogicVerFlag when logic is changed
        LogicVerFlag: '',
      }
      setRows(newRows)
      setSelectedRowLogic(newLogic)

      // Track modifications if this is an update
      if (originalRows) {
        // Check if the row is already in modifiedRows
        const isAlreadyModified = modifiedRows.includes(selectedRowIndex)

        // Check if the current logic value is different from the original
        const isLogicModified =
          JSON.stringify(originalRows[selectedRowIndex]?.logic) !==
          JSON.stringify(newLogic)

        // Add to modifiedRows if not already there and the logic is modified
        if (!isAlreadyModified && isLogicModified) {
          setModifiedRows((prev) => [...prev, selectedRowIndex])
        }
      }

      // Reset validation status for this row
      setValidationStatus((prev) => ({
        ...prev,
        [selectedRowIndex]: undefined,
      }))

      // Set hasUnsavedChanges to true and reset validation states when logic is changed
      setHasUnsavedChanges(true)
      setShowValidateButton(false)
      setHasBeenValidated(false)
      setAllRowsValidated(false)
      setIsActivated(false)
    }
  }

  // Modify handleSaveSql to set hasUnsavedChanges when SQL is saved
  const handleSaveSql = () => {
    if (selectedRowIndex !== null) {
      const newRows = [...rows]
      const originalLogic = newRows[selectedRowIndex].logic;
      
      // Check if logic has actually changed
      if (originalLogic !== sqlEditorContent) {
        newRows[selectedRowIndex] = {
          ...newRows[selectedRowIndex],
          logic: sqlEditorContent,
          // Reset LogicVerFlag when logic is changed
          LogicVerFlag: '',
        }
        setRows(newRows)
        
        // Track modifications and update state
        if (originalRows) {
          // If not already in modifiedRows, add it
          if (!modifiedRows.includes(selectedRowIndex)) {
            setModifiedRows((prev) => [...prev, selectedRowIndex])
          }
        }
        
        // Set hasUnsavedChanges to true since logic has been modified
        setHasUnsavedChanges(true)
        setShowValidateButton(false)
        setHasBeenValidated(false)
        setAllRowsValidated(false)
        setIsActivated(false)
        setIsActivationSuccessful(false)
        
        message.success('SQL logic saved and changes detected')
      } else {
        message.info('No changes were made to SQL logic')
      }
      
      setShowSqlEditor(false)
    }
  }

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const data = await response.json()

      // Remove excluded fields from form data
      const { mapperId, ...cleanedFormData } = data.formData

      // Remove excluded fields from rows and normalize fieldName
      const cleanedRows = data.rows.map((row) => {
        const {
          NewRow,
          validator,
          mapdtlid,
          mapref,
          LogicVerFlag,
          ...cleanedRowData // Renamed to avoid conflict
        } = row

        // Normalize fieldName: convert to uppercase and remove spaces
        let normalizedFieldName = cleanedRowData.fieldName
        if (typeof normalizedFieldName === 'string') {
          normalizedFieldName = normalizedFieldName.toUpperCase().replace(/\s/g, '')
        }

        return {
          ...cleanedRowData,
          fieldName: normalizedFieldName, // Use normalized fieldName
          // Ensure other essential fields have defaults if not present in upload, similar to fetchReferenceDetails
          dataType: cleanedRowData.dataType || '',
          primaryKey: cleanedRowData.primaryKey || false,
          pkSeq: cleanedRowData.pkSeq || '',
          nulls: cleanedRowData.nulls || false,
          logic: cleanedRowData.logic || '',
          // validator: cleanedRowData.validator || 'N', // validator is in cleanedRowData
          keyColumn: cleanedRowData.keyColumn || '',
          valColumn: cleanedRowData.valColumn || '',
          execSequence: cleanedRowData.execSequence || '',
          mapCombineCode: cleanedRowData.mapCombineCode || '',
          // LogicVerFlag: cleanedRowData.LogicVerFlag || '', // LogicVerFlag is in cleanedRowData
          scdType: cleanedRowData.scdType || (formData.tableType === 'DIM' ? (scdTypeOptions.length > 0 ? scdTypeOptions[0].PRCD : '1') : ''),
          fieldDesc: cleanedRowData.fieldDesc || '',
          isNewRow: true, // Set isNewRow to true for all uploaded rows
        }
      })

      // Removed sorting to maintain original order from the uploaded file
      setFormData(cleanedFormData)
      setRows(cleanedRows)

      // Reset all validation and workflow states
      setHasUnsavedChanges(true) // Make save button visible
      setShowValidateButton(true)
      setHasBeenValidated(false)
      setAllRowsValidated(false)
      setIsActivated(false)
      setIsActivationSuccessful(false)
      setBulkValidationSuccess(false)

      // Reset validation status and errors
      setValidationStatus({})
      setErrorMessages({})
      setRowWarnings({})
      setPkSeqErrors({})
      setHasDuplicateKeys(false)

      // Reset modification tracking
      setModifiedFields({})
      setModifiedRows([])

      // Reset original data since this is a new upload
      setOriginalFormData(null)
      setOriginalRows(null)

      // Automatically trigger validation after upload to update states
      validateAll();



      message.success('File uploaded successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error('Failed to upload file')
    }
  }

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
      message.error(
        'Reference can only contain letters, numbers, and underscores'
      )
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/get-by-reference/${reference}`
      )
      const data = response.data

      setFormData({
        ...data.formData,
        freqCode: data.formData.freqCode || '',
      })
      setRows(
        data.rows.length > 0
          ? data.rows.map((row) => ({
              ...row,
              // Normalize fieldName on fetch
              fieldName: typeof row.fieldName === 'string' 
                ? row.fieldName.toUpperCase().replace(/\s/g, '') 
                : '',
              validator: row.validator || 'N',
              keyColumn: row.keyColumn || '',
              valColumn: row.valColumn || '',
              execSequence: row.execSequence || '',
              mapCombineCode: row.mapCombineCode || '',
              LogicVerFlag: row.LogicVerFlag || '',
              scdType: row.scdType || '1',
              fieldDesc: row.fieldDesc || '',
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
              execSequence: '',
              mapCombineCode: '',
              LogicVerFlag: '',
              scdType: '1',
              fieldDesc: '',
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
            execSequence: '',
            mapCombineCode: '',
            LogicVerFlag: '',
            scdType: '1',
            fieldDesc: '',
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
        message.error(
          error.response?.data?.error || 'Failed to fetch reference details'
        )
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

  // Function to show logs for a specific row
  const handleShowLogs = (rowIndex) => {
    const message = errorMessages[rowIndex] || 'No logs available for this row.'
    const rowName = rows[rowIndex]?.fieldName
      ? rows[rowIndex].fieldName
      : `Row ${rowIndex + 1}`

    setCurrentLogMessage(message)
    setLogsDialogTitle(`Validation Logs - ${rowName}`)
    setShowLogsDialog(true)
  }

  // Function to close logs dialog
  const handleCloseLogsDialog = () => {
    setShowLogsDialog(false)
  }

  // Update handleValidateRow function to call both APIs
  const handleValidateRow = async (index) => {
    const currentRow = rows[index]

    // Check if required fields are filled
    if (!currentRow.keyColumn || !currentRow.valColumn || !currentRow.logic) {
      message.error('Please fill in Key Column, Value Column, and SQL Logic')
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/validate-logic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_logic: currentRow.logic,
            p_keyclnm: currentRow.keyColumn,
            p_valclnm: currentRow.valColumn,
          }),
        }
      )

      const data = await response.json()
      if (data.status === 'success') {
        // Update the row's LogicVerFlag directly in rows state
        const newRows = [...rows]
        newRows[index] = {
          ...newRows[index],
          LogicVerFlag: data.is_valid, // 'Y' or 'N'
        }
        setRows(newRows)

        // Store error message if validation failed
        if (data.is_valid === 'N') {
          setErrorMessages((prev) => ({
            ...prev,
            [index]: data.message || 'Logic validation failed',
          }))
        } else {
          // Clear any existing error messages for successful validations
          setErrorMessages((prev) => {
            const newMessages = { ...prev }
            delete newMessages[index]
            return newMessages
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
        LogicVerFlag: 'N',
      }
      setRows(newRows)

      // Store error message
      setErrorMessages((prev) => ({
        ...prev,
        [index]: error.message || 'Error validating logic',
      }))
    }
  }

  // Add back the areAllRowsValid function
  const areAllRowsValid = () => {
    // Get rows that have any data filled
    const filledRows = rows.filter(
      (row) =>
        row.fieldName.trim() !== '' ||
        row.dataType.trim() !== '' ||
        row.keyColumn.trim() !== '' ||
        row.valColumn.trim() !== '' ||
        row.mapCombineCode.trim() !== '' ||
        row.logic.trim() !== ''
    )

    // If no filled rows, return false
    if (filledRows.length === 0) return false

    // Check if all filled rows have LogicVerFlag as 'Y'
    const allValid = filledRows.every((row) => row.LogicVerFlag === 'Y')

    // Don't update state here during render - this causes infinite re-renders
    // Only perform the check and return the value
    return allValid
  }

  // Update validateAll function to use the batch validation API
  const validateAll = async () => {
    // Get rows that have any data filled
    const filledRows = rows.filter(
      (row) =>
        row.fieldName.trim() !== '' ||
        row.dataType.trim() !== '' ||
        row.keyColumn.trim() !== '' ||
        row.valColumn.trim() !== '' ||
        row.mapCombineCode.trim() !== '' ||
        row.logic.trim() !== ''
    )

    if (filledRows.length === 0) {
      console.log('No rows to validate')
      return
    }

    // Set validating state to true
    setIsValidating(true)

    // Show loading message
    message.loading({ content: 'Validating all rows...', key: 'validateAll' })

    try {
      // Call the new batch validation API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/validate-batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mapref: formData.reference,
            rows: rows,
          }),
        }
      )

      const data = await response.json()

      if (data.status !== 'success') {
        throw new Error(data.message || 'Batch validation failed')
      }

      // Initialize validation states
      let validationMessages = []
      let hasBulkValidationError = false
      let hasRowValidationErrors = false

      // Check bulk validation status first
      if (data.bulkValidation && data.bulkValidation.success === 'N') {
        hasBulkValidationError = true
        setBulkValidationSuccess(false) // Set bulk validation status to false
        validationMessages.push(data.bulkValidation.error || 'Bulk validation failed')
        message.error({
          content: data.bulkValidation.error || 'Validation failed',
          key: 'validateAll',
          duration: 5,
        })
      } else {
        setBulkValidationSuccess(true) // Set bulk validation status to true
      }

      // Process row results
      const newRows = [...rows]
      data.rowResults.forEach((result) => {
        const rowIndex = rows.findIndex(
          (row) =>
            (row.mapdtlid && row.mapdtlid === result.rowId) ||
            row.fieldName === result.fieldName
        )

        if (rowIndex !== -1) {
          newRows[rowIndex] = {
            ...newRows[rowIndex],
            LogicVerFlag: result.isValid ? 'Y' : 'N',
          }

          if (!result.isValid) {
            hasRowValidationErrors = true
            setErrorMessages((prev) => ({
              ...prev,
              [rowIndex]: result.detailedError || result.error || 'Validation failed',
            }))
            validationMessages.push(
              `Row ${rowIndex + 1} (${result.fieldName || 'Unnamed'}): ${
                result.error || 'Validation failed'
              }`
            )
          }
        }
      })

      // Check for missing required fields
      rows.forEach((row, index) => {
        if (
          (row.fieldName.trim() !== '' ||
            row.dataType.trim() !== '' ||
            row.keyColumn.trim() !== '' ||
            row.valColumn.trim() !== '' ||
            row.mapCombineCode.trim() !== '' ||
            row.logic.trim() !== '') &&
          (!row.keyColumn || !row.valColumn || !row.logic)
        ) {
          hasRowValidationErrors = true
          newRows[index] = {
            ...newRows[index],
            LogicVerFlag: 'N',
          }
          setErrorMessages((prev) => ({
            ...prev,
            [index]: 'Missing required fields: Key Column, Value Column, and SQL Logic',
          }))
          validationMessages.push(`Row ${index + 1}: Missing required fields`)
        }
      })

      // Update rows state
      setRows(newRows)

      // Set validation states based on both bulk and row validation results
      const isValidationSuccessful = !hasBulkValidationError && !hasRowValidationErrors
      
      setHasBeenValidated(true)
      setAllRowsValidated(isValidationSuccessful)
      setShowValidateButton(!isValidationSuccessful)
      
      // Reset activation states
      setIsActivated(false)
      setIsActivationSuccessful(false)

      // Show appropriate message
      if (isValidationSuccessful) {
        message.success({
          content: 'All rows validated successfully',
          key: 'validateAll',
        });
      } else {
        message.error({
          content: (
            <div>
              <div>Validation failed:</div>
              {validationMessages.map((msg, idx) => (
                <div key={idx} style={{ marginTop: '8px' }}>
                  {msg}
                </div>
              ))}
            </div>
          ),
          key: 'validateAll',
          duration: 5,
        });
      }


    } catch (error) {
      message.error({
        content: 'Error validating rows: ' + (error.message || 'Unknown error'),
        key: 'validateAll',
      })
      console.error('Validation error:', error)

      // Set validation workflow states on error
      setHasBeenValidated(true)
      setAllRowsValidated(false)
      setShowValidateButton(true)
      setBulkValidationSuccess(false) // Set bulk validation status to false on error
      
      // Reset activation states
      setIsActivated(false)
      setIsActivationSuccessful(false)
    } finally {
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

  // Add export menu open handler
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  // Add export menu close handler
  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  // Modify the existing handleDownloadTemplate function to accept format parameter
  const handleDownloadTemplate = async (downloadType = 'empty', format = 'xlsx') => {
    try {
      const messageKey = 'downloadTemplate'
      message.loading({
        content: 'Preparing template...',
        key: messageKey,
      })

      let response
      
      if (downloadType === 'empty') {
        // Download empty template
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mapper/download-template?format=${format}`
        )
      } else {
        // Download with current data
        const payload = {
          formData: formData,
          rows: rows,
          format: format
        }

        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mapper/download-current`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        )
      }

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadType === 'empty' 
        ? `mapper_template.${format}` 
        : `${formData.reference || 'mapper'}_template.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      message.success({
        content: downloadType === 'empty' 
          ? 'Template downloaded successfully' 
          : `Current data exported successfully as ${format.toUpperCase()}`,
        key: messageKey,
      })
    } catch (error) {
      message.error({
        content: 'Failed to download template',
        key: 'downloadTemplate',
      })
      console.error('Download error:', error)
    }
  }

  // Add handler for exporting the current data
  const handleExportData = (format) => {
    handleDownloadTemplate('current', format)
    handleExportClose()
  }

  // Update this reference to use the consolidated function
  const handleCreateJob = async () => {
    // Double check conditions before proceeding
    if (!allRowsValidated || !hasBeenValidated || !isActivated) { // Change from isActivationSuccessful to isActivated
      message.error(
        'Mapper must be validated and activated successfully before creating a job'
      )
      return
    }
    
    // Skip if job is already created
    if (isJobCreated) {
      message.info('Job has already been created')
      return
    }
    
    setIsJobCreating(true)
    
    try {
      // Show loading message
      message.loading({ content: 'Creating job...', key: 'createJob' })
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/job/create-update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mapref: formData.reference,
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        message.success({ 
          content: data.message || 'Job created successfully',
          key: 'createJob'
        })
        
        // Set job as created - this will disable the create job button
        setIsJobCreated(true)
      } else {
        message.error({ 
          content: data.message || 'Failed to create job',
          key: 'createJob'
        })
      }
    } catch (error) {
      message.error({
        content: 'Failed to create job: ' + (error.message || 'Unknown error'),
        key: 'createJob'
      })
    } finally {
      setIsJobCreating(false)
    }
  }

  // Add useEffect to fetch SCD type options
  useEffect(() => {
    const fetchScdTypeOptions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mapper/parameter_scd_type`
        )
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

  const [error, setError] = useState('') // Add this line to define the error state

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
        execSequence: '',
        mapCombineCode: '',
        LogicVerFlag: '',
        scdType: '1',
        fieldDesc: '',
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
//   const handleEditReference = (reference) => {
//     if (reference) {
//       // The existing fetchReferenceDetails function will be called with this reference
//       fetchReferenceDetails(reference)

//       // Show the mapper form and hide the reference table
//       setShowReferenceTable(false)
//       setShowMapperForm(true)
//     }
//   }

  // Add state for logs dialog
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [logsDialogTitle, setLogsDialogTitle] = useState('')
  const [currentLogMessage, setCurrentLogMessage] = useState('')

  // Add useEffect to debug button states
  useEffect(() => {

  }, [isActivated, isActivationSuccessful, isJobCreated, hasBeenValidated, allRowsValidated, showValidateButton, hasUnsavedChanges, modifiedRows]);

  // Add state for row actions menu
  const [rowMenuAnchorEl, setRowMenuAnchorEl] = useState(null);
  const [selectedActionRowIndex, setSelectedActionRowIndex] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle row menu open
  const handleRowMenuOpen = (event, index) => {
    event.stopPropagation();
    setRowMenuAnchorEl(event.currentTarget);
    setSelectedActionRowIndex(index);
  };

  // Handle row menu close
  const handleRowMenuClose = () => {
    setRowMenuAnchorEl(null);
  };

  // Handle duplicate row
  const handleDuplicateRow = () => {
    if (selectedActionRowIndex !== null) {
      const rowToDuplicate = rows[selectedActionRowIndex];
      
      // Create a new row based on the selected row, clearing the ID
      const newRow = {
        ...rowToDuplicate,
        mapdtlid: '', // Clear the ID so it will be treated as a new row
        LogicVerFlag: '', // Reset validation flag
      };
      
      // Insert the duplicated row after the selected row
      const newRows = [...rows];
      newRows.splice(selectedActionRowIndex + 1, 0, newRow);
      setRows(newRows);
      
      // Set hasUnsavedChanges to true and reset validation states
      setHasUnsavedChanges(true);
      setShowValidateButton(false);
      setHasBeenValidated(false);
      setAllRowsValidated(false);
      setIsActivated(false);
      setIsActivationSuccessful(false);
      
      message.success('Row duplicated successfully');
      handleRowMenuClose();
    }
  };

  // Handle delete row dialog open
  const handleDeleteRowDialogOpen = () => {
    if (selectedActionRowIndex !== null) {
      const rowToDelete = rows[selectedActionRowIndex];
      
      // Only show delete dialog if the row has data and a field name
      if (rowToDelete.fieldName) {
        setRowToDelete(rowToDelete);
        setShowDeleteDialog(true);
      } else {
        // If the row is empty, just remove it directly
        handleDeleteEmptyRow();
      }
      
      handleRowMenuClose();
    }
  };

  // Handle delete empty row (no confirmation needed)
  const handleDeleteEmptyRow = () => {
    if (selectedActionRowIndex !== null) {
      const newRows = [...rows];
      newRows.splice(selectedActionRowIndex, 1);
      setRows(newRows);
      
      message.info('Row removed');
      
      // Ensure we always have at least one row
      if (newRows.length === 0) {
        addRow();
      }
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setRowToDelete(null);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!rowToDelete || !rowToDelete.fieldName || !formData.reference) {
      handleCancelDelete();
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Call the API to delete the row
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/mapper/delete-mapping-detail`,
        {
          mapref: formData.reference,
          trgclnm: rowToDelete.fieldName
        }
      );
      
      if (response.data.success) {
        // Remove the row from the state
        const newRows = [...rows];
        newRows.splice(selectedActionRowIndex, 1);
        setRows(newRows);
        
        message.success(response.data.message || 'Row deleted successfully');
        
        // Ensure we always have at least one row
        if (newRows.length === 0) {
          addRow();
        }
        
        // Set hasUnsavedChanges to true and reset validation states
        setHasUnsavedChanges(true);
        setShowValidateButton(false);
        setHasBeenValidated(false);
        setAllRowsValidated(false);
        setIsActivated(false);
        setIsActivationSuccessful(false);
      } else {
        message.error(response.data.message || 'Failed to delete row');
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      message.error(error.response?.data?.message || 'Failed to delete row');
    } finally {
      setIsDeleting(false);
      handleCancelDelete();
    }
  };

  // Add useEffect to fetch user data from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserData(user)
      }
    } catch (error) {
      console.error('Error getting user data from localStorage:', error)
    }
  }, [])

  // Add a cleanup effect to release locks when component unmounts
  useEffect(() => {
    // Cleanup function to release lock on unmount
    return () => {
      if (reference) {
        releaseReferenceLock(reference).catch(error => {
          console.error('Error releasing lock on unmount:', error);
        });
      }
    };
  }, [reference]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Removed Paper wrapper from here */}
      <div
        className={`transition-all duration-300 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}
      >
        {/* Header section with optimized space */}
        <div className="mb-2">
          {/* Simplified header with buttons in a single row */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* Left side buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                onClick={handleReturnWithUnlock}
                className="transition-all duration-200"
                sx={{
                  height: '30px',
                  minWidth: '85px',
                  textTransform: 'none',
                  borderRadius: '6px',
                  borderWidth: '1px',
                  fontSize: '0.8rem',
                  borderColor: darkMode
                    ? 'rgba(96, 165, 250, 0.5)'
                    : 'rgba(37, 99, 235, 0.5)',
                  color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                  '&:hover': {
                    borderColor: darkMode
                      ? 'rgb(96, 165, 250)'
                      : 'rgb(37, 99, 235)',
                    backgroundColor: darkMode
                      ? 'rgba(96, 165, 250, 0.08)'
                      : 'rgba(37, 99, 235, 0.04)',
                  },
                }}
                startIcon={<KeyboardArrowLeftIcon fontSize="small" />}
              >
                Back
              </Button>

              <Button
                variant="outlined"
                onClick={handleTemplateClick}
                className="transition-all duration-200"
                sx={{
                  height: '30px',
                  minWidth: '85px',
                  textTransform: 'none',
                  borderRadius: '6px',
                  borderWidth: '1px',
                  fontSize: '0.8rem',
                  borderColor: darkMode
                    ? 'rgba(96, 165, 250, 0.5)'
                    : 'rgba(37, 99, 235, 0.5)',
                  color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                  '&:hover': {
                    borderColor: darkMode
                      ? 'rgb(96, 165, 250)'
                      : 'rgb(37, 99, 235)',
                    backgroundColor: darkMode
                      ? 'rgba(96, 165, 250, 0.08)'
                      : 'rgba(37, 99, 235, 0.04)',
                  },
                }}
                endIcon={<KeyboardArrowDownIcon fontSize="small" />}
              >
                Template
              </Button>

              {/* Add Export button */}
              <Button
                variant="outlined"
                onClick={handleExportClick}
                className="transition-all duration-200"
                sx={{
                  height: '30px',
                  minWidth: '85px',
                  textTransform: 'none',
                  borderRadius: '6px',
                  borderWidth: '1px',
                  fontSize: '0.8rem',
                  borderColor: darkMode
                    ? 'rgba(96, 165, 250, 0.5)'
                    : 'rgba(37, 99, 235, 0.5)',
                  color: darkMode ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                  '&:hover': {
                    borderColor: darkMode
                      ? 'rgb(96, 165, 250)'
                      : 'rgb(37, 99, 235)',
                    backgroundColor: darkMode
                      ? 'rgba(96, 165, 250, 0.08)'
                      : 'rgba(37, 99, 235, 0.04)',
                  },
                }}
                endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                startIcon={<ExportIcon fontSize="small" />}
              >
                Export
              </Button>
            </div>

            {/* Right side buttons - Updated for proper workflow */}
            <div className="flex items-center gap-2">
              {/* Save/Update Button */}
              <Tooltip
                title={
                  areAllRowsValid()
                    ? isUpdateMode
                      ? 'Update Mapper Configuration'
                      : 'Save Mapper Configuration'
                    : 'All rows must be validated successfully before saving'
                }
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving || (!hasUnsavedChanges && modifiedRows.length === 0)}
                    sx={{
                      height: '30px',
                      minWidth: '70px',
                      textTransform: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                      background: isUpdateMode
                        ? 'linear-gradient(45deg, #059669, #10B981)'
                        : 'linear-gradient(45deg, #2563EB, #3B82F6)',
                      '&:hover': {
                        background: isUpdateMode
                          ? 'linear-gradient(45deg, #047857, #059669)'
                          : 'linear-gradient(45deg, #1D4ED8, #2563EB)',
                      },
                      '&.Mui-disabled': {
                        background: isUpdateMode
                          ? darkMode
                            ? 'rgba(5, 150, 105, 0.3)'
                            : 'rgba(5, 150, 105, 0.3)'
                          : darkMode
                            ? 'rgba(37, 99, 235, 0.3)'
                            : 'rgba(37, 99, 235, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                    startIcon={
                      isSaving ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon fontSize="small" />
                      )
                    }
                  >
                    {isUpdateMode ? 'Update' : 'Save'}
                  </Button>
                </span>
              </Tooltip>

              {/* Validate Button - Always show but disable when appropriate */}
              <Tooltip
                title={
                  hasUnsavedChanges
                    ? 'Save changes before validating'
                    : showValidateButton
                      ? 'Validate all rows' 
                      : 'Validation completed successfully'
                }
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={validateAll}
                    disabled={isValidating || hasUnsavedChanges || !showValidateButton}
                    sx={{
                      height: '30px',
                      minWidth: '70px',
                      textTransform: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      background: 'linear-gradient(45deg, #059669, #10B981)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #047857, #059669)',
                      },
                      '&.Mui-disabled': {
                        background: darkMode 
                          ? 'rgba(5, 150, 105, 0.3)' 
                          : 'rgba(5, 150, 105, 0.3)',
                        color: darkMode 
                          ? 'rgba(255, 255, 255, 0.4)'
                          : 'rgba(255, 255, 255, 0.7)'
                      }
                    }}
                    startIcon={
                      isValidating ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <VerifyIcon fontSize="small" />
                      )
                    }
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </Button>
                </span>
              </Tooltip>

              {/* Activate Button - Always show but disable when not validated */}
              <Tooltip
                title={
                  !hasBeenValidated
                    ? 'Validation must be attempted before activation'
                    : isActivated 
                      ? 'Mapper is already activated'
                      : 'Activate mapper configuration'
                }
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleActivate}
                    disabled={!hasBeenValidated || !bulkValidationSuccess || isActivated}
                    sx={{
                      height: '30px',
                      minWidth: '70px',
                      textTransform: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      background: 'linear-gradient(45deg, #7C3AED, #8B5CF6)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #6D28D9, #7C3AED)',
                      },
                      '&.Mui-disabled': {
                        background: darkMode 
                          ? 'rgba(124, 58, 237, 0.3)' 
                          : 'rgba(124, 58, 237, 0.3)',
                        color: darkMode 
                          ? 'rgba(255, 255, 255, 0.4)'
                          : 'rgba(255, 255, 255, 0.7)'
                      }
                    }}
                    startIcon={<CheckIcon fontSize="small" />}
                  >
                    Activate
                  </Button>
                </span>
              </Tooltip>

              {/* Create Job Button - Always show but disable when not activated or already created */}
              <Tooltip
                title={
                  !isActivated // Change from isActivationSuccessful to isActivated
                    ? 'Mapper must be activated before creating a job'
                    : isJobCreated
                      ? 'Job has been created successfully'
                      : 'Create job for this mapper configuration'
                }
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleCreateJob}
                    disabled={!isActivated || isJobCreated || isJobCreating} // Change from isActivationSuccessful to isActivated
                    sx={{
                      height: '30px',
                      minWidth: '70px',
                      textTransform: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      background: 'linear-gradient(45deg, #0EA5E9, #38BDF8)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0284C7, #0EA5E9)',
                      },
                      '&.Mui-disabled': {
                        background: darkMode 
                          ? 'rgba(14, 165, 233, 0.3)' 
                          : 'rgba(14, 165, 233, 0.3)',
                        color: darkMode 
                          ? 'rgba(255, 255, 255, 0.4)'
                          : 'rgba(255, 255, 255, 0.7)'
                      }
                    }}
                    startIcon={isJobCreating ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon fontSize="small" />}
                  >
                    {isJobCreating ? 'Creating...' : 'Create Job'}
                  </Button>
                </span>
              </Tooltip>
            </div>
          </div>

          {/* Template menus */}
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
                mt: 1,
              },
            }}
          >
            <MenuItem
              onClick={(event) => {
                event.stopPropagation()
                handleDownloadClick(event)
              }}
              className={
                darkMode
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'hover:bg-blue-50'
              }
            >
              <ListItemIcon>
                <DownloadIcon
                  className={darkMode ? 'text-gray-400' : 'text-gray-600'}
                  fontSize="small"
                />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
              <KeyboardArrowRightIcon
                fontSize="small"
                className={darkMode ? 'text-gray-400' : 'text-gray-600'}
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleTemplateClose()
                handleUploadClick()
              }}
              className={
                darkMode
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'hover:bg-blue-50'
              }
            >
              <ListItemIcon>
                <UploadIcon
                  className={darkMode ? 'text-gray-400' : 'text-gray-600'}
                  fontSize="small"
                />
              </ListItemIcon>
              <ListItemText>Upload</ListItemText>
            </MenuItem>
          </Menu>

          {/* Download menu */}
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
                borderRadius: '8px',
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleTemplateClose()
                handleDownloadTemplate('empty', 'xlsx')
              }}
              className={
                darkMode
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'hover:bg-blue-50'
              }
            >
              <ListItemIcon>
                <DescriptionIcon
                  className={darkMode ? 'text-gray-400' : 'text-gray-600'}
                  fontSize="small"
                />
              </ListItemIcon>
              <ListItemText>Download Template</ListItemText>
            </MenuItem>
          </Menu>

          {/* Add Export menu */}
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              elevation: 3,
              sx: {
                backgroundColor: darkMode ? 'rgb(31, 41, 55)' : 'white',
                minWidth: '200px',
                borderRadius: '8px',
                mt: 1,
              },
            }}
          >
            <MenuItem
              onClick={() => handleExportData('xlsx')}
              className={
                darkMode
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'hover:bg-blue-50'
              }
            >
              <ListItemIcon>
                <TableIcon
                  className={darkMode ? 'text-green-400' : 'text-green-600'}
                  fontSize="small"
                />
              </ListItemIcon>
              <ListItemText>Export as Excel (.xlsx)</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleExportData('csv')}
              className={
                darkMode
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'hover:bg-blue-50'
              }
            >
              <ListItemIcon>
                <FileIcon
                  className={darkMode ? 'text-blue-400' : 'text-blue-600'}
                  fontSize="small"
                />
              </ListItemIcon>
              <ListItemText>Export as CSV (.csv)</ListItemText>
            </MenuItem>
          </Menu>

          {/* Hidden file input */}
          <input
            id="file-upload"
            type="file"
            hidden
            accept=".xlsx"
            onChange={handleFileUpload}
          />
        </div>

        {/* Form Section with more compact layout */}
        <div className="grid grid-cols-12 gap-x-4 gap-y-2 mb-3">
          {/* Combined Form Section - Optimizing top space, more compact layout */}
          <div
            className={`col-span-12 p-3 rounded-lg border ${
              darkMode
                ? 'border-gray-700 bg-gray-800/30'
                : 'border-gray-200 bg-white/80'
            }`}
          >
            <div className="grid grid-cols-12 gap-x-3 gap-y-2">
              <TextField
                label="Reference"
                value={formData.reference}
                onChange={(e) =>
                  handleFormChange('reference', e.target.value)
                }
                onKeyDown={handleKeyDown}
                size="small"
                className="col-span-2"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : 'white',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.7rem',
                    transform: 'translate(14px, 7px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                }}
                InputProps={{
                  style: { fontSize: '0.8rem' },
                }}
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
                size="small"
                className="col-span-2"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : 'white',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.7rem',
                    transform: 'translate(14px, 7px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                }}
                InputProps={{
                  style: { fontSize: '0.8rem' },
                }}
              />
              <TextField
                label="Target Schema"
                value={formData.targetSchema}
                onChange={(e) =>
                  handleFormChange('targetSchema', e.target.value)
                }
                size="small"
                className="col-span-2"
                variant="outlined"
                error={!!schemaError}
                helperText={
                  schemaError
                    ? 'Must start with a letter, only A-Z, 0-9, _'
                    : ''
                }
                // Disable the field if this is an update of an existing mapper
                disabled={isUpdateMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : isUpdateMode
                        ? 'rgba(229, 231, 235, 0.5)'
                        : 'white',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.7rem',
                    transform: 'translate(14px, 7px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    position: 'absolute',
                    bottom: '-16px',
                    margin: 0,
                    fontSize: '0.625rem',
                    lineHeight: '1',
                  },
                }}
                InputProps={{
                  style: { fontSize: '0.8rem' },
                }}
              />
              <TextField
                label="Target Table"
                value={formData.tableName}
                onChange={(e) =>
                  handleFormChange('tableName', e.target.value)
                }
                size="small"
                className="col-span-2"
                variant="outlined"
                error={!!tableNameError}
                helperText={
                  tableNameError
                    ? 'Must start with a letter, only A-Z, 0-9, _'
                    : ''
                }
                // Disable the field if this is an update of an existing mapper
                disabled={isUpdateMode}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : isUpdateMode
                        ? 'rgba(229, 231, 235, 0.5)'
                        : 'white',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.7rem',
                    transform: 'translate(14px, 7px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    position: 'absolute',
                    bottom: '-16px',
                    margin: 0,
                    fontSize: '0.625rem',
                    lineHeight: '1',
                  },
                }}
                InputProps={{
                  style: { fontSize: '0.8rem' },
                }}
              />
              <FormControl
                size="small"
                variant="outlined"
                className="col-span-1"
                sx={{ '& .MuiOutlinedInput-root': { height: '28px' } }}
              >
                <InputLabel
                  id="table-type-label"
                  className={`${darkMode ? 'text-gray-400' : ''}`}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Table Type
                </InputLabel>
                <Select
                  labelId="table-type-label"
                  value={formData.tableType}
                  onChange={(e) =>
                    handleFormChange('tableType', e.target.value)
                  }
                  disabled={isUpdateMode}
                  label="Table Type"
                  className={`${darkMode ? 'text-gray-200' : ''}`}
                  sx={{ 
                    fontSize: '0.8rem',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : isUpdateMode ? 'rgba(229, 231, 235, 0.5)' : 'white',
                  }}
                >
                  {TABLE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                size="small"
                variant="outlined"
                className="col-span-1"
                sx={{ '& .MuiOutlinedInput-root': { height: '28px' } }}
              >
                <InputLabel
                  id="freq-code-label"
                  className={`${darkMode ? 'text-gray-400' : ''}`}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Frequency
                </InputLabel>
                <Select
                  labelId="freq-code-label"
                  value={formData.freqCode}
                  onChange={(e) =>
                    handleFormChange('freqCode', e.target.value)
                  }
                  label="Frequency"
                  className={`${darkMode ? 'text-gray-200' : ''}`}
                  sx={{ fontSize: '0.8rem' }}
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
                onChange={(e) =>
                  handleFormChange('sourceSystem', e.target.value)
                }
                size="small"
                className="col-span-1"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : 'white',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.7rem',
                    transform: 'translate(14px, 7px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                }}
                InputProps={{
                  style: { fontSize: '0.8rem' },
                }}
              />
              <TextField
                label="Bulk Process Rows"
                value={formData.bulkProcessRows}
                onChange={(e) => {
                  const value = e.target.value
                  if (
                    value === '' ||
                    (/^\d+$/.test(value) && parseInt(value) > 0)
                  ) {
                    handleFormChange('bulkProcessRows', value)
                  }
                }}
                size="small"
                className="col-span-1"
                variant="outlined"
                type="number"
                inputProps={{ min: '1' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: darkMode
                      ? 'rgba(31, 41, 55, 0.5)'
                      : 'white',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.7rem',
                    transform: 'translate(14px, 7px) scale(1)',
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    },
                  },
                  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button':
                    {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                  '& input[type=number]': {
                    '-moz-appearance': 'textfield',
                  },
                }}
                InputProps={{
                  style: { fontSize: '0.8rem' },
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Section with additional height */}
        <div
          className={`rounded-lg border ${
            darkMode
              ? 'border-gray-700 bg-gray-800/20'
              : 'border-gray-200 bg-white/90'
          } overflow-hidden shadow-sm mb-6 relative`}
          style={{ minHeight: '400px' }} /* Increase table height to use space efficiently */
        >
          {/* Remove title section and add row button from here */}
          <TableContainer 
            className="overflow-auto"
            sx={{ 
              maxHeight: 'calc(100vh - 15rem)',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.3)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)',
                },
              },
            }}
          >
            <Table stickyHeader size="small" sx={{ 
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': {
                padding: '0px',
                border: darkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 1)',
              }
            }}>
              <TableHead>
                <TableRow sx={{ height: '36px' }}>
                  <TableCell
                    align="center"
                    className={`
                          font-medium py-1 px-1
                          ${
                            hasDuplicateKeys
                              ? darkMode
                                ? 'bg-red-900/80 text-red-100'
                                : 'bg-red-100 text-red-800'
                              : darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                           sticky top-0 z-10
                          transition-colors duration-300
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '40px', 
                      padding: '6px 2px',
                      borderBottom: darkMode ? '2px solid rgba(75, 85, 99, 0.5)' : '2px solid rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    Key?
                  </TableCell>
                  <TableCell
                    align="center"
                    className={`
                          font-medium py-1 px-1
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '60px',
                      padding: '6px 2px'
                    }}
                  >
                    {hasDuplicateKeys ? (
                      <Tooltip title="Duplicate key sequences detected. Each primary key must have a unique sequence number.">
                        <div className="flex items-center justify-center">
                          KeySeq
                          <span className="ml-1 text-red-500 animate-pulse">
                            ⚠️
                          </span>
                        </div>
                      </Tooltip>
                    ) : (
                      'KeySeq'
                    )}
                  </TableCell>
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '140px',
                      padding: '6px 8px'
                    }}
                  >
                    Target Column Name
                  </TableCell>
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '100px',
                      padding: '6px 8px'
                    }}
                  >
                    Data Type
                  </TableCell>
                  {/* Add Description column header */}
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)', 
                      width: '120px',
                      padding: '6px 8px'
                    }}
                  >
                    Description
                  </TableCell>
                  {formData.tableType === 'DIM' && (
                    <TableCell
                      className={`
                            font-medium py-1 px-2
                            ${
                              darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-gray-50/90'
                            }
                            sticky top-0 z-10
                          `}
                      sx={{ 
                        fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                        width: '80px',
                        padding: '6px 8px'
                      }}
                    >
                      SCD Type
                    </TableCell>
                  )}
                  {/* Add Logic column header */}
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '220px', // Increased from 180px
                      padding: '6px 8px'
                    }}
                  >
                    Logic
                  </TableCell>
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '130px', // Increased from 110px
                      padding: '6px 8px'
                    }}
                  >
                    Key Column
                  </TableCell>
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '130px', // Increased from 110px
                      padding: '6px 8px'
                    }}
                  >
                    Value Column
                  </TableCell>
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '90px',
                      padding: '6px 8px'
                    }}
                  >
                    Exec Seq
                  </TableCell>
                  <TableCell
                    className={`
                          font-medium py-1 px-2
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '110px', // Reduced from 150px
                      padding: '6px 8px'
                    }}
                  >
                    Comb Code
                  </TableCell>
                  <TableCell
                    align="center"
                    className={`
                          font-medium py-1 px-1
                          ${
                            darkMode
                              ? 'bg-gray-800 text-gray-200'
                              : 'bg-gray-50/90'
                          }
                          sticky top-0 z-10
                        `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '40px', // Reduced from 50px
                      padding: '6px 2px'
                    }}
                  >
                    Valid
                  </TableCell>
                  {/* Add Actions column header */}
                  <TableCell
                    align="center"
                    className={`
                        font-medium py-1 px-1
                        ${
                          darkMode
                            ? 'bg-gray-800 text-gray-200'
                            : 'bg-gray-50/90'
                        }
                        sticky top-0 z-10
                      `}
                    sx={{ 
                      fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)',
                      width: '35px', // Reduced from 40px
                      padding: '6px 2px'
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={index}
                    onClick={() => handleRowClick(index)}
                    className={`
                          transition-colors duration-150 cursor-pointer
                          ${
                            modifiedRows.includes(index)
                              ? darkMode
                                ? 'bg-green-900/20 hover:bg-green-900/30'
                                : 'bg-green-50 hover:bg-green-100/70'
                              : darkMode
                              ? `hover:bg-gray-700/50 ${
                                  selectedRowIndex === index
                                    ? 'bg-gray-700/70'
                                    : ''
                                }`
                              : `hover:bg-blue-50/30 ${
                                  selectedRowIndex === index
                                    ? 'bg-blue-50/50'
                                    : ''
                                }`
                          }
                        `}
                    sx={{ 
                      height: { xs: '26px', md: '26px' },
                      '&:hover': {
                        '& .MuiTableCell-root': {
                          borderColor: darkMode 
                            ? 'rgba(96, 165, 250, 0.3)' 
                            : 'rgba(59, 130, 246, 0.3)',
                        }
                      },
                      '&.Mui-selected, &.Mui-selected:hover': {
                        '& .MuiTableCell-root': {
                          borderColor: darkMode 
                            ? 'rgba(96, 165, 250, 0.5)' 
                            : 'rgba(59, 130, 246, 0.5)',
                        }
                      }
                    }}
                  >
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 2px' }}>
                      <Checkbox
                        checked={row.primaryKey}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            'primaryKey',
                            e.target.checked
                          )
                        }
                        className={`${
                          darkMode ? 'text-blue-400' : 'text-blue-500'
                        }`}
                        size="small"
                        sx={{ padding: '2px', height: '26px' }}
                      />
                    </TableCell>
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 2px' }}>
                      <TextField
                        value={row.pkSeq}
                        onChange={(e) =>
                          handleNumberChange(e, index, 'pkSeq')
                        }
                        disabled={!row.primaryKey}
                        size="small"
                        fullWidth
                        variant="outlined"
                        error={!!pkSeqErrors[index]}
                        helperText={pkSeqErrors[index]}
                        inputProps={{
                          min: 0,
                          max: 999,
                          step: 1,
                          className: 'px-2 py-0 text-center',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } rounded-none ${!row.primaryKey ? 'opacity-50' : ''}`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: pkSeqErrors[index]
                                ? darkMode
                                  ? 'rgba(239,68,68,0.7)'
                                  : 'rgba(239,68,68,0.7)'
                                : 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: pkSeqErrors[index]
                                ? darkMode
                                  ? 'rgba(239,68,68,0.9)'
                                  : 'rgba(239,68,68,0.9)'
                                : darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: pkSeqErrors[index]
                                ? darkMode
                                  ? 'rgba(239,68,68,1)'
                                  : 'rgba(239,68,68,1)'
                                : '#3b82f6',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: darkMode
                                ? 'rgba(31, 41, 55, 0.5)'
                                : 'rgba(229, 231, 235, 0.5)',
                              '& fieldset': {
                                borderColor: 'transparent',
                              },
                              '& input': {
                                color: darkMode
                                  ? 'rgba(255,255,255,0.5)'
                                  : 'rgba(0,0,0,0.5)',
                              },
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: darkMode
                              ? 'rgba(239,68,68,0.9)'
                              : 'rgba(239,68,68,0.9)',
                            position: 'absolute',
                            bottom: '-20px',
                            margin: 0,
                            fontSize: '0.625rem',
                          },
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <TextField
                        value={row.fieldName}
                        disabled={!!row.mapdtlid}
                        onChange={(e) => {
                          const value = e.target.value
                            .toUpperCase()
                            .slice(0, 30)
                          handleRowChange(
                            index,
                            'fieldName',
                            value
                          )
                        }}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          maxLength: 30,
                          className: 'px-2 py-0',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode
                            ? 'bg-gray-800/50'
                            : row.mapdtlid
                            ? 'bg-gray-100'
                            : 'bg-white'
                        } rounded-none`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: '#3b82f6',
                            },
                            '&.Mui-disabled': {
                              backgroundColor: darkMode
                                ? 'rgba(31, 41, 55, 0.5)'
                                : 'rgba(229, 231, 235, 0.5)',
                              '& fieldset': {
                                borderColor: 'transparent',
                              },
                              '& input': {
                                color: darkMode
                                  ? 'rgba(255,255,255,0.5)'
                                  : 'rgba(0,0,0,0.5)',
                              },
                            },
                          },
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px', width: '100px' }}>
                      <Autocomplete
                        value={
                          dataTypeOptions.find(
                            (option) => option.PRCD === row.dataType
                          ) || null
                        }
                        disabled={!!row.mapdtlid}
                        onChange={(event, newValue) => {
                          handleRowChange(
                            index,
                            'dataType',
                            newValue ? newValue.PRCD : ''
                          )
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
                              darkMode
                                ? 'bg-gray-800/50'
                                : row.mapdtlid
                                ? 'bg-gray-100'
                                : 'bg-white'
                            } rounded-none`}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                height: '26px',
                                borderRadius: '0',
                                '& fieldset': {
                                  borderColor: 'transparent',
                                },
                                '&:hover fieldset': {
                                  borderColor: darkMode
                                    ? 'rgba(96, 165, 250, 0.5)' 
                                    : 'rgba(59, 130, 246, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderWidth: '1px !important',
                                  borderColor: '#3b82f6',
                                },
                                '&.Mui-disabled': {
                                  backgroundColor: darkMode
                                    ? 'rgba(31, 41, 55, 0.5)'
                                    : 'rgba(229, 231, 235, 0.5)',
                                  '& fieldset': {
                                    borderColor: 'transparent',
                                  },
                                  '& input': {
                                    color: darkMode
                                      ? 'rgba(255,255,255,0.5)'
                                      : 'rgba(0,0,0,0.5)',
                                  },
                                },
                              },
                              '& .MuiAutocomplete-inputRoot': {
                                paddingTop: '0 !important',
                                paddingBottom: '0 !important',
                              },
                              '& .MuiInputBase-input': {
                                padding: '2px 4px !important',
                                fontSize: '0.8rem',
                                height: '26px !important',
                                boxSizing: 'border-box',
                              }
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
                        isOptionEqualToValue={(option, value) =>
                          option.PRCD === value.PRCD
                        }
                        className={darkMode ? 'text-gray-200' : ''}
                        disableClearable
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <TextField
                        value={row.fieldDesc}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 100)
                          handleRowChange(
                            index,
                            'fieldDesc',
                            value
                          )
                        }}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          maxLength: 100,
                          className: 'px-2 py-0',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } rounded-none`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: '#3b82f6',
                            },
                          },
                        }}
                      />
                    </TableCell>
                    
                    {formData.tableType === 'DIM' && (
                      <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                        <FormControl
                          fullWidth
                          size="small"
                          variant="outlined"
                          className={`${
                            darkMode ? 'bg-gray-800/50' : 'bg-white'
                          } rounded-none`}
                        >
                          <Select
                            value={row.scdType}
                            onChange={(e) =>
                              handleRowChange(
                                index,
                                'scdType',
                                e.target.value
                              )
                            }
                            renderValue={(value) => {
                              // Find the option with matching PRCD and display its PRCD
                              const option = scdTypeOptions.find(
                                (opt) => opt.PRCD === value
                              )
                              return option ? option.PRCD : value
                            }}
                            className={darkMode ? 'text-gray-200' : ''}
                            sx={{
                              height: '26px',
                              borderRadius: '0',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'transparent',
                                borderRadius: '0',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: darkMode
                                  ? 'rgba(96, 165, 250, 0.5)'
                                  : 'rgba(59, 130, 246, 0.5)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '1px !important',
                                borderColor: '#3b82f6',
                              },
                              '& .MuiSelect-select': {
                                padding: '2px 6px',
                                fontSize: '0.8rem',
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
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <div className="relative group">
                        <TextField
                          multiline
                          maxRows={2}
                          value={row.logic?.substring(0, 100) || ''}
                          disabled
                          size="small"
                          fullWidth
                          variant="outlined"
                          placeholder="Click edit to add SQL logic"
                          className={`${
                            darkMode ? 'bg-gray-800/50' : 'bg-white'
                          } rounded-none`}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.75rem',
                              minHeight: '20px',
                              height: '26px',
                              borderRadius: '0',
                              '& fieldset': {
                                borderColor: 'transparent',
                                borderRadius: '0',
                              },
                              '&:hover fieldset': {
                                borderColor: darkMode 
                                  ? 'rgba(96, 165, 250, 0.5)' 
                                  : 'rgba(59, 130, 246, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderWidth: '1px !important',
                                borderColor: '#3b82f6',
                              },
                              '&.Mui-disabled': {
                                backgroundColor: 'transparent',
                                '& fieldset': {
                                  borderColor: 'transparent',
                                },
                                '& textarea': {
                                  color: darkMode
                                    ? 'rgba(255,255,255,0.8)'
                                    : 'rgba(0,0,0,0.8)',
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              height: '26px',
                              boxSizing: 'border-box',
                              padding: '2px 4px !important',
                              lineHeight: '1.2',
                            }
                          }}
                        />
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip title="Edit SQL Logic">
                            <IconButton
                                                          onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSqlEditor(index);
                            }}
                              size="small"
                              sx={{ 
                                padding: '2px',
                                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)'
                              }}
                            >
                              <EditIcon fontSize="small" className={darkMode ? 'text-blue-400' : 'text-blue-600'} sx={{ fontSize: '16px' }} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <TextField
                        value={row.keyColumn}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 250)
                          handleRowChange(
                            index,
                            'keyColumn',
                            value
                          )
                        }}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          maxLength: 250,
                          className: 'px-2 py-0',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } rounded-none`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: '#3b82f6',
                            },
                          },
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <TextField
                        value={row.valColumn}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 250)
                          handleRowChange(
                            index,
                            'valColumn',
                            value
                          )
                        }}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          maxLength: 250,
                          className: 'px-2 py-0',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } rounded-none`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: '#3b82f6',
                            },
                          },
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <TextField
                        value={row.execSequence}
                        onChange={(e) => {
                          // Only allow integers up to 5000
                          const value = e.target.value;
                          if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 5000)) {
                            handleRowChange(
                              index,
                              'execSequence',
                              value
                            )
                          }
                        }}
                        size="small"
                        fullWidth
                        variant="outlined"
                        type="number"
                        inputProps={{
                          min: 0,
                          max: 5000,
                          className: 'px-2 py-0',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } rounded-none`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: '#3b82f6',
                            },
                          },
                          '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                            '-webkit-appearance': 'none',
                            margin: 0,
                          },
                          '& input[type=number]': {
                            '-moz-appearance': 'textfield',
                          },
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" sx={{ padding: '0px 4px' }}>
                      <TextField
                        value={row.mapCombineCode}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 30)
                          handleRowChange(
                            index,
                            'mapCombineCode',
                            value
                          )
                        }}
                        size="small"
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          maxLength: 30,
                          className: 'px-2 py-0',
                          style: { height: '26px', fontSize: '0.8rem' }
                        }}
                        className={`${
                          darkMode ? 'bg-gray-800/50' : 'bg-white'
                        } rounded-none`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '26px',
                            borderRadius: '0',
                            '& fieldset': {
                              borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                              borderColor: darkMode
                                ? 'rgba(96, 165, 250, 0.5)'
                                : 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: '1px !important',
                              borderColor: '#3b82f6',
                            },
                          },
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="py-0 px-0" align="center" sx={{ padding: '0px 2px' }}>
                      <Tooltip
                        title={
                          row.LogicVerFlag === ''
                            ? 'Validate this row'
                            : row.LogicVerFlag === 'Y'
                            ? 'Logic is valid'
                            : errorMessages[index] ||
                              'Logic is invalid'
                        }
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation() // Prevent row selection
                            handleValidateRow(index)
                          }}
                          size="small"
                          sx={{
                            padding: '2px',
                            color:
                              row.LogicVerFlag === ''
                                ? darkMode
                                  ? 'rgba(156, 163, 175, 0.9)'
                                  : 'rgba(75, 85, 99, 0.9)'
                                : row.LogicVerFlag === 'Y'
                                ? darkMode
                                  ? 'rgba(34, 197, 94, 0.9)'
                                  : 'rgba(22, 163, 74, 0.9)'
                                : darkMode
                                ? 'rgba(239, 68, 68, 0.9)'
                                : 'rgba(220, 38, 38, 0.9)',
                            '&:hover': {
                              color:
                                row.LogicVerFlag === ''
                                  ? darkMode
                                    ? 'rgba(156, 163, 175, 1)'
                                    : 'rgba(75, 85, 99, 1)'
                                  : row.LogicVerFlag === 'Y'
                                  ? darkMode
                                    ? 'rgba(34, 197, 94, 1)'
                                    : 'rgba(22, 163, 74, 1)'
                                  : darkMode
                                  ? 'rgba(239, 68, 68, 1)'
                                  : 'rgba(220, 38, 38, 1)',
                            },
                          }}
                        >
                          {row.LogicVerFlag === '' ? (
                            <HelpOutlineIcon fontSize="small" sx={{ fontSize: '16px' }} />
                          ) : row.LogicVerFlag === 'Y' ? (
                            <CheckCircleIcon fontSize="small" sx={{ fontSize: '16px' }} />
                          ) : (
                            <ErrorIcon fontSize="small" sx={{ fontSize: '16px' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    {/* Add Actions cell */}
                    <TableCell className="py-0 px-0" align="center" sx={{ padding: '0px 2px' }}>
                      <IconButton
                        onClick={(e) => handleRowMenuOpen(e, index)}
                        size="small"
                        sx={{
                          padding: '2px',
                          color: darkMode
                            ? 'rgba(156, 163, 175, 0.9)'
                            : 'rgba(75, 85, 99, 0.9)',
                          '&:hover': {
                            color: darkMode
                              ? 'rgba(156, 163, 175, 1)'
                              : 'rgba(75, 85, 99, 1)',
                          },
                        }}
                      >
                        <MoreVertIcon fontSize="small" sx={{ fontSize: '16px' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Enhanced Add Row section */}
          <div className={`flex justify-between items-center px-4 py-3 border-t ${
            darkMode 
              ? 'border-gray-700 bg-gray-800/30' 
              : 'border-gray-200 bg-gray-50/50'
          }`}>
            <div className="flex items-center gap-3">
              <Button
                variant="contained"
                onClick={addRow}
                startIcon={<AddIcon />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '8px 16px',
                  background: darkMode 
                    ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' 
                    : 'linear-gradient(135deg, #2563EB, #1E40AF)',
                  boxShadow: darkMode
                    ? '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)'
                    : '0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -1px rgba(37, 99, 235, 0.2)',
                  '&:hover': {
                    background: darkMode
                      ? 'linear-gradient(135deg, #2563EB, #1E40AF)'
                      : 'linear-gradient(135deg, #1D4ED8, #1E3A8A)',
                    boxShadow: darkMode
                      ? '0 6px 10px -1px rgba(59, 130, 246, 0.4), 0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                      : '0 6px 10px -1px rgba(37, 99, 235, 0.4), 0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Add New Row
              </Button>
              
              {/* Row count indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                darkMode 
                  ? 'bg-gray-700/50 text-gray-300' 
                  : 'bg-white/80 text-gray-600'
              }`}>
                <TableIcon fontSize="small" className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                <span className="text-sm font-medium">
                  {rows.filter(row => row.fieldName.trim() !== '').length} / {rows.length} rows
                </span>
              </div>
            </div>
            
            {/* Additional info or actions can go here */}
            <div className="flex items-center gap-2">
              <Tooltip title="Scroll to see all rows" placement="top">
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  darkMode 
                    ? 'text-gray-400 bg-gray-700/30' 
                    : 'text-gray-500 bg-gray-200/50'
                }`}>
                  <KeyboardArrowUpIcon fontSize="small" sx={{ fontSize: '16px' }} />
                  <KeyboardArrowDownIcon fontSize="small" sx={{ fontSize: '16px' }} />
                  <span>Scroll</span>
                </div>
              </Tooltip>
            </div>
          </div>
          
          {/* Remove floating Add Row button */}
          {/*
          <Tooltip title="Add Row">
            <Fab
              color="primary"
              size="small"
              onClick={addRow}
              sx={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                backgroundColor: darkMode ? '#3B82F6' : '#2563EB',
                '&:hover': {
                  backgroundColor: darkMode ? '#2563EB' : '#1D4ED8',
                },
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          */}
        </div>
      </div>

      {/* SQL Editor Dialog - Make it smaller and position at the bottom */}
      <Dialog
        open={showSqlEditor}
        onClose={() => setShowSqlEditor(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          style: {
            backgroundColor: darkMode ? '#1A1F2C' : 'white',
            borderRadius: '12px',
            position: 'absolute',
            bottom: '24px',
            maxHeight: 'calc(50vh)'
          },
        }}
      >
        <DialogTitle
          sx={{
            color: darkMode ? 'white' : 'inherit',
            borderBottom: `1px solid ${
              darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 1)'
            }`,
            padding: '12px 20px',
            fontSize: '1rem'
          }}
        >
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              SQL Logic Editor
              {rows[selectedRowIndex]?.fieldName && (
                <Chip
                  label={rows[selectedRowIndex]?.fieldName}
                  size="small"
                  sx={{
                    backgroundColor: darkMode
                      ? 'rgba(37, 99, 235, 0.2)'
                      : 'rgba(37, 99, 235, 0.1)',
                    color: darkMode
                      ? 'rgb(96, 165, 250)'
                      : 'rgb(37, 99, 235)',
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </span>
            <IconButton onClick={() => setShowSqlEditor(false)} size="small">
              <ClearIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ padding: '16px 20px' }}>
          <div
            className={`h-[120px] rounded-lg overflow-hidden border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme={darkMode ? 'vs-dark' : 'vs'}
              value={sqlEditorContent}
              onChange={setSqlEditorContent}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                wordWrap: 'on',
                lineNumbers: 'on',
                lineHeight: 18
              }}
            />
          </div>
          {sqlError && (
            <Box
              mt={2}
              p={1}
              bgcolor={
                darkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(254, 226, 226, 1)'
              }
              borderRadius={1}
            >
              <Typography color="error" variant="body2" sx={{ fontSize: '0.75rem' }}>
                {sqlError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            padding: '8px 20px',
            borderTop: `1px solid ${
              darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 1)'
            }`,
          }}
        >
          <div className="flex gap-2">
            <Tooltip title="Format SQL">
              <IconButton
                size="small"
                onClick={() => {
                  try {
                    const formatted = format(sqlEditorContent || '', {
                      language: 'sql',
                      indent: '  ',
                      uppercase: true,
                    })
                    setSqlEditorContent(formatted)
                    message.success('SQL formatted successfully')
                  } catch (error) {
                    message.error('Failed to format SQL')
                  }
                }}
                sx={{
                  backgroundColor: darkMode
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(16, 185, 129, 0.1)',
                }}
              >
                <FormatIcon 
                  fontSize="small" 
                  className={darkMode ? 'text-green-400' : 'text-green-600'} 
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy to Clipboard">
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(sqlEditorContent)
                    .then(() => {
                      message.success('SQL copied to clipboard')
                    })
                    .catch(err => {
                      console.error('Failed to copy: ', err)
                      message.error('Failed to copy SQL')
                    })
                }}
                sx={{
                  backgroundColor: darkMode
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(59, 130, 246, 0.1)',
                }}
              >
                <CopyIcon 
                  fontSize="small" 
                  className={darkMode ? 'text-blue-400' : 'text-blue-600'} 
                />
              </IconButton>
            </Tooltip>
          </div>
          <div>
            <Button
              onClick={() => setShowSqlEditor(false)}
              sx={{
                textTransform: 'none',
                color: darkMode ? '#9CA3AF' : 'inherit',
                borderRadius: '6px',
                fontSize: '0.8rem',
                height: '32px',
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
                fontSize: '0.8rem',
                height: '32px',
                background: 'linear-gradient(45deg, #2563EB, #3B82F6)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1D4ED8, #2563EB)',
                },
              }}
            >
              Save
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Row actions menu */}
      <Menu
        anchorEl={rowMenuAnchorEl}
        open={Boolean(rowMenuAnchorEl)}
        onClose={handleRowMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 3,
          sx: {
            backgroundColor: darkMode ? 'rgb(31, 41, 55)' : 'white',
            minWidth: '180px',
            borderRadius: '8px',
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={handleDuplicateRow}
          className={
            darkMode
              ? 'text-gray-200 hover:bg-gray-700'
              : 'hover:bg-blue-50'
          }
        >
          <ListItemIcon>
            <DuplicateIcon
              className={darkMode ? 'text-gray-400' : 'text-gray-600'}
              fontSize="small"
            />
          </ListItemIcon>
          <ListItemText>Duplicate Row</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleDeleteRowDialogOpen}
          className={
            darkMode
              ? 'text-gray-200 hover:bg-gray-700'
              : 'hover:bg-blue-50'
          }
        >
          <ListItemIcon>
            <DeleteIcon
              className={darkMode ? 'text-red-400' : 'text-red-600'}
              fontSize="small"
            />
          </ListItemIcon>
          <ListItemText>Delete Row</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete row confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={handleCancelDelete}
        PaperProps={{
          style: {
            backgroundColor: darkMode ? '#1F2937' : 'white',
            borderRadius: '12px',
            padding: '8px',
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? 'white' : 'inherit' }}>
          Confirm Row Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: darkMode ? '#D1D5DB' : 'inherit' }}>
            Are you sure you want to delete the row with field name "{rowToDelete?.fieldName}"?
            This operation cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '16px' }}>
          <Button
            onClick={handleCancelDelete}
            sx={{
              textTransform: 'none',
              color: darkMode ? '#9CA3AF' : 'inherit',
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
})

export default ReferenceForm
