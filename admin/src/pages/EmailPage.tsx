import React, {
  useEffect,
  useState,
} from 'react';

import {
  Mail,
  RefreshCw,
  Send,
  User,
} from 'lucide-react';

import { apiClient } from '../api';

interface Employee {
  id: string;
  name: string;
  status?: string;
}

interface EmailThread {
  id: string;
  gmailThreadId: string;
  subject?: string;
  participants: string[];
  lastMessageAt?: string;
  unreadCount: number;
  customerSite?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  messages?: Array<{
    id: string;
    direction: string;
    fromEmail: string;
    snippet?: string;
    bodyText?: string;
    sentAt: string;
    isRead: boolean;
  }>;
}

interface EmailConversation {
  id: string;
  subject?: string;
  customerSite?: {
    name: string;
    email?: string;
  } | null;
  messages: Array<{
    id: string;
    direction: string;
    fromEmail: string;
    toEmails: string[];
    ccEmails: string[];
    subject?: string;
    bodyText?: string;
    sentAt: string;
    isRead: boolean;
  }>;
}

export const EmailPage: React.FC = () => {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [selectedEmployee, setSelectedEmployee] =
    useState('');

  const [threads, setThreads] =
    useState<EmailThread[]>([]);

  const [selectedThread, setSelectedThread] =
    useState<EmailConversation | null>(
      null,
    );

  const [reply, setReply] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadThreads(selectedEmployee);
    } else {
      setThreads([]);
      setSelectedThread(null);
    }
  }, [selectedEmployee]);

  async function loadEmployees() {
    try {
      const response =
        await apiClient.get<Employee[]>(
          '/employees',
        );

      setEmployees(
        Array.isArray(response.data)
          ? response.data
          : [],
      );
    } catch (error) {
      console.error(
        'Failed to load employees',
        error,
      );
    }
  }

  async function loadThreads(
    employeeId: string,
  ) {
    setLoading(true);

    try {
      const response =
        await apiClient.get(
          `/admin/email/employees/${employeeId}/threads`,
        );

      setThreads(
        response.data.threads || [],
      );
    } catch (error) {
      console.error(
        'Failed to load email threads',
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function syncEmployee() {
    if (!selectedEmployee) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(
        `/admin/email/employees/${selectedEmployee}/sync`,
      );

      await loadThreads(
        selectedEmployee,
      );
    } catch (error) {
      console.error(
        'Failed to synchronize inbox',
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function openThread(
    threadId: string,
  ) {
    try {
      const response =
        await apiClient.get(
          `/admin/email/threads/${threadId}`,
        );

      setSelectedThread(
        response.data,
      );
    } catch (error) {
      console.error(
        'Failed to load conversation',
        error,
      );
    }
  }

  async function sendReply() {
    if (
      !selectedThread ||
      !selectedEmployee ||
      !reply.trim()
    ) {
      return;
    }

    setSending(true);

    try {
      await apiClient.post(
        `/admin/email/threads/${selectedThread.id}/reply`,
        {
          employeeId:
            selectedEmployee,
          body: reply,
        },
      );

      setReply('');

      await openThread(
        selectedThread.id,
      );

      await loadThreads(
        selectedEmployee,
      );
    } catch (error) {
      console.error(
        'Failed to send reply',
        error,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Email
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mt-1">
          View customer conversations and manage employee Gmail communication.
        </p>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={selectedEmployee}
          onChange={(event) =>
            setSelectedEmployee(
              event.target.value,
            )
          }
          className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        >
          <option value="">
            Select employee
          </option>

          {employees.map(
            (employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.name} — {employee.id}
              </option>
            ),
          )}
        </select>

        <button
          onClick={syncEmployee}
          disabled={
            !selectedEmployee ||
            loading
          }
          className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
          />

          Sync Inbox
        </button>
      </div>

      {!selectedEmployee ? (
        <div className="flex-1 flex items-center justify-center border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]">
          <div className="text-center text-[var(--text-tertiary)]">
            <Mail
              size={40}
              className="mx-auto mb-3"
            />

            <p>
              Select an employee to view their email.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                Loading...
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                No conversations found.
              </div>
            ) : (
              threads.map(
                (thread) => (
                  <button
                    key={thread.id}
                    onClick={() =>
                      openThread(
                        thread.id,
                      )
                    }
                    className={`w-full text-left p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] ${
                      selectedThread?.id ===
                      thread.id
                        ? 'bg-[var(--bg-surface-hover)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User
                        size={15}
                      />

                      <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {thread.customerSite?.name ||
                          thread.participants[0] ||
                          'Unknown'}
                      </span>

                      {thread.unreadCount >
                        0 && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--brand-primary)] text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-[var(--text-primary)] mt-2 truncate">
                      {thread.subject ||
                        '(No subject)'}
                    </p>

                    <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                      {thread.messages?.[0]
                        ?.snippet ||
                        ''}
                    </p>
                  </button>
                ),
              )
            )}
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl flex flex-col min-h-0">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
                Select a conversation.
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-[var(--border-subtle)]">
                  <h2 className="font-bold text-[var(--text-primary)]">
                    {selectedThread.subject ||
                      '(No subject)'}
                  </h2>

                  {selectedThread.customerSite && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {selectedThread.customerSite.name}

                      {selectedThread.customerSite.email
                        ? ` — ${selectedThread.customerSite.email}`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedThread.messages.map(
                    (message) => {
                      const outbound =
                        message.direction ===
                        'OUTBOUND';

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            outbound
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl p-4 ${
                              outbound
                                ? 'bg-[var(--brand-subtle)]'
                                : 'bg-[var(--bg-app)]'
                            }`}
                          >
                            <p className="text-xs font-semibold text-[var(--text-secondary)]">
                              {message.fromEmail}
                            </p>

                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap mt-2">
                              {message.bodyText ||
                                ''}
                            </p>

                            <p className="text-xs text-[var(--text-tertiary)] mt-3">
                              {new Date(
                                message.sentAt,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="p-4 border-t border-[var(--border-subtle)]">
                  <textarea
                    value={reply}
                    onChange={(event) =>
                      setReply(
                        event.target.value,
                      )
                    }
                    placeholder="Write a reply..."
                    rows={4}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-app)] p-3 text-sm text-[var(--text-primary)] focus:outline-none"
                  />

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={sendReply}
                      disabled={
                        sending ||
                        !reply.trim()
                      }
                      className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send
                        size={16}
                      />

                      {sending
                        ? 'Sending...'
                        : 'Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};