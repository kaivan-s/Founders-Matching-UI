import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Avatar,
  IconButton,
} from '@mui/material';
import { Send, Handshake } from '@mui/icons-material';
import { supabase } from '../config/supabase';
import { API_BASE } from '../config/api';

const WorkspaceChat = ({ matchId, currentFounderId }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);
  

  // Note: fetchMessages was removed and integrated directly into useEffect
  // to avoid dependency issues and repeated API calls

  useEffect(() => {
    if (!matchId || !user?.id) {
      return;
    }
    
    // Initial fetch - only once when matchId changes
    let isMounted = true;
    
    // Fetch initial messages
    const fetchInitialMessages = async () => {
      try {
        if (!isMounted) return;
        
        const response = await fetch(`${API_BASE}/matches/${matchId}/messages`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        if (isMounted) {
          setMessages(data || []);
          setLoadingMessages(false);
          setAutoScrollEnabled(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ Error fetching initial messages:', err);
          setLoadingMessages(false);
        }
      }
    };
    
    setLoadingMessages(true);
    fetchInitialMessages();
    
    // Set up Supabase Realtime subscription for new messages
    const subscription = supabase
        .channel(`messages_${matchId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `match_id=eq.${matchId}`
          }, 
          (payload) => {
            // Add the new message to the list (avoid duplicates and replace optimistic messages)
            setMessages(prev => {
              // Check if this is replacing an optimistic message
              const optimisticIndex = prev.findIndex(msg => 
                msg.is_optimistic && 
                msg.content === payload.new.content && 
                msg.sender_id === payload.new.sender_id
              );
              
              if (optimisticIndex !== -1) {
                // Replace optimistic message with real message
                const updated = [...prev];
                updated[optimisticIndex] = payload.new;
                return updated;
              }
              
              // Check for actual duplicates
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) {
                return prev; // Don't add duplicate
              }
              
              return [...prev, payload.new];
            });
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setConnectionStatus('disconnected');
            console.error('Realtime subscription error:', status, err);
          }
        });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [matchId, user?.id]); // Depend on both matchId and user.id

  useEffect(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScrollEnabled]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !matchId || sendingMessage) return;

    const messageContent = messageInput.trim();
    setSendingMessage(true);
    
    // Optimistic update - add message immediately for better UX
    const optimisticMessage = {
      id: `temp_${Date.now()}`, // Temporary ID
      content: messageContent,
      sender_id: currentFounderId,
      match_id: matchId,
      created_at: new Date().toISOString(),
      is_optimistic: true // Flag to identify optimistic messages
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    setAutoScrollEnabled(true);
    
    try {
      const response = await fetch(`${API_BASE}/matches/${matchId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const newMessage = await response.json();
      
      // Replace optimistic message with real message when it arrives
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? newMessage : msg
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      // Restore message input on error
      setMessageInput(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!matchId) {
    return (
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        p: 4,
        bgcolor: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
      }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          bgcolor: '#e2e8f0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 3
        }}>
          <Handshake sx={{ fontSize: 40, color: '#94a3b8' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 600, mb: 1 }}>
          No chat available
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 300 }}>
          This workspace doesn't have an associated match for messaging.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '600px', // Increased height
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    }}>
      {/* Messages Header - could add recipient info here later */}
      
      {/* Messages List */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: '#f8fafc',
      }}
      onScroll={(e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop < scrollHeight - clientHeight - 100) {
          setAutoScrollEnabled(false);
        } else {
          setAutoScrollEnabled(true);
        }
      }}
      >
        {loadingMessages && messages.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={32} sx={{ color: '#0ea5e9' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            opacity: 0.8
          }}>
            <Box sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: '24px', 
              bgcolor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <Handshake sx={{ fontSize: 32, color: '#0ea5e9' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 600, mb: 0.5 }}>
              Start the conversation
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Send a message to begin chatting.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentFounderId;
              
              // Check if we need to show a date separator
              const showDateSeparator = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        bgcolor: '#e2e8f0', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: '12px',
                        fontWeight: 500
                      }}>
                        {formatDate(message.created_at)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      mb: 0.5,
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: '8px 14px',
                        maxWidth: '70%',
                        bgcolor: isOwnMessage 
                          ? '#0ea5e9' 
                          : '#ffffff',
                        color: isOwnMessage ? 'white' : '#0f172a',
                        borderRadius: isOwnMessage 
                          ? '18px 18px 4px 18px' 
                          : '18px 18px 18px 4px',
                        boxShadow: isOwnMessage 
                          ? '0 2px 4px rgba(14, 165, 233, 0.15)' 
                          : '0 2px 4px rgba(0, 0, 0, 0.05)',
                        border: isOwnMessage ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.925rem', 
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {message.content}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 0.5,
                          textAlign: 'right',
                          opacity: isOwnMessage ? 0.8 : 0.5,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          color: isOwnMessage ? 'white' : '#64748b'
                        }}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Paper>
                  </Box>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message Input Area */}
      <Box sx={{
        p: 1.5,
        bgcolor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'flex-end',
          bgcolor: '#f8fafc',
          p: 0.75,
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          transition: 'border-color 0.2s',
          '&:focus-within': {
            borderColor: '#0ea5e9',
            bgcolor: '#ffffff',
            boxShadow: '0 0 0 2px rgba(14, 165, 233, 0.1)'
          }
        }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendingMessage}
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              px: 1.5,
              py: 0.5,
              '& .MuiInputBase-root': {
                fontSize: '0.95rem',
                padding: 0,
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            sx={{
              width: 40,
              height: 40,
              bgcolor: !messageInput.trim() ? 'transparent' : '#0ea5e9',
              color: !messageInput.trim() ? '#94a3b8' : 'white',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: !messageInput.trim() ? 'transparent' : '#0284c7',
                transform: !messageInput.trim() ? 'none' : 'scale(1.05)',
              },
              '&.Mui-disabled': {
                bgcolor: 'transparent',
                color: '#cbd5e1'
              }
            }}
          >
            {sendingMessage ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Send sx={{ fontSize: 20, ml: 0.5 }} />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkspaceChat;

