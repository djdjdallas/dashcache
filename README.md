# DashCache - Dashcam Data Marketplace

A B2B marketplace that connects rideshare drivers with autonomous vehicle companies. Drivers upload dashcam footage and get paid, while AV companies purchase anonymized AI training datasets.

## 🚀 Features

### For Drivers
- **Passive Income**: Earn $30-100/month from dashcam footage
- **Secure Upload**: Drag & drop video files with progress tracking
- **Automatic Processing**: AI anonymization and scenario tagging
- **Real-time Earnings**: Track your income and footage contributions
- **Stripe Payouts**: Automated monthly payments

### For AV Companies
- **Curated Datasets**: Browse scenario-specific training data
- **Advanced Filtering**: Filter by location, weather, scenario type
- **Preview & Purchase**: Sample videos before buying
- **Instant Access**: Secure download links with 30-day access
- **Bulk Purchasing**: Shopping cart for multiple datasets

### For Admins
- **Content Moderation**: Review and approve video scenarios
- **User Management**: Verify drivers and manage buyers
- **Analytics Dashboard**: Revenue, usage stats, platform health
- **Payout Management**: Process driver payments

## 🛠 Tech Stack

- **Frontend/Backend**: Next.js 14+ (JavaScript)
- **Database & Auth**: Supabase
- **Video Processing**: Mux Video API
- **Anonymization**: SightEngine API
- **Payments**: Stripe Connect
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dashcache
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.local` and fill in your API keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Mux Video
   MUX_TOKEN_ID=your_mux_token_id
   MUX_TOKEN_SECRET=your_mux_token_secret

   # SightEngine
   SIGHTENGINE_API_USER=your_sightengine_user
   SIGHTENGINE_API_SECRET=your_sightengine_secret

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # General
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Enable Row Level Security (RLS)

5. **Configure Stripe**
   - Set up Stripe Connect for marketplace payments
   - Configure webhooks endpoint: `/api/webhooks/stripe`

6. **Run the development server**
   ```bash
   npm run dev
   ```

## 🗄 Database Schema

### Core Tables
- `profiles` - User profiles extending Supabase auth
- `video_submissions` - Driver video uploads
- `video_scenarios` - Tagged scenarios from videos
- `data_packages` - Curated datasets for sale
- `purchases` - Buyer transactions
- `driver_earnings` - Driver payout tracking

### Key Relationships
- Drivers upload videos → AI processes into scenarios → Admin approves → Packaged for sale
- Buyers purchase packages → Stripe processes payment → Drivers get 30% share

## 🔄 Video Processing Pipeline

1. **Upload**: Driver uploads video via Mux API
2. **Anonymization**: SightEngine removes faces/license plates
3. **AI Tagging**: Extract scenarios (intersections, parking, etc.)
4. **Review**: Admin approves scenarios for marketplace
5. **Packaging**: Group scenarios into sellable datasets
6. **Monetization**: Revenue split (70% platform, 30% drivers)

## 💰 Business Model

- **Driver Upload**: $0.50-$2.00 per minute of processed footage
- **Dataset Sales**: $100-500 per hour of processed data
- **Revenue Split**: Drivers 30%, Platform 70%
- **Payment Processing**: Stripe Connect for automatic payouts

## 🚦 User Roles & Access

### Driver (`/driver-dashboard`)
- Upload videos
- Track earnings
- View processing status
- Manage profile & payment info

### Buyer (`/marketplace`)
- Browse datasets
- Filter by criteria
- Purchase with Stripe
- Download secure links

### Admin (`/admin`)
- Content moderation
- User verification
- Platform analytics
- Payout management

## 🔌 API Routes

### Upload & Processing
- `POST /api/upload/video` - Upload videos to Mux
- `POST /api/process/anonymize` - SightEngine anonymization
- `GET /api/process/anonymize` - Check processing status

### Marketplace
- `GET /api/data-packages` - List available datasets
- `POST /api/data-packages` - Create new package (admin)
- `GET /api/scenarios` - List video scenarios
- `PATCH /api/scenarios` - Approve/reject scenarios

### Payments
- `POST /api/checkout/create-session` - Stripe checkout
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/payments/driver-payout` - Process driver payouts
- `GET /api/verify-purchase` - Verify completed purchases

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📈 Future Enhancements

### Planned Features
- BlackVue Cloud API integration
- Mobile app for drivers
- Real-time processing status
- Advanced AI scenario detection
- Custom dataset requests
- API access for enterprise buyers

## 📞 Support

- **Support Email**: support@dashcache.com
- **Driver Support**: drivers@dashcache.com
- **Enterprise Sales**: enterprise@dashcache.com

## 📄 License

Copyright © 2024 DashCache. All rights reserved.
# dashcache
