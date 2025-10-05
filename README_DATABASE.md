# Database Setup Guide

## Quick Start

### 1. Set Environment Variables
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/compliance_ai"
```

### 2. Run Setup Script
```bash
cd backend
./scripts/setup-db.sh
```

### 3. Verify Setup
```bash
# Check health endpoint
curl http://localhost:3001/api/health

# View database in Prisma Studio
npx prisma studio
```

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Create Database Tables
```bash
npx prisma db push
```

### 4. Verify Database Connection
```bash
npx prisma db pull --print
```

## Database Schema

The application uses the following main tables:

- **uploads**: Stores raw CSV/JSON data and metadata
- **reports**: Stores analysis results and scores
- **field_mappings**: Stores detected field mappings (P1 feature)
- **analysis_sessions**: Tracks analysis sessions (P1 feature)

## API Endpoints

### Core Endpoints (P0)
- `POST /api/upload` - Upload CSV/JSON data
- `POST /api/analyze` - Analyze uploaded data
- `GET /api/report/:reportId` - Retrieve analysis report
- `GET /api/health` - Health check with DB status

### Optional Endpoints (P1)
- `GET /api/reports?limit=10` - List recent reports

## Health Check

The `/api/health` endpoint provides:
- Database connection status
- Database type and version
- Record counts (uploads, reports)
- System information
- Last report timestamp

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T10:30:00.000Z",
  "database": {
    "status": "connected",
    "type": "postgresql",
    "version": "PostgreSQL 15.4"
  },
  "statistics": {
    "uploads": 5,
    "reports": 3,
    "lastReport": "r_abc123 (2025-01-31T10:25:00.000Z)"
  },
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "uptime": 3600
  }
}
```

## Data Retention

- Reports are stored with optional expiration dates
- Minimum retention: 7 days (P0 requirement)
- Automatic cleanup can be implemented as background job

## Performance

### Indexes
The schema includes optimized indexes for:
- Recent reports queries (`created_at DESC`)
- Upload lookups (`upload_id`)
- Field mapping queries

### JSON Storage
- Uses PostgreSQL JSONB for efficient JSON storage
- Enables JSON queries and indexing
- Supports complex report structure

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

2. **Prisma Client Not Found**
   - Run `npx prisma generate`
   - Check node_modules installation

3. **Migration Errors**
   - Check database permissions
   - Verify schema syntax
   - Review Prisma logs

### Debug Commands
```bash
# Check Prisma connection
npx prisma db pull --print

# View database schema
npx prisma db pull

# Reset database (development only)
npx prisma db push --force-reset

# View Prisma logs
DEBUG=prisma:* npm run dev
```

## Production Considerations

### Security
- Use connection pooling
- Implement proper authentication
- Encrypt sensitive data
- Regular security updates

### Monitoring
- Set up database metrics
- Monitor query performance
- Track error rates
- Implement alerting

### Backup
- Regular automated backups
- Point-in-time recovery
- Test restore procedures
- Offsite backup storage

## Support

For issues with database setup:
1. Check the logs: `npm run dev`
2. Verify environment variables
3. Test database connection manually
4. Review Prisma documentation: https://www.prisma.io/docs


