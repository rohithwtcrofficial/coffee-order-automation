# ☕ Coffee Order Automation – Admin Dashboard

A **production-ready admin dashboard** built with **Next.js and Firebase** for managing coffee products, customers, and orders, with **fully automated customer email notifications** triggered by order status changes.

This system is **internal (admin-only)** and designed to be secure, scalable, and extensible.

---

## 🚀 Features

* 🔐 Admin-only authentication
* 📦 Product master catalog (no manual product typing)
* 👥 Customer management with multiple delivery addresses
* 🧾 Order management with product & quantity selection
* 🔍 Advanced customer search (name, email, phone, address)
* 🔄 6-stage order status workflow with tracking
* 📩 **Fully automated customer emails** via Firebase Cloud Functions
* 🚫 Duplicate email prevention & smart tracking ID validation
* 📊 Real-time analytics dashboard with revenue charts
* 🧱 Clean, scalable folder architecture
* 🔒 Secure Firestore rules
* 📱 Fully responsive mobile-first design
* ⚙️ Ready for future n8n / WhatsApp / SMS automation

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, React 19
* **Backend:** Firebase Firestore, Firebase Authentication, Firebase Admin SDK
* **Automation:** Firebase Cloud Functions
* **Email:** Transactional email provider (Brevo / SendGrid / Resend / Zoho)
* **Charts:** Recharts for analytics visualization
* **UI Components:** Custom component library with Lucide icons
* **Hosting:** Vercel + Firebase

---

## 📂 Project Structure

```text
coffee-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/        # Analytics & Overview
│   │   │   ├── orders/
│   │   │   │   ├── [id]/         # Order detail & status update
│   │   │   │   └── new/          # Create new order
│   │   │   ├── products/
│   │   │   │   ├── [id]/edit/    # Edit product
│   │   │   │   └── new/          # Add new product
│   │   │   └── customers/        # Customer list
│   │   ├── api/                  # API routes (optional)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── orders/               # Order-specific components
│   │   │   ├── OrdersTable.tsx
│   │   │   └── StatusUpdateSection.tsx
│   │   ├── dashboard/            # Dashboard components
│   │   └── products/             # Product components
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── admin.ts          # Admin SDK
│   │   │   └── client.ts         # Client SDK
│   │   ├── actions/              # Server actions
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utility functions
│   └── styles/
│       └── globals.css
├── functions/
│   ├── src/
│   │   ├── triggers/
│   │   │   └── onOrderStatusChange.ts
│   │   ├── email/
│   │   │   ├── templates/
│   │   │   │   ├── order-received.ts
│   │   │   │   ├── order-accepted.ts
│   │   │   │   ├── order-packed.ts
│   │   │   │   ├── order-shipped.ts
│   │   │   │   ├── order-delivered.ts
│   │   │   │   └── order-cancelled.ts
│   │   │   └── sender.ts
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env.local
└── README.md
```

---

## 🔁 Order Email Automation Flow

```text
Admin updates order status
→ Firestore update (status + optional tracking ID)
→ Cloud Function trigger (onWrite)
→ Status change detected
→ Duplicate check (lastEmailSentStatus)
→ Email template selected based on new status
→ Customer email sent automatically
→ Email logged in Firestore (emailLogs collection)
→ Order updated with lastEmailSentStatus
```

### 6-Stage Order Status Workflow

| Status      | Email Sent                    | Tracking ID | Description                |
| ----------- | ----------------------------- | ----------- | -------------------------- |
| RECEIVED    | ✅ Order Confirmation         | ❌          | Order received from Dukaan |
| ACCEPTED    | ✅ Order Accepted Notice      | ❌          | Order accepted & verified  |
| PACKED      | ✅ Packing Confirmation       | ❌          | Order packed & ready       |
| SHIPPED     | ✅ Shipping & Tracking        | ✅ Required | Order dispatched           |
| DELIVERED   | ✅ Thank You + Brewing Tips   | ✅ Inherited| Order delivered (uses SHIPPED tracking) |
| CANCELLED   | ✅ Cancellation Notice        | ❌          | Order cancelled            |

**Note:** Tracking ID is mandatory for SHIPPED and DELIVERED statuses.

---

## 🎯 Key Features Explained

### 1. Smart Customer Management
* Multiple delivery addresses per customer
* Default address marking
* Address labels (Home, Office, etc.)
* Search across all customer fields
* Legacy customer data migration support

### 2. Intelligent Order Creation
* Search existing customers by name, email, phone, or address
* Select from saved addresses or add new ones
* Prevent duplicate product selection
* Real-time subtotal calculation
* Manual order number entry (from Dukaan)

### 3. Advanced Status Updates
* Visual status timeline
* Confirmation modal with change preview
* Automatic email trigger notification
* Tracking ID validation
* Success/error feedback

### 4. Analytics Dashboard
* Revenue trend charts (7-period view)
* Category distribution pie charts
* Order status overview cards
* Top-selling products
* Top customers by spending
* Growth rate calculations
* Quick action buttons

---

## 🔐 Security Model

* ✅ Only authenticated admins can access data
* ✅ Firestore rules enforce admin-only read/write
* ✅ Server-side validation for all updates
* ✅ No payment or card data stored
* ✅ Emails sent **server-side only** via Cloud Functions
* ✅ Customer data never exposed publicly
* ✅ Rate limiting on status updates
* ✅ Input sanitization and validation
* ✅ Firebase Admin SDK for privileged operations

---

## 🧪 Environment Variables

