'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, FileText, Plane, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  function_call?: {
    name: string;
    result: FunctionCallResult;
  };
  timestamp: Date;
}

interface FunctionCallResult {
  legal?: boolean;
  reason?: string;
  aircraft_info?: {
    model: string;
    max_passengers: number;
    max_range_nm: string;
  };
  conflicts?: Array<{
    type: string;
    message: string;
  }>;
  flight_info?: {
    route: string;
    aircraft: string;
    captain: string;
  };
  results?: string[];
  [key: string]: unknown;
}

const QuickActions = ({ onQuickAction }: { onQuickAction: (message: string) => void }) => {
  const actions = [
    {
      icon: <Plane className="h-4 w-4" />,
      label: "Check Aircraft Legality",
      message: "Can N123AB legally fly LAX to SFO tomorrow?"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Generate LOA",
      message: "Generate an LOA template for charter operations with Citation CJ3+"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Check Conflicts",
      message: "Check for conflicts on flight 07799d86-be54-4a61-bfe7-9ae75550fe94"
    },
    {
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Duty Time Rules",
      message: "What are the Part 135 duty time limitations?"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4 flex-shrink-0">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="justify-start text-left h-auto p-3"
          onClick={() => onQuickAction(action.message)}
        >
          <div className="flex items-start space-x-2">
            {action.icon}
            <div>
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs text-gray-500 mt-1">{action.message}</div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};

const FunctionCallDisplay = ({ functionCall }: { functionCall: { name: string; result: FunctionCallResult } }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'check_aircraft_legality':
        return <Plane className="h-4 w-4" />;
      case 'generate_loa_template':
        return <FileText className="h-4 w-4" />;
      case 'check_flight_conflicts':
        return <Clock className="h-4 w-4" />;
      case 'search_regulations':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (name: string) => {
    switch (name) {
      case 'check_aircraft_legality':
        return 'bg-blue-100 text-blue-800';
      case 'generate_loa_template':
        return 'bg-green-100 text-green-800';
      case 'check_flight_conflicts':
        return 'bg-yellow-100 text-yellow-800';
      case 'search_regulations':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-2 mb-2">
        {getIcon(functionCall.name)}
        <Badge className={getBadgeColor(functionCall.name)}>
          {functionCall.name.replace(/_/g, ' ')}
        </Badge>
      </div>
      
      {functionCall.result && (
        <div className="text-sm">
          {functionCall.name === 'check_aircraft_legality' && (
            <div>
              <div className={`font-medium ${functionCall.result.legal ? 'text-green-600' : 'text-red-600'}`}>
                {functionCall.result.legal ? '✅ LEGAL' : '❌ NOT LEGAL'}
              </div>
              <div className="text-gray-600 mt-1">{functionCall.result.reason}</div>
              {functionCall.result.aircraft_info && (
                <div className="mt-2 text-xs">
                  <div>Model: {functionCall.result.aircraft_info.model}</div>
                  <div>Max Passengers: {functionCall.result.aircraft_info.max_passengers}</div>
                  <div>Range: {functionCall.result.aircraft_info.max_range_nm} nm</div>
                </div>
              )}
            </div>
          )}
          
          {functionCall.name === 'generate_loa_template' && (
            <div className="bg-white p-2 rounded border max-h-96 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">{String(functionCall.result)}</pre>
            </div>
          )}
          
          {functionCall.name === 'check_flight_conflicts' && (
            <div>
              {functionCall.result.conflicts && functionCall.result.conflicts.length === 0 ? (
                <div className="text-green-600 font-medium">✅ No conflicts found</div>
              ) : (
                <div>
                  <div className="text-red-600 font-medium">⚠️ {functionCall.result.conflicts?.length || 0} conflict(s) found:</div>
                  {functionCall.result.conflicts?.map((conflict, index: number) => (
                    <div key={index} className="mt-1 p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-800">{conflict.type}</div>
                      <div className="text-red-600 text-xs">{conflict.message}</div>
                    </div>
                  ))}
                </div>
              )}
              {functionCall.result.flight_info && (
                <div className="mt-2 text-xs text-gray-600">
                  <div>Route: {functionCall.result.flight_info.route}</div>
                  <div>Aircraft: {functionCall.result.flight_info.aircraft}</div>
                  <div>Captain: {functionCall.result.flight_info.captain}</div>
                </div>
              )}
            </div>
          )}
          
          {functionCall.name === 'search_regulations' && (
            <div>
              <div className="font-medium mb-1">Regulatory Guidance:</div>
              <div className="max-h-48 overflow-y-auto">
                {functionCall.result.results?.map((result: string, index: number) => (
                  <div key={index} className="text-sm bg-blue-50 p-2 rounded mt-1">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Part 135 operations assistant. I can help you check aircraft legality, generate LOA templates, identify flight conflicts, and search regulations. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        function_call: data.function_call,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col max-w-full">
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader className="flex-shrink-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Part 135 Operations Assistant</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0 p-6 pt-0">
          {/* Quick Actions - Fixed at top */}
          <QuickActions onQuickAction={handleQuickAction} />
          
          {/* Messages - Scrollable area */}
          <div className="flex-1 min-h-0 mb-4">
            <div className="h-full overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                      {message.role === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none break-words">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>,
                                p: ({children}) => <p className="mb-2 text-gray-900">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-900">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-900">{children}</ol>,
                                li: ({children}) => <li className="text-gray-900">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                em: ({children}) => <em className="italic text-gray-900">{children}</em>,
                                code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-900">{children}</code>,
                                pre: ({children}) => <pre className="bg-gray-200 p-2 rounded text-xs font-mono overflow-x-auto text-gray-900">{children}</pre>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-700">{children}</blockquote>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="break-words">{message.content}</div>
                        )}
                        {message.function_call && (
                          <FunctionCallDisplay functionCall={message.function_call} />
                        )}
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input - Fixed at bottom */}
          <form onSubmit={handleSubmit} className="flex space-x-2 flex-shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about aircraft legality, regulations, conflicts..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 