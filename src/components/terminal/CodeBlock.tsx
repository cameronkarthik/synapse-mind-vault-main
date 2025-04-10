
import React from 'react';

interface CodeBlockProps {
  content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content }) => {
  // Extract language if present (first line)
  const firstLineBreak = content.indexOf('\n');
  
  let language = '';
  let code = content;
  
  if (firstLineBreak > 0) {
    language = content.slice(0, firstLineBreak).trim();
    if (language && !language.includes(' ')) {
      code = content.slice(firstLineBreak + 1);
    } else {
      language = '';
    }
  }
  
  return (
    <div className="code-block">
      {language && (
        <div className="text-xs text-gray-400 mb-1">{language}</div>
      )}
      <pre className="whitespace-pre-wrap">{code}</pre>
    </div>
  );
};

export default CodeBlock;
