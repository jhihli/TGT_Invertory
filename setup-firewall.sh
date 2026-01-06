#!/bin/bash
# Firewall Setup Script for TGT Inventory System on Dell R340
# This script configures UFW (Uncomplicated Firewall) for production deployment

set -e  # Exit on any error

echo "=========================================="
echo "TGT Inventory - Firewall Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Please run this script as root or with sudo"
    echo "Usage: sudo bash setup-firewall.sh"
    exit 1
fi

# Install UFW if not already installed
echo "[1/6] Installing UFW..."
apt-get update -qq
apt-get install -y ufw

# Reset UFW to default settings (optional, comment out if you want to keep existing rules)
echo "[2/6] Resetting UFW to default settings..."
ufw --force reset

# Set default policies
echo "[3/6] Setting default policies..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (CRITICAL - Don't lock yourself out!)
echo "[4/6] Allowing SSH access (port 22)..."
ufw allow 22/tcp comment 'SSH Access'

# Allow HTTP and HTTPS
echo "[5/6] Allowing HTTP/HTTPS access..."
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Deny direct access to Django (only allow through nginx)
echo "Denying direct external access to Django port 8000..."
ufw deny 8000/tcp comment 'Deny external Django access'

# Deny direct access to Next.js (only allow through nginx)
echo "Denying direct external access to Next.js port 3000..."
ufw deny 3000/tcp comment 'Deny external Next.js access'

# Deny external PostgreSQL access (only localhost should connect)
echo "Denying external PostgreSQL access..."
ufw deny 5432/tcp comment 'Deny external PostgreSQL access'

# Optional: Allow access from specific IP range (e.g., local network)
# Uncomment and modify the subnet as needed
# echo "Allowing access from local network..."
# ufw allow from 192.168.0.0/24 comment 'Local network access'

# Optional: Allow iDRAC access from specific subnet
# Uncomment and modify as needed
# echo "Allowing iDRAC access from management network..."
# ufw allow from 192.168.1.0/24 to any port 443 comment 'iDRAC access'

# Enable UFW
echo "[6/6] Enabling UFW firewall..."
ufw --force enable

# Display firewall status
echo ""
echo "=========================================="
echo "Firewall setup complete!"
echo "=========================================="
echo ""
ufw status verbose

echo ""
echo "IMPORTANT NOTES:"
echo "1. SSH is allowed on port 22 - ensure you can connect before logging out!"
echo "2. HTTP (80) and HTTPS (443) are open for web access"
echo "3. Django (8000) and Next.js (3000) are blocked from external access"
echo "4. PostgreSQL (5432) is blocked from external access"
echo "5. All traffic must go through nginx reverse proxy"
echo ""
echo "To add additional rules, use: sudo ufw allow <port>/<protocol>"
echo "To check status: sudo ufw status"
echo "To disable: sudo ufw disable"
echo ""
