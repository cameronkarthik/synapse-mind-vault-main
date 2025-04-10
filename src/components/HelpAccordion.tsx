import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HelpAccordion = () => {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
      <AccordionItem value="item-1" className="border-b border-zinc-800">
        <AccordionTrigger className="text-white hover:text-white hover:no-underline">
          How does Syndicate Mind empower you?
        </AccordionTrigger>
        <AccordionContent className="text-zinc-400">
          <p className="mb-2">
            Syndicate Mind transforms how you capture, connect, and utilize your thoughts:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access your thought history anytime and search by tags, keywords, or timeframes.</li>
            <li>Discover unexpected connections between ideas across different areas of your life.</li>
            <li>Transform scattered thoughts into structured knowledge using built-in commands.</li>
            <li>Create a personal thought database that grows more valuable over time.</li>
            <li>Use natural language to explore and build upon your previous insights.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-2" className="border-b border-zinc-800">
        <AccordionTrigger className="text-white hover:text-white hover:no-underline">
          How to organize your thoughts with tags
        </AccordionTrigger>
        <AccordionContent className="text-zinc-400">
          <p className="mb-2">
            Tags are a powerful way to organize your thoughts in Syndicate Mind:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Use hashtags directly in your text (#project, #idea, #followup) to auto-tag content.</li>
            <li>Use the <span className="font-mono">/tag</span> command for explicitly tagging: <span className="font-mono">/tag reading This book has interesting ideas</span></li>
            <li>Be consistent with your tagging system for better organization.</li>
            <li>You can later recall thoughts by tag using <span className="font-mono">/recall #tagname</span></li>
            <li>Combine multiple tags in a single thought to create connections.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-3" className="border-b-0">
        <AccordionTrigger className="text-white hover:text-white hover:no-underline">
          How your data is stored and protected
        </AccordionTrigger>
        <AccordionContent className="text-zinc-400">
          <p className="mb-2">
            Syndicate Mind prioritizes your privacy and data ownership:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All your thoughts and data are stored locally in your browser's IndexedDB.</li>
            <li>Your OpenAI API key is stored securely in your browser and never sent to our servers.</li>
            <li>API requests go directly from your browser to OpenAI's servers.</li>
            <li>You can export your data at any time for backup or migration.</li>
            <li>We recommend periodically exporting your data as a backup measure.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default HelpAccordion; 