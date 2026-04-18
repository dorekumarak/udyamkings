# Project Manual: UdyamKings Loan Application Platform

## Table of Contents
1. [Introduction](#introduction)
2. [User Manual](#user-manual)
3. [Developer Manual](#developer-manual)
4. [Troubleshooting](#troubleshooting)
5. [Contributing](#contributing)

## Introduction

UdyamKings is a web-based loan application platform built with Node.js, Express, Sequelize, and EJS. It allows users to apply for loans by submitting applications with personal details and documents. Admins can review and manage applications through a dedicated admin panel.

**Key Features:**
- User registration and authentication
- Loan application form with document uploads
- Admin dashboard for application management
- Dynamic form field management (partially implemented)
- Payment integration (Razorpay)

**Tech Stack:**
- Backend: Node.js, Express.js
- Database: SQLite (development), configurable for others
- ORM: Sequelize
- Frontend: EJS templates, Bootstrap, jQuery
- File Uploads: Multer
- Authentication: Custom sessions
- Payments: Razorpay

---

## User Manual

### Getting Started
1. **Access the Website**: Open your browser and go to `http://localhost:3003` (after starting the server).
2. **Register**: Click "Register" to create an account with name, email, mobile, and city.
3. **Verify Email**: Check your email for verification (implementation may vary).
4. **Login**: Use your email and password to log in.

### Applying for a Loan
1. **Navigate to Apply**: After login, click "Apply" or "Apply Now".
2. **Fill the Form**:
   - **Applicant Type**: Select individual or business.
   - **Business Details**: Name, description, amount requested.
   - **Personal Details**: Annual revenue, years in operation, preferred contact time.
   - **Documents**: Upload required files (Aadhaar Card, PAN Card, Business Plan, Supporting Documents).
3. **Submit**: Click "Submit Application". You'll see a success message.
4. **Payment**: Follow prompts to complete payment via Razorpay.

### Admin Panel
1. **Access**: Go to `/admin/login` and log in with admin credentials.
2. **Dashboard**: View statistics on applications (total, accepted, pending, rejected).
3. **Applications**:
   - List all applications.
   - View details: applicant info, documents, status.
   - Change status: Accept, Reject, Under Review.
   - Edit application details.
   - Delete applications.
4. **Form Fields**: Manage dynamic form fields (add, edit, remove fields including file uploads; backend partially implemented).
5. **Content Management**: Edit site content like FAQ.
6. **Email Templates**: Customize email notifications.
7. **Settings**: General platform settings.
8. **Users**: Manage user accounts.

### Document Viewing
- In the admin panel, click "View Document" on application details to open PDFs in a new tab.

### Logout
- Click "Logout" from the admin panel or user menu.

---

## Developer Manual

### Prerequisites
- Node.js (v14+)
- npm
- SQLite (comes with Sequelize)

### Installation
1. Clone or copy the project to your local machine.
2. Navigate to the project directory: `cd udyamkings`
3. Install dependencies: `npm install`
4. Set up environment variables: Create `.env` file with:
   ```
   PORT=3003
   SESSION_SECRET=your_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   DATABASE_URL=sqlite:///./database.sqlite
   ```
5. Run database sync: `npm run db:sync` (if script exists) or start the server once to auto-sync.

### Running the Application
1. Start the server: `npm start`
2. Open browser to `http://localhost:3003`
3. For development, use `npm run dev` if configured.

### Folder Structure
```
udyamkings/
├── app.js                 # Main application setup (Express app, middleware, routes)
├── server.js              # Server entry point (HTTP server, static files)
├── package.json           # Dependencies and scripts
├── models/                # Sequelize models (User, Application, etc.)
├── routes/                # Route handlers
│   ├── index.js           # Main routes (home, auth)
│   ├── adminRoutes.js     # Admin panel routes
│   ├── applicationRoutes.js # Application form routes
│   ├── paymentRoutes.js   # Payment routes
│   └── formConfigs.js     # Dynamic form fields (if implemented)
├── controllers/           # Business logic
│   ├── authController.js  # Authentication
│   ├── applicationController.js # Application handling
│   └── adminController.js # Admin functions
├── views/                 # EJS templates
│   ├── apply.ejs          # Application form
│   ├── admin/             # Admin panel templates
│   │   ├── dashboard.ejs
│   │   ├── application-detail.ejs
│   │   └── form-fields.ejs
│   └── partials/          # Reusable templates
├── public/                # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── uploads/           # Uploaded files
├── middleware/            # Custom middleware
│   ├── auth.js            # Authentication middleware
│   └── adminAuth.js       # Admin authentication (if exists)
├── config/                # Configuration files
├── database.sqlite        # SQLite database file
└── .env                   # Environment variables
```

### Key Files Explanation
- **app.js**: Initializes Express app, sets up middleware (sessions, CSRF, static files), mounts routes.
- **server.js**: Starts the HTTP server, handles static uploads from `public/uploads/applications`.
- **models/index.js**: Sequelize setup, defines models like `User` and `Application`.
- **routes/applicationRoutes.js**: Handles `/apply` GET/POST, file uploads with Multer.
- **controllers/applicationController.js**: Processes application submissions, saves to DB, handles file paths.
- **views/admin/application-detail.ejs**: Displays application details, parses extra_docs_paths for documents.

### Database Schema
- **Users**: id, name, email, mobile, city, password, role, email_verified, etc.
- **Applications**: id, user_id, applicant_type, business_name, description_short, description_long, amount_requested, aadhar_path, extra_docs_paths (JSON string), status, etc.
- **FormFields** (if implemented): Dynamic fields for forms.

### API Endpoints
- **User Routes**:
  - GET /register: Registration form
  - POST /register: Register user
  - GET /login: Login form
  - POST /login: Authenticate
  - POST /logout: Logout
- **Application Routes**:
  - GET /apply: Application form
  - POST /apply: Submit application (with file uploads)
- **Admin Routes**:
  - GET /admin/dashboard: Dashboard
  - GET /admin/applications: List applications
  - GET /admin/applications/:id: View application
  - POST /admin/applications/:id/accept: Accept application
  - POST /admin/applications/:id/reject: Reject application
  - POST /admin/applications/:id/review: Under review
- **API Routes** (partial):
  - GET /api/form-configs: Get dynamic form fields
  - POST /api/form-configs: Create field
  - PUT /api/form-configs/:id: Update field
  - DELETE /api/form-configs/:id: Delete field

### File Uploads
- Uses Multer for handling multipart/form-data.
- Saves to `public/uploads/applications/`.
- Paths stored in DB as relative URLs (e.g., `/uploads/filename.pdf`).
- Served statically via `/uploads` route.

### Authentication
- Session-based with express-session.
- Passwords hashed with bcrypt.
- Admin role check for protected routes.

### Development Tips
- Use `console.log` for debugging (check server terminal).
- Restart server after code changes.
- For DB changes, use `sequelize.sync({ alter: true })` in app.js.
- Test file uploads and admin views thoroughly.
- Implement missing APIs (e.g., form-configs) for full dynamic functionality.

### Deployment
- Set `NODE_ENV=production`.
- Use a production DB (e.g., PostgreSQL).
- Configure reverse proxy (e.g., Nginx).
- Secure environment variables.
- Run `npm start` or use PM2.

---

## Troubleshooting

### Common Issues
- **Server won't start**: Check for port conflicts (default 3003). Kill process: `taskkill /F /IM node.exe`.
- **MODULE_NOT_FOUND**: Ensure all dependencies installed (`npm install`).
- **404 on uploads**: Verify static middleware in server.js/app.js points to `public/uploads/applications`.
- **DB errors**: Run `sequelize.sync({ alter: true })`; check foreign keys.
- **Application submission fails**: Check controller logs; ensure files uploaded correctly.
- **Admin panel issues**: Verify admin login; check routes in adminRoutes.js.

### Logs
- Server logs in terminal.
- Client errors in browser console.

### Support
- Check code comments for details.
- Review Git history for changes.
- Contact developer for custom issues.

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make changes, test thoroughly.
4. Submit pull request.

For major changes, discuss first.

---

This manual covers the essentials. Update as the project evolves.
