import React, { useState, useEffect } from 'react';
import { clarifyAPI } from '../../services/clarifyApi';
import { useAuthGuard } from '../../hooks/useAuthGuard';

interface Reminder {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
}

export const ReminderList: React.FC = () => {
  const { requireAuth } = useAuthGuard();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await clarifyAPI.getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;

    // Require authentication for creating reminders
    requireAuth(async () => {
      setLoading(true);
      try {
        await clarifyAPI.createReminder(newReminder);
        setNewReminder('');
        await loadReminders();
      } catch (error) {
        console.error('Error creating reminder:', error);
        alert('Failed to create reminder');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;

    // Require authentication for deleting reminders
    requireAuth(async () => {
      try {
        await clarifyAPI.deleteReminder(id);
        await loadReminders();
      } catch (error) {
        console.error('Error deleting reminder:', error);
        alert('Failed to delete reminder');
      }
    });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📋 My Reminders</h3>

      <form onSubmit={handleAddReminder} style={styles.form}>
        <input
          type="text"
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
          placeholder="Add a reminder..."
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.addButton}>
          Add
        </button>
      </form>

      <div style={styles.list}>
        {reminders.length === 0 ? (
          <p style={styles.empty}>No reminders yet. Add one above!</p>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} style={styles.reminderItem}>
              <p style={styles.reminderText}>{reminder.text}</p>
              <button
                onClick={() => handleDeleteReminder(reminder.id)}
                style={styles.deleteButton}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    color: '#333',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    padding: '2rem',
  },
  reminderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  reminderText: {
    flex: 1,
    margin: 0,
    color: '#333',
  },
  deleteButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

