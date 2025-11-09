import React, { useState, useEffect } from 'react';
import { clarifyAPI } from '../../services/clarifyApi';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import './ReminderList.css';

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
    <div className="container">
      <h3 className="title">📋 My Reminders</h3>

      <form onSubmit={handleAddReminder} className="form">
        <input
          type="text"
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
          placeholder="Add a reminder..."
          className="input"
        />
        <button type="submit" disabled={loading} className="addButton">
          Add
        </button>
      </form>

      <div className="list">
        {reminders.length === 0 ? (
          <p className="empty">No reminders yet. Add one above!</p>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className="reminderItem">
              <p className="reminderText">{reminder.text}</p>
              <button
                onClick={() => handleDeleteReminder(reminder.id)}
                className="deleteButton"
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


