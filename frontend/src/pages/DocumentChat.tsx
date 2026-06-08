import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DocumentDetail, ChatMessage } from '../types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Avatar,
  Divider,
  Paper,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Send,
  ChevronLeft,
  Bot,
  User,
  Info,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const DocumentChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Loading flags
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Input fields
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const docRes = await api.get(`/documents/${id}`);
      setDoc(docRes.data);
      
      const chatRes = await api.get(`/chat/${id}`);
      setMessages(chatRes.data);
    } catch (err: any) {
      console.error('Failed fetching chat context:', err);
      setError(err.response?.data?.detail || 'Unable to load report chat workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Autoscroll to bottom when message log loads/updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputVal;
    if (!textToSend.trim() || !id) return;

    setSending(true);
    setError(null);
    if (!customMessage) setInputVal(''); // Clear box

    try {
      const response = await api.post(`/chat/${id}`, {
        message: textToSend,
      });

      // Response contains user_message and assistant_message
      const { user_message, assistant_message } = response.data;
      setMessages((prev) => [...prev, user_message, assistant_message]);
    } catch (err: any) {
      console.error('Failed sending message:', err);
      setError(
        err.response?.data?.detail || 'An error occurred sending query. Check connection settings.'
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !doc) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ChevronLeft />} onClick={() => navigate('/history')}>
          Back to Archives
        </Button>
      </Box>
    );
  }

  const quickSuggestions = [
    'Explain the overall diagnosis in simple terms.',
    'Are there any out-of-range lab markers I should be concerned about?',
    'Explain the purpose and intake schedules of my prescribed medications.',
    'What follow-up suggestions or lifestyle steps are recommended here?',
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: 'calc(100vh - 128px)' }}>
      {/* Top Controller Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ChevronLeft size={18} />}
          onClick={() => navigate(`/history/${doc?.id}`)}
          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Back to Insights
        </Button>
        <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 600 }}>
          Chatting about: <span style={{ color: '#f3f4f6' }}>{doc?.file_name}</span>
        </Typography>
      </Box>

      {/* Workspace split grid */}
      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Left Side: Summary Context Pane */}
        <Grid item xs={12} md={5} lg={4} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CardContent sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info size={18} color="#0ea5e9" />
                Report Snapshot
              </Typography>
              <Divider sx={{ mb: 2, opacity: 0.05 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#f3f4f6' }}>
                Summary
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                {doc?.analysis?.summary || 'No simplified report summary loaded.'}
              </Typography>

              {doc?.analysis?.abnormal_values && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#f43f5e' }}>
                    Abnormal Indicators
                  </Typography>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.08)', mb: 3 }}>
                    <ReactMarkdown className="markdown-body-small">
                      {doc.analysis.abnormal_values}
                    </ReactMarkdown>
                  </Box>
                </>
              )}

              {doc?.prescriptions && doc.prescriptions.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#10b981' }}>
                    Identified Medicines
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {doc.prescriptions.map((p, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #10b981' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 650 }}>{p.medicine_name}</Typography>
                        <Typography variant="caption" color="textSecondary">Dose: {p.dosage || 'N/A'}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: ChatGPT style chat bubble stream */}
        <Grid item xs={12} md={7} lg={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Messages Screen Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              }}
            >
              {messages.length === 0 ? (
                /* Welcome Screen with suggestions */
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  flexGrow={1}
                  sx={{ py: 6, px: 2, textAlign: 'center' }}
                >
                  <Bot size={48} color="#0ea5e9" style={{ marginBottom: 15 }} />
                  <Typography variant="h6" sx={{ fontWeight: 750, color: '#f3f4f6', mb: 1 }}>
                    Ask anything about this document
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 450, mb: 4 }}>
                    Type a query or click one of the quick questions below to discuss insights.
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1.5} width="100%" maxWidth={500}>
                    {quickSuggestions.map((s, idx) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        onClick={() => handleSendMessage(s)}
                        disabled={sending}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          py: 1.25,
                          px: 2,
                          borderRadius: 2,
                          color: '#e5e7eb',
                          borderColor: 'rgba(255,255,255,0.08)',
                          backgroundColor: 'rgba(255,255,255,0.01)',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'rgba(14, 165, 233, 0.05)',
                          },
                        }}
                      >
                        {s}
                      </Button>
                    ))}
                  </Box>
                </Box>
              ) : (
                /* Dialogue Bubbles */
                messages.map((m) => {
                  const isAssistant = m.sender === 'assistant';
                  return (
                    <Box
                      key={m.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAssistant ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                          px: 1,
                        }}
                      >
                        {isAssistant ? (
                          <>
                            <Bot size={14} color="#0ea5e9" />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#0ea5e9' }}>
                              Assistant
                            </Typography>
                          </>
                        ) : (
                          <>
                            <User size={14} color="#10b981" />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#10b981' }}>
                              You
                            </Typography>
                          </>
                        )}
                        <Typography variant="caption" color="textSecondary">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '85%',
                          borderRadius: 3,
                          borderTopLeftRadius: isAssistant ? 2 : 12,
                          borderTopRightRadius: isAssistant ? 12 : 2,
                          bgcolor: isAssistant ? '#111827' : '#0ea5e9',
                          color: isAssistant ? '#f3f4f6' : '#ffffff',
                          border: isAssistant ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}
                      >
                        {isAssistant ? (
                          <Box className="markdown-body-chat">
                            <ReactMarkdown>{m.message}</ReactMarkdown>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{m.message}</Typography>
                        )}
                      </Paper>
                    </Box>
                  );
                })
              )}
              {sending && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="textSecondary">
                    AI is writing response...
                  </Typography>
                </Box>
              )}
              <div ref={chatBottomRef} />
            </Box>

            <Divider sx={{ opacity: 0.05 }} />

            {/* Input Bar */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                backgroundColor: '#111827',
              }}
            >
              <TextField
                fullWidth
                placeholder="Ask about test parameters, medicine purposes..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={sending || !inputVal.trim()}
                sx={{
                  bgcolor: 'rgba(14, 165, 233, 0.1)',
                  p: 1.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(14, 165, 233, 0.2)' },
                  '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.02)', color: '#4b5563' },
                }}
              >
                <Send size={18} />
              </IconButton>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default DocumentChat;
