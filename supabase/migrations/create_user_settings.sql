-- Create user_settings table for storing per-user application settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Event & Competition Settings
    event_key TEXT DEFAULT '2026ilpe',
    default_team_number INTEGER,
    
    -- Scout Preferences
    scout_name TEXT,
    auto_fill_scout_name BOOLEAN DEFAULT true,
    
    -- Data & Sync Settings
    auto_sync BOOLEAN DEFAULT true,
    offline_mode BOOLEAN DEFAULT false,
    
    -- Display Preferences
    compact_view BOOLEAN DEFAULT false,
    show_tba_data BOOLEAN DEFAULT true,
    
    -- Notification Settings
    enable_notifications BOOLEAN DEFAULT true,
    notify_on_submit BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one settings row per user
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own settings
CREATE POLICY "Users can view own settings"
    ON user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
    ON user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
    ON user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();
