/**
 * CodeBlock Component
 * Displays syntax-highlighted code with copy functionality
 */

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ContentCopy as CopyIcon, Code as CodeIcon } from '@mui/icons-material';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';

export interface CodeBlockProps {
  /** The code to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Box sx={{ position: 'relative', mt: 0.5 }}>
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          display: 'flex',
          gap: 0.5,
          zIndex: 1,
        }}
      >
        <Chip
          label={language}
          size="small"
          icon={<CodeIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ height: 20, fontSize: 10, backgroundColor: 'rgba(0,0,0,0.3)' }}
        />
        <Tooltip title={copied ? 'Kopiert!' : 'Kopieren'}>
          <IconButton
            size="small"
            onClick={() => {
              void handleCopy();
            }}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.3)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
            }}
          >
            <CopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter
        language={language}
        style={oneDark as Record<string, React.CSSProperties>}
        customStyle={{
          margin: 0,
          borderRadius: 8,
          fontSize: 12,
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

export default CodeBlock;
