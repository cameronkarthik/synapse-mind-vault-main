
import React from 'react';

interface TextFormatterProps {
  text: string;
}

const TextFormatter: React.FC<TextFormatterProps> = ({ text }) => {
  if (!text) return null;
  
  // Process the text to improve formatting
  let formattedText = text;
  
  // Replace hashtag headings with styled headings
  formattedText = formattedText.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    const sizes = ["text-xl font-bold", "text-lg font-bold", "text-base font-bold", "text-sm font-semibold", "text-sm font-medium", "text-sm"];
    const color = level <= 3 ? "text-syndicate-purple" : "text-gray-200";
    return `<h${level} class="${sizes[level-1]} ${color} my-2">${content}</h${level}>`;
  });
  
  // Improve bullet point formatting
  formattedText = formattedText.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>');
  
  // Wrap consecutive bullet points in a ul
  formattedText = formattedText.replace(/<li class="[^"]+">(.+)<\/li>(\n<li class="[^"]+">(.+)<\/li>)+/g, (match) => {
    return `<ul class="my-2 list-disc pl-4">${match}</ul>`;
  });
  
  // Format numbered lists
  formattedText = formattedText.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<li class="ml-4 list-decimal mb-1">$2</li>');
  
  // Wrap consecutive numbered points in an ol
  formattedText = formattedText.replace(/<li class="[^d]+decimal[^"]+">(.+)<\/li>(\n<li class="[^d]+decimal[^"]+">(.+)<\/li>)+/g, (match) => {
    return `<ul class="my-2 list-decimal pl-4">${match}</ul>`;
  });
  
  // Handling emphasis and bold
  formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Handling links
  formattedText = formattedText.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  return (
    <div 
      className="mb-2 whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

export default TextFormatter;
