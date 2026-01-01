# ☕ Coffee Order Automation – Admin Dashboard

A **production-ready admin dashboard** built with **Next.js and Firebase** for managing coffee products, customers, and orders, with **fully automated customer email notifications** triggered by order status changes.

This system is **internal (admin-only)** and designed to be secure, scalable, and extensible.

---

## 🚀 Features

* 🔐 Admin-only authentication
* 📦 Product master catalog (no manual product typing)
* 🧾 Order management with product & quantity selection
* 🔄 Order status workflow (Placed → Delivered)
* 📩 **Fully automated customer emails** via Firebase Cloud Functions
* 🧠 Duplicate email prevention
* 🧱 Clean, scalable folder architecture
* 🔒 Secure Firestore rules
* ⚙️ Ready for future n8n / WhatsApp / SMS automation

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
* **Backend:** Firebase Firestore, Firebase Authentication
* **Automation:** Firebase Cloud Functions
* **Email:** Transactional email provider (Brevo / SendGrid / Zoho)
* **Hosting:** Vercel + Firebase

---

## 📂 Project Structure

```
coffee-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/login
│   │   ├── (dashboard)/
│   │   │   ├── dashboard
│   │   │   ├── orders
│   │   │   ├── products
│   │   │   └── customers
│   │   ├── api/
│   │   └── middleware.ts
│   ├── components/
│   ├── lib/
│   └── styles/
├── functions/
│   ├── triggers/
│   ├── email/templates/
│   └── utils/
├── firestore.rules
├── firebase.json
└── README.md
```

---

## 🔁 Order Email Automation Flow

```
Admin updates order status
→ Firestore update
→ Cloud Function trigger
→ Status change detected
→ Email template selected
→ Customer email sent automatically
→ Email logged in Firestore
```

### Supported Order Status Emails

| Status     | Email Sent               |
| ---------- | ------------------------ |
| PLACED     | Order Confirmation       |
| PROCESSING | Fresh Roast Update       |
| PACKED     | Packing Confirmation     |
| SHIPPED    | Shipping & Tracking      |
| DELIVERED  | Thank You + Brewing Tips |
| CANCELLED  | Cancellation Notice      |

---

## 🔐 Security Model

* Only authenticated admins can access data
* Firestore rules enforce admin-only access
* No payment or card data stored
* Emails sent **server-side only**
* Customer data never exposed publicly

---

## 🧪 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=orders@yourdomain.com
```

Use `.env.example` as reference.

---

## 🏃‍♂️ Getting Started

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Run frontend

```bash
npm run dev
```

### 3️⃣ Deploy Firebase Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 🧠 Admin Access Setup (IMPORTANT)

1. Create admin user via Firebase Authentication
2. Add admin document in Firestore:

```
admins/{auth.uid}
```

```json
{
  "email": "admin@yourdomain.com",
  "role": "admin"
}
```

Without this, access will be denied.

---

## 🔮 Future Enhancements

* n8n workflow integration
* WhatsApp & SMS notifications
* Email preview inside admin
* Role-based access (admin / staff)
* Analytics dashboard
* Multi-branch support

---

## 📄 License

This project is **private/internal** and intended for business operations.

---

## ✨ Final Note

This system follows **real-world e-commerce best practices** and is designed for **long-term scalability and trust**.

