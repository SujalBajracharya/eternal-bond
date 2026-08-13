ALTER TABLE user_notifications
ADD COLUMN transaction_id VARCHAR(255) REFERENCES payments(id) ON DELETE SET NULL;
