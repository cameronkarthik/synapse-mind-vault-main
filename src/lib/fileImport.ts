export const parseImportedFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Handle PDF files differently - we'll need to inform the user that PDF text extraction is limited
    if (fileExtension === 'pdf') {
      resolve(`Imported PDF: ${file.name}\n\nNOTE: This is a PDF file. Please note that this system has limited PDF parsing capability. For best results with PDFs, consider extracting the text manually or uploading text-based formats instead.\n\nIf you have content from this PDF you'd like to discuss, please paste it directly into the chat.`);
      return;
    }
    
    reader.onload = (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Failed to read file');
        }
        
        const content = event.target.result;
        
        switch (fileExtension) {
          case 'txt':
            // Plain text files are returned as is
            resolve(content);
            break;
            
          case 'md':
            // Markdown files are returned as is
            resolve(content);
            break;
            
          case 'csv':
            // Process CSV into a more readable format
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(header => header.trim());
            
            // Check if it's a simple or complex CSV
            if (lines.length <= 1) {
              resolve(content);
              return;
            }
            
            if (headers.length <= 1) {
              // If it's just a list, return as is
              resolve(content);
            } else {
              // Format as structured text for more complex CSVs
              let formattedContent = `Imported from ${file.name}:\n\n`;
              
              for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = parseCSVLine(lines[i]);
                
                // Create a formatted entry
                formattedContent += `Entry ${i}:\n`;
                for (let j = 0; j < headers.length && j < values.length; j++) {
                  formattedContent += `- ${headers[j]}: ${values[j]}\n`;
                }
                formattedContent += '\n';
              }
              
              resolve(formattedContent);
            }
            break;
            
          case 'json':
            // Format JSON for readability
            try {
              const jsonData = JSON.parse(content);
              
              // If it's an array of objects, format as entries
              if (Array.isArray(jsonData)) {
                let formattedJson = `Imported ${jsonData.length} entries from ${file.name}:\n\n`;
                
                jsonData.forEach((item, index) => {
                  formattedJson += `Entry ${index + 1}:\n`;
                  
                  if (typeof item === 'object' && item !== null) {
                    Object.entries(item).forEach(([key, value]) => {
                      formattedJson += `- ${key}: ${formatJsonValue(value)}\n`;
                    });
                  } else {
                    formattedJson += `- ${formatJsonValue(item)}\n`;
                  }
                  
                  formattedJson += '\n';
                });
                
                resolve(formattedJson);
              } else if (typeof jsonData === 'object' && jsonData !== null) {
                // Single object
                let formattedJson = `Imported data from ${file.name}:\n\n`;
                
                Object.entries(jsonData).forEach(([key, value]) => {
                  formattedJson += `- ${key}: ${formatJsonValue(value)}\n`;
                });
                
                resolve(formattedJson);
              } else {
                // Simple value
                resolve(`Imported from ${file.name}: ${formatJsonValue(jsonData)}`);
              }
            } catch (error) {
              // If JSON parsing fails, treat as text
              console.error('Error parsing JSON:', error);
              resolve(`Imported text from ${file.name} (invalid JSON format):\n\n${content}`);
            }
            break;
            
          default:
            resolve(`Imported from ${file.name}:\n\n${content}`);
            break;
        }
      } catch (error) {
        reject(new Error(`Error processing file: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Helper function to parse CSV lines correctly (handling quoted values with commas)
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  
  return values;
};

// Helper function to format JSON values
const formatJsonValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.map(formatJsonValue).join(', ')}]`;
    }
    return JSON.stringify(value);
  }
  
  return String(value);
}; 