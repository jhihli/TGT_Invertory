cd backend\server
py manage.py runserver

cd frontend
npm run dev


#run This tells PostgreSQL: Start using IDs after the current max.
SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));