import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  IconButton,
  alpha,
} from '@mui/material';
import { Send, Handshake, Circle } from '@mui/icons-material';
import { supabase } from '../config/supabase';
import { API_BASE } from '../config/api';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const WorkspaceChat = ({ matchId, currentFounderId }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!matchId || !user?.id) {
      return;
    }
    
    let isMounted = true;
    
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
          setLoadingMessages(false);
        }
      }
    };
    
    setLoadingMessages(true);
    fetchInitialMessages();
    
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
            setMessages(prev => {
              const optimisticIndex = prev.findIndex(msg => 
                msg.is_optimistic && 
                msg.content === payload.new.content && 
                msg.sender_id === payload.new.sender_id
              );
              
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = payload.new;
                return updated;
              }
              
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) {
                return prev;
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
          }
        });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [matchId, user?.id]);

  useEffect(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScrollEnabled]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !matchId || sendingMessage) return;

    const messageContent = messageInput.trim();
    setSendingMessage(true);
    
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      content: messageContent,
      sender_id: currentFounderId,
      match_id: matchId,
      created_at: new Date().toISOString(),
      is_optimistic: true
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
      
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? newMessage : msg
      ));
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
        bgcolor: BG,
        borderRadius: 2,
        border: '1px solid',
        borderColor: SLATE_200,
      }}>
        <Box sx={{ 
          width: 64, 
          height: 64, 
          borderRadius: '50%', 
          bgcolor: alpha(TEAL, 0.1), 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2
        }}>
          <Handshake sx={{ fontSize: 32, color: TEAL }} />
        </Box>
        <Typography variant="h6" sx={{ color: SLATE_900, fontWeight: 600, mb: 1 }}>
          No chat available
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, maxWidth: 300 }}>
          This workspace doesn't have an associated match for messaging.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      minHeight: 600,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#fff',
      borderRadius: 2,
      border: '1px solid',
      borderColor: SLATE_200,
      overflow: 'hidden',
    }}>
      {/* Connection Status */}
      {connectionStatus === 'disconnected' && (
        <Box sx={{
          px: 2,
          py: 1,
          bgcolor: alpha('#f59e0b', 0.1),
          borderBottom: '1px solid',
          borderColor: alpha('#f59e0b', 0.2),
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <Circle sx={{ fontSize: 8, color: '#f59e0b' }} />
          <Typography variant="caption" sx={{ color: '#f59e0b', fontSize: '0.75rem' }}>
            Reconnecting...
          </Typography>
        </Box>
      )}

      {/* Messages List */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: BG,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: SLATE_200,
          borderRadius: '3px',
          '&:hover': {
            background: SLATE_400,
          },
        },
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
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: TEAL }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <Box sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: 2, 
              bgcolor: alpha(TEAL, 0.1), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 2
            }}>
              <Handshake sx={{ fontSize: 32, color: TEAL }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: SLATE_900, fontWeight: 600, mb: 0.5 }}>
              Start the conversation
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              Send a message to begin chatting.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentFounderId;
              
              const showDateSeparator = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                      <Typography sx={{ 
                        fontSize: '0.7rem', 
                        color: SLATE_400, 
                        bgcolor: '#fff', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 2,
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: SLATE_200,
                      }}>
                        {formatDate(message.created_at)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    {!isOwnMessage && (
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: alpha(SKY, 0.1),
                          color: SKY,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {message.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: '70%',
                        bgcolor: isOwnMessage ? TEAL : '#fff',
                        color: isOwnMessage ? '#fff' : SLATE_900,
                        borderRadius: 2,
                        px: 2,
                        py: 1.25,
                        border: isOwnMessage ? 'none' : '1px solid',
                        borderColor: SLATE_200,
                        boxShadow: isOwnMessage 
                          ? `0 2px 8px ${alpha(TEAL, 0.2)}` 
                          : `0 1px 3px ${alpha(SLATE_900, 0.05)}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.9rem', 
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        mb: 0.5,
                      }}>
                        {message.content}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          textAlign: 'right',
                          opacity: 0.7,
                          fontSize: '0.7rem',
                          color: isOwnMessage ? 'rgba(255,255,255,0.8)' : SLATE_400,
                        }}
                      >
                        {formatTime(message.created_at)}
                      </Typography>
                    </Box>
                    {isOwnMessage && (
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: alpha(TEAL, 0.1),
                          color: TEAL,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {user?.firstName?.[0] || 'Y'}
                      </Avatar>
                    )}
                  </Box>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{
        p: 2,
        bgcolor: '#fff',
        borderTop: '1px solid',
        borderColor: SLATE_200,
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'flex-end',
          bgcolor: BG,
          p: 1,
          borderRadius: 2,
          border: '1px solid',
          borderColor: SLATE_200,
          transition: 'all 0.2s',
          '&:focus-within': {
            borderColor: TEAL,
            bgcolor: '#fff',
            boxShadow: `0 0 0 3px ${alpha(TEAL, 0.1)}`,
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
              '& .MuiInputBase-root': {
                fontSize: '0.9rem',
                px: 1.5,
                py: 0.5,
              },
              '& .MuiInputBase-input': {
                color: SLATE_900,
                '&::placeholder': {
                  color: SLATE_400,
                  opacity: 1,
                },
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            sx={{
              width: 36,
              height: 36,
              bgcolor: messageInput.trim() ? TEAL : 'transparent',
              color: messageInput.trim() ? '#fff' : SLATE_400,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: messageInput.trim() ? TEAL_LIGHT : alpha(SLATE_400, 0.1),
                transform: messageInput.trim() ? 'scale(1.05)' : 'none',
              },
              '&.Mui-disabled': {
                bgcolor: 'transparent',
                color: SLATE_200,
              }
            }}
          >
            {sendingMessage ? (
              <CircularProgress size={18} sx={{ color: 'inherit' }} />
            ) : (
              <Send sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkspaceChat;
