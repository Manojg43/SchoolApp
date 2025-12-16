
import os
import psycopg2
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

def reset_database():
    print("--- Resetting Database ---")
    
    # Get config from DATABASE_URL
    db_config = dj_database_url.config(default=os.environ.get('DATABASE_URL'))
    
    conn = psycopg2.connect(
        dbname=db_config['NAME'],
        user=db_config['USER'],
        password=db_config['PASSWORD'],
        host=db_config['HOST'],
        port=db_config['PORT']
    )
    conn.autocommit = True
    cur = conn.cursor()

    try:
        # Get all tables in public schema
        cur.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public';
        """)
        tables = cur.fetchall()
        
        if not tables:
            print("No tables found to drop.")
            return

        print(f"Found {len(tables)} tables. Dropping...")
        
        for table in tables:
            print(f"Dropping table: {table[0]}")
            continue_drop = True
            # We use CASCADE to handle foreign keys
            cur.execute(f'DROP TABLE IF EXISTS "{table[0]}" CASCADE;')
        
        print("✅ All tables dropped successfully.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    reset_database()
