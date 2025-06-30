'use client'

import React from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Box,
  Typography,
} from '@mui/material'
import {
  Clear as ClearIcon,
  FormatIndentIncrease as FormatIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import Editor from '@monaco-editor/react'
import { format } from 'sql-formatter'
import { message } from 'antd'

const SqlEditorDialog = ({
  open,
  onClose,
  darkMode,
  value,
  onChange,
  onSave,
  fieldName,
  sqlError,
}) => {
  const handleFormatSql = () => {
    try {
      const formatted = format(value || '', {
        language: 'sql',
        indent: '  ',
        uppercase: true,
      })
      onChange(formatted)
      message.success('SQL formatted successfully')
    } catch (error) {
      message.error('Failed to format SQL')
    }
  }

  const handleCopySql = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        message.success('SQL copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy: ', err)
        message.error('Failed to copy SQL')
      })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        style: {
          backgroundColor: darkMode ? '#1A1F2C' : 'white',
          borderRadius: '12px',
          position: 'absolute',
          bottom: '24px',
          maxHeight: 'calc(50vh)',
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
          fontSize: '1rem',
        }}
      >
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            SQL Logic Editor
            {fieldName && (
              <Chip
                label={fieldName}
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
          <IconButton onClick={onClose} size="small">
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
            value={value}
            onChange={onChange}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              wordWrap: 'on',
              lineNumbers: 'on',
              lineHeight: 18,
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
            <Typography
              color="error"
              variant="body2"
              sx={{ fontSize: '0.75rem' }}
            >
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
              onClick={handleFormatSql}
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
              onClick={handleCopySql}
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
            onClick={onClose}
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
            onClick={onSave}
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
  )
}

export default SqlEditorDialog 