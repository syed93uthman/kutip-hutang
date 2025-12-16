# Kutip Hutang - Debt Management System

A modern web application for managing debt between users, built with Next.js 15, shadcn/ui, and Prisma ORM with MySQL.

## Features

- **User Management**: Create, read, update, and delete users
- **User Information**: Store user name and phone number
- **Modern UI**: Built with shadcn/ui and dashboard-01 template
- **Type-Safe**: Full TypeScript support
- **API Routes**: RESTful API endpoints for user operations

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: shadcn/ui with Tailwind CSS
- **Database**: MySQL with Prisma ORM
- **Language**: TypeScript
- **Package Manager**: npm

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── users/           # API routes for user management
│   │   ├── users/               # Users management page
│   │   ├── dashboard/           # Dashboard page
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── user-form.tsx        # User form dialog component
│   │   ├── user-list.tsx        # User table component
│   │   └── ...                  # Other dashboard components
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client configuration
│   │   └── utils.ts             # Utility functions
│   └── generated/               # Generated Prisma client
├── prisma/
│   ├── schema.prisma            # Prisma schema with User model
│   └── migrations/              # Database migrations
├── .env                         # Environment variables
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Update the `.env` file with your MySQL connection string:

```env
DATABASE_URL="mysql://user:password@localhost:3306/kutip_hutang"
```

Replace:
- `user`: Your MySQL username (default: `root`)
- `password`: Your MySQL password
- `localhost:3306`: Your MySQL host and port
- `kutip_hutang`: Your database name

### 3. Create Database and Run Migrations

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE kutip_hutang;"

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Access the Application

- **Home**: `http://localhost:3000/`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Users Management**: `http://localhost:3000/users`

## API Endpoints

### Users

- **GET** `/api/users` - Get all users
- **POST** `/api/users` - Create a new user
- **GET** `/api/users/[id]` - Get a specific user
- **PUT** `/api/users/[id]` - Update a user
- **DELETE** `/api/users/[id]` - Delete a user

### Request/Response Examples

#### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "08123456789"
  }'
```

Response:
```json
{
  "id": 1,
  "name": "John Doe",
  "phone": "08123456789",
  "createdAt": "2025-12-16T10:30:00Z",
  "updatedAt": "2025-12-16T10:30:00Z"
}
```

## Database Schema

### User Table

```sql
CREATE TABLE User (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL UNIQUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Prisma commands
npx prisma generate    # Generate Prisma client
npx prisma migrate dev # Create and run migrations
npx prisma studio     # Open Prisma Studio (GUI)
```

## Environment Variables

`.env` file should contain:

```env
DATABASE_URL="mysql://user:password@localhost:3306/kutip_hutang"
NODE_ENV=development
```

## Next Steps

1. Set up your MySQL database with proper connection details
2. Run database migrations
3. Start the development server
4. Access the users management page to start managing users
5. Extend the schema with additional features (debt tracking, transactions, etc.)

## Notes

- Phone numbers must be unique in the system
- All timestamps are in UTC
- The Prisma client is generated to `src/generated/`
- The project uses Turbopack for fast development builds

## Troubleshooting

### Connection Issues
- Ensure MySQL is running
- Verify DATABASE_URL in `.env` file
- Check MySQL user permissions

### Port Already in Use
- Default port is 3000
- Change with: `npm run dev -- -p 3001`

## License

MIT

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
