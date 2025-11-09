# How to Edit/Delete Content

This guide explains how to use the edit/delete functionality for alerts, helpdesk requests, and responses.

## Backend API Endpoints

### Alerts

**Update Alert:**
```http
PATCH /citypulse/alerts/{alert_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "category": "Road",
  "priority": "High",
  "phone": "+1234567890",
  "email": "user@example.com",
  "other_contact": "Telegram: @username"
}
```

**Delete Alert:**
```http
DELETE /citypulse/alerts/{alert_id}
Authorization: Bearer <token>
```

### Helpdesk Requests

**Update Request:**
```http
PUT /helpboard/requests/{request_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "status": "closed",
  ...
}
```

**Delete Request:**
```http
DELETE /helpboard/requests/{request_id}
Authorization: Bearer <token>
```

### Helpdesk Responses

**Update Response:**
```http
PATCH /helpboard/responses/{response_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Updated message",
  ...
}
```

**Delete Response:**
```http
DELETE /helpboard/responses/{response_id}
Authorization: Bearer <token>
```

## Frontend Usage

### 1. Import Required Utilities

```typescript
import { useAuth } from '../contexts/AuthContext';
import { canEditAlert, canDeleteAlert } from '../utils/permissions';
import { updateAlert, deleteAlert } from '../services/citypulseApi';
// or for helpdesk:
import { helpdeskAPI } from '../services/api';
import { canEditRequest, canDeleteRequest } from '../utils/permissions';
```

### 2. Check Permissions

```typescript
const { user } = useAuth();

// Check if user can edit an alert
const canEdit = canEditAlert(user, alert.user_id);

// Check if user can delete an alert
const canDelete = canDeleteAlert(user, alert.user_id);
```

### 3. Add Edit/Delete Buttons to UI

#### Example: Alert Card Component

```typescript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canEditAlert, canDeleteAlert } from '../utils/permissions';
import { updateAlert, deleteAlert } from '../services/citypulseApi';
import type { Alert } from '../types/citypulse';

function AlertCard({ alert, onUpdate }: { alert: Alert; onUpdate: () => void }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    title: alert.title,
    description: alert.description || '',
    category: alert.category,
    priority: alert.priority,
  });

  const canEdit = canEditAlert(user, alert.user_id);
  const canDelete = canDeleteAlert(user, alert.user_id);

  const handleEdit = async () => {
    try {
      await updateAlert(alert.id, editData);
      setIsEditing(false);
      onUpdate(); // Refresh the list
      alert('Alert updated successfully!');
    } catch (error: any) {
      alert(`Failed to update alert: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAlert(alert.id);
      onUpdate(); // Refresh the list
      alert('Alert deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete alert: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      {isEditing ? (
        <div>
          <input
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full mb-2 p-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4 className="font-semibold">{alert.title}</h4>
          {alert.description && <p>{alert.description}</p>}
          
          {/* Show edit/delete buttons only if user has permission */}
          {(canEdit || canDelete) && (
            <div className="mt-2 flex gap-2">
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  ✏️ Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

#### Example: Helpdesk Request Card

```typescript
import { useAuth } from '../contexts/AuthContext';
import { canEditRequest, canDeleteRequest } from '../utils/permissions';
import { helpdeskAPI } from '../services/api';

function RequestCard({ request, onUpdate }: { request: any; onUpdate: () => void }) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = canEditRequest(user, request.user_id);
  const canDelete = canDeleteRequest(user, request.user_id);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await helpdeskAPI.deleteRequest(request._id);
      onUpdate();
      alert('Request deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete request: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={styles.requestCard}>
      <h3>{request.title}</h3>
      <p>{request.description}</p>
      
      {(canEdit || canDelete) && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          {canEdit && (
            <button
              onClick={() => {/* Open edit modal/form */}}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              ✏️ Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## Permission Rules

### Edit Permissions
- ✅ Users can always edit their own content
- ✅ Trusted users and above can edit any content
- ❌ Regular users cannot edit others' content

### Delete Permissions
- ✅ Users can always delete their own content
- ✅ Moderators and above can delete any content
- ❌ Regular users and trusted users cannot delete others' content

## Error Handling

All API calls return appropriate error messages:
- `401` - Not authenticated (need to log in)
- `403` - Forbidden (no permission)
- `404` - Resource not found
- `400` - Bad request (invalid data)

Always handle these errors in your UI:

```typescript
try {
  await updateAlert(alertId, data);
  // Success
} catch (error: any) {
  if (error.status === 401) {
    // Redirect to login
  } else if (error.status === 403) {
    // Show permission denied message
  } else {
    // Show generic error
  }
}
```

## Complete Example: Adding to AlertList Component

Here's how to add edit/delete functionality to the existing `AlertList.tsx`:

1. Import utilities at the top:
```typescript
import { useAuth } from '../../contexts/AuthContext';
import { canEditAlert, canDeleteAlert } from '../../utils/permissions';
import { updateAlert, deleteAlert } from '../../services/citypulseApi';
```

2. Add state and handlers:
```typescript
const { user } = useAuth();
const [editingId, setEditingId] = useState<string | null>(null);

const handleDelete = async (alertId: string, alertUserId: string) => {
  if (!canDeleteAlert(user, alertUserId)) return;
  if (!confirm('Delete this alert?')) return;
  
  try {
    await deleteAlert(alertId);
    loadAlerts(); // Refresh list
  } catch (error: any) {
    alert(`Error: ${error.message}`);
  }
};
```

3. Add buttons to the alert card:
```typescript
{(canEditAlert(user, alert.user_id) || canDeleteAlert(user, alert.user_id)) && (
  <div className="flex gap-2 mt-2">
    {canEditAlert(user, alert.user_id) && (
      <button onClick={() => setEditingId(alert.id)}>Edit</button>
    )}
    {canDeleteAlert(user, alert.user_id) && (
      <button onClick={() => handleDelete(alert.id, alert.user_id)}>Delete</button>
    )}
  </div>
)}
```

This provides a complete guide for implementing edit/delete functionality!



