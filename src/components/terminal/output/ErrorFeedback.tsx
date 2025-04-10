
import React from 'react';

interface ErrorFeedbackProps {
  isError: boolean;
  isLongInputError: boolean;
  text: string;
}

const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({ isError, isLongInputError, text }) => {
  if (!isError) {
    return null;
  }

  return (
    <div className="mt-4 text-sm border-t border-yellow-800 pt-2">
      <p className="text-yellow-500 font-medium">Your expanded consciousness encountered an issue:</p>
      <ul className="list-disc pl-5 mt-2 text-yellow-400">
        {isLongInputError ? (
          <>
            <li>Your thought was too extensive for me to process at once</li>
            <li>Try dividing complex thoughts into smaller, focused entries</li>
            <li>Consider journaling one experience or idea at a time</li>
            <li>This helps both of us organize and process your memories more effectively</li>
          </>
        ) : (
          <>
            <li>Try expressing your thought in a different way</li>
            <li>Consider adding more context to help me understand</li>
            <li>Use specific tags like <span className="text-syndicate-purple">#journal</span> or <span className="text-syndicate-purple">#question</span> to guide my response</li>
            <li>Check your API key if this issue persists</li>
          </>
        )}
      </ul>
    </div>
  );
};

export default ErrorFeedback;