### Frontend (.env.local)

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Optional: Public Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Cloud Functions (.env or Firebase Config)

```env
# Email Provider (choose one)
BREVO_API_KEY=your_brevo_api_key
# OR
SENDGRID_API_KEY=your_sendgrid_api_key
# OR
RESEND_API_KEY=your_resend_api_key

# Email Configuration
EMAIL_FROM=orders@yourdomain.com
EMAIL_FROM_NAME=Your Coffee Shop
```

Use `.env.example` as reference.

---

## 🏃‍♂️ Getting Started

### 1️⃣ Clone & Install

```bash
git clone <repository-url>
cd coffee-admin
npm install
```

### 2️⃣ Set Up Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting (optional)

### 3️⃣ Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your Firebase credentials
nano .env.local
```

### 4️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5️⃣ Deploy Firebase Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 6️⃣ Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## 🧠 Admin Access Setup (IMPORTANT)

### Step 1: Create Admin User

1. Go to Firebase Console → Authentication
2. Add user with email/password
3. Copy the User UID

### Step 2: Add Admin Document

Create document in Firestore:

```text
Collection: admins
Document ID: {user_uid_from_step_1}
```

```json
{
  "email": "admin@yourdomain.com",
  "role": "admin",
  "name": "Admin Name",
  "createdAt": {timestamp}
}
```

### Step 3: Test Login

1. Go to `/login`
2. Sign in with admin credentials
3. Should redirect to `/dashboard`

**Without this setup, all pages will show "Unauthorized"**

---

## 📊 Firestore Data Structure

```text
Collections:
├── admins/              # Admin users
├── products/            # Product catalog
├── customers/           # Customer records
│   └── addresses[]      # Multiple addresses per customer
├── orders/              # All orders
│   ├── items[]          # Order line items
│   └── trackingId       # Optional tracking number
└── emailLogs/           # Email delivery logs
```

### Example Documents

**Product:**
```json
{
  "name": "Colombian Dark Roast",
  "category": "COFFEE_BEANS",
  "roastLevel": "DARK",
  "availableGrams": [250, 500, 1000],
  "pricePerVariant": {
    "250": 299,
    "500": 549,
    "1000": 999
  },
  "isActive": true,
  "stockQuantity": 50,
  "imageUrl": "https://...",
  "createdAt": {timestamp}
}
```

**Order:**
```json
{
  "orderNumber": "DK-2025-001234",
  "customerId": "customer_id",
  "deliveryAddressId": "addr_id",
  "status": "RECEIVED",
  "items": [...],
  "totalAmount": 1598,
  "currency": "INR",
  "trackingId": null,
  "lastEmailSentStatus": "RECEIVED",
  "createdAt": {timestamp}
}
```

---

## 🧪 Testing Checklist

### Order Flow
- [ ] Create new customer with address
- [ ] Create order with existing customer
- [ ] Add multiple addresses to customer
- [ ] Update order status (RECEIVED → DELIVERED)
- [ ] Verify tracking ID validation (SHIPPED/DELIVERED)
- [ ] Check duplicate email prevention
- [ ] Verify email logs in Firestore

### UI/UX
- [ ] Mobile responsive design
- [ ] Search functionality
- [ ] Filter by status/category
- [ ] Dashboard charts render correctly
- [ ] Status update confirmation modal
- [ ] Success/error messages

### Security
- [ ] Non-admin cannot access dashboard
- [ ] Firestore rules block unauthorized access
- [ ] API routes require authentication
- [ ] Status updates validate input

---

## 🔮 Future Enhancements

### Phase 1 (Immediate)
- [ ] PDF invoice generation
- [ ] Bulk order import (CSV)
- [ ] Email preview in admin panel
- [ ] Push notifications

### Phase 2 (Q2 2025)
- [ ] n8n workflow integration
- [ ] WhatsApp notifications via Twilio
- [ ] SMS order updates
- [ ] Customer portal (view orders)

### Phase 3 (Q3 2025)
- [ ] Multi-branch support
- [ ] Staff role (limited access)
- [ ] Advanced analytics & reports
- [ ] Inventory management
- [ ] Loyalty points system

### Phase 4 (Q4 2025)
- [ ] Mobile app (React Native)
- [ ] AI-powered demand forecasting
- [ ] Integration with accounting software
- [ ] Subscription/recurring orders

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" on all pages
**Solution:** Verify admin document exists in Firestore with correct UID

### Issue: Email not sending
**Solution:** 
1. Check Cloud Functions logs: `firebase functions:log`
2. Verify email provider API key in Functions config
3. Check `emailLogs` collection for error messages

### Issue: Tracking ID not saving
**Solution:** Ensure `updateOrderStatus` action is deployed and `revalidatePath` is working

### Issue: Customer search not working
**Solution:** Firestore doesn't support full-text search by default. Current implementation filters client-side. Consider Algolia for production.

### Issue: Dashboard charts not rendering
**Solution:** Clear browser cache and check for console errors. Verify Recharts is installed.

---

## 📞 Support & Contact

For questions or issues:
- Open a GitHub issue
- Contact: support@yourdomain.com

---

## 📄 License

This project is **private/internal** and intended for business operations only.

---

## ✨ Final Note

This system follows **real-world e-commerce best practices** and is designed for **long-term scalability, security, and trust**. Built with modern technologies and production-ready patterns.

**Key Principles:**
- 🎯 Admin-first design
- 🔒 Security by default
- 📧 Automation-first mindset
- 📊 Data-driven decisions
- 🚀 Built for scale

---

**Made with ☕ for coffee lovers everywhere**