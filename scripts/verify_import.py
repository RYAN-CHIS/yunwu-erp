import psycopg2

DATABASE_URL = 'postgresql://neondb_owner:npg_cAas8kuHmrO0@ep-polished-unit-ajk5rq34.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM raw_materials")
print('材料总数：', cur.fetchone()[0])

cur.execute("SELECT COUNT(*) FROM inventory_transactions")
print('库存流水总数：', cur.fetchone()[0])

print('\n=== 形状分布 ===')
cur.execute("SELECT shape, COUNT(*) FROM raw_materials GROUP BY shape ORDER BY COUNT(*) DESC")
for r in cur.fetchall():
    print(' ', r[0] or '空', '→', r[1], '条')

print('\n=== 采样验证（圆珠+按克）===')
cur.execute("""SELECT code, name, shape, "unitCost", "inventoryUnit", remaining
               FROM raw_materials WHERE shape='圆珠' LIMIT 5""")
for r in cur.fetchall(): print(' ', r)

print('\n=== 按串计价验证 ===')
cur.execute("""SELECT code, name, "unitCost", "inventoryUnit", default_purchase_unit,
                  default_conversion_rate, beads_per_strand, remaining
               FROM raw_materials WHERE default_purchase_unit='串' LIMIT 3""")
for r in cur.fetchall(): print(' ', r)

print('\n=== 按个计价验证 ===')
cur.execute("""SELECT code, name, "unitCost", "inventoryUnit", remaining
               FROM raw_materials WHERE default_purchase_unit='个' LIMIT 3""")
for r in cur.fetchall(): print(' ', r)

conn.close()
