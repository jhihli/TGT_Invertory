#!/usr/bin/env python
"""
Script to add default cargo entries to the database.
Run this with: python manage.py shell < add_default_cargos.py
Or: python add_default_cargos.py (if Django is configured)
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from product.models import Cargo

# Default cargo entries
DEFAULT_CARGOS = [
    "Air Freight",
    "Sea Freight",
    "Express Courier",
    "Ground Shipping",
    "Rail Freight",
    "Warehouse Storage",
]

def add_default_cargos():
    """Add default cargo entries to the database."""
    created_count = 0
    existing_count = 0

    for cargo_name in DEFAULT_CARGOS:
        cargo, created = Cargo.objects.get_or_create(name=cargo_name)
        if created:
            created_count += 1
            print(f"✓ Created cargo: {cargo_name}")
        else:
            existing_count += 1
            print(f"• Cargo already exists: {cargo_name}")

    print(f"\nSummary:")
    print(f"- Created: {created_count}")
    print(f"- Already existed: {existing_count}")
    print(f"- Total cargos in database: {Cargo.objects.count()}")

if __name__ == '__main__':
    add_default_cargos()
