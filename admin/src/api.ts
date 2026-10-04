import axios from 'axios';

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// ADMIN AUTH TOKEN
// ============================================================

apiClient.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('token');

    if (token) {
      config.headers =
        config.headers ?? {};

      config.headers[
        'Authorization'
      ] = `Bearer ${token}`;
    }

    return config;
  },
);

// ============================================================
// EMAIL — EMPLOYEE THREADS
// ============================================================

/**
 * Get all email conversations belonging
 * to an employee.
 *
 * Backend:
 * GET /api/admin/email/employees/:employeeId/threads
 */
export async function getEmployeeEmailThreads(
  employeeId: string,
) {
  const response =
    await apiClient.get(
      `/email/employees/${employeeId}/threads`,
    );

  return response.data;
}

// ============================================================
// EMAIL — SYNC
// ============================================================

/**
 * Synchronize an employee's Gmail inbox.
 *
 * Backend:
 * POST /api/admin/email/employees/:employeeId/sync
 */
export async function syncEmployeeEmail(
  employeeId: string,
) {
  const response =
    await apiClient.post(
      `/email/employees/${employeeId}/sync`,
    );

  return response.data;
}

// ============================================================
// EMAIL — SINGLE THREAD
// ============================================================

/**
 * Get a complete email conversation.
 *
 * Backend:
 * GET /api/admin/email/threads/:threadId
 */
export async function getAdminEmailThread(
  threadId: string,
) {
  const response =
    await apiClient.get(
      `/email/threads/${threadId}`,
    );

  return response.data;
}

// ============================================================
// EMAIL — REPLY
// ============================================================

/**
 * Reply to a customer conversation
 * using the selected employee's Gmail account.
 *
 * Backend:
 * POST /api/admin/email/threads/:threadId/reply
 */
export async function replyAsEmployee(
  threadId: string,
  employeeId: string,
  body: string,
) {
  const response =
    await apiClient.post(
      `/email/threads/${threadId}/reply`,
      {
        employeeId,
        body,
      },
    );

  return response.data;
}

// ============================================================
// EMAIL — FORWARD
// ============================================================

/**
 * Forward an email using the selected
 * employee's Gmail account.
 *
 * Backend:
 * POST /api/admin/email/messages/:messageId/forward
 */
export async function forwardAsEmployee(
  messageId: string,
  employeeId: string,
  to: string,
  body: string,
) {
  const response =
    await apiClient.post(
      `/email/messages/${messageId}/forward`,
      {
        employeeId,
        to,
        body,
      },
    );

  return response.data;
}