import React, { useState, useRef, useEffect } from 'react';
import { Pin } from '../../types';
import { chatbotService, ChatMessage, MapQueryContext } from '../../lib/chatbot';
import { Point } from '../../lib/spatial';

interface ChatbotProps {
  pins: Pin[];
  mapCenter: Point;
  mapName: string;
  isLocked: boolean;
  isMapCreator: boolean;
  onHighlightPins?: (pinIds: string[]) => void;
  onMoveMap?: (center: Point, zoom?: number) => void;
  onAddPin?: (pin: { lat: number; lng: number; name: string; description?: string }) => Promise<void>;
  onPinAdded?: (pinName: string) => void;
  onDeleteAllPins?: () => Promise<void>;
}

export const Chatbot: React.FC<ChatbotProps> = ({
  pins,
  mapCenter,
  mapName,
  isLocked,
  isMapCreator,
  onHighlightPins,
  onMoveMap,
  onAddPin,
  onPinAdded,
  onDeleteAllPins
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm your map assistant. I can help you analyze your map "${mapName}" with ${pins.length} pins. Try asking me things like:
        
• "What's the distance between [pin1] and [pin2]?"
• "Show me pins within 5 miles of the center"
• "Find pins near [coordinates]"
• "What are the map statistics?"`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, mapName, pins.length]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context: MapQueryContext = {
        pins,
        mapCenter,
        mapBounds: {
          north: Math.max(...pins.map(p => p.lat)),
          south: Math.min(...pins.map(p => p.lat)),
          east: Math.max(...pins.map(p => p.lng)),
          west: Math.min(...pins.map(p => p.lng))
        },
        mapName,
        isLocked,
        isMapCreator
      };

      const response = await chatbotService.sendMessage(input.trim(), context);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.action === 'highlight_pins' && response.data?.pinsInRadius && onHighlightPins) {
        const pinIds = response.data.pinsInRadius.map((pin: any) => pin.id);
        onHighlightPins(pinIds);
      }

      if (response.action === 'move_map' && response.data?.center && onMoveMap) {
        onMoveMap(response.data.center, response.data.zoom);
      }

      if (response.action === 'add_pin' && response.data && onAddPin) {
        try {
          await onAddPin({
            lat: response.data.lat,
            lng: response.data.lng,
            name: response.data.name,
            description: response.data.description
          });
          
          // Trigger success notification
          if (onPinAdded) {
            onPinAdded(response.data.name);
          }
        } catch (error) {
          console.error('Error adding pin:', error);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error while adding the pin. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }

      if (response.action === 'delete_all_pins' && onDeleteAllPins) {
        try {
          await onDeleteAllPins();
        } catch (error) {
          console.error('Error deleting all pins:', error);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error while deleting all pins. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Open Map Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-800">Map Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your map..."
                className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
