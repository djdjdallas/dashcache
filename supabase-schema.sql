-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  user_type TEXT CHECK (user_type IN ('driver', 'buyer', 'admin')) NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT, -- for buyers
  vehicle_info JSONB, -- for drivers: {make, model, year, license_plate}
  blackvue_device_id TEXT, -- for API integration
  stripe_account_id TEXT, -- for payments
  monthly_earnings DECIMAL DEFAULT 0,
  total_footage_contributed INTEGER DEFAULT 0, -- hours
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video submissions from drivers
CREATE TABLE video_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) NOT NULL,
  original_filename TEXT NOT NULL,
  mux_asset_id TEXT, -- Mux Video asset ID
  mux_playback_id TEXT, -- for viewing
  duration_seconds INTEGER,
  file_size_mb DECIMAL,
  upload_status TEXT CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
  location_data JSONB, -- {lat, lng, city, state, timestamp}
  weather_conditions TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  is_anonymized BOOLEAN DEFAULT false,
  sightengine_job_id TEXT,
  processing_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tagged scenarios extracted from videos
CREATE TABLE video_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_submission_id UUID REFERENCES video_submissions(id) NOT NULL,
  scenario_type TEXT NOT NULL, -- 'intersection_turn', 'pedestrian_crossing', 'parking', etc.
  start_time_seconds DECIMAL NOT NULL,
  end_time_seconds DECIMAL NOT NULL,
  confidence_score DECIMAL, -- AI confidence in tagging
  tags JSONB, -- ['rainy', 'night', 'heavy_traffic', 'urban']
  location_data JSONB,
  is_approved BOOLEAN DEFAULT false, -- manual review
  clip_url TEXT, -- processed clip URL
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data packages for sale to buyers
CREATE TABLE data_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scenario_types JSONB, -- array of scenario types included
  total_clips INTEGER,
  total_duration_hours DECIMAL,
  geographic_coverage JSONB, -- cities/regions included
  weather_conditions JSONB,
  price_per_hour DECIMAL NOT NULL,
  total_price DECIMAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Which scenarios are included in which packages
CREATE TABLE package_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES data_packages(id) NOT NULL,
  scenario_id UUID REFERENCES video_scenarios(id) NOT NULL,
  UNIQUE(package_id, scenario_id)
);

-- Purchase transactions
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  package_id UUID REFERENCES data_packages(id) NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  download_link TEXT,
  download_expires_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver earnings tracking
CREATE TABLE driver_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) NOT NULL,
  video_submission_id UUID REFERENCES video_submissions(id),
  amount DECIMAL NOT NULL,
  earning_type TEXT CHECK (earning_type IN ('footage_contribution', 'bonus', 'referral')) DEFAULT 'footage_contribution',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  stripe_transfer_id TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY; 
ALTER TABLE video_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for video_submissions
CREATE POLICY "Drivers can view own submissions" ON video_submissions FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "Drivers can insert own submissions" ON video_submissions FOR INSERT WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Admin can view all submissions" ON video_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for video_scenarios
CREATE POLICY "Owners can view scenarios" ON video_scenarios FOR SELECT USING (
  EXISTS (SELECT 1 FROM video_submissions WHERE id = video_submission_id AND driver_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'buyer'))
);

-- RLS Policies for data_packages
CREATE POLICY "Anyone can view active packages" ON data_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage packages" ON data_packages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for purchases
CREATE POLICY "Buyers can view own purchases" ON purchases FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Buyers can insert purchases" ON purchases FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Admin can view all purchases" ON purchases FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- RLS Policies for driver_earnings
CREATE POLICY "Drivers can view own earnings" ON driver_earnings FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "Admin can manage earnings" ON driver_earnings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- Indexes for performance
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_video_submissions_driver_id ON video_submissions(driver_id);
CREATE INDEX idx_video_submissions_status ON video_submissions(upload_status);
CREATE INDEX idx_video_scenarios_submission_id ON video_scenarios(video_submission_id);
CREATE INDEX idx_video_scenarios_type ON video_scenarios(scenario_type);
CREATE INDEX idx_data_packages_active ON data_packages(is_active);
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();