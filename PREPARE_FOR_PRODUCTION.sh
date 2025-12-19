#!/bin/bash

echo "========================================"
echo "  CRM Platform - Production Preparation"
echo "========================================"
echo ""

echo "This script will help you prepare for production deployment."
echo ""

# Generate SECRET_KEY
echo "🔑 Generating SECRET_KEY..."
SECRET_KEY=$(openssl rand -base64 32)
echo "✅ Generated SECRET_KEY: $SECRET_KEY"
echo ""

# Generate PostgreSQL password
echo "🔒 Generating PostgreSQL password..."
POSTGRES_PASSWORD=$(openssl rand -base64 24)
echo "✅ Generated PostgreSQL password: $POSTGRES_PASSWORD"
echo ""

echo "========================================"
echo "  📋 Next Steps"
echo "========================================"
echo ""
echo "1. Update backend/.env with these values:"
echo "   DATABASE_URL=postgresql+asyncpg://crm_user:$POSTGRES_PASSWORD@postgres:5432/crm_db"
echo "   SECRET_KEY=$SECRET_KEY"
echo "   CORS_ORIGINS=https://your-domain.com"
echo ""
echo "2. Update frontend/.env:"
echo "   REACT_APP_BACKEND_URL=https://api.your-domain.com"
echo ""
echo "3. Update docker-compose.yml:"
echo "   - Change POSTGRES_PASSWORD to: $POSTGRES_PASSWORD"
echo "   - Change SECRET_KEY to: $SECRET_KEY"
echo "   - Update CORS_ORIGINS with your domain"
echo ""
echo "4. Test locally first:"
echo "   docker-compose -f docker-compose.local.yml up --build"
echo ""
echo "5. Deploy to production:"
echo "   See DEPLOYMENT.md for full instructions"
echo ""
echo "========================================"
echo ""
echo "📝 Save these credentials securely!"
echo ""
