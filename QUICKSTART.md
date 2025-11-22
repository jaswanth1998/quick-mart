# ⚡ Quick Start Guide

Get your Quick Gas & Convenience Store Management System up and running in 5 minutes!

## 🎯 Prerequisites

- Node.js 20 or higher installed
- A Supabase account (free tier works!)
- A code editor (VS Code recommended)

## 📋 Step-by-Step Setup

### Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/jaswanthtata/Desktop/Projects/essoStore
npm install
```

### Step 2: Configure Supabase (3 minutes)

1. **Create a Supabase project**:
   - Go to https://supabase.com
   - Click "New Project"
   - Fill in project details
   - Wait for database to initialize

2. **Get your credentials**:
   - Go to Project Settings > API
   - Copy:
     - Project URL
     - Anon/Public key
     - Service role key (keep secret!)

3. **Create `.env.local` file**:
   ```bash
   # Copy from example
   cp .env.local.example .env.local
   
   # Edit .env.local with your credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
   ```

### Step 3: Set Up Database (2 minutes)

1. **Go to Supabase SQL Editor**:
   - In your Supabase dashboard
   - Click "SQL Editor" in sidebar
   - Click "New Query"

2. **Run these SQL commands** (copy-paste one by one):

```sql
-- Create departments table
CREATE TABLE departments (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  store_id BIGINT NOT NULL,
  description VARCHAR NOT NULL
);

-- Create products table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  storeId BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  description VARCHAR NOT NULL,
  price FLOAT4 NOT NULL,
  ageRestriction BOOLEAN NOT NULL,
  tax1 BOOLEAN NOT NULL,
  tax2 BOOLEAN NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shiftNumber BIGINT NOT NULL,
  productId BIGINT NOT NULL,
  productDescription VARCHAR NOT NULL,
  quantity INT4 NOT NULL,
  amount FLOAT4 NOT NULL,
  dateTime TIMESTAMP NOT NULL,
  isGasTrn BOOLEAN NOT NULL,
  typeOfGas VARCHAR,
  volume FLOAT4,
  pump INT4
);

-- Create todos table
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  description VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  priority VARCHAR NOT NULL,
  due_date DATE
);
```

3. **Click "RUN"** for each query

### Step 4: Start the Application (30 seconds)

```bash
npm run dev
```

### Step 5: Access the Application (10 seconds)

1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the login page!

## 🎉 First Steps in the App

### 1. Create an Account
- Click the "Sign Up" tab
- Enter:
  - Username: `admin` (or your choice)
  - Email: `your-email@example.com`
  - Password: `password123` (or stronger!)
  - Confirm password
- Click "Sign Up"

### 2. Sign In
- Switch to "Sign In" tab
- Use the email and password you just created
- Click "Sign In"
- You'll be redirected to the Dashboard!

### 3. Test the Features

#### Try Departments First:
1. Click "Departments" in sidebar
2. Click "Add Department" button
3. Fill in:
   - Store ID: `1`
   - Description: `Beverages`
4. Click "Save"
5. You should see your first department!

#### Try Product Management:
1. Click "Products" in sidebar
2. Click "Add Product"
3. Fill in product details
4. Try the filters (department, tax, age restriction)
5. Export to Excel to see your data

#### Try File Upload:
1. Click "Upload Files" in sidebar
2. Go to the "Departments" tab
3. Drag and drop the example file:
   - Location: `prompts/exampleUploadFiles/Departments.JSON`
4. Watch the upload process!
5. Go back to Departments page to see imported data

## 📊 Test Data Locations

Example files are provided in:
```
prompts/exampleUploadFiles/
├── Departments.JSON    # Department data
├── SKUs.json          # Product data
├── 12074.JSON         # Transaction data (shift 12074)
└── 12075.JSON         # Transaction data (shift 12075)
```

## 🔍 What to Test

### ✅ Basic Features
- [ ] Sign up and sign in
- [ ] Navigate through all pages
- [ ] Add a department
- [ ] Add a product
- [ ] View transactions (after upload)
- [ ] Create a todo
- [ ] Search on any page
- [ ] Change page size
- [ ] Export to Excel

### ✅ Advanced Features
- [ ] Upload Departments.JSON
- [ ] Upload SKUs.json
- [ ] Upload transaction files
- [ ] Filter products by department
- [ ] Filter todos by status
- [ ] Switch between transaction tabs
- [ ] Delete items with confirmation
- [ ] Edit existing records

## 🚨 Troubleshooting

### Issue: "Module not found" errors
**Solution**: Run `npm install` again

### Issue: "Invalid Supabase credentials"
**Solution**: 
1. Check your `.env.local` file
2. Make sure credentials have no extra spaces
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: "Table does not exist"
**Solution**: 
1. Go back to Supabase SQL Editor
2. Run the CREATE TABLE commands again
3. Verify tables exist in Table Editor

### Issue: Port 3000 already in use
**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Issue: Can't see uploaded data
**Solution**:
1. Check the upload results panel
2. Look for error messages
3. Make sure file format matches examples
4. Try uploading example files first

## 📱 Browser Support

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎓 Next Steps

Once everything works:

1. **Explore the Code**:
   - Check `src/app/` for pages
   - Look at `src/hooks/` for data logic
   - Review `src/components/` for UI

2. **Customize**:
   - Change colors in `src/providers/antd-theme-provider.tsx`
   - Add more fields to database
   - Create new pages

3. **Deploy** (Optional):
   - Vercel (recommended)
   - Netlify
   - Your own server

## 💡 Tips & Tricks

### Keyboard Shortcuts
- `Cmd+K` (Mac) / `Ctrl+K` (Windows): Focus search
- `Enter`: Submit forms
- `Esc`: Close modals

### Best Practices
- Use strong passwords in production
- Set up email confirmation in Supabase
- Enable Row-Level Security (RLS)
- Regular database backups
- Monitor error logs

### Development Tips
- Keep dev server running
- Use React DevTools extension
- Check browser console for errors
- Test on different screen sizes

## 📚 Learn More

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Ant Design**: https://ant.design/components/overview/
- **React Query**: https://tanstack.com/query/latest

## 🎉 You're All Set!

Your Quick Gas & Convenience Store Management System is now running!

- **Dashboard**: http://localhost:3000/dashboard
- **Departments**: http://localhost:3000/department
- **Products**: http://localhost:3000/product
- **Transactions**: http://localhost:3000/transaction
- **Upload**: http://localhost:3000/upload
- **Todos**: http://localhost:3000/todo

**Happy managing! 🚀**

---

Need help? Check:
- `README.md` - Full documentation
- `PROJECT_SUMMARY.md` - Complete feature list
- Supabase dashboard - Database viewer
